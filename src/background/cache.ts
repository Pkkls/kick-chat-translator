import { createStore, get, set, del, keys, clear } from 'idb-keyval';
import { CACHE_DB, CACHE_STORE } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';
import { cacheKey, normalizeForKey } from '~/shared/normalize';

// Re-export so existing importers (and tests) keep working.
export { normalizeForKey };

const log = rootLogger.child('cache');
const store = createStore(CACHE_DB, CACHE_STORE);

/**
 * Target languages worth warming, most important first: what the user reads, then
 * the languages seen most in chat. The second group is there because compose
 * translates INTO the channel's language, and the languages we translate FROM are
 * the closest signal the worker has for which channels are being watched.
 */
export function warmTargets(readTarget: string, byLang: Record<string, number>, max = 3): string[] {
  const frequent = Object.entries(byLang)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([lang]) => lang);
  return [...new Set([readTarget, ...frequent])].filter(Boolean);
}

interface CacheEntry {
  translatedText: string;
  detectedLang: string;
  provider: string;
  storedAtMs: number;
}

export class TranslationCache {
  // In-memory layer to avoid IDB roundtrip in hot paths
  private mem = new Map<string, CacheEntry>();

  constructor(
    private maxEntries: number,
    private ttlMs: number,
  ) {}

  setConfig(maxEntries: number, ttlMs: number): void {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  key(text: string, targetLang: string): string {
    return cacheKey(text, targetLang);
  }

  async get(text: string, targetLang: string): Promise<CacheEntry | undefined> {
    const k = this.key(text, targetLang);
    let entry = this.mem.get(k);
    if (!entry) {
      try {
        entry = await get<CacheEntry>(k, store);
        if (entry) this.mem.set(k, entry);
      } catch (err: unknown) {
        log.warn('idb get failed', err);
      }
    }
    if (!entry) return undefined;
    if (Date.now() - entry.storedAtMs > this.ttlMs) {
      this.mem.delete(k);
      void del(k, store).catch(() => undefined);
      return undefined;
    }
    return entry;
  }

  async set(
    text: string,
    targetLang: string,
    value: Omit<CacheEntry, 'storedAtMs'>,
  ): Promise<void> {
    const entry: CacheEntry = { ...value, storedAtMs: Date.now() };
    const k = this.key(text, targetLang);
    this.mem.set(k, entry);
    try {
      await set(k, entry, store);
    } catch (err: unknown) {
      log.warn('idb set failed', err);
    }
    if (this.mem.size > this.maxEntries) this.evict();
  }

  async clear(): Promise<void> {
    this.mem.clear();
    try {
      await clear(store);
    } catch (err: unknown) {
      log.warn('idb clear failed', err);
    }
  }

  private evict(): void {
    const toRemove = this.mem.size - this.maxEntries;
    if (toRemove <= 0) return;
    let i = 0;
    for (const k of this.mem.keys()) {
      if (i >= toRemove) break;
      this.mem.delete(k);
      void del(k, store).catch(() => undefined);
      i += 1;
    }
  }

  /**
   * Pull entries back into memory at startup. IndexedDB returns keys in
   * lexicographic order and every key begins with its target language, so taking
   * the first `limit` blindly warms whichever language sorts first rather than the
   * one being read. `targets` is consumed most-important-first.
   */
  async warm(limit = 200, targets: string[] = []): Promise<void> {
    try {
      const ks = (await keys(store)).filter((k): k is string => typeof k === 'string');
      let wanted = ks;
      if (targets.length > 0) {
        wanted = [];
        for (const prefix of targets.map((t) => `${t}::`)) {
          for (const k of ks) if (k.startsWith(prefix)) wanted.push(k);
          if (wanted.length >= limit) break;
        }
      }
      for (const k of wanted.slice(0, limit)) {
        const v = await get<CacheEntry>(k, store);
        if (v) this.mem.set(k, v);
      }
    } catch (err: unknown) {
      log.warn('warm failed', err);
    }
  }
}
