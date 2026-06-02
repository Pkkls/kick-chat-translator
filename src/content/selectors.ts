/**
 * Kick chat DOM selectors as of 2026.
 *
 * Modern Kick uses a virtualised list (react-virtuoso style) where each chat row
 * is an `<div data-index="N">` positioned absolutely. `data-index` is RECYCLED
 * by the virtualiser — it is not a stable message ID.
 *
 * 7TV (a popular emote extension) wraps text tokens in `span.seventv-text-token`
 * and adds the class `seventv-chat-observer` to the scroll container.
 */

export const SELECTORS = {
  containers: [
    '#channel-chatroom .no-scrollbar',
    '#channel-chatroom [class*="virtuoso"]',
    '#channel-chatroom',
    // Legacy fallbacks
    '#chatroom-messages',
    '[data-chat-id]',
    '[data-testid="chat-messages"]',
  ],
  messageRows: ['div[data-index]'],
} as const;

export const NON_CHAT_TEXT_CLASSES = ['text-neutral']; // timestamp

/**
 * Candidate selectors for Kick's chat *composer* (the box you type into), ordered
 * most-specific first. Verified live (2026): Kick renders a Lexical editor —
 * `div.editor-input[role="textbox"][contenteditable="true"][data-testid="chat-input"]`.
 * The first and `[data-testid="chat-input"]` selectors both match it; the rest cover
 * legacy/mobile textarea layouts. If Kick renames things the feature simply doesn't
 * mount (graceful no-op).
 */
export const COMPOSE_SELECTORS = [
  '#channel-chatroom div[contenteditable="true"]',
  '#channel-chatroom [role="textbox"][contenteditable="true"]',
  '#channel-chatroom textarea',
  '[data-testid="chat-input"]',
  '[data-testid="message-input"]',
  'div[contenteditable="true"][data-editor]',
  '[contenteditable="true"][role="textbox"]',
] as const;

/** Find the chat composer element, or null when not present (e.g. not on a channel page). */
export function findComposer(root: ParentNode = document): HTMLElement | null {
  const el = pickFirst(root, COMPOSE_SELECTORS);
  return el instanceof HTMLElement ? el : null;
}

export function pickFirst(root: ParentNode, list: readonly string[]): Element | null {
  for (const sel of list) {
    try {
      const found = root.querySelector(sel);
      if (found) return found;
    } catch {
      /* invalid selector, ignore */
    }
  }
  return null;
}

export function findAllRows(container: ParentNode): Element[] {
  return Array.from(container.querySelectorAll('div[data-index]'));
}

export function matchesMessageRow(el: Element): boolean {
  return el instanceof HTMLElement && el.hasAttribute('data-index');
}

/**
 * Extract just the message body (text only — no timestamp, no username, no separator),
 * preferring 7TV-tokenised text when present to avoid the native+7TV duplicate text bug.
 */
export function extractMessageText(row: Element): string {
  const sevenTv = row.querySelectorAll<HTMLElement>('span.seventv-text-token');
  if (sevenTv.length > 0) {
    return joinTexts(Array.from(sevenTv));
  }
  // Native Kick: text spans have class "font-normal" but NOT "font-bold" (which is username/separator)
  const native = Array.from(row.querySelectorAll<HTMLElement>('span.font-normal')).filter(
    (s) => !s.classList.contains('font-bold'),
  );
  return joinTexts(native);
}

function joinTexts(els: HTMLElement[]): string {
  return els
    .map((e) => {
      // Skip elements that are just emote image alt-text containers.
      // Kick renders custom emotes as <img alt="emoteName"> inside text spans.
      if (e.children.length === 1 && e.children[0] instanceof HTMLImageElement) return '';
      // Filter out <img> alt text from mixed content spans.
      const text = Array.from(e.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('');
      return text || (e.textContent ?? '');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Best-effort username extraction (lowercased). */
export function extractUsername(row: Element): string | undefined {
  // Kick wraps the username in a button with title=<user> on hover-tooltipped variants
  const btn = row.querySelector('button[title]');
  const fromTitle = btn?.getAttribute('title');
  if (fromTitle) return fromTitle.trim().toLowerCase();
  // Otherwise: the styled (colored) bold span is the username
  const styled = row.querySelector('span.inline-flex.font-bold[style*="color"]');
  if (styled?.textContent) return styled.textContent.trim().toLowerCase();
  const anyBold = row.querySelector('button span.font-bold, button span[style*="color"]');
  return anyBold?.textContent?.trim().toLowerCase() ?? undefined;
}

/**
 * Pick the deepest container we should append our translation to,
 * so it stays inside the message bubble (rounded-lg padding) rather than
 * sitting outside the message row.
 */
export function pickInjectionTarget(row: Element): Element {
  return (
    row.querySelector('div.w-full.min-w-0.shrink-0') ??
    row.querySelector('div.group') ??
    (row.firstElementChild as Element | null) ??
    row
  );
}

/**
 * Build a stable-enough ID for the row. `data-index` alone is reused by the
 * virtualiser, so we combine it with a hash of (username + text prefix).
 */
export function buildSyntheticId(row: Element, username: string, text: string): string {
  const idx = row.getAttribute('data-index') ?? 'x';
  const seed = `${username}::${text}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return `r${idx}_h${(h >>> 0).toString(36)}`;
}
