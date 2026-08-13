import type { Settings } from '~/shared/settings';
import type { ProviderId, TranslationOutcome, TranslationResult } from '~/shared/types';
import { MAX_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { applyUserGlossary, isSlangOnly } from '~/shared/glossary';
import { parseKickContent } from './emoteParser';
import { extractMessageText } from './selectors';
import { detectLanguage } from './langDetect';
import { resolveBrowserLang } from '~/shared/languages';
import { isContextCritical } from '~/shared/langTiers';
import { isNoise, isSameLanguageAsTarget, shouldDropBySourceLang, shouldDropByUserOrChannel } from './filters';
import { TRANSLATION_SELECTOR, inject, incrementFloatingCount, injectHoverPlaceholder, removeAllArtifacts, showError, showLoading, showThrottleIndicator, showToast, updateActiveProvider } from './injector';
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
// Pro-drop, no-person-marking sources (ja/ko/zh/vi/th/ar) drop the subject; feeding
// more prior dialogue lets DeepL's `context` infer the right person ("he", not "I").
const CONTEXT_LINES_HARD = 6;
const MAX_CONTEXT_KEEP = CONTEXT_LINES_HARD + 1;

export class TranslationPipeline {
  private settings: Settings;
  private recent = new Map<string, string[]>();
  /** Per-user dedup: skip identical messages spammed by the same user. */
  private userDedup = new Map<string, string>();

  constructor(settings: Settings) {
    this.settings = settings;
    // Bound dedup map size.
    setInterval(() => { if (this.userDedup.size > 200) this.userDedup.clear(); }, 60_000);
  }

  updateSettings(next: Settings): void {
    this.settings = next;
  }

  /**
   * Reading target — resolves the 'auto' sentinel to the user's browser language.
   *
   * ⚠️ Read from `this.settings.targetLang`, NEVER `this.effTarget`. Referencing the
   * getter from inside itself is infinite recursion (`RangeError: Maximum call stack`).
   * That exact typo shipped in v2.1.0–v2.2.0 and silently broke ALL incoming translation
   * (`prepare()` threw on every message; the rejection was swallowed by the observer's
   * `void onDomMessage(...)`). See pipeline.test.ts + docs/postmortem-2026-06-03-efftarget-recursion.md.
   */
  private get effTarget(): string {
    return this.settings.targetLang === 'auto' ? resolveBrowserLang() : this.settings.targetLang;
  }

  /** Cheap filters + a single franc-min call. Returns undefined to skip. */
  private prepare(
    rawText: string,
    meta: { username: string; channel: string; isBot: boolean },
    opts: { dedup: boolean } = { dedup: true },
  ): Prepared | undefined {
    if (!this.settings.enabled) return undefined;
    // Live visibility gate — read document.hidden each message so a backgrounded
    // tab never translates (no quota burn), with no stuck-paused state.
    if (this.settings.pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
      return undefined;
    }
    if (shouldDropByUserOrChannel(meta, this.settings)) return undefined;

    // Per-user dedup: if this user just sent the exact same message, skip it.
    // Common in chat spam — saves a provider call + avoids duplicate translations.
    // Only the DOM path takes part. It is the only path that displays, so letting
    // the websocket warm pass claim the slot first would suppress the display of a
    // message nobody has seen yet.
    if (opts.dedup) {
      const dedupKey = meta.username.toLowerCase();
      if (dedupKey && this.userDedup.get(dedupKey) === rawText) return undefined;
      if (dedupKey) this.userDedup.set(dedupKey, rawText);
    }

    const { realText } = parseKickContent(rawText);
    if (realText.length < this.settings.minTextLength || realText.length > MAX_TEXT_LENGTH) return undefined;
    if (isNoise(realText)) return undefined; // emoji / kkkk / rsrs / xd / digits
    if (isSlangOnly(realText)) return undefined; // poggers / copium / kekw …

    const detected = detectLanguage(realText);
    if (this.settings.ignoreEnglish && this.effTarget === 'en' && detected === 'en') return undefined;
    if (isSameLanguageAsTarget(detected, this.effTarget)) return undefined;
    if (shouldDropBySourceLang(detected, this.settings)) return undefined;

    return { real: realText, detected };
  }

  /** Rolling per-channel context (previous lines) for DeepL disambiguation.
   *  Formatted as "username: message" so DeepL understands it's a dialogue. */
  private contextFor(channel: string, current: string, username: string | undefined, lines: number): string {
    const buf = this.recent.get(channel) ?? [];
    const ctx = buf.slice(-lines).join('\n');
    buf.push(username ? `${username}: ${current}` : current);
    if (buf.length > MAX_CONTEXT_KEEP) buf.shift();
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
    const prepared = this.prepare(msg.text, msg, { dedup: false });
    if (!prepared) return;
    try {
      await send({
        type: 'translate',
        payload: { messageId: `ws:${msg.id}`, text: prepared.real, targetLang: this.effTarget, channel: msg.channel },
      });
    } catch (err: unknown) {
      log.debug('ws warmup failed', err);
    }
  }

  async onDomMessage(msg: IncomingDomMessage): Promise<void> {
    const prepared = this.prepare(msg.text, msg);
    if (!prepared) return;
    const { real, detected } = prepared;
    const target = this.effTarget;

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

    // ── 2. Hover-to-translate: just show a placeholder, translate on hover ──
    if (this.settings.displayStyle === 'hover') {
      injectHoverPlaceholder(msg.injectionTarget, () => {
        void this.translateAndApply(msg, real, detected);
      });
      return;
    }

    // ── 3. Cloud chain (coalesced + batched in the SW) ──
    void this.translateAndApply(msg, real, detected);
  }

  /** Shared cloud translate + apply, used by both normal flow and hover-to-translate. */
  private async translateAndApply(msg: IncomingDomMessage, real: string, sourceLang?: string): Promise<void> {
    // Subject-dropping languages need more prior dialogue so the engine infers the
    // right person; everything else gets the cheap 2-line window.
    const lines = isContextCritical(sourceLang) ? CONTEXT_LINES_HARD : CONTEXT_LINES;
    const context = this.contextFor(msg.channel, real, msg.username, lines);
    showLoading(msg.injectionTarget);
    const outcome = await this.requestCloud(real, this.effTarget, msg.channel, context, false, sourceLang);
    if (!outcome) {
      if (this.settings.debug) showError(msg.injectionTarget, 'translate failed');
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!outcome.ok) {
      // #7 — Toast on notable failures (max 1 per 30s to avoid spam).
      const code = outcome.error.code;
      if (code === 'channel_budget') {
        showThrottleIndicator(true);
        setTimeout(() => showThrottleIndicator(false), 5000);
      }
      if (code === 'saturated' || code === 'no_provider') {
        this.maybeToast('All translation providers are down — retrying shortly');
      } else if (code === 'quota' || outcome.error.message?.includes('quota')) {
        this.maybeToast(`${outcome.error.provider ?? 'Provider'} quota reached — falling back`);
      }
      if (this.settings.debug) showError(msg.injectionTarget, code);
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }
    this.applyTranslation(msg, real, outcome.result, { store: true });
  }

  /** ⟳ button: re-translate ignoring caches (and skip the same-lang guard). */
  private async forceRetranslate(msg: IncomingDomMessage, real: string): Promise<void> {
    showLoading(msg.injectionTarget);
    const outcome = await this.requestCloud(real, this.effTarget, msg.channel, '', true);
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
    sourceLang?: string,
  ): Promise<TranslationOutcome | undefined> {
    try {
      const res = await send({
        type: 'translate',
        payload: {
          messageId: 'dom',
          text,
          targetLang: target,
          channel,
          ...(sourceLang ? { sourceLangHint: sourceLang } : {}),
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
    // If the original row was recycled by virtual scroll, try to find another
    // visible row that still holds the same text and inject there instead of
    // silently dropping the translation we just paid for.
    if (this.rowRecycled(msg)) {
      const rescued = this.findRowWithText(msg.text);
      if (!rescued) return;
      msg = { ...msg, rowElement: rescued.row, injectionTarget: rescued.target };
    }
    const tt = applyUserGlossary(result.translatedText, this.settings.glossary);
    if (!tt) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!opts.force) {
      if (isSameLanguageAsTarget(result.detectedLang, this.effTarget) && this.settings.ignoreEnglish) {
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
      if (tt.trim().toLowerCase() === real.trim().toLowerCase()) {
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
    }
    if (opts.store) {
      memCache.set(real, this.effTarget, {
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
    updateActiveProvider(result.provider);
    // Provider switch notification.
    if (this.lastProvider && this.lastProvider !== result.provider) {
      this.maybeToast(`Switched to ${result.provider}`);
    }
    this.lastProvider = result.provider;
  }

  /** Track provider switches to notify the user. */
  private lastProvider: string | undefined;

  /** #7 — Rate-limited toast: max 1 every 30s. */
  private lastToastMs = 0;
  private maybeToast(msg: string): void {
    if (Date.now() - this.lastToastMs < 30_000) return;
    this.lastToastMs = Date.now();
    showToast(msg);
  }

  /** Virtual-scroll guard: row reused for a newer message while we awaited. */
  private rowRecycled(msg: IncomingDomMessage): boolean {
    return !msg.rowElement.isConnected || extractMessageText(msg.rowElement) !== msg.text;
  }

  /** Scan visible rows for one that still holds the given text (recycled-row rescue). */
  private findRowWithText(text: string): { row: Element; target: Element } | undefined {
    const rows = document.querySelectorAll('#channel-chatroom div[data-index]');
    for (const row of rows) {
      if (extractMessageText(row) === text && !row.querySelector(TRANSLATION_SELECTOR)) {
        const target = row.querySelector('div.w-full.min-w-0.shrink-0') ?? row.querySelector('div.group') ?? row.firstElementChild ?? row;
        return { row, target };
      }
    }
    return undefined;
  }
}
