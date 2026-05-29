import { describe, expect, it } from 'vitest';
import { isSlangOnly } from './glossary';

describe('isSlangOnly', () => {
  it('flags pure streaming slang', () => {
    expect(isSlangOnly('poggers')).toBe(true);
    expect(isSlangOnly('KEKW KEKW')).toBe(true);
    expect(isSlangOnly('copium ngl')).toBe(true);
    expect(isSlangOnly('based fr fr')).toBe(true);
  });
  it('does NOT flag real sentences', () => {
    expect(isSlangOnly('vamos a la playa')).toBe(false);
    expect(isSlangOnly('poggers que jogada')).toBe(false); // has real words
    expect(isSlangOnly('元気ですか')).toBe(false);
  });
  it('returns false on empty', () => {
    expect(isSlangOnly('')).toBe(false);
  });
});
