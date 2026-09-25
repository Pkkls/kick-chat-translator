import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { LANGUAGES } from './languages';
import { FLAG_BY_LANG, flagClass } from './flags';

describe('flags', () => {
  // A language added to LANGUAGES without an entry here would silently render
  // with no flag while every neighbour has one, which reads as a bug in the
  // list rather than as a missing table row.
  it('covers every offered language', () => {
    const missing = LANGUAGES.filter((l) => !FLAG_BY_LANG[l.code]).map((l) => l.code);
    expect(missing).toEqual([]);
    expect(Object.keys(FLAG_BY_LANG)).toHaveLength(LANGUAGES.length);
  });

  it('names a country code that exists as a drawn flag', () => {
    for (const cc of Object.values(FLAG_BY_LANG)) {
      expect(cc).toMatch(/^[a-z]{2}$/);
    }
  });

  // A decision, not a convention: zh and zh-tw are two rows in the list, so
  // they get the two flags their readers use.
  it('keeps Taiwan separate from China', () => {
    expect(FLAG_BY_LANG['zh-tw']).toBe('tw');
    expect(FLAG_BY_LANG['zh']).toBe('cn');
  });

  // The flag says which language the row is and nothing else. Russian showed
  // Ukraine's flag for a while; every other row was already read as the
  // language, so that one was the odd one out.
  it('shows each language its own flag, Russian included', () => {
    expect(FLAG_BY_LANG['ru']).toBe('ru');
    expect(FLAG_BY_LANG['uk']).toBe('ua');
  });

  it('has no flag for auto, rather than a wrong one', () => {
    expect(flagClass('auto')).toBeUndefined();
    expect(flagClass('fr')).toBe('kt-flag kt-flag-fr');
  });

  // A CODE HERE WITH NO RULE IN THE CSS DRAWS AN EMPTY BOX, and nothing in this
  // suite could see it: the table above only checks that every language HAS a
  // code. Cantonese shipped with `hk` in the table, no `.kt-flag-hk` anywhere,
  // and an empty square in the language panel for as long as it took an offline
  // gate that nobody runs in CI to say "1 of 39 language rows draw no flag".
  //
  // The check is static and reads the stylesheet, which is the only place the
  // answer lives. It costs one file read and it closes the whole class: the next
  // language added to the table fails here until its flag is drawn.
  it('draws every flag code it hands out', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/content/inject.css'), 'utf8');
    const manquants = [...new Set(Object.values(FLAG_BY_LANG))]
      .filter((code) => !css.includes(`.kt-flag-${code} `))
      .sort();
    expect(manquants).toEqual([]);
  });
});
