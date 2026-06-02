import { describe, expect, it } from 'vitest';
import { isContextCritical, isDeeplPremium, routeForBudget } from './langTiers';

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

describe('routeForBudget', () => {
  const ORDER = ['deepl', 'google', 'mymemory', 'lingva'] as const;

  it('keeps DeepL first for premium European targets', () => {
    expect(routeForBudget(ORDER, 'fr', true)).toEqual(['deepl', 'google', 'mymemory', 'lingva']);
    expect(routeForBudget(ORDER, 'pt-br', true)).toEqual(['deepl', 'google', 'mymemory', 'lingva']);
  });

  it('demotes DeepL to last for non-premium targets (conserves quota)', () => {
    expect(routeForBudget(ORDER, 'ja', true)).toEqual(['google', 'mymemory', 'lingva', 'deepl']);
    expect(routeForBudget(ORDER, 'ar', true)).toEqual(['google', 'mymemory', 'lingva', 'deepl']);
  });

  it('never drops DeepL — it stays as a last-resort fallback', () => {
    expect(routeForBudget(ORDER, 'th', true)).toContain('deepl');
  });

  it('is a no-op when smart routing is off', () => {
    expect(routeForBudget(ORDER, 'ja', false)).toEqual([...ORDER]);
  });

  it('is a no-op when DeepL is absent or already last', () => {
    expect(routeForBudget(['google', 'mymemory'], 'ja', true)).toEqual(['google', 'mymemory']);
    expect(routeForBudget(['google', 'deepl'], 'ja', true)).toEqual(['google', 'deepl']);
  });

  it('treats an unknown / undefined target as non-premium (demotes)', () => {
    expect(routeForBudget(ORDER, undefined, true)).toEqual(['google', 'mymemory', 'lingva', 'deepl']);
  });

  it('does not mutate the input order', () => {
    const input = [...ORDER];
    routeForBudget(input, 'ja', true);
    expect(input).toEqual([...ORDER]);
  });
});
