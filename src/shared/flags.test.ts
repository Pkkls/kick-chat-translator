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
});
