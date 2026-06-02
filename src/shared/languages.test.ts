import { describe, expect, it } from 'vitest';
import { getLang, isSupportedLang, resolveBrowserLang, resolveTargetLang } from './languages';

describe('isSupportedLang', () => {
  it('knows supported languages, case-insensitively', () => {
    expect(isSupportedLang('en')).toBe(true);
    expect(isSupportedLang('SK')).toBe(true); // Slovak added
    expect(isSupportedLang('zz')).toBe(false);
  });
});

describe('Slovak support', () => {
  it('is in the language list', () => {
    expect(getLang('sk')?.label).toBe('Slovak');
  });
});

describe('resolveTargetLang', () => {
  it('passes through an explicit code', () => {
    expect(resolveTargetLang('fr')).toBe('fr');
    expect(resolveTargetLang('ja')).toBe('ja');
  });

  it("resolves 'auto' to a supplied channel language when supported", () => {
    expect(resolveTargetLang('auto', 'es')).toBe('es');
    expect(resolveTargetLang('auto', 'PT')).toBe('pt');
  });

  it("resolves 'auto' to the browser language when the channel value is unsupported/missing", () => {
    expect(isSupportedLang(resolveTargetLang('auto', 'zz'))).toBe(true);
    expect(isSupportedLang(resolveTargetLang('auto'))).toBe(true);
  });
});

describe('resolveBrowserLang', () => {
  it('always returns a supported code', () => {
    expect(isSupportedLang(resolveBrowserLang())).toBe(true);
  });
});
