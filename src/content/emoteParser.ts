import type { TextToken } from '~/shared/types';

// Kick chat content uses [emote:<id>:<name>] tokens for emotes,
// @<user> for mentions, and bare URLs for links.
const EMOTE_RE = /\[emote:(\d+):([^\]]+)\]/g;
const MENTION_RE = /(^|[\s,.!?])@([a-z0-9_]{2,32})/gi;
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;

export interface ParsedContent {
  /** Readable text with placeholders (`:emote:`, `[link]`, `@user`). */
  plain: string;
  /** ONLY the human words — emotes / mentions / urls removed. What we translate. */
  realText: string;
  tokens: TextToken[];
}

interface Marker {
  start: number;
  end: number;
  token: TextToken;
  plain: string;
}

export function parseKickContent(content: string): ParsedContent {
  const markers: Marker[] = [];

  for (const match of content.matchAll(EMOTE_RE)) {
    if (match.index === undefined) continue;
    const id = match[1] ?? '';
    const name = match[2] ?? '';
    markers.push({
      start: match.index,
      end: match.index + match[0].length,
      token: { kind: 'emote', id, name },
      plain: ` :${name}: `,
    });
  }

  for (const match of content.matchAll(URL_RE)) {
    if (match.index === undefined) continue;
    if (overlaps(markers, match.index, match.index + match[0].length)) continue;
    markers.push({
      start: match.index,
      end: match.index + match[0].length,
      token: { kind: 'url', href: match[0] },
      plain: ' [link] ',
    });
  }

  for (const match of content.matchAll(MENTION_RE)) {
    if (match.index === undefined) continue;
    const lead = match[1] ?? '';
    const user = match[2] ?? '';
    const absStart = match.index + lead.length;
    const absEnd = absStart + 1 + user.length; // '@' + user
    if (overlaps(markers, absStart, absEnd)) continue;
    markers.push({
      start: absStart,
      end: absEnd,
      token: { kind: 'mention', user: user.toLowerCase() },
      plain: ` @${user} `,
    });
  }

  markers.sort((a, b) => a.start - b.start);

  const tokens: TextToken[] = [];
  let cursor = 0;
  const plainParts: string[] = [];

  for (const m of markers) {
    if (m.start > cursor) {
      const slice = content.slice(cursor, m.start);
      tokens.push({ kind: 'text', value: slice });
      plainParts.push(slice);
    }
    tokens.push(m.token);
    plainParts.push(m.plain);
    cursor = m.end;
  }
  if (cursor < content.length) {
    const slice = content.slice(cursor);
    tokens.push({ kind: 'text', value: slice });
    plainParts.push(slice);
  }

  const plain = plainParts.join('').replace(/\s+/g, ' ').trim();
  const rawReal = tokens
    .filter((t): t is { kind: 'text'; value: string } => t.kind === 'text')
    .map((t) => t.value)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Strip inline emote names: tokens like "namedarumajankiss2", "LUL", "KEKW",
  // "xqcL", "pepeLaugh" that are concatenated with real text. These are typically
  // camelCase/PascalCase with digits, or ALL-CAPS 3+ letter words that aren't real
  // words. We strip them to recover the translatable text underneath.
  const realText = stripInlineEmoteNames(rawReal);
  return { plain, realText, tokens };
}

/**
 * Strip words that look like emote names from extracted text.
 * Patterns:
 * - camelCase/PascalCase with digits (namedarumajankiss2, xqcL, pepeLaugh)
 * - ALL-CAPS 3+ letters that aren't common words (KEKW, LULW, OMEGALUL)
 * - Words starting with lowercase then uppercase mid-word (catJam, monkaS)
 * Preserves real text around them.
 */
function stripInlineEmoteNames(text: string): string {
  return text
    // Token with mixed case + digits, typically emote names (namedarumajankiss2, xqcL3)
    .replace(/\b[a-zA-Z]*[a-z][A-Z][a-zA-Z0-9]*\b/g, ' ')
    // Token that's all lowercase+digits but >12 chars and no spaces — likely concatenated emote slug
    .replace(/\b[a-z]{3,}[a-z0-9]{10,}\b/g, ' ')
    // Known emote suffixes (common Kick/BTTV/7TV patterns)
    .replace(/\b\w+(kiss|wave|hug|love|dab|pog|kek|lul|gg|ez|clap|jam|hype)\d*\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function overlaps(markers: Marker[], start: number, end: number): boolean {
  for (const m of markers) {
    if (start < m.end && end > m.start) return true;
  }
  return false;
}
