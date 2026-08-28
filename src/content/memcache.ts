import { cacheKey } from '~/shared/normalize';
import type { ProviderId } from '~/shared/types';

export interface MemEntry {
  translatedText: string;
  detectedLang: string;
  provider: ProviderId;
}

/**
 * Tiny in-tab LRU of recent translations. Repeated chat lines (copypasta, common
 * reactions) render instantly with ZERO messaging to the service worker. The SW
 * IndexedDB cache still backs cross-tab / cross-session reuse.
 */
class MemCache {
  private map = new Map<string, MemEntry>();
  constructor(private max = 1500) {}

  get(text: string, target: string): MemEntry | undefined {
    const k = cacheKey(text, target);
    const v = this.map.get(k);
    if (v) {
      // LRU touch
      this.map.delete(k);
      this.map.set(k, v);
    }
    return v;
  }

  set(text: string, target: string, entry: MemEntry): void {
    const k = cacheKey(text, target);
    this.map.delete(k);
    this.map.set(k, entry);
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  /** Entries held, so a hit rate of zero can be told apart from an empty map. */
  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

export const memCache = new MemCache();
