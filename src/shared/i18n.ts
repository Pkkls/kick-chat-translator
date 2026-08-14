/**
 * UI internationalization for the popup + options page.
 *
 * Strategy: the English string IS the lookup key (gettext-style). Components keep
 * readable English in the JSX via `t('Cloud fallback chain')`; the catalog in
 * `i18n.messages.ts` maps that English string to each non-English locale. English
 * needs no catalog (the key is the message), and any missing translation falls back
 * to the English key — so the UI is never blank.
 */
import { UI_MESSAGES } from './i18n.messages';

export const UI_LOCALES = ['en', 'ja', 'fr', 'zh', 'ar', 'ru', 'pt', 'es', 'tr', 'ko'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

/** Native names for the language picker. */
export const UI_LOCALE_NAMES: Record<UiLocale, string> = {
  en: 'English',
  ja: '日本語',
  fr: 'Français',
  zh: '中文',
  ar: 'العربية',
  ru: 'Русский',
  pt: 'Português',
  es: 'Español',
  tr: 'Türkçe',
  ko: '한국어',
};

const RTL_LOCALES = new Set<UiLocale>(['ar']);
export function isRtlLocale(locale: UiLocale): boolean {
  return RTL_LOCALES.has(locale);
}

function isUiLocale(v: string): v is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(v);
}

/**
 * Pick the closest supported UI locale from the browser's language list.
 * Reliable + standard (navigator.language); falls back to English.
 */
export function detectUiLocale(): UiLocale {
  const list =
    typeof navigator !== 'undefined'
      ? (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])
      : [];
  for (const raw of list) {
    const base = (raw || '').toLowerCase().split('-')[0] ?? '';
    if (isUiLocale(base)) return base;
  }
  return 'en';
}

/** Resolve the `uiLang` setting ('auto' or an explicit locale) to a concrete locale. */
export function resolveUiLocale(setting: string | undefined): UiLocale {
  if (!setting || setting === 'auto') return detectUiLocale();
  return isUiLocale(setting) ? setting : 'en';
}

export type TFunc = (key: string) => string;

/** Build a translate function bound to one locale. English returns the key verbatim. */
export function makeT(locale: UiLocale): TFunc {
  if (locale === 'en') return (key) => key;
  const table = UI_MESSAGES[locale];
  return (key) => table?.[key] ?? key;
}
