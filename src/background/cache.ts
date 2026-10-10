import { createStore, get, set, del, keys, clear, promisifyRequest } from 'idb-keyval';
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

  /**
   * Ce qu'il y a dedans, pour que le reglage qui le plafonne puisse le dire.
   *
   * keys() est deja l'appel que fait warm(). L'age vient du Map parce qu'il est
   * gratuit ; le prendre sur la base entiere couterait une lecture par cle, et
   * ce cache monte a vingt mille.
   */
  async stats(): Promise<{
    entries: number;
    inMemory: number;
    oldestMs?: number;
    maxEntries: number;
  }> {
    let entries = this.mem.size;
    try {
      entries = (await keys(store)).length;
    } catch (err: unknown) {
      log.warn('idb keys failed, falling back on the memory layer', err);
    }
    let plusVieille: number | undefined;
    for (const e of this.mem.values()) {
      if (plusVieille === undefined || e.storedAtMs < plusVieille) plusVieille = e.storedAtMs;
    }
    return {
      entries,
      inMemory: this.mem.size,
      ...(plusVieille === undefined ? {} : { oldestMs: Date.now() - plusVieille }),
      maxEntries: this.maxEntries,
    };
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
      // One key range per language, read in one transaction each. This used to
      // list every key in the store (up to cacheMaxEntries, 15,000 by default)
      // and then read the 200 it kept one transaction at a time: about 100 ms
      // of a worker start, measured on 15,000 entries in Chromium, against 3 ms
      // for the range. The worker now sleeps when no Kick tab is open, so it
      // starts more often and this is paid on the first line of a session.
      const ranges =
        targets.length > 0
          ? targets.map((t) => IDBKeyRange.bound(`${t}::`, `${t}::\uffff`))
          : [undefined];
      let left = limit;
      for (const range of ranges) {
        if (left <= 0) break;
        const [ks, vs] = await store('readonly', (s) =>
          Promise.all([
            promisifyRequest(s.getAllKeys(range, left)),
            promisifyRequest(s.getAll(range, left)),
          ]),
        );
        ks.forEach((k, i) => {
          if (typeof k === 'string' && vs[i]) this.mem.set(k, vs[i] as CacheEntry);
        });
        left -= ks.length;
      }
    } catch (err: unknown) {
      log.warn('warm failed', err);
    }
  }

}
