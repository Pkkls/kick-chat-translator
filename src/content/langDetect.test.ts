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
