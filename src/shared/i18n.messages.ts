import type { UiLocale } from './i18n';
import { fr } from './i18n/fr';
import { es } from './i18n/es';
import { pt } from './i18n/pt';
import { pt_pt } from './i18n/pt-pt';
import { de } from './i18n/de';
import { it } from './i18n/it';
import { nl } from './i18n/nl';
import { pl } from './i18n/pl';
import { sv } from './i18n/sv';
import { no } from './i18n/no';
import { da } from './i18n/da';
import { fi } from './i18n/fi';
import { cs } from './i18n/cs';
import { sk } from './i18n/sk';
import { sl } from './i18n/sl';
import { hu } from './i18n/hu';
import { ro } from './i18n/ro';
import { ca } from './i18n/ca';
import { et } from './i18n/et';
import { lt } from './i18n/lt';
import { lv } from './i18n/lv';
import { tr } from './i18n/tr';
import { vi } from './i18n/vi';
import { id } from './i18n/id';
import { ms } from './i18n/ms';
import { tl } from './i18n/tl';
import { ru } from './i18n/ru';
import { uk } from './i18n/uk';
import { bg } from './i18n/bg';
import { el } from './i18n/el';
import { ar } from './i18n/ar';
import { he } from './i18n/he';
import { fa } from './i18n/fa';
import { hi } from './i18n/hi';
import { bn } from './i18n/bn';
import { ta } from './i18n/ta';
import { th } from './i18n/th';
import { ja } from './i18n/ja';
import { ko } from './i18n/ko';
import { zh } from './i18n/zh';
import { zh_tw } from './i18n/zh-tw';
import { yue } from './i18n/yue';

/**
 * UI translation catalog: English string (key) → translation, per non-English locale.
 * Anything missing falls back to the English key, so partial coverage is safe.
 * Per-language maps live in ./i18n/<locale>.ts (keys mirror src/shared/i18n/keys.json).
 */
export type UiCatalog = Partial<Record<Exclude<UiLocale, 'en'>, Record<string, string>>>;

export const UI_MESSAGES: UiCatalog = {
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
