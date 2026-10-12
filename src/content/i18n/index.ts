/**
 * The chat's own catalogue, compiled into the content bundle.
 *
 * chrome.i18n answers in the BROWSER's language and MV3 offers no way to ask
 * it for another, so the `uiLang` setting changed the popup and the options and
 * left the chat in whatever language the browser happened to be in.
 *
 * English is absent on purpose: it is the fallback argument at every msg()
 * call, and msg.coverage.test.ts holds the two to each other. Same shape as
 * src/shared/i18n, which the popup and the options page use.
 */
import { fr } from './fr';
import { es } from './es';
import { pt } from './pt';
import { pt_pt } from './pt-pt';
import { de } from './de';
import { it } from './it';
import { nl } from './nl';
import { pl } from './pl';
import { sv } from './sv';
import { no } from './no';
import { da } from './da';
import { fi } from './fi';
import { cs } from './cs';
import { sk } from './sk';
import { sl } from './sl';
import { hu } from './hu';
import { ro } from './ro';
import { ca } from './ca';
import { et } from './et';
import { lt } from './lt';
import { lv } from './lv';
import { tr } from './tr';
import { vi } from './vi';
import { id } from './id';
import { ms } from './ms';
import { tl } from './tl';
import { ru } from './ru';
import { uk } from './uk';
import { bg } from './bg';
import { el } from './el';
import { ar } from './ar';
import { he } from './he';
import { fa } from './fa';
import { hi } from './hi';
import { bn } from './bn';
import { ta } from './ta';
import { th } from './th';
import { ja } from './ja';
import { ko } from './ko';
import { zh } from './zh';
import { zh_tw } from './zh-tw';
import { yue } from './yue';

export const CHAT_MESSAGES: Record<string, Record<string, string>> = {
  fr,
  es,
  pt,
  'pt-pt': pt_pt,
  de,
  it,
  nl,
  pl,
  sv,
  no,
  da,
  fi,
  cs,
  sk,
  sl,
  hu,
  ro,
  ca,
  et,
  lt,
  lv,
  tr,
  vi,
  id,
  ms,
  tl,
  ru,
  uk,
  bg,
  el,
  ar,
  he,
  fa,
  hi,
  bn,
  ta,
  th,
  ja,
  ko,
  zh,
  'zh-tw': zh_tw,
  yue,
};
