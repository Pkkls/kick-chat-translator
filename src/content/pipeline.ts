import type { Settings } from '~/shared/settings';
import type { TranslationOutcome, TranslationResult } from '~/shared/types';
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { parseKickContent } from './emoteParser';
import { detectLanguage } from './langDetect';
import { isNoise, isSameLanguageAsTarget, shouldDropBySourceLang, shouldDropByUserOrChannel } from './filters';
import { inject, removeAllArtifacts, showError, showLoading } from './injector';
import { localEngine } from './localEngine';

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

/** Result of the cheap pre-checks shared by both ingestion paths. */
interface Prepared {
  real: string;
  detected: string | undefined;
}

export class TranslationPipeline {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  updateSettings(next: Settings): void {
    this.settings = next;
  }

  /**
   * Run all cheap filters (no network, single franc-min call) and return the
   * translatable text + detected language, or undefined to skip the message.
   */
  private prepare(rawText: string, meta: { username: string; channel: string; isBot: boolean }): Prepared | undefined {
    if (!this.settings.enabled) return undefined;
    if (shouldDropByUserOrChannel(meta, this.settings)) return undefined;

    const { realText } = parseKickContent(rawText);
    // Emote-only / @mention-only / url-only messages have no real words → skip.
    if (realText.length < MIN_TEXT_LENGTH || realText.length > MAX_TEXT_LENGTH) return undefined;
    if (isNoise(realText)) return undefined; // emoji / kkkk / rsrs / xd / digits …

    const detected = detectLanguage(realText); // franc-min — called ONCE per message
    if (this.settings.ignoreEnglish && this.settings.targetLang === 'en' && detected === 'en') {
      return undefined;
    }
    if (isSameLanguageAsTarget(detected, this.settings.targetLang)) return undefined;
    if (shouldDropBySourceLang(detected, this.settings)) return undefined;

    return { real: realText, detected };
  }

  /** Cache-warm via the cloud chain when a message arrives over WS (cloud path only). */
  async onWebSocketMessage(msg: IncomingWsMessage): Promise<void> {
    if (this.settings.engineMode === 'local-only') return; // local can't run from the SW
    const prepared = this.prepare(msg.text, msg);
    if (!prepared) return;
    try {
      await send({
        type: 'translate',
        payload: {
          messageId: `ws:${msg.id}`,
          text: prepared.real,
          targetLang: this.settings.targetLang,
          // No sourceLangHint: cloud providers (esp. DeepL) auto-detect more
          // reliably than franc-min on short chat text.
          channel: msg.channel,
        },
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

    // ── On-device first (Chrome; absent on Brave → falls straight to cloud) ──
    if (this.settings.localEnabled && this.settings.engineMode !== 'cloud-first' && detected) {
      localEngine.noteSeen(detected, target);
      if (localEngine.isReady(detected, target)) {
        showLoading(msg.injectionTarget);
        try {
          const translatedText = await localEngine.translate(detected, target, real);
          this.finishLocal(msg, real, translatedText, detected);
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

    await this.translateViaCloud(msg, real);
  }

  private finishLocal(msg: IncomingDomMessage, real: string, translatedText: string, detected: string): void {
    if (!translatedText || translatedText.trim().toLowerCase() === real.trim().toLowerCase()) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    const result: TranslationResult = {
      messageId: msg.id,
      translatedText,
      detectedLang: detected,
      provider: 'local',
      cached: false,
    };
    inject(msg.injectionTarget, result, this.settings);
    void send({ type: 'stats.local', payload: { lang: detected, chars: real.length } }).catch(() => undefined);
  }

  private async translateViaCloud(msg: IncomingDomMessage, real: string): Promise<void> {
    showLoading(msg.injectionTarget);
    let outcome: TranslationOutcome;
    try {
      const res = await send({
        type: 'translate',
        payload: {
          messageId: msg.id,
          text: real,
          targetLang: this.settings.targetLang,
          // No sourceLangHint: let cloud providers auto-detect (more accurate
          // than franc-min on short text, avoids forcing a wrong source on DeepL).
          channel: msg.channel,
        },
      });
      if (res.type !== 'translate.result') throw new Error('Unexpected response');
      outcome = res.payload;
    } catch (err: unknown) {
      log.warn('cloud translate failed', err);
      if (this.settings.debug) showError(msg.injectionTarget, 'translate failed');
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }

    if (!outcome.ok) {
      // Saturation / all providers down → skip silently (no orphan spinner).
      if (this.settings.debug) showError(msg.injectionTarget, outcome.error.code);
      else removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!outcome.result.translatedText) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (
      isSameLanguageAsTarget(outcome.result.detectedLang, this.settings.targetLang) &&
      this.settings.ignoreEnglish
    ) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (outcome.result.translatedText.trim().toLowerCase() === real.trim().toLowerCase()) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    inject(msg.injectionTarget, outcome.result, this.settings);
  }
}
