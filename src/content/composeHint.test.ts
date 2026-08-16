import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * The composer must never hand a guessed source language to a translation engine.
 *
 * langDetect exposes two detectors on purpose. `detectLanguage` will fall back to
 * franc, measured at roughly a third correct on chat-length text. `confidentLanguage`
 * answers only when the language was looked up — Unicode script, the chat-word
 * lexicon, the trivial-token table — and returns undefined otherwise, which tells
 * the engine to detect for itself.
 *
 * The incoming path has used the confident one since it was written. The composer
 * used the other, so every message typed carried a source hint that was usually
 * wrong. Nothing failed loudly: the engine translated from a language the text was
 * not in and returned either the text unchanged or something else entirely.
 */

describe('the two detectors differ where it matters', () => {
  it('withholds a guess that detectLanguage is willing to make', () => {
    // Short Latin chat with no lexicon hit: franc answers, the lookup does not.
    const guessy = 'que fue con esos pendejos';
    expect(detectLanguage(guessy)).toBeDefined();
    expect(confidentLanguage(guessy)).toBeUndefined();
  });

  it('still answers when the script settles it', () => {
    // Control: if the confident detector answered nothing ever, the assertion
    // above would pass on a function that is simply broken.
    expect(confidentLanguage('これはテストです')).toBe('ja');
    expect(confidentLanguage('это тест')).toBe('ru');
  });

  it('still answers when a chat word settles it', () => {
    expect(confidentLanguage('merci')).toBe('fr');
    expect(confidentLanguage('gracias')).toBe('es');
  });
});

describe('compose sends the confident one', () => {
  const source = (): string => readFileSync('src/content/compose.ts', 'utf8');

  it('feeds sourceLangHint from confidentLanguage, not detectLanguage', () => {
    const hint = /sourceLangHint:\s*(\w+)/.exec(source());
    expect(hint, 'sourceLangHint disappeared or was reshaped').not.toBeNull();
    // `confident` is the local holding confidentLanguage's answer. Naming it in the
    // assertion is deliberate: a rename should make someone re-read this test
    // rather than let the wrong variable slip back in unnoticed.
    expect(hint?.[1]).toBe('confident');
  });

  it('binds that local to confidentLanguage', () => {
    expect(source()).toMatch(/const confident\s*=\s*trimmed\s*\?\s*confidentLanguage\(/);
  });
});
