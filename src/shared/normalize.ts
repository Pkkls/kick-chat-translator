/**
 * Normalize chat text so cosmetic variations collapse to the same cache key.
 * Chat repeats heavily ("WWWW"/"wwww", "loooool"/"lool", trailing punctuation).
 * Collapsing them multiplies the cache hit-rate — the #1 lever against rate-limits.
 * Shared by the SW IndexedDB cache and the content-side memory cache so both
 * agree on what counts as "the same message".
 */
export function normalizeForKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/(.)\1{2,}/gu, '$1$1')
    .replace(/[!?.…~、。！？]+$/u, '');
}

export function cacheKey(text: string, targetLang: string): string {
  return `${targetLang}::${normalizeForKey(text)}`;
}
