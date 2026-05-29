const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
};

/**
 * Decode HTML entities in translated text. Some providers (MyMemory, Lingva)
 * return entity-escaped output (`&#39;`, `&quot;`, `&amp;`). Runs in the service
 * worker (no DOM), so it's a small regex decoder rather than a textarea trick.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input || input.indexOf('&') === -1) return input;
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, ent: string) => {
    if (ent[0] === '#') {
      const isHex = ent[1] === 'x' || ent[1] === 'X';
      const code = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return match;
    }
    return NAMED[ent.toLowerCase()] ?? match;
  });
}
