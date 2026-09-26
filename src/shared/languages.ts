import { FAVORITE_LANGS_MAX } from './constants';
export interface LangInfo {
  code: string;
  label: string;
  native: string;
}

export const LANGUAGES: readonly LangInfo[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese (Portugal)', native: 'Português' },
  { code: 'pt-br', label: 'Portuguese (Brazil)', native: 'Português (BR)' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'sv', label: 'Swedish', native: 'Svenska' },
  { code: 'cs', label: 'Czech', native: 'Čeština' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina' },
  { code: 'ro', label: 'Romanian', native: 'Română' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'he', label: 'Hebrew', native: 'עברית' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'zh', label: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'zh-tw', label: 'Chinese (Traditional)', native: '繁體中文' },
  // Cantonese is 'yue' and not 'zh-hk' on purpose, and the two are not the same
  // thing. 'zh-hk' is Chinese as Hong Kong writes it formally: standard Chinese
  // grammar in traditional characters, which a Taipei reader reads without
  // effort, and which 'zh-tw' already covers. 'yue' is the vernacular a chat
  // actually types, with its own grammar and its own characters, and a Mandarin
  // reader does not read it. The free Google endpoint agrees: it answers to
  // tl=yue and returns 唔, which is a word 'zh-tw' never produces.
  { code: 'yue', label: 'Cantonese', native: '廣東話' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'fi', label: 'Finnish', native: 'Suomi' },
  { code: 'no', label: 'Norwegian', native: 'Norsk' },
  { code: 'da', label: 'Danish', native: 'Dansk' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar' },
  { code: 'bg', label: 'Bulgarian', native: 'Български' },
  { code: 'ca', label: 'Catalan', native: 'Català' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina' },
  { code: 'et', label: 'Estonian', native: 'Eesti' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu' },
  { code: 'fa', label: 'Persian', native: 'فارسی' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
  { code: 'tl', label: 'Filipino', native: 'Filipino' },
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
  // 'zh-hk' above stays pointed at 'zh-tw', and that is the conservative half of
  // adding Cantonese. A browser set to zh-HK asks for Chinese as Hong Kong reads
  // it, which is the traditional standard, not the vernacular. Repointing it at
  // 'yue' would silently switch every Hong Kong reader to a register they did
  // not choose. Cantonese is in the list to be picked, not to be assumed.
  //
  // These three are the tags that really do mean the language: the ISO 639-3
  // code with a region, the script form, and the legacy IANA tag the Cantonese
  // Wikipedia still uses.
  'yue-hk': 'yue',
  'yue-hant': 'yue',
  'zh-yue': 'yue',
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
 *
 * `fallback: 'none'` is what makes that last sentence true, and it was missing.
 * The default is `'code'`, which does not answer nothing: it echoes the code
 * back. So an unknown but well-formed code reached the reader as `xx` instead of
 * the native name, and `|| fallback` never ran because a code is truthy.
 * Measured: `of('xx')` returns `"xx"` by default and `undefined` with this
 * option, while `of('zzzz')` throws either way, being malformed rather than
 * unknown.
 *
 * The test covering this only ever exercised the throwing path, so it passed on
 * a runtime that throws and failed on one that does not, and CI was red on two
 * assertions while the product carried a defect neither of them described.
 */
export function localLangName(code: string, fallback: string, locale = uiLocale()): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language', fallback: 'none' }).of(code) || fallback;
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
