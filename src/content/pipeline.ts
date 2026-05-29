import type { Settings } from '~/shared/settings';
import type { TranslationOutcome, TranslationResult } from '~/shared/types';
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { parseKickContent } from './emoteParser';
import { detectLanguage, isLikelyEnglish } from './langDetect';
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

export class TranslationPipeline {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  updateSettings(next: Settings): void {
    this.settings = next;
  }

  /** Cache-warm via the cloud chain when a message arrives over WS (cloud path only). */
  async onWebSocketMessage(msg: IncomingWsMessage): Promise<void> {
    if (!this.settings.enabled) return;
    if (this.settings.engineMode === 'local-only') return; // local can't run from SW
    if (shouldDropByUserOrChannel(msg, this.settings)) return;
    const { plain } = parseKickContent(msg.text);
    if (!this.passLengthAndLang(plain)) return;
    try {
      await send({
        type: 'translate',
        payload: {
          messageId: `ws:${msg.id}`,
          text: plain,
          targetLang: this.settings.targetLang,
          channel: msg.channel,
        },
      });
    } catch (err: unknown) {
      log.debug('ws warmup failed', err);
    }
  }

  async onDomMessage(msg: IncomingDomMessage): Promise<void> {
    if (!this.settings.enabled) return;
    if (shouldDropByUserOrChannel(msg, this.settings)) return;

    const { plain } = parseKickContent(msg.text);
    if (!this.passLengthAndLang(plain)) return;

    const detected = detectLanguage(plain);
    if (isSameLanguageAsTarget(detected, this.settings.targetLang)) return;
    if (shouldDropBySourceLang(detected, this.settings)) return;

    const target = this.settings.targetLang;

    // ── On-device first ──────────────────────────────────────────────
    if (this.settings.localEnabled && this.settings.engineMode !== 'cloud-first' && detected) {
      localEngine.noteSeen(detected, target);
      if (localEngine.isReady(detected, target)) {
        showLoading(msg.injectionTarget);
        try {
          const translatedText = await localEngine.translate(detected, target, plain);
          this.finishLocal(msg, plain, translatedText, detected);
          return;
        } catch (err: unknown) {
          log.debug('local translate failed, falling back', err);
        }
      } else if (this.settings.engineMode === 'local-only') {
        // model not downloaded yet → can't translate without a gesture; skip silently
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
    }

    if (this.settings.engineMode === 'local-only') {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }

    // ── Cloud fallback (coalesced + batched in the SW) ───────────────
    await this.translateViaCloud(msg, plain, detected);
  }

  private finishLocal(
    msg: IncomingDomMessage,
    plain: string,
    translatedText: string,
    detected: string,
  ): void {
    if (!translatedText || translatedText.trim().toLowerCase() === plain.trim().toLowerCase()) {
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
    void send({ type: 'stats.local', payload: { lang: detected, chars: plain.length } }).catch(
      () => undefined,
    );
  }

  private async translateViaCloud(
    msg: IncomingDomMessage,
    plain: string,
    detected: string | undefined,
  ): Promise<void> {
    showLoading(msg.injectionTarget);
    let outcome: TranslationOutcome;
    try {
      const res = await send({
        type: 'translate',
        payload: {
          messageId: msg.id,
          text: plain,
          targetLang: this.settings.targetLang,
          sourceLangHint: detected,
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
    if (outcome.result.translatedText.trim().toLowerCase() === plain.trim().toLowerCase()) {
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    inject(msg.injectionTarget, outcome.result, this.settings);
  }

  private passLengthAndLang(text: string): boolean {
    if (text.length < MIN_TEXT_LENGTH) return false;
    if (text.length > MAX_TEXT_LENGTH) return false;
    if (isNoise(text)) return false;
    if (this.settings.ignoreEnglish && this.settings.targetLang === 'en' && isLikelyEnglish(text)) {
      return false;
    }
    return true;
  }
}
