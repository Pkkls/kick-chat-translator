/**
 * Pure, DOM-free decision logic for the compose preview (outgoing translation).
 *
 * Kept separate from the DOM controller (`compose.ts`) and the panel UI
 * (`composeUi.ts`) so the fluidity-critical bits — what to translate, request
 * ordering, and rate limiting — are deterministic and unit-testable in isolation.
 */
import { isNoise, isSameLanguageAsTarget } from './filters';

/** Wait this long after the last keystroke before translating the settled text. */
export const COMPOSE_DEBOUNCE_MS = 320;
/** Don't bother translating fragments shorter than this. */
export const COMPOSE_MIN_LEN = 2;
/** Don't translate anything longer than this — chat lines are short; huge input is a paste. */
export const COMPOSE_MAX_LEN = 500;
/** Safety net against pathological typing — caps network calls per rolling minute. */
export const COMPOSE_MAX_PER_MIN = 30;

export type ComposeAction =
  | 'translate'
  | 'skip-empty'
  | 'skip-short'
  | 'skip-long'
  | 'skip-noise'
  | 'skip-same-lang'
  | 'skip-unchanged';

/** True when the text is nothing but links and/or @mentions — nothing to translate. */
export function isLinkOrMentionOnly(text: string): boolean {
  if (!/\S/.test(text)) return false;
  const stripped = text
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
  return stripped.length === 0;
}

/**
 * Decide whether the currently-typed text warrants a (network) translation.
 * All cheap gates run before any request is issued — this is the first line of
 * defence for both quota and fluidity.
 *
 * @param text            current composer text (raw, untrimmed)
 * @param lastTranslated  the text we last produced a translation for (for dedup)
 * @param detected        auto-detected source language (ISO2) or undefined
 * @param target          desired output language (ISO2)
 * @param minLen          minimum meaningful length
 */
export function decideComposeAction(
  text: string,
  lastTranslated: string | undefined,
  detected: string | undefined,
  target: string,
  minLen: number = COMPOSE_MIN_LEN,
): ComposeAction {
  const t = text.trim();
  if (t.length === 0) return 'skip-empty';
  if (t.length < minLen) return 'skip-short';
  if (t.length > COMPOSE_MAX_LEN) return 'skip-long';
  if (isNoise(t) || isLinkOrMentionOnly(t)) return 'skip-noise';
  // Only skip on a *confident* same-language detection — undefined means "let the
  // provider auto-detect", which is correct for short/ambiguous input.
  if (detected && isSameLanguageAsTarget(detected, target)) return 'skip-same-lang';
  if (lastTranslated !== undefined && t === lastTranslated.trim()) return 'skip-unchanged';
  return 'translate';
}

/**
 * Monotonic request sequencer. Every in-flight translation gets an id; a response
 * is applied only when it is still the latest — stale responses (the user kept
 * typing) are dropped so the preview never flickers to an out-of-date result.
 */
export class Sequencer {
  private latest = 0;

  next(): number {
    return ++this.latest;
  }

  get current(): number {
    return this.latest;
  }

  isCurrent(id: number): boolean {
    return id === this.latest;
  }
}

/** Sliding-window rate limiter. */
export class RateLimiter {
  private hits: number[] = [];

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true and records a hit when under the cap; false when the window is full. */
  tryAcquire(now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    this.hits = this.hits.filter((t) => t > cutoff);
    if (this.hits.length >= this.max) return false;
    this.hits.push(now);
    return true;
  }
}
