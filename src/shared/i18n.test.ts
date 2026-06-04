import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { UiLocale } from './i18n';
import { UI_LOCALES, UI_LOCALE_NAMES, isRtlLocale, detectUiLocale, resolveUiLocale, makeT } from './i18n';
import { UI_MESSAGES } from './i18n.messages';

const here = dirname(fileURLToPath(import.meta.url));
const keys = JSON.parse(readFileSync(join(here, 'i18n/keys.json'), 'utf8')) as string[];
const nonEn = UI_LOCALES.filter((l): l is Exclude<UiLocale, 'en'> => l !== 'en');

describe('i18n', () => {
  it('English t() is the identity function', () => {
    const t = makeT('en');
    expect(t('Options')).toBe('Options');
    expect(t('unknown zzz key')).toBe('unknown zzz key');
  });

  it('a non-English t() resolves catalog entries and falls back to the key', () => {
    const t = makeT('fr');
    const saved = UI_MESSAGES.fr?.['saved'];
    expect(saved).toBeTruthy();
    expect(t('saved')).toBe(saved);
    expect(t('unknown zzz key')).toBe('unknown zzz key');
  });

  it('marks only Arabic as RTL', () => {
    expect(isRtlLocale('ar')).toBe(true);
    for (const l of UI_LOCALES) if (l !== 'ar') expect(isRtlLocale(l)).toBe(false);
  });

  it('resolves the uiLang setting (auto / explicit / invalid)', () => {
    expect(UI_LOCALES).toContain(resolveUiLocale('auto'));
    expect(UI_LOCALES).toContain(resolveUiLocale(undefined));
    expect(resolveUiLocale('fr')).toBe('fr');
    expect(resolveUiLocale('not-a-locale')).toBe('en');
  });

  it('detects a supported locale from the environment', () => {
    expect(UI_LOCALES).toContain(detectUiLocale());
  });

  it('has a native name for every locale', () => {
    for (const l of UI_LOCALES) expect(UI_LOCALE_NAMES[l]).toBeTruthy();
  });

  it('every non-English catalog covers exactly the canonical keys, with no empty values', () => {
    const canonical = [...keys].sort();
    for (const loc of nonEn) {
      const map = UI_MESSAGES[loc];
      expect(map, `missing catalog: ${loc}`).toBeTruthy();
      expect(Object.keys(map ?? {}).sort()).toEqual(canonical);
      for (const [k, v] of Object.entries(map ?? {})) {
        expect(typeof v === 'string' && v.length > 0, `${loc} -> "${k}"`).toBe(true);
      }
    }
  });
});
