/**
 * Which interface locale a browser's language list asks for.
 *
 * Kept apart from i18n.ts so the content script can use it without pulling in
 * the interface catalogue (see msg.ts).
 */

/**
 * Browser tags that name a locale under another spelling: Norwegian's two
 * written forms, Filipino's ISO code, Hebrew's old one, Chinese by region, and
 * Brazilian Portuguese (`pt` is Brazilian here, `pt-pt` European).
 */
const ALIASES: Record<string, string> = {
  nb: 'no',
  nn: 'no',
  fil: 'tl',
  iw: 'he',
  'pt-br': 'pt',
};

/** The first tag that names a supported locale, or undefined. */
export function matchUiLocale(tags: readonly string[], supported: (v: string) => boolean): string | undefined {
  for (const raw of tags) {
    const tag = (raw || '').toLowerCase();
    const base = tag.split('-')[0] ?? '';
    // zh-Hant-TW, zh-HK...: Traditional script, whatever the order of subtags.
    if (base === 'zh' && /-(hant|tw|hk|mo)\b/.test(tag) && supported('zh-tw')) return 'zh-tw';
    for (const v of [tag, base]) {
      const hit = ALIASES[v] ?? v;
      if (supported(hit)) return hit;
    }
  }
  return undefined;
}
