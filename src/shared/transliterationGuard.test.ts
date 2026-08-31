import { describe, expect, it } from 'vitest';
import {
  isTransliteration,
  getSemanticOverride,
  enhanceContextForShortInput,
} from './transliterationGuard';

// ─── isTransliteration ──────────────────────────────────────────────────────

describe('isTransliteration', () => {
  it('detects pure katakana output as transliteration for JA target', () => {
    expect(isTransliteration('bonjour', 'ボンジュール', 'ja')).toBe(true);
    expect(isTransliteration('hello', 'ハロー', 'ja')).toBe(true);
    expect(isTransliteration('merci', 'メルシー', 'ja')).toBe(true);
    expect(isTransliteration('ciao', 'チャオ', 'ja')).toBe(true);
  });

  it('accepts kanji/hiragana output as real translation', () => {
    expect(isTransliteration('bonjour', 'こんにちは', 'ja')).toBe(false);
    expect(isTransliteration('thank you', 'ありがとうございます', 'ja')).toBe(false);
    expect(isTransliteration('goodbye', 'さようなら', 'ja')).toBe(false);
  });

  it('accepts mixed katakana+kanji (legitimate loanword in sentence)', () => {
    expect(isTransliteration('the computer is broken', 'コンピューターが壊れました', 'ja')).toBe(false);
  });

  it('ignores non-Latin input', () => {
    expect(isTransliteration('こんにちは', 'ボンジュール', 'ja')).toBe(false);
    expect(isTransliteration('привет', 'ハロー', 'ja')).toBe(false);
  });

  it('ignores Latin target languages', () => {
    expect(isTransliteration('bonjour', 'hello', 'en')).toBe(false);
    expect(isTransliteration('hola', 'bonjour', 'fr')).toBe(false);
  });

  it('ignores long inputs (> 4 words) to avoid false positives', () => {
    expect(isTransliteration(
      'this is a longer sentence that should not trigger',
      'ディスイズアロンガーセンテンス',
      'ja',
    )).toBe(false);
  });

  it('handles empty/whitespace output gracefully', () => {
    expect(isTransliteration('bonjour', '', 'ja')).toBe(false);
    expect(isTransliteration('bonjour', '   ', 'ja')).toBe(false);
  });
});

// ─── getSemanticOverride ────────────────────────────────────────────────────

describe('getSemanticOverride', () => {
  it('returns correct JA translation for common greetings', () => {
    expect(getSemanticOverride('bonjour', 'ja')).toBe('こんにちは');
    expect(getSemanticOverride('merci', 'ja')).toBe('ありがとう');
    expect(getSemanticOverride('hola', 'ja')).toBe('こんにちは');
    expect(getSemanticOverride('ciao', 'ja')).toBe('こんにちは');
    expect(getSemanticOverride('danke', 'ja')).toBe('ありがとう');
  });

  it('returns correct ZH translation', () => {
    expect(getSemanticOverride('bonjour', 'zh')).toBe('你好');
    expect(getSemanticOverride('goodbye', 'zh')).toBe('再见');
  });

  it('returns correct KO translation', () => {
    expect(getSemanticOverride('hello', 'ko')).toBe('안녕하세요');
    expect(getSemanticOverride('thanks', 'ko')).toBe('고마워');
  });

  it('returns correct AR translation', () => {
    expect(getSemanticOverride('bonjour', 'ar')).toBe('مرحبا');
  });

  it('returns correct RU translation', () => {
    expect(getSemanticOverride('bonjour', 'ru')).toBe('Привет');
    expect(getSemanticOverride('danke', 'ru')).toBe('Спасибо');
  });

  it('returns correct TH translation', () => {
    expect(getSemanticOverride('hello', 'th')).toBe('สวัสดี');
  });

  it('returns correct HI translation', () => {
    expect(getSemanticOverride('hello', 'hi')).toBe('नमस्ते');
  });

  it('is case-insensitive', () => {
    expect(getSemanticOverride('Bonjour', 'ja')).toBe('こんにちは');
    expect(getSemanticOverride('MERCI', 'ja')).toBe('ありがとう');
    expect(getSemanticOverride('Hello', 'ko')).toBe('안녕하세요');
  });

  it('handles accented variants via normalization', () => {
    // "merci" with an accent should still match
    expect(getSemanticOverride('Bonjour', 'ja')).toBe('こんにちは');
  });

  it('falls back from zh-tw to zh base', () => {
    expect(getSemanticOverride('bonjour', 'zh-tw')).toBe('你好');
  });

  it('returns undefined for unknown expressions', () => {
    expect(getSemanticOverride('supercalifragilisticexpialidocious', 'ja')).toBeUndefined();
    expect(getSemanticOverride('abcdef', 'ja')).toBeUndefined();
  });

  it('returns undefined for Latin target languages', () => {
    // No overrides for en/fr/es/etc. — providers handle those fine
    expect(getSemanticOverride('bonjour', 'en')).toBeUndefined();
    expect(getSemanticOverride('hello', 'fr')).toBeUndefined();
  });

  it('covers romanized Japanese expressions', () => {
    expect(getSemanticOverride('konnichiwa', 'zh')).toBe('你好');
    expect(getSemanticOverride('arigatou', 'ko')).toBe('감사합니다');
    expect(getSemanticOverride('kawaii', 'ja')).toBe('かわいい');
    expect(getSemanticOverride('sugoi', 'ja')).toBe('すごい');
  });

  it('covers gaming/chat expressions', () => {
    expect(getSemanticOverride('good game', 'ja')).toBe('いい試合だった');
    expect(getSemanticOverride('well played', 'ja')).toBe('お見事');
    expect(getSemanticOverride('well done', 'ko')).toBe('잘했어');
  });
});

// ─── enhanceContextForShortInput ────────────────────────────────────────────

describe('enhanceContextForShortInput', () => {
  it('adds hint for short input targeting JA', () => {
    const result = enhanceContextForShortInput('bonjour', 'ja');
    expect(result).toContain('Do not transliterate');
    expect(result).toContain('chat message');
  });

  it('appends hint to existing context', () => {
    const result = enhanceContextForShortInput('merci', 'ja', 'some chat context');
    expect(result).toContain('some chat context');
    expect(result).toContain('Do not transliterate');
  });

  it('does NOT add hint for Latin-script targets', () => {
    expect(enhanceContextForShortInput('bonjour', 'en')).toBeUndefined();
    expect(enhanceContextForShortInput('hello', 'fr', 'context')).toBe('context');
  });

  it('does NOT add hint for long inputs (> 3 words)', () => {
    const existing = 'chat context';
    expect(enhanceContextForShortInput('this is a long sentence here', 'ja', existing)).toBe(existing);
  });

  it('adds hint for 1-3 word inputs to all non-Latin targets', () => {
    for (const lang of ['ja', 'zh', 'ko', 'ar', 'ru', 'th', 'hi']) {
      const result = enhanceContextForShortInput('salut', lang);
      expect(result).toContain('Do not transliterate');
    }
  });
});
