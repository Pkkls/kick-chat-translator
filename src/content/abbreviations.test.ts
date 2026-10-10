import { describe, expect, it } from 'vitest';
import { spellOutAbbreviations } from './abbreviations';

describe('spellOutAbbreviations', () => {
  it('spells out whole words only, in any case', () => {
    expect(spellOutAbbreviations('NGL that was a huge L')).toBe('not gonna lie that was a huge loss');
    expect(spellOutAbbreviations('lmk when he goes live')).toBe('let me know when he goes live');
    expect(spellOutAbbreviations('fresh frames')).toBe('fresh frames');
  });

  it('ignores words that only exist on Object.prototype', () => {
    expect(spellOutAbbreviations('constructor toString')).toBe('constructor toString');
  });
});

describe('ig', () => {
  it('is "I guess" unless it names Instagram', () => {
    expect(spellOutAbbreviations('he is tired ig')).toBe('he is tired I guess');
    expect(spellOutAbbreviations('follow my ig')).toBe('follow my ig');
    expect(spellOutAbbreviations('he posted it on ig')).toBe('he posted it on ig');
  });
});

describe('W and L', () => {
  it('are a verdict only when they stand alone', () => {
    expect(spellOutAbbreviations('massive W for the streamer')).toBe('massive win for the streamer');
    expect(spellOutAbbreviations('I should cancel my L.A. trip')).toBe('I should cancel my L.A. trip');
    expect(spellOutAbbreviations('playing w/ the boys')).toBe('playing w/ the boys');
  });
});
