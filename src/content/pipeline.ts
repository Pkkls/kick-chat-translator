import type { Settings } from '~/shared/settings';
import type { Decision } from '~/shared/messages';
import type { ProviderId, TranslationOutcome, TranslationResult } from '~/shared/types';
import { MAX_TEXT_LENGTH } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { send } from '~/shared/messages';
import { applyUserGlossary, isSlangOnly } from '~/shared/glossary';
import { createMetrics } from '~/shared/metrics';
import { parseKickContent } from './emoteParser';
import { extractMessageText } from './selectors';
import { confidentLanguage, detectLanguage } from './langDetect';
import { resolveBrowserLang } from '~/shared/languages';
import { isContextCritical } from '~/shared/langTiers';
import { isNoise, isSameLanguageAsTarget, normalizeElongation, shouldDropBySourceLang, shouldDropByUserOrChannel } from './filters';
import { HANDLED_SELECTOR, inject, incrementFloatingCount, injectHoverPlaceholder, markSkipped, removeAllArtifacts, showError, showLoading, showThrottleIndicator, showToast, updateActiveProvider } from './injector';
import { localEngine } from './localEngine';
import { memCache } from './memcache';

const log = rootLogger.child('pipeline');
const metrics = createMetrics('content');

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

/**
 * Filter codes turned into something a reader can act on.
 *
 * English only, like every other string this content script shows. It has no
 * translation runtime of its own, and giving it one would put the whole UI
 * catalogue (about 67 KB) on every Kick page just to fill a tooltip.
 */
const DROP_REASON: Record<string, string> = {
  bot: 'the sender looks like a bot',
  user_blacklisted: 'this user is on your blocked list',
  channel_blacklisted: 'this channel is on your blocked list',
  channel_not_whitelisted: 'this channel is not on your allowed list',
  lang_unknown: 'its language could not be identified',
  lang_not_allowed: 'its language is not on your allowed list',
};

/** How many decisions the Debug tab can look back over. */
const DECISION_LOG_MAX = 50;

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
  /**
   * The last few calls this made, so the Debug tab can show them. Memory only,
   * never written to storage, and dropped with the page.
   */
  private decisions: Decision[] = [];

  private note(text: string, outcome: string): void {
    // Kept whole enough to be readable in full on hover. Still bounded, because
    // this text comes from a page we do not control.
    this.decisions.push({ at: Date.now(), text: text.slice(0, 200), outcome });
    if (this.decisions.length > DECISION_LOG_MAX) this.decisions.shift();
  }

  /** Newest first, for the Debug tab. */
  recentDecisions(): Decision[] {
    return [...this.decisions].reverse();
  }

  /**
   * Leave the reason on the line and remember it. An empty reason clears the
   * line, which every message about to be translated does, so a recycled row
   * never keeps the explanation of the message that used it before.
   */
  private skip(msg: IncomingDomMessage, reason: string): void {
    markSkipped(msg.injectionTarget, reason);
    if (reason) {
      this.note(msg.text, reason);
      // The Debug tab shows the last 50 one by one, which answers "why was THIS
      // line left alone" and never "what share of chat never reaches an engine".
      // The defaults for ignoreEnglish and minTextLength were picked without it.
      metrics.count(`skip.${reason}`);
    }
  }

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
  ): Prepared | string {
    // An empty reason means "skipped, but there is nothing worth telling this
    // line about": the two gates below are about the whole tab, not the message.
    if (!this.settings.enabled) return '';
    // Live visibility gate — read document.hidden each message so a backgrounded
    // tab never translates (no quota burn), with no stuck-paused state.
    if (this.settings.pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
      return '';
    }
    const dropped = shouldDropByUserOrChannel(meta, this.settings);
    if (dropped) return DROP_REASON[dropped] ?? dropped;

    // Per-user dedup: if this user just sent the exact same message, skip it.
    // Common in chat spam — saves a provider call + avoids duplicate translations.
    // Only the DOM path takes part. It is the only path that displays, so letting
    // the websocket warm pass claim the slot first would suppress the display of a
    // message nobody has seen yet.
    if (opts.dedup) {
      const dedupKey = meta.username.toLowerCase();
      if (dedupKey && this.userDedup.get(dedupKey) === rawText) return 'the same user just sent this';
      if (dedupKey) this.userDedup.set(dedupKey, rawText);
    }

    const { realText } = parseKickContent(rawText);
    if (realText.length < this.settings.minTextLength) {
      return `it is shorter than your ${this.settings.minTextLength} character minimum`;
    }
    if (realText.length > MAX_TEXT_LENGTH) return 'it is longer than the size limit';
    if (isNoise(realText)) return 'it is only emoji, symbols or laughter'; // kkkk / rsrs / xd / digits
    if (isSlangOnly(realText)) return 'it is only chat slang'; // poggers / copium / kekw …

    const detected = detectLanguage(realText);
    // Three exits can end a line for "already readable", and they are not the
    // same event: two of them decide here without asking anyone, the third is
    // the service answering after the call was made. Each says which it is, or
    // the Debug tab shows two verdicts for what looks like one case.
    if (this.settings.ignoreEnglish && this.effTarget === 'en' && detected === 'en') {
      return 'it looks like English and you asked to skip English';
    }
    if (isSameLanguageAsTarget(detected, this.effTarget)) return 'it is already in your language';
    const byLang = shouldDropBySourceLang(detected, this.settings);
    if (byLang) return DROP_REASON[byLang] ?? byLang;

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
    if (typeof prepared === 'string') return;
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
    if (typeof prepared === 'string') {
      this.skip(msg, prepared);
      return;
    }
    // This line is going to be translated, so drop any reason left on it by the
    // message that used this row before the virtual scroller recycled it.
    this.skip(msg, '');
    const { real, detected } = prepared;
    const target = this.effTarget;

    // ── 0. In-tab memory cache: instant, zero round-trip ──
    const mem = memCache.get(real, target);
    if (mem) {
      // stats.ts counts one totalCacheHits for both tiers, so nothing says
      // whether this in-tab map earns its size or the SW cache does all the work.
      metrics.count('cache.mem.hit');
      this.applyTranslation(msg, real, mem, { store: false });
      return;
    }
    metrics.count('cache.mem.miss');

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
        const t0 = performance.now();
        try {
          const translatedText = await localEngine.translate(detected, target, real);
          this.applyTranslation(msg, real, { translatedText, detectedLang: detected, provider: 'local' }, { store: true });
          // Seen to painted, on device. `e2e.cloud` in translateAndApply is the
          // same span for the other path, so the two are directly comparable.
          // local-first has been the default since it shipped and nothing has
          // ever measured whether it is the faster one.
          metrics.timing('e2e.local', performance.now() - t0);
          void send({ type: 'stats.local', payload: { lang: detected, chars: real.length } }).catch(() => undefined);
          return;
        } catch (err: unknown) {
          log.debug('local translate failed, falling back', err);
        }
      } else if (this.settings.engineMode === 'local-only') {
        this.skip(msg, 'there is no on device model for its language yet');
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
    }

    if (this.settings.engineMode === 'local-only') {
      this.skip(msg, 'there is no on device model for its language yet');
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
    // Counterpart of `e2e.local`. This span covers the whole round trip the
    // reader waits through: coalescing window, SW cache lookup, provider call and
    // every fallback the chain walked. Not the provider latency the SW records,
    // which is only the last hop of it.
    const t0 = performance.now();
    // Only tell the engine the source language when we looked it up rather than
    // guessed it. A guessed `sl` makes the engine translate from the wrong
    // language, and the result is either dropped for matching the original or
    // shown while saying something else. `sourceLang` still sizes the context
    // window above, where being wrong costs nothing.
    const outcome = await this.requestCloud(real, this.effTarget, msg.channel, context, false, confidentLanguage(real));
    if (!outcome) {
      showError(msg.injectionTarget, 'translate failed', () => void this.forceRetranslate(msg, real));
      return;
    }
    if (!outcome.ok) {
      // #7 — Toast on notable failures (max 1 per 30s to avoid spam).
      const code = outcome.error.code;
      // Budget saturation is a fact about the channel, not about this line: on a
      // fast chat every message over the cap would carry its own red marker and
      // say the same thing hundreds of times. Report it once, on the bar, and
      // leave the line bare. Every other reason keeps its per-line marker.
      if (code === 'channel_budget') {
        showThrottleIndicator(true);
        setTimeout(() => showThrottleIndicator(false), 5000);
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
      if (code === 'saturated' || code === 'no_provider') {
        this.maybeToast('All translation providers are down — retrying shortly');
      } else if (code === 'quota' || outcome.error.message?.includes('quota')) {
        this.maybeToast(`${outcome.error.provider ?? 'Provider'} quota reached — falling back`);
      }
      showError(msg.injectionTarget, code, () => void this.forceRetranslate(msg, real));
      return;
    }
    this.applyTranslation(msg, real, outcome.result, { store: true });
    // Only the success path is timed. A line that ended on showError never
    // reached the reader, and folding those into the same series would drag the
    // median toward a latency nobody actually waited for a translation through.
    metrics.timing('e2e.cloud', performance.now() - t0);
    metrics.count(outcome.result.cached ? 'cache.sw.hit' : 'cache.sw.miss');
  }

  /**
   * Second and last attempt, on the flattened text, after the engine returned the
   * line unchanged. `noCache` because the cache would hand back the same refusal,
   * and `normalized` so a second refusal ends as a skip instead of looping.
   */
  private async retryNormalized(msg: IncomingDomMessage, flat: string): Promise<void> {
    const outcome = await this.requestCloud(flat, this.effTarget, msg.channel, '', true, confidentLanguage(flat));
    if (!outcome?.ok) {
      this.skip(msg, 'the translation came back the same as the original');
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    metrics.count('retry.normalized.answered');
    this.applyTranslation(msg, flat, outcome.result, { store: true, normalized: true });
  }

  /** ⟳ button: re-translate ignoring caches (and skip the same-lang guard). */
  private async forceRetranslate(msg: IncomingDomMessage, real: string): Promise<void> {
    showLoading(msg.injectionTarget);
    const outcome = await this.requestCloud(real, this.effTarget, msg.channel, '', true);
    if (!outcome || !outcome.ok) {
      // A failed retry must not delete the button that started it.
      showError(msg.injectionTarget, 'translate failed', () => void this.forceRetranslate(msg, real));
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
      // The whole round trip to the worker and back. Measured against
      // `leg.sw.total`, which the worker records for its own share: the
      // difference is message transport plus, in MV3, waking a worker that the
      // browser may have killed since the last line.
      const res = await metrics.measure('leg.roundtrip', () => send({
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
      }));
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
    opts: { store: boolean; force?: boolean; normalized?: boolean },
  ): void {
    // Everything from having the text to it being on screen: the recycled-row
    // rescue below walks the panel, and injection touches the DOM of a page we do
    // not control. Cheap in theory, never measured, and it sits inside the 780ms
    // that the provider call does not account for.
    const paintT0 = performance.now();
    try {
      this.applyTranslationInner(msg, real, result, opts);
    } finally {
      metrics.timing('leg.inject', performance.now() - paintT0);
    }
  }

  private applyTranslationInner(
    msg: IncomingDomMessage,
    real: string,
    result: RawResult,
    opts: { store: boolean; force?: boolean; normalized?: boolean },
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
      this.skip(msg, 'your glossary emptied the translation');
      removeAllArtifacts(msg.injectionTarget);
      return;
    }
    if (!opts.force) {
      if (isSameLanguageAsTarget(result.detectedLang, this.effTarget) && this.settings.ignoreEnglish) {
        this.skip(msg, 'the translation service found it was already in your language');
        removeAllArtifacts(msg.injectionTarget);
        return;
      }
      if (tt.trim().toLowerCase() === real.trim().toLowerCase()) {
        // The engine handed the line straight back. On stretched chat that is
        // usually why: "BINNNNNNNGOOOOOOO" and "muuuuy biennnn" both return
        // unchanged, and flattened they come back as "BINGO" and "très bien".
        // Retrying here rather than flattening every line up front is deliberate:
        // Google already copes with some stretching, and normalising first turns
        // "sooo goood" from "tellement bon" into "alors mon Dieu". After a refusal
        // there is nothing left to spoil.
        const flat = normalizeElongation(real);
        if (!opts.normalized && flat !== real && flat.length > 0) {
          metrics.count('retry.normalized');
          void this.retryNormalized(msg, flat);
          return;
        }
        this.skip(msg, 'the translation came back the same as the original');
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
    this.note(real, 'translated');
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
      if (extractMessageText(row) === text && !row.querySelector(HANDLED_SELECTOR)) {
        const target = row.querySelector('div.w-full.min-w-0.shrink-0') ?? row.querySelector('div.group') ?? row.firstElementChild ?? row;
        return { row, target };
      }
    }
    return undefined;
  }
}
