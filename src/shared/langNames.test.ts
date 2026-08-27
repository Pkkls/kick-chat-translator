import { describe, expect, it } from 'vitest';
import { LANGUAGES, localLangName, sortedLanguages } from './languages';

describe('localLangName', () => {
  // The bug: every language menu rendered in English whatever the interface
  // language was, so a Japanese user met a list they could not read.
  it('names a language in the reader language, not in English', () => {
    const ja = localLangName('fr', 'Français', 'ja');
    const en = localLangName('fr', 'Français', 'en');
    expect(ja).not.toBe(en);
    expect(ja).toMatch(/[\u3000-\u9fff]/); // actual Japanese, not a fallback
  });

  it('falls back to the native name for a code nothing knows', () => {
    expect(localLangName('zzzz', 'Fallback', 'en')).toBe('Fallback');
  });
});

describe('sortedLanguages', () => {
  it('covers the whole catalogue, once each', () => {
    const out = sortedLanguages('en');
    expect(out).toHaveLength(LANGUAGES.length);
    expect(new Set(out.map((l) => l.code)).size).toBe(LANGUAGES.length);
  });

  it('is sorted for the reader in every interface language we ship', () => {
    for (const loc of ['en', 'ja', 'fr', 'zh', 'ar', 'ru', 'pt', 'es', 'tr', 'ko']) {
      const names = sortedLanguages(loc).map((l) => l.name);
      const collator = new Intl.Collator(loc);
      const expected = [...names].sort((a, b) => collator.compare(a, b));
      expect(names, `order is wrong for ${loc}`).toEqual(expected);
    }
  });

  // Control: a plain sort is NOT good enough, which is why Intl.Collator is
  // there. If these ever agree the guard has stopped guarding anything.
  it('differs from a naive sort where accents exist', () => {
    const differing = ['ja', 'tr', 'cs'].filter((loc) => {
      const names = sortedLanguages(loc).map((l) => l.name);
      return JSON.stringify([...names].sort()) !== JSON.stringify(names);
    });
    expect(differing.length, 'collation made no difference anywhere').toBeGreaterThan(0);
  });

  it('gives every entry a non-empty name', () => {
    for (const loc of ['en', 'ja', 'ar']) {
      for (const l of sortedLanguages(loc)) {
        expect(l.name.trim().length, `${l.code} is unnamed in ${loc}`).toBeGreaterThan(0);
      }
    }
  });
});
