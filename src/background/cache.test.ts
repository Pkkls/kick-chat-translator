import { describe, expect, it } from 'vitest';
import { normalizeForKey } from './cache';

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

describe('normalizeForKey across letter case', () => {
  it('collapses ASCII case as before', () => {
    expect(normalizeForKey('HOLA')).toBe(normalizeForKey('hola'));
  });

  // Turkish capitals lowercase to a letter plus a combining dot, so the same word
  // written in two cases used to produce two cache entries and pay twice.
  it('collapses Turkish case variants onto one key', () => {
    expect(normalizeForKey('İYİ')).toBe(normalizeForKey('iyi'));
    expect(normalizeForKey('İyi')).toBe(normalizeForKey('iyi'));
  });

  // Documented limit: dotless and dotted i are different letters. Folding them
  // would be wrong everywhere else, so they stay distinct.
  it('keeps dotless i distinct from plain i', () => {
    expect(normalizeForKey('ışık')).not.toBe(normalizeForKey('isik'));
  });
});
