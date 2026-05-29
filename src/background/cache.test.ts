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
