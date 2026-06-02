import { describe, expect, it } from 'vitest';
import { isContextCritical, isDeeplPremium } from './langTiers';

describe('isContextCritical', () => {
  it('flags subject-dropping languages that misattribute person', () => {
    for (const c of ['ja', 'ko', 'zh', 'zh-tw', 'vi', 'th', 'ar']) {
      expect(isContextCritical(c), c).toBe(true);
    }
  });
  it('does NOT flag languages that recover person from the verb', () => {
    for (const c of ['en', 'fr', 'es', 'de', 'ru', 'pl', 'pt-br']) {
      expect(isContextCritical(c), c).toBe(false);
    }
  });
  it('handles undefined and case/regional variants', () => {
    expect(isContextCritical(undefined)).toBe(false);
    expect(isContextCritical('ZH')).toBe(true);
    expect(isContextCritical('zh-TW')).toBe(true);
  });
});

describe('isDeeplPremium', () => {
  it('flags European pairs where DeepL beats Google', () => {
    for (const c of ['de', 'fr', 'pt-br', 'uk', 'el', 'fi']) {
      expect(isDeeplPremium(c), c).toBe(true);
    }
  });
  it('does NOT flag Asian/Indic where Google is as good', () => {
    for (const c of ['ja', 'ko', 'zh', 'hi', 'th', 'ar']) {
      expect(isDeeplPremium(c), c).toBe(false);
    }
  });
});
