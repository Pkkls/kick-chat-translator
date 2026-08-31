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

  // Deux codes que rien ne nomme, et ils ne prennent PAS le meme chemin. C'est
  // ce que l'ancienne version de ce test ne separait pas, et c'est ce qui l'a
  // fait passer ici et rougir en CI.
  it('falls back to the native name for a malformed code', () => {
    // Quatre lettres n'est pas la forme d'une langue : le moteur leve, et
    // certains runtimes seulement. Le test ne pouvait donc rien garantir.
    expect(localLangName('zzzz', 'Fallback', 'en')).toBe('Fallback');
  });

  it('falls back to the native name for a well-formed code nothing knows', () => {
    // Le cas qui atteint vraiment un lecteur, et qui n'etait couvert nulle part.
    // Sans `fallback: 'none'`, le moteur renvoie le code lui-meme, `xx` est vrai,
    // et la rangee affichait `xx` a la place du nom natif.
    expect(localLangName('xx', 'Fallback', 'en')).toBe('Fallback');
    expect(localLangName('qqq', 'Fallback', 'ja')).toBe('Fallback');
  });

  it('still names the languages the engine does know', () => {
    // Le temoin de l'autre cote : `fallback: 'none'` ne doit pas transformer
    // tout le catalogue en noms natifs.
    expect(localLangName('fr', 'Francais', 'en')).toBe('French');
    expect(localLangName('ja', 'Nihongo', 'en')).toBe('Japanese');
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
