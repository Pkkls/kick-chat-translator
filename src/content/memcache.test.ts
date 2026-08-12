import { describe, expect, it } from 'vitest';
import { memCache } from './memcache';

const entry = (translatedText: string) => ({
  translatedText,
  detectedLang: 'es',
  provider: 'deepl' as const,
});

describe('memCache', () => {
  it('returns a stored translation and misses on a different target', () => {
    memCache.clear();
    memCache.set('hola', 'en', entry('hello'));
    expect(memCache.get('hola', 'en')?.translatedText).toBe('hello');
    expect(memCache.get('hola', 'fr')).toBeUndefined();
  });

  it('hits on a cosmetic variant of the same message', () => {
    memCache.clear();
    memCache.set('LOOOOL!!', 'en', entry('haha'));
    expect(memCache.get('lool', 'en')?.translatedText).toBe('haha');
  });

  it('overwrites rather than duplicating an existing key', () => {
    memCache.clear();
    memCache.set('hola', 'en', entry('hello'));
    memCache.set('hola', 'en', entry('hi'));
    expect(memCache.get('hola', 'en')?.translatedText).toBe('hi');
  });

  it('evicts the least recently used entry, sparing one that was just read', () => {
    // Digits are separated so normalizeForKey's repeat-collapsing ("111" -> "11")
    // cannot make two of these keys collide.
    const key = (i: number) => `m${String(i).split('').join('-')}`;
    const MAX = 1500;

    memCache.clear();
    for (let i = 0; i < MAX; i++) memCache.set(key(i), 'en', entry(String(i)));

    // Touch the oldest so it is no longer the eviction candidate.
    expect(memCache.get(key(0), 'en')?.translatedText).toBe('0');
    memCache.set(key(MAX), 'en', entry('overflow'));

    expect(memCache.get(key(0), 'en')?.translatedText).toBe('0');
    expect(memCache.get(key(1), 'en')).toBeUndefined();
    expect(memCache.get(key(MAX), 'en')?.translatedText).toBe('overflow');
  });

  it('drops everything on clear', () => {
    memCache.clear();
    memCache.set('hola', 'en', entry('hello'));
    memCache.clear();
    expect(memCache.get('hola', 'en')).toBeUndefined();
  });
});
