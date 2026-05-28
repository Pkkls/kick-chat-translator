import { createStore, get, set, del, keys, clear } from 'idb-keyval';
import { CACHE_DB, CACHE_STORE } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('cache');
const store = createStore(CACHE_DB, CACHE_STORE);

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
    return `${targetLang}::${text}`;
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

  async warm(limit = 200): Promise<void> {
    try {
      const ks = await keys(store);
      const subset = ks.slice(0, limit);
      for (const k of subset) {
        const v = await get<CacheEntry>(k, store);
        if (v && typeof k === 'string') this.mem.set(k, v);
      }
    } catch (err: unknown) {
      log.warn('warm failed', err);
    }
  }
}
