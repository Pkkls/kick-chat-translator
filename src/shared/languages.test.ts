import { describe, expect, it } from 'vitest';
import {
  getLang,
  isRtl,
  isSupportedLang,
  normalizeLang,
  resolveBrowserLang,
  resolveTargetLang,
} from './languages';

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

describe('normalizeLang — regional variants', () => {
  it('keeps supported regional variants distinct', () => {
    expect(normalizeLang('pt-BR')).toBe('pt-br');
    expect(normalizeLang('zh-TW')).toBe('zh-tw');
    expect(normalizeLang('zh-Hant')).toBe('zh-tw');
  });
  it('folds region tags into the base language otherwise', () => {
    expect(normalizeLang('en-US')).toBe('en');
    expect(normalizeLang('pt-PT')).toBe('pt');
    expect(normalizeLang('zh-CN')).toBe('zh');
    expect(normalizeLang('fr_FR')).toBe('fr');
    expect(normalizeLang('nb')).toBe('no');
  });
});

describe('new languages', () => {
  it('includes the additions', () => {
    for (const c of ['sk', 'sl', 'et', 'lt', 'lv', 'ca', 'fa', 'bn', 'ta', 'ms', 'tl', 'pt-br']) {
      expect(getLang(c), c).toBeDefined();
    }
  });
});

describe('isRtl', () => {
  it('flags right-to-left scripts', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('he')).toBe(true);
    expect(isRtl('fa')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('ja')).toBe(false);
  });
});
