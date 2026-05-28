import type { Settings } from '~/shared/settings';
import type { TranslationOutcome } from '~/shared/types';
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { parseKickContent } from './emoteParser';
import { detectLanguage, isLikelyEnglish } from './langDetect';
import { isSameLanguageAsTarget, shouldDropBySourceLang, shouldDropByUserOrChannel } from './filters';
import { inject, removeAllArtifacts, showError, showHoverTrigger, showLoading } from './injector';

const log = rootLogger.child('pipeline');

interface PendingDom {
  element: Element;
  text: string;
  channel: string;
  username: string;
}

export interface IncomingDomMessage {
  element: Element;
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
  private pending = new Map<string, PendingDom>();
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  updateSettings(next: Settings): void {
    this.settings = next;
  }

  /** Pre-translate (cache warm) when a message arrives via WS. */
  async onWebSocketMessage(msg: IncomingWsMessage): Promise<void> {
    if (!this.settings.enabled) return;
    const drop = shouldDropByUserOrChannel(msg, this.settings);
    if (drop) return;
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

    const drop = shouldDropByUserOrChannel(msg, this.settings);
    if (drop) return;

    const { plain } = parseKickContent(msg.text);
    if (!this.passLengthAndLang(plain)) return;

    const detected = detectLanguage(plain);
    if (isSameLanguageAsTarget(detected, this.settings.targetLang)) return;

    const dropLang = shouldDropBySourceLang(detected, this.settings);
    if (dropLang) return;

    // Hover mode: don't auto-translate
    if (this.settings.displayStyle === 'hover') {
      showHoverTrigger(msg.element, () => {
        void this.translateAndInject(msg, plain, detected);
      });
      return;
    }

    await this.translateAndInject(msg, plain, detected);
  }

  private async translateAndInject(
    msg: IncomingDomMessage,
    plain: string,
    detected: string | undefined,
  ): Promise<void> {
    this.pending.set(msg.id, {
      element: msg.element,
      text: plain,
      channel: msg.channel,
      username: msg.username,
    });
    showLoading(msg.element);

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
      if (res.type !== 'translate.result') {
        throw new Error('Unexpected response');
      }
      outcome = res.payload;
    } catch (err: unknown) {
      log.warn('translate failed', err);
      if (this.settings.debug) showError(msg.element, 'translate failed');
      else removeAllArtifacts(msg.element);
      this.pending.delete(msg.id);
      return;
    }

    this.pending.delete(msg.id);

    if (!outcome.ok) {
      if (this.settings.debug) showError(msg.element, outcome.error.code);
      else removeAllArtifacts(msg.element);
      return;
    }

    if (!outcome.result.translatedText) {
      removeAllArtifacts(msg.element);
      return;
    }

    if (
      isSameLanguageAsTarget(outcome.result.detectedLang, this.settings.targetLang) &&
      this.settings.ignoreEnglish
    ) {
      removeAllArtifacts(msg.element);
      return;
    }

    // Sanity guard: identical text → don't display
    if (outcome.result.translatedText.trim().toLowerCase() === plain.trim().toLowerCase()) {
      removeAllArtifacts(msg.element);
      return;
    }

    inject(msg.element, outcome.result, this.settings);
  }

  private passLengthAndLang(text: string): boolean {
    if (text.length < MIN_TEXT_LENGTH) return false;
    if (text.length > MAX_TEXT_LENGTH) return false;
    if (this.settings.ignoreEnglish && isLikelyEnglish(text)) {
      if (this.settings.targetLang === 'en') return false;
    }
    return true;
  }
}

