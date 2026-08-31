import { FAVORITE_LANGS_MAX } from './constants';
export interface LangInfo {
  code: string;
  label: string;
  native: string;
  flag: string;
}

export const LANGUAGES: readonly LangInfo[] = [
  { code: 'en', label: 'English', native: 'English', flag: 'EN' },
  { code: 'fr', label: 'French', native: 'Français', flag: 'FR' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: 'ES' },
  { code: 'pt', label: 'Portuguese (Portugal)', native: 'Português', flag: 'PT' },
  { code: 'pt-br', label: 'Portuguese (Brazil)', native: 'Português (BR)', flag: 'BR' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: 'DE' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: 'IT' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: 'NL' },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: 'PL' },
  { code: 'sv', label: 'Swedish', native: 'Svenska', flag: 'SV' },
  { code: 'cs', label: 'Czech', native: 'Čeština', flag: 'CS' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina', flag: 'SK' },
  { code: 'ro', label: 'Romanian', native: 'Română', flag: 'RO' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: 'RU' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська', flag: 'UA' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: 'TR' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: 'AR' },
  { code: 'he', label: 'Hebrew', native: 'עברית', flag: 'HE' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: 'JA' },
  { code: 'ko', label: 'Korean', native: '한국어', flag: 'KO' },
  { code: 'zh', label: 'Chinese (Simplified)', native: '简体中文', flag: 'ZH' },
  { code: 'zh-tw', label: 'Chinese (Traditional)', native: '繁體中文', flag: 'TW' },
  { code: 'th', label: 'Thai', native: 'ไทย', flag: 'TH' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: 'VI' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: 'ID' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: 'HI' },
  { code: 'fi', label: 'Finnish', native: 'Suomi', flag: 'FI' },
  { code: 'no', label: 'Norwegian', native: 'Norsk', flag: 'NO' },
  { code: 'da', label: 'Danish', native: 'Dansk', flag: 'DA' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά', flag: 'EL' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar', flag: 'HU' },
  { code: 'bg', label: 'Bulgarian', native: 'Български', flag: 'BG' },
  { code: 'ca', label: 'Catalan', native: 'Català', flag: 'CA' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina', flag: 'SI' },
  { code: 'et', label: 'Estonian', native: 'Eesti', flag: 'EE' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių', flag: 'LT' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu', flag: 'LV' },
  { code: 'fa', label: 'Persian', native: 'فارسی', flag: 'FA' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: 'BN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: 'TA' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu', flag: 'MS' },
  { code: 'tl', label: 'Filipino', native: 'Filipino', flag: 'PH' },
];

/** The 'use the detected language' sentinel stored in settings. */
export const AUTO = 'auto';

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code.toLowerCase(), l]));

// franc-min returns ISO 639-3 codes; map a few common ones to our 2-letter set
const FRANC_MAP: Record<string, string> = {
  eng: 'en',
  fra: 'fr',
  spa: 'es',
  por: 'pt',
  deu: 'de',
  ita: 'it',
  nld: 'nl',
  pol: 'pl',
  swe: 'sv',
  ces: 'cs',
  slk: 'sk',
  ron: 'ro',
  rus: 'ru',
  ukr: 'uk',
  tur: 'tr',
  ara: 'ar',
  heb: 'he',
  jpn: 'ja',
  kor: 'ko',
  cmn: 'zh',
  zho: 'zh',
  tha: 'th',
  vie: 'vi',
  ind: 'id',
  hin: 'hi',
  fin: 'fi',
  nor: 'no',
  nob: 'no',
  dan: 'da',
  ell: 'el',
  hun: 'hu',
  bul: 'bg',
  cat: 'ca',
  slv: 'sl',
  est: 'et',
  lit: 'lt',
  lav: 'lv',
  pes: 'fa',
  fas: 'fa',
  ben: 'bn',
  tam: 'ta',
  msa: 'ms',
  zsm: 'ms',
  // Le code que franc-min emet reellement pour le malais. `msa` est le
  // macrolangage et `zsm` le malais standard ; franc rend `zlm`, et sans lui la
  // table ne reconnaissait rien, donc le chat malais partait en langue inconnue.
  // Mesure sur une phrase malaise : franc `zlm`, table undefined,
  // `detectLanguage` undefined.
  zlm: 'ms',
  tgl: 'tl',
  fil: 'tl',
};

export function francToIso2(francCode: string): string | undefined {
  return FRANC_MAP[francCode];
}

export function getLang(code: string): LangInfo | undefined {
  return BY_CODE.get(code.toLowerCase());
}

// Locale / region tags → our canonical codes, keeping the regional variants we
// actually support (pt-BR, zh-TW) distinct from their base language.
const REGION_VARIANTS: Record<string, string> = {
  'pt-br': 'pt-br',
  'pt-pt': 'pt',
  'zh-tw': 'zh-tw',
  'zh-hant': 'zh-tw',
  'zh-hk': 'zh-tw',
  'zh-mo': 'zh-tw',
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-sg': 'zh',
  nb: 'no',
  nn: 'no',
};

export function normalizeLang(raw: string): string {
  const lower = raw.toLowerCase().trim().replace('_', '-');
  if (BY_CODE.has(lower)) return lower; // exact match incl. 'pt-br' / 'zh-tw'
  const variant = REGION_VARIANTS[lower];
  if (variant) return variant;
  const base = lower.split('-')[0] ?? lower; // strip region → base language
  return BY_CODE.has(base) ? base : lower;
}

export function langFlag(code: string): string {
  return getLang(code)?.flag ?? code.toUpperCase().slice(0, 2);
}

const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

/** Right-to-left script? Drives `dir="auto"`/RTL rendering of translated text. */
export function isRtl(code: string): boolean {
  return RTL_LANGS.has(normalizeLang(code));
}

/** Is this language code one we support translating to? */
export function isSupportedLang(code: string): boolean {
  return BY_CODE.has(code.toLowerCase());
}

/**
 * The user's own language, from the browser — used as the default *reading* target
 * so the extension works for anyone, anywhere, with zero configuration. Maps e.g.
 * "fr-FR" → "fr"; falls back to English when the locale isn't one we support.
 */
export function resolveBrowserLang(): string {
  const candidates =
    typeof navigator !== 'undefined'
      ? [navigator.language, ...(navigator.languages ?? [])].filter((c): c is string => Boolean(c))
      : [];
  for (const c of candidates) {
    const code = normalizeLang(c);
    if (BY_CODE.has(code)) return code;
  }
  return 'en';
}

/**
 * Resolve a target-language setting that may be the sentinel 'auto'. For the
 * reading direction 'auto' means the browser language; pass an explicit
 * `autoValue` (e.g. a detected channel language) to override what 'auto' resolves to.
 */
export function resolveTargetLang(setting: string, autoValue?: string): string {
  if (setting !== 'auto') return setting;
  return autoValue && BY_CODE.has(autoValue.toLowerCase()) ? autoValue.toLowerCase() : resolveBrowserLang();
}

/**
 * Push `code` to the front of the favourites, keeping the list capped and unique.
 *
 * Lives here rather than next to the settings schema on purpose: the content
 * script imports this, and `settings.ts` pulls zod in as a value — which
 * `nozod.test.ts` forbids in that bundle.
 */
export function withFavorite(current: readonly string[], code: string): string[] {
  if (!isSupportedLang(code)) return [...current];
  return [code, ...current.filter((c) => c !== code)].slice(0, FAVORITE_LANGS_MAX);
}

/**
 * Set by the content script from the `uiLang` setting.
 *
 * The popup and the options page pass their locale explicitly and never touch
 * this. The content script cannot: chrome.i18n answers in the browser's
 * language and MV3 gives no way to ask it for another, so a chat menu was
 * named and sorted by the browser while the setting said otherwise.
 */
let forced: string | undefined;

export function setUiLocale(locale: string | undefined): void {
  forced = locale;
}

/**
 * The interface language, whichever context this runs in.
 *
 * `chrome` is absent under test and in a plain page, and reading a missing
 * binding throws rather than yielding undefined — hence the typeof guard.
 */
export function uiLocale(): string {
  if (forced) return forced;
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage() || navigator.language || 'en';
    }
    return navigator.language || 'en';
  } catch {
    return 'en';
  }
}

/**
 * A language's name in the reader's own language.
 *
 * Every language menu used to render in English whatever the interface was set
 * to, so someone running the extension in Japanese met a list of English names
 * they could not read — in an interface otherwise fully translated for them.
 * `Intl.DisplayNames` already knows all of these: 0 strings to maintain against
 * 42 languages x 11 interface locales. Falls back to the native name when the
 * engine answers nothing for a code.
 */
export function localLangName(code: string, fallback: string, locale = uiLocale()): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) || fallback;
  } catch {
    return fallback;
  }
}

let collatorCache: { locale: string; c: Intl.Collator } | undefined;
function localeCollator(locale: string): Intl.Collator {
  if (collatorCache?.locale !== locale) collatorCache = { locale, c: new Intl.Collator(locale) };
  return collatorCache.c;
}

/**
 * Every language, named for the reader and sorted the way that reader expects.
 *
 * Sorting has to go through `Intl.Collator`, not a plain compare: measured, the
 * two disagree in every locale that has accents — ja, tr and cs all place
 * different entries first.
 */
export function sortedLanguages(locale = uiLocale()): { code: string; name: string; native: string }[] {
  return LANGUAGES.map((l) => ({
    code: l.code,
    name: localLangName(l.code, l.native, locale),
    native: l.native,
  })).sort((a, b) => localeCollator(locale).compare(a.name, b.name));
}
