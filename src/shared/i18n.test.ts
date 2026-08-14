import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { UiLocale } from './i18n';
import { UI_LOCALES } from './i18n';
import { SettingsSchema } from './settings';
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

// Three locales shipped that the picker offered and the settings schema refused.
// Picking one sent a value zod would not accept, so nothing was saved and the page
// kept rendering the last accepted language while the menu showed the new one.
// Offering a language and being able to keep it are two different lists, and only
// one of them was updated.
describe('every offered locale can actually be saved', () => {
  it.each(UI_LOCALES)('accepts %s', (loc) => {
    expect(SettingsSchema.parse({ uiLang: loc }).uiLang).toBe(loc);
  });

  it('accepts auto', () => {
    expect(SettingsSchema.parse({ uiLang: 'auto' }).uiLang).toBe('auto');
  });

  // The other direction: a locale the schema takes but the picker never lists
  // would be unreachable, and a stale value nobody can select again.
  it('offers every locale the schema accepts', () => {
    const accepted = (SettingsSchema.shape.uiLang as unknown as { _def: { innerType: { options: string[] } } })._def
      .innerType.options;
    for (const loc of accepted) {
      if (loc === 'auto') continue;
      expect(UI_LOCALES as readonly string[]).toContain(loc);
    }
  });
});
