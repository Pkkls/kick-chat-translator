import { CHAT_MESSAGES } from './i18n';
import { setUiLocale } from '~/shared/languages';

/**
 * A string from the chat's own catalogue.
 *
 * This used to be chrome.i18n over `public/_locales`. That reads the BROWSER's
 * language and MV3 offers no way to ask it for another, so `uiLang` -- a
 * setting with eleven values, sitting in the options page -- moved the popup
 * and the options page and left the chat in whatever language the browser
 * happened to be in. Someone on an English browser who set the interface to
 * Japanese read Japanese settings about an English chat.
 *
 * The catalogue is compiled in instead, and keyed on the setting.
 *
 * English is not in it. It is the `fallback` argument at every call site, which
 * keeps the English text where the code that uses it is, and
 * msg.coverage.test.ts holds every call and its catalogue entry to each other.
 */

const SUPPORTED = new Set(['en', ...Object.keys(CHAT_MESSAGES)]);

/** The catalogue in force. Undefined means English, which needs no table. */
let table: Record<string, string> | undefined;

/**
 * The locale the chat should speak.
 *
 * Deliberately NOT `resolveUiLocale` from `~/shared/i18n`, which does the same
 * job for the popup: that module imports UI_MESSAGES, and pulling it in here
 * would drag the interface catalogue -- 128KB of it -- into a content script
 * that is injected into every Kick page. `nozod.test.ts` guards the same bundle
 * against zod for the same reason.
 */
function resolve(uiLang: string | undefined): string {
  if (uiLang && uiLang !== 'auto' && SUPPORTED.has(uiLang)) return uiLang;
  const list =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : [];
  for (const raw of list) {
    const base = (raw || '').toLowerCase().split('-')[0] ?? '';
    if (SUPPORTED.has(base)) return base;
  }
  return 'en';
}

/**
 * Point the chat at a language. Returns the one it settled on.
 *
 * Also sets the locale the language NAMES resolve against: the chip's menu runs
 * `Intl.DisplayNames` and `Intl.Collator`, and both were asking chrome.i18n
 * too, so the menu could be sorted and named in one language while the labels
 * around it spoke another.
 */
export function setContentLocale(uiLang: string | undefined): string {
  const locale = resolve(uiLang);
  table = CHAT_MESSAGES[locale];
  setUiLocale(locale);
  return locale;
}

export function msg(key: string, fallback: string, subs?: string[]): string {
  const text = table?.[key] ?? fallback;
  if (!subs?.length) return text;
  // Filled in the order the placeholders appear, catalogue entry and fallback
  // alike. One code path for both, so a message that reads correctly in English
  // cannot come out with its substitutions in another order somewhere else.
  let i = 0;
  return text.replace(/\$[A-Za-z][A-Za-z0-9_]*\$/g, () => subs[i++] ?? '');
}
