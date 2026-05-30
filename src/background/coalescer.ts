import type { Settings } from '~/shared/settings';
import type { TranslationOutcome, TranslationRequest } from '~/shared/types';
import { BATCH_MAX_ITEMS, BATCH_WINDOW_MS } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { translateGroup } from './translator';
import type { TranslationCache } from './cache';
import type { StatsTracker } from './stats';

const log = rootLogger.child('coalescer');

interface Entry {
  req: TranslationRequest;
  key: string;
  resolvers: ((o: TranslationOutcome) => void)[];
}

export interface CoalescerDeps {
  getSettings: () => Settings;
  cache: TranslationCache;
  stats: StatsTracker;
}

/**
 * Buffers translate requests for a short window, dedups identical text in-flight,
 * groups by target language and dispatches as a batch (DeepL) or concurrency-capped
 * per-item (others) through the provider chain.
 */
export class TranslationCoalescer {
  private pending: Entry[] = [];
  private byKey = new Map<string, Entry>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** Adaptive batch window: track message rate to auto-tune. */
  private recentSubmits: number[] = [];

  constructor(private deps: CoalescerDeps) {}

  /** Adaptive window: 50ms on slow chats, up to 300ms on fast chats. */
  private adaptiveWindowMs(): number {
    const now = Date.now();
    // Keep only the last 10s of submit timestamps.
    this.recentSubmits = this.recentSubmits.filter((t) => now - t < 10_000);
    this.recentSubmits.push(now);
    const rate = this.recentSubmits.length; // msgs in last 10s
    if (rate < 3) return 50; // slow chat: low latency
    if (rate < 10) return BATCH_WINDOW_MS; // normal: default 180ms
    return 300; // fast chat: batch more aggressively
  }

  submit(req: TranslationRequest): Promise<TranslationOutcome> {
    const key = this.deps.cache.key(req.text, req.targetLang);
    const existing = this.byKey.get(key);
    if (existing) {
      return new Promise((resolve) => existing.resolvers.push(resolve));
    }
    const entry: Entry = { req, key, resolvers: [] };
    this.byKey.set(key, entry);
    this.pending.push(entry);
    const p = new Promise<TranslationOutcome>((resolve) => entry.resolvers.push(resolve));

    if (this.pending.length >= BATCH_MAX_ITEMS) {
      void this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => void this.flush(), this.adaptiveWindowMs());
    }
    return p;
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    if (this.pending.length === 0) return;
    const batch = this.pending;
    this.pending = [];
    for (const e of batch) this.byKey.delete(e.key);

    const settings = this.deps.getSettings();
    const groups = new Map<string, Entry[]>();
    for (const e of batch) {
      const g = groups.get(e.req.targetLang);
      if (g) g.push(e);
      else groups.set(e.req.targetLang, [e]);
    }

    await Promise.all(
      [...groups.values()].map(async (entries) => {
        const reqs = entries.map((e) => e.req);
        let outcomes: TranslationOutcome[];
        try {
          outcomes = await translateGroup(reqs, settings, settings.concurrency);
        } catch (err: unknown) {
          log.warn('group dispatch threw', err);
          outcomes = reqs.map(() => ({
            ok: false as const,
            error: { code: 'dispatch', message: 'dispatch failed' },
          }));
        }
        entries.forEach((entry, i) => {
          this.finalize(entry, outcomes[i] ?? { ok: false, error: { code: 'no_result', message: 'no result' } });
        });
      }),
    );
  }

  private finalize(entry: Entry, outcome: TranslationOutcome): void {
    const { cache, stats } = this.deps;
    const dedupCount = entry.resolvers.length;
    if (outcome.ok) {
      void cache.set(entry.req.text, entry.req.targetLang, {
        translatedText: outcome.result.translatedText,
        detectedLang: outcome.result.detectedLang,
        provider: outcome.result.provider,
      });
      stats.recordRequest(outcome.result.provider, outcome.result.detectedLang, entry.req.text.length, false, entry.req.channel);
      // Extra callers that shared this in-flight translation count as cache hits.
      for (let k = 1; k < dedupCount; k++) {
        stats.recordRequest(outcome.result.provider, outcome.result.detectedLang, 0, true, entry.req.channel);
      }
    } else {
      stats.recordError();
    }
    for (const resolve of entry.resolvers) resolve(outcome);
  }
}
