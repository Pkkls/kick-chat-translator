/**
 * The flag shown next to a language, as a display convention.
 *
 * A language is not a country, and this table does not pretend otherwise. It
 * answers one question only: which single flag helps someone spot their
 * language in a list of forty-two at a glance, without reading. Arabic gets one
 * flag for twenty countries, English gets one for dozens. That is a deliberate
 * trade, made because the alternative measured worse: two-letter ISO codes read
 * slower than colour, and flag emoji do not render at all on Windows, where the
 * system falls back to the very letters we were replacing.
 *
 * Two entries are not conventions and must not be "fixed":
 *  - zh-tw carries Taiwan's flag, zh carries China's.
 *  - ru carries Ukraine's flag. Deliberate, decided by the maintainer.
 */

/** Language code to the ISO 3166-1 alpha-2 code whose flag is drawn. */
export const FLAG_BY_LANG: Readonly<Record<string, string>> = {
  en: 'gb',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  'pt-br': 'br',
  de: 'de',
  it: 'it',
  nl: 'nl',
  pl: 'pl',
  sv: 'se',
  cs: 'cz',
  sk: 'sk',
  ro: 'ro',
  ru: 'ua',
  uk: 'ua',
  tr: 'tr',
  ar: 'sa',
  he: 'il',
  ja: 'jp',
  ko: 'kr',
  zh: 'cn',
  'zh-tw': 'tw',
  th: 'th',
  vi: 'vn',
  id: 'id',
  hi: 'in',
  fi: 'fi',
  no: 'no',
  da: 'dk',
  el: 'gr',
  hu: 'hu',
  bg: 'bg',
  ca: 'ca',
  sl: 'sl',
  et: 'ee',
  lt: 'lt',
  lv: 'lv',
  fa: 'ir',
  bn: 'bd',
  ta: 'lk',
  ms: 'my',
  tl: 'ph',
};

/**
 * The CSS class carrying the drawn flag, or undefined when there is none.
 *
 * Undefined is a real answer, not a failure: 'auto' has no country, and a
 * language added to LANGUAGES without an entry here should fall back to its ISO
 * code rather than draw a wrong flag. A wrong flag is worse than no flag.
 */
export function flagClass(code: string): string | undefined {
  const cc = FLAG_BY_LANG[code.toLowerCase()];
  // Prefixed, like every other class this extension injects. A bare `.f` on
  // kick.com is a collision waiting to happen.
  return cc ? `kt-flag kt-flag-${cc}` : undefined;
}
