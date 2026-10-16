/**
 * The locales the chat's catalogue covers, as codes only.
 *
 * The page needs this list to pick its language, and must not carry the 42
 * catalogues themselves: they were 193 KB, 38% of the script injected into
 * every Kick page, for the one table a reader uses (esbuild metafile,
 * 2026-10-16). The worker keeps them and hands over the one asked for.
 * codes.test.ts holds this list to the catalogue's keys.
 */
export const CHAT_LOCALES = [
  'fr', 'es', 'pt', 'pt-pt', 'de', 'it', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'cs', 'sk', 'sl', 'hu', 'ro', 'ca',
  'et', 'lt', 'lv', 'tr', 'vi', 'id', 'ms', 'tl', 'ru', 'uk', 'bg', 'el', 'ar', 'he', 'fa', 'hi', 'bn', 'ta', 'th',
  'ja', 'ko', 'zh', 'zh-tw', 'yue',
] as const;
