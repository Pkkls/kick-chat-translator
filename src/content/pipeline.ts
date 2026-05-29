import type { Settings } from '~/shared/settings';
import type { ProviderId, TranslationOutcome, TranslationResult } from '~/shared/types';
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { isSlangOnly } from '~/shared/glossary';
import { parseKickContent } from './emoteParser';
import { extractMessageText } from './selectors';
import { detectLanguage } from './langDetect';
import { isNoise, isSameLanguageAsTarget, shouldDropBySourceLang, shouldDropByUserOrChannel } from './filters';
import { inject, incrementFloatingCount, removeAllArtifacts, showError, showLoading } from './injector';
import { localEngine } from './localEngine';
import { memCache } from './memcache';

const log = rootLogger.child('pipeline');

export interface IncomingDomMessage {
  rowElement: Element;
  injectionTarget: Element;
  id: string;
  text: string;
  channel: string;
  username: string;
  isBot: boolean;
}

export interface IncomingWsMessage {
  id: string;
  text: string;
  channel: string;
  username: string;
  isBot: boolean;
}

interface Prepared {
  real: string;
  detected: string | undefined;
}

interface RawResult {
  translatedText: string;
  detectedLang: string;
  provider: ProviderId;
}

const CONTEXT_LINES = 2;

export class TranslationPipeline {
  private settings: Settings;
  private recent = new Map<string, string[]>();

  constructor(settings: Settings) {
    this.settings = settings;
  }

  updateSettings(next: Settings): void {
    this.settings = next;
  }

  /** Cheap filters + a single franc-min call. Returns undefined to skip. */
  private prepare(rawText: string, meta: { username: string; channel: string; isBot: boolean }): Prepared | undefined {
    if (!this.settings.enabled) return undefined;
    // Live visibility gate — read document.hidden each message so a backgrounded
    // tab never translates (no quota burn), with no stuck-paused state.
    if (this.settings.pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
      return undefined;
    }
    if (shouldDropByUserOrChannel(meta, this.settings)) return undefined;

    const { realText } = parseKickContent(rawText);
    if (realText.length < MIN_TEXT_LENGTH || realText.length > MAX_TEXT_LENGTH) return undefined;
    if (isNoise(realText)) return undefined; // emoji / kkkk / rsrs / xd / digits
    if (isSlangOnly(realText)) return undefined; // poggers / copium / kekw …

    const detected = detectLanguage(realText);
    if (this.settings.ignoreEnglish && this.settings.targetLang === 'en' && detected === 'en') return undefined;
    if (isSameLanguageAsTarget(detected, this.settings.targetLang)) return undefined;
    if (shouldDropBySourceLang(detected, this.settings)) return undefined;

    return { real: realText, detected };
  }

  /** Rolling per-channel context (previous lines) for DeepL disambiguation. */
  private contextFor(channel: string, current: string): string {
    const buf = this.recent.get(channel) ?? [];
    const ctx = buf.slice(-CONTEXT_LINES).join(' ');
    buf.push(current);
    if (buf.length > CONTEXT_LINES + 1) buf.shift();
    this.recent.set(channel, buf);
    // Bound the map so visiting many channels in one session can't leak.
    if (this.recent.size > 20) {
      const oldest = this.recent.keys().next().value;
      if (oldest !== undefined && oldest !== channel) this.recent.delete(oldest);
    }
    return ctx;
  }

  async onWebSocketMessage(msg: IncomingWsMessage): Promise<void> {
    if (this.settings.engineMode === 'local-only') return;
    const prepared = this.prepare(msg.text, msg);
    if (!prepared) return;
    try {
      await send({
        type: 'translate',
        payload: { messageId: `ws:${msg.id}`, text: prepared.real, targetLang: this.settings.targetLang, channel: msg.channel },
      });
    } catch (err: unknown) {
      log.debug('ws warmup failed', err);
    }
  }

  async onDomMessage(msg: IncomingDomMessage): Promise<void> {
    const prepared = this.prepare(msg.text, msg);
    if (!prepared) return;
    const { real, detected } = prepared;
    const target = this.settings.targetLang;

    // ── 0. In-tab memory cache: instant, zero round-trip ──
    const mem = memCache.get(real, target);
    if (mem) {
      this.applyTranslation(msg, real, mem, { store: false });
      return;
    }

    // ── 1. On-device (Chrome; absent on Brave → straight to cloud) ──
    if (
      this.settings.localEnabled &&
      this.settings.engineMode !== 'cloud-first' &&
      detected &&
      localEngine.present()
    ) {
      localEngine.noteSeen(detected, target);
      if (localEngine.isReady(detected, target)) {
        showLoading(msg.injectionTarget);
        try {
          const translatedText = await localEngine.translate(detected, target, real);
          this.applyTranslation(msg, real, { translatedText, detectedLang: detected, provider: 'local' }, { store: true });
          void send({ type: 'stats.local', payload: { lang: detected, chars: real.length } }).catch(() => undefined);
          return;
        } catch (err: unknown) {
          log.debug('local translate failed, falling back', err);
        }
      } else if (this.settings.engineMode === 'local-only') {
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
    }

    if (this.settings.engineMode === 'local-only') {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }

    // ── 2. Cloud chain (coalesced + batched in the SW) ──
    const context = this.contextFor(msg.channel, real);
    showLoading(msg.injectionTarget);
    const outcome = await this.requestCloud(real, target, msg.channel, context, false);
    if (!outcome) {
      if (this.settings.debug) showError(msg.injectionTarget, 'translate failed');
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!outcome.ok) {
      if (this.settings.debug) showError(msg.injectionTarget, outcome.error.code);
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }
    this.applyTranslation(msg, real, outcome.result, { store: true });
  }

  /** ⟳ button: re-translate ignoring caches (and skip the same-lang guard). */
  private async forceRetranslate(msg: IncomingDomMessage, real: string): Promise<void> {
    showLoading(msg.injectionTarget);
    const outcome = await this.requestCloud(real, this.settings.targetLang, msg.channel, '', true);
    if (!outcome || !outcome.ok) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    this.applyTranslation(msg, real, outcome.result, { store: true, force: true });
  }

  private async requestCloud(
    text: string,
    target: string,
    channel: string,
    context: string,
    noCache: boolean,
  ): Promise<TranslationOutcome | undefined> {
    try {
      const res = await send({
        type: 'translate',
        payload: {
          messageId: 'dom',
          text,
          targetLang: target,
          channel,
          ...(context ? { context } : {}),
          ...(noCache ? { noCache: true } : {}),
        },
      });
      return res.type === 'translate.result' ? res.payload : undefined;
    } catch (err: unknown) {
      log.warn('cloud translate failed', err);
      return undefined;
    }
  }

  private applyTranslation(
    msg: IncomingDomMessage,
    real: string,
    result: RawResult,
    opts: { store: boolean; force?: boolean },
  ): void {
    if (this.rowRecycled(msg)) return; // node reused for another message — leave it alone
    const tt = result.translatedText;
    if (!tt) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!opts.force) {
      if (isSameLanguageAsTarget(result.detectedLang, this.settings.targetLang) && this.settings.ignoreEnglish) {
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
      if (tt.trim().toLowerCase() === real.trim().toLowerCase()) {
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
    }
    if (opts.store) {
      memCache.set(real, this.settings.targetLang, {
        translatedText: tt,
        detectedLang: result.detectedLang,
        provider: result.provider,
      });
    }
    const full: TranslationResult = {
      messageId: msg.id,
      translatedText: tt,
      detectedLang: result.detectedLang,
      provider: result.provider,
      cached: false,
    };
    inject(msg.injectionTarget, full, this.settings, () => void this.forceRetranslate(msg, real));
    incrementFloatingCount();
  }

  /** Virtual-scroll guard: row reused for a newer message while we awaited. */
  private rowRecycled(msg: IncomingDomMessage): boolean {
    return !msg.rowElement.isConnected || extractMessageText(msg.rowElement) !== msg.text;
  }
}
