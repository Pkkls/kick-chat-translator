/**
 * Instrumentation for the integration build.
 *
 * Everything here is compiled OUT of a release build. `__KT_METRICS__` is a
 * constant injected by vite (see vite.config.ts), so `__KT_METRICS__ ? real : NOOP`
 * folds to `NOOP` at build time and the real implementation is dropped by tree
 * shaking. The call sites survive as calls into an object whose methods are
 * empty, which costs a few bytes and no work. Verified by scripts/check-strip.ts,
 * which fails the build if a release bundle still carries the marker.
 *
 * NOTHING IS SENT ANYWHERE. Samples live in chrome.storage.local under this
 * machine's own profile and are read back by the Debug tab. There is no endpoint,
 * no beacon, and no id of any kind. Adding one would change what both stores were
 * told this extension collects.
 *
 * The two contexts keep separate blobs (`.sw` for the service worker, `.content`
 * for the page) and each flushes its own. Routing page samples through a message
 * to the worker would add one round trip per chat line, which is exactly the cost
 * the measurement is supposed to find.
 */

/** Present in the real sink only. scripts/check-strip.ts greps release bundles for it. */
export const METRICS_MARKER = 'kt.metrics.v1';

export type MetricsScope = 'sw' | 'content';

/** Bounded sample reservoir per timing key: enough for a median, cheap to keep. */
const MAX_SAMPLES = 200;
const FLUSH_DEBOUNCE_MS = 2000;

export interface TimingSummary {
  n: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
  mean: number;
}

export interface MetricsSnapshot {
  scope: MetricsScope;
  since: number;
  counts: Record<string, number>;
  timings: Record<string, TimingSummary>;
}

/**
 * What actually goes to storage: raw samples, not summaries.
 *
 * Summaries cannot be merged. Folding a p50 into another p50 is meaningless, so a
 * stored summary is a dead end the moment the process that wrote it restarts. The
 * reservoirs are kept whole and the percentiles are computed when read.
 */
interface StoredMetrics {
  scope: MetricsScope;
  since: number;
  counts: Record<string, number>;
  samples: Record<string, number[]>;
}

export interface Metrics {
  /** Record a duration in milliseconds. */
  timing(key: string, ms: number): void;
  /** Increment a counter. */
  count(key: string, n?: number): void;
  /** Time a promise and record it under `key`, tagging failures separately. */
  measure<T>(key: string, fn: () => Promise<T>): Promise<T>;
  snapshot(): MetricsSnapshot | undefined;
  reset(): Promise<void>;
}

export function summarize(samples: number[]): TimingSummary {
  const s = [...samples].sort((a, b) => a - b);
  const n = s.length;
  // A percentile of nothing is not 0, it is absent. Callers drop empty keys
  // rather than charting a zero that reads as "instant".
  if (n === 0) return { n: 0, min: 0, p50: 0, p95: 0, max: 0, mean: 0 };
  const at = (q: number): number => s[Math.min(n - 1, Math.floor(q * n))] ?? 0;
  return {
    n,
    min: s[0] ?? 0,
    p50: at(0.5),
    p95: at(0.95),
    max: s[n - 1] ?? 0,
    mean: Math.round((s.reduce((a, b) => a + b, 0) / n) * 10) / 10,
  };
}

class LiveMetrics implements Metrics {
  private counts = new Map<string, number>();
  private samples = new Map<string, number[]>();
  private since = Date.now();
  private flushHandle: ReturnType<typeof setTimeout> | undefined;
  private key: string;

  constructor(private scope: MetricsScope) {
    this.key = `${METRICS_MARKER}.${scope}`;
  }

  timing(key: string, ms: number): void {
    let arr = this.samples.get(key);
    if (!arr) {
      arr = [];
      this.samples.set(key, arr);
    }
    // Keep the newest window rather than the first 200: a provider that degrades
    // an hour in would otherwise be invisible behind its warm-up samples.
    if (arr.length >= MAX_SAMPLES) arr.shift();
    arr.push(Math.round(ms));
    this.scheduleFlush();
  }

  count(key: string, n = 1): void {
    this.counts.set(key, (this.counts.get(key) ?? 0) + n);
    this.scheduleFlush();
  }

  async measure<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const t0 = performance.now();
    try {
      const out = await fn();
      this.timing(key, performance.now() - t0);
      return out;
    } catch (err: unknown) {
      // A failure that took 8 seconds and a success that took 80ms must not land
      // in the same distribution, or the median hides every timeout.
      this.timing(`${key}.failed`, performance.now() - t0);
      throw err;
    }
  }

  snapshot(): MetricsSnapshot {
    const timings: Record<string, TimingSummary> = {};
    for (const [k, v] of this.samples) timings[k] = summarize(v);
    return {
      scope: this.scope,
      since: this.since,
      counts: Object.fromEntries(this.counts),
      timings,
    };
  }

  async reset(): Promise<void> {
    this.counts.clear();
    this.samples.clear();
    this.since = Date.now();
    await chrome.storage.local.remove(this.key);
  }

  /** Raw state, mergeable, as it is stored. */
  private persisted(): StoredMetrics {
    return {
      scope: this.scope,
      since: this.since,
      counts: Object.fromEntries(this.counts),
      samples: Object.fromEntries(this.samples),
    };
  }

  /**
   * Fold what is already stored into what this process has, then write both back.
   *
   * A plain overwrite loses every earlier run, and in MV3 that is not an edge case:
   * the service worker is killed whenever it goes idle, so its sink is rebuilt
   * empty and the first flush wipes the record. Measured after the first night of
   * collection, eight hours of samples had been reduced to the forty seconds since
   * the last restart, because this method used to call `set` with a fresh snapshot.
   *
   * Counters add. Reservoirs concatenate and keep the newest MAX_SAMPLES, so a long
   * session still reports a recent distribution rather than a stale one. `since`
   * keeps the earliest, because it describes the record and not this process.
   */
  private async flush(): Promise<void> {
    const mine = this.persisted();
    let merged = mine;
    try {
      const stored = (await chrome.storage.local.get(this.key))[this.key] as StoredMetrics | undefined;
      if (stored && stored.counts && stored.samples) {
        const counts = { ...stored.counts };
        for (const [k, v] of Object.entries(mine.counts)) counts[k] = (counts[k] ?? 0) + v;
        const samples: Record<string, number[]> = { ...stored.samples };
        for (const [k, v] of Object.entries(mine.samples)) {
          samples[k] = [...(samples[k] ?? []), ...v].slice(-MAX_SAMPLES);
        }
        merged = { scope: this.scope, since: Math.min(stored.since ?? mine.since, mine.since), counts, samples };
      }
    } catch {
      // Storage unreadable: write this process's own state rather than nothing.
    }
    await chrome.storage.local.set({ [this.key]: merged });
    // What was just handed over must not be handed over again on the next flush,
    // or every interval would re-add the same counts and inflate them geometrically.
    this.counts.clear();
    this.samples.clear();
    this.since = merged.since;
  }

  private scheduleFlush(): void {
    if (this.flushHandle) return;
    this.flushHandle = setTimeout(() => {
      this.flushHandle = undefined;
      void this.flush().catch(() => undefined);
    }, FLUSH_DEBOUNCE_MS);
  }
}

const NOOP: Metrics = {
  timing: () => undefined,
  count: () => undefined,
  measure: (_key, fn) => fn(),
  snapshot: () => undefined,
  reset: () => Promise.resolve(),
};

const instances = new Map<MetricsScope, Metrics>();

/**
 * The sink for this context, one per scope.
 *
 * In a release build `__KT_METRICS__` is the constant `false`, so the guard below
 * always returns and everything after it is unreachable: esbuild drops it and
 * LiveMetrics never reaches the bundle.
 *
 * Memoised because two sinks for the same scope would both flush to the same
 * storage key and each would overwrite the other's samples.
 */
export function createMetrics(scope: MetricsScope): Metrics {
  if (!__KT_METRICS__) return NOOP;
  let m = instances.get(scope);
  if (!m) {
    m = new LiveMetrics(scope);
    instances.set(scope, m);
  }
  return m;
}

/**
 * Read both context blobs back, percentiles computed at read time.
 *
 * Storage holds raw reservoirs so that separate runs can be merged; turning them
 * into percentiles is this function's job and happens once, on demand.
 */
export async function readAllMetrics(): Promise<MetricsSnapshot[]> {
  const keys = [`${METRICS_MARKER}.sw`, `${METRICS_MARKER}.content`];
  const stored = await chrome.storage.local.get(keys);
  return keys
    .map((k) => stored[k] as StoredMetrics | undefined)
    .filter((v): v is StoredMetrics => v !== undefined && v.samples !== undefined)
    .map((s) => ({
      scope: s.scope,
      since: s.since,
      counts: s.counts,
      timings: Object.fromEntries(Object.entries(s.samples).map(([k, v]) => [k, summarize(v)])),
    }));
}
