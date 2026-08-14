import type { UiLocale } from './i18n';
import { ja } from './i18n/ja';
import { fr } from './i18n/fr';
import { zh } from './i18n/zh';
import { ar } from './i18n/ar';
import { ru } from './i18n/ru';
import { pt } from './i18n/pt';
import { es } from './i18n/es';

/**
 * UI translation catalog: English string (key) → translation, per non-English locale.
 * Anything missing falls back to the English key, so partial coverage is safe.
 * Per-language maps live in ./i18n/<locale>.ts (keys mirror src/shared/i18n/keys.json).
 */
export type UiCatalog = Partial<Record<Exclude<UiLocale, 'en'>, Record<string, string>>>;

export const UI_MESSAGES: UiCatalog = { ja, fr, zh, ar, ru, pt, es };
