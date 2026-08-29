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

  // Two entries that are decisions, not conventions. If either ever flips it
  // will be because someone "fixed" it without reading the comment, and this is
  // what stops that landing.
  it('keeps Taiwan separate from China', () => {
    expect(FLAG_BY_LANG['zh-tw']).toBe('tw');
    expect(FLAG_BY_LANG['zh']).toBe('cn');
  });

  it('shows Ukraine for Russian', () => {
    expect(FLAG_BY_LANG['ru']).toBe('ua');
  });

  it('has no flag for auto, rather than a wrong one', () => {
    expect(flagClass('auto')).toBeUndefined();
    expect(flagClass('fr')).toBe('kt-flag kt-flag-fr');
  });
});
