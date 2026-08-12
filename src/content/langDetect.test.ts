import { describe, expect, it } from 'vitest';
import { detectLanguage, isLikelyEnglish } from './langDetect';

describe('detectLanguage', () => {
  it('returns en for short chat tokens like lol/gg', () => {
    expect(detectLanguage('gg ez')).toBe('en');
    expect(detectLanguage('lol')).toBe('en');
  });

  it('detects French in a clear sentence', () => {
    expect(detectLanguage('Bonjour, comment ça va aujourd’hui ?')).toBe('fr');
  });

  it('detects Japanese script', () => {
    expect(detectLanguage('こんにちは、元気ですか？')).toBe('ja');
  });

  it('detects Korean script', () => {
    expect(detectLanguage('안녕하세요 만나서 반갑습니다')).toBe('ko');
  });

  it('detects Chinese (pure Han) as zh, not Japanese', () => {
    const r = detectLanguage('我们今天天气很好一起出去玩吧朋友们');
    expect(r).not.toBe('ja');
    expect(['zh', undefined]).toContain(r);
  });

  it('keeps Japanese with kana as ja', () => {
    expect(detectLanguage('これはテストです')).toBe('ja');
  });

  it('identifies short foreign chat words instead of calling them English', () => {
    expect(detectLanguage('hola')).toBe('es');
    expect(detectLanguage('gracias')).toBe('es');
    expect(detectLanguage('merci')).toBe('fr');
    expect(detectLanguage('danke')).toBe('de');
    expect(detectLanguage('grazie')).toBe('it');
    expect(detectLanguage('obrigado')).toBe('pt');
    expect(detectLanguage('tamam')).toBe('tr');
  });

  it('stays unsure when short words disagree rather than guessing', () => {
    expect(detectLanguage('merci danke')).not.toBe('fr');
    expect(detectLanguage('merci danke')).not.toBe('de');
  });

  it('still resolves a short message mixing English filler with a foreign word', () => {
    expect(detectLanguage('ok merci')).toBe('fr');
  });

  it('leaves long messages to franc', () => {
    expect(detectLanguage('hello, how are you doing today my friend')).toBe('en');
  });

  it('falls back to English only for ASCII-only text franc cannot place', () => {
    expect(detectLanguage('...!!')).toBe('en');
    expect(detectLanguage('9 9 9')).toBe('en');
    // Same fallback, non-ASCII input: must not be claimed as English.
    expect(detectLanguage('日本')).toBeUndefined();
  });

  it('returns undefined or en for empty/very ambiguous inputs', () => {
    const r = detectLanguage('xx');
    expect([undefined, 'en']).toContain(r);
  });
});

describe('isLikelyEnglish', () => {
  it('flags clear English', () => {
    expect(isLikelyEnglish('hello, how are you doing today my friend')).toBe(true);
  });
  it('does not flag clear Japanese', () => {
    expect(isLikelyEnglish('今日は良い天気ですね')).toBe(false);
  });
});
