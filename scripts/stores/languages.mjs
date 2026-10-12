/**
 * Every listing language, in one place. The key is the file name used under
 * store/ (chrome/description/<key>.txt, amo/..., notes/...).
 *
 * dir    the public/_locales directory, which sets Chrome's name and short
 *        description. Chrome's page hl and the dashboard's code are the same
 *        with a hyphen (pt_BR -> pt-BR).
 * amo    the AMO locales that show this text, in the devhub's lower case; the
 *        first one is checked by verify.mjs. AMO's production locales were read
 *        from addons-server's PROD_LANGUAGES on 2026-10-12: no Arabic, Thai,
 *        Indonesian, Hindi, Danish, Bulgarian, Catalan, Baltic, Bengali, Tamil,
 *        Malay or Filipino. The add-on's default locale is fr, so a visitor
 *        whose locale has no text sees French: every variant gets one.
 * check  'accents': payloads.mjs wants a diacritic in every long paragraph and
 *        no Cyrillic letter; 'latin': only the Cyrillic check (Dutch,
 *        Indonesian, Malay and Filipino write without accents).
 *
 * Left out on purpose: the Chrome locales of languages the extension cannot
 * translate into (am gu hr kn ml mr sr sw te), whose listing would promise
 * what it does not do, and en_AU, en_GB, en_US, es_419, which fall back to en
 * and es.
 */
export const LISTINGS = {
  en: { dir: 'en', amo: ['en-us', 'en-gb', 'en-ca'] },
  fr: { dir: 'fr', amo: ['fr'], check: 'accents' },
  es: { dir: 'es', amo: ['es-es', 'es-mx', 'es-ar', 'es-cl'], check: 'accents' },
  'pt-BR': { dir: 'pt_BR', amo: ['pt-br'], check: 'accents' },
  'pt-PT': { dir: 'pt_PT', amo: ['pt-pt'], check: 'accents' },
  de: { dir: 'de', amo: ['de'], check: 'accents' },
  it: { dir: 'it', amo: ['it'], check: 'accents' },
  nl: { dir: 'nl', amo: ['nl'], check: 'latin' },
  pl: { dir: 'pl', amo: ['pl'], check: 'accents' },
  sv: { dir: 'sv', amo: ['sv-se'], check: 'accents' },
  no: { dir: 'no', amo: ['nb-no', 'nn-no'], check: 'accents' },
  da: { dir: 'da', amo: [], check: 'accents' },
  fi: { dir: 'fi', amo: ['fi'], check: 'accents' },
  cs: { dir: 'cs', amo: ['cs'], check: 'accents' },
  sk: { dir: 'sk', amo: ['sk'], check: 'accents' },
  sl: { dir: 'sl', amo: ['sl'], check: 'accents' },
  hu: { dir: 'hu', amo: ['hu'], check: 'accents' },
  ro: { dir: 'ro', amo: ['ro'], check: 'accents' },
  ca: { dir: 'ca', amo: [], check: 'accents' },
  et: { dir: 'et', amo: [], check: 'accents' },
  lt: { dir: 'lt', amo: [], check: 'accents' },
  lv: { dir: 'lv', amo: [], check: 'accents' },
  tr: { dir: 'tr', amo: ['tr'], check: 'accents' },
  vi: { dir: 'vi', amo: ['vi'], check: 'accents' },
  id: { dir: 'id', amo: [], check: 'latin' },
  ms: { dir: 'ms', amo: [], check: 'latin' },
  fil: { dir: 'fil', amo: [], check: 'latin' },
  ru: { dir: 'ru', amo: ['ru'] },
  uk: { dir: 'uk', amo: ['uk'] },
  bg: { dir: 'bg', amo: [] },
  el: { dir: 'el', amo: ['el'] },
  ar: { dir: 'ar', amo: [] },
  he: { dir: 'he', amo: ['he'] },
  fa: { dir: 'fa', amo: ['fa'] },
  hi: { dir: 'hi', amo: [] },
  bn: { dir: 'bn', amo: [] },
  ta: { dir: 'ta', amo: [] },
  th: { dir: 'th', amo: [] },
  ja: { dir: 'ja', amo: ['ja'] },
  ko: { dir: 'ko', amo: ['ko'] },
  zh: { dir: 'zh_CN', amo: ['zh-cn'] },
  'zh-TW': { dir: 'zh_TW', amo: ['zh-tw'] },
};

/** Chrome's page hl and dashboard code for a listing language. */
export const chromeCode = (lang) => LISTINGS[lang].dir.replace('_', '-');

/** The devhub writes en-us, the API wants en-US. */
export const apiLocale = (l) => l.replace(/-([a-z]+)$/, (_, r) => '-' + r.toUpperCase());
