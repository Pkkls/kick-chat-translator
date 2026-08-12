import { describe, expect, it } from 'vitest';
import { cacheKey } from '~/shared/normalize';
import { normalizeForKey, TranslationCache } from './cache';

describe('normalizeForKey', () => {
  it('lowercases and trims', () => {
    expect(normalizeForKey('  Hola  ')).toBe('hola');
  });

  it('collapses 3+ char repeats to 2', () => {
    expect(normalizeForKey('loooool')).toBe('lool');
    expect(normalizeForKey('草草草草')).toBe('草草');
    expect(normalizeForKey('wwwww')).toBe('ww');
  });

  it('drops trailing punctuation runs', () => {
    expect(normalizeForKey('genial!!!')).toBe('genial');
    expect(normalizeForKey('ええ？？')).toBe('ええ');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeForKey('hola    amigo')).toBe('hola amigo');
  });

  it('maps cosmetic variants to the same key (cache-hit win)', () => {
    expect(normalizeForKey('WWWW')).toBe(normalizeForKey('wwww'));
    expect(normalizeForKey('lol!!')).toBe(normalizeForKey('LOL'));
  });
});

describe('TranslationCache.key', () => {
  // The in-tab cache keys through cacheKey() while the worker keys through this
  // method. If the two formats drifted, every in-tab hit would miss in the worker.
  it('agrees with the shared cacheKey used by the in-tab cache', () => {
    const cache = new TranslationCache(10, 60_000);
    for (const [text, lang] of [
      ['Hola  amigo', 'en'],
      ['loooool', 'ja'],
      ['genial!!!', 'pt-br'],
    ] as const) {
      expect(cache.key(text, lang)).toBe(cacheKey(text, lang));
    }
  });

  it('keys cosmetic variants together but keeps target languages apart', () => {
    const cache = new TranslationCache(10, 60_000);
    expect(cache.key('WWWW', 'en')).toBe(cache.key('wwww', 'en'));
    expect(cache.key('hola', 'en')).not.toBe(cache.key('hola', 'fr'));
  });
});
