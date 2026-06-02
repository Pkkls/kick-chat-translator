/**
 * Translation-quality routing tiers — derived from a typological + MT-engine study
 * (see docs/translation-quality.md).
 *
 * Key finding: a machine translator outputs the WRONG grammatical person ("I" instead
 * of "he") when a language drops the subject AND lacks the verb morphology to recover
 * it — the East/South-East-Asian isolating languages, Vietnamese's kinship-pronoun
 * system, and Arabic. Romance/Slavic are also pro-drop but the conjugation encodes the
 * person, so MT recovers it correctly. For the truly ambiguous set, NO engine can
 * recover a referent the language leaves implicit — unless we feed it the surrounding
 * conversation. So those sources get extra context (DeepL's `context` parameter).
 */

const baseLang = (code: string): string => code.toLowerCase().split('-')[0] ?? code.toLowerCase();

/**
 * Source languages where a dropped subject systematically yields the wrong person.
 * Translating FROM these, we feed more prior chat lines so the engine can infer who
 * is meant. (Tier-1 "wrong-person" set from the study.)
 */
const CONTEXT_CRITICAL = new Set(['ja', 'ko', 'zh', 'zh-tw', 'vi', 'th', 'ar']);

export function isContextCritical(code: string | undefined): boolean {
  if (!code) return false;
  const c = code.toLowerCase();
  return CONTEXT_CRITICAL.has(c) || CONTEXT_CRITICAL.has(baseLang(c));
}

/**
 * Languages where DeepL measurably beats Google for short informal text (the European
 * pairs) — worth spending the limited DeepL Free budget. For Asian/Indic/RTL languages
 * Google is as good or better (or DeepL doesn't support them), so they can stay on the
 * free engine. Exposed for future budget-aware provider routing.
 */
export const DEEPL_PREMIUM = new Set([
  'de', 'fr', 'es', 'pt', 'pt-br', 'it', 'nl', 'pl', 'sv', 'cs', 'sk', 'ro',
  'ru', 'uk', 'fi', 'hu', 'bg', 'el', 'sl', 'et', 'lt', 'lv', 'da', 'tr',
]);

export function isDeeplPremium(code: string | undefined): boolean {
  if (!code) return false;
  const c = code.toLowerCase();
  return DEEPL_PREMIUM.has(c) || DEEPL_PREMIUM.has(baseLang(c));
}
