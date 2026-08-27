/**
 * The chat's own catalogue, compiled into the content bundle.
 *
 * chrome.i18n answers in the BROWSER's language and MV3 offers no way to ask
 * it for another, so the `uiLang` setting -- eleven values, right there in the
 * options page -- changed the popup and the options and left the chat in
 * whatever language the browser happened to be in.
 *
 * English is absent on purpose: it is the fallback argument at every msg()
 * call, and msg.coverage.test.ts holds the two to each other. Same shape as
 * src/shared/i18n, which the popup and the options page use.
 */
import { ja } from './ja';
import { fr } from './fr';
import { zh } from './zh';
import { ar } from './ar';
import { ru } from './ru';
import { pt } from './pt';
import { es } from './es';
import { tr } from './tr';
import { ko } from './ko';

export const CHAT_MESSAGES: Record<string, Record<string, string>> = {
  ja,
  fr,
  zh,
  ar,
  ru,
  pt,
  es,
  tr,
  ko,
};
