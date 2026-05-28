export const SELECTORS = {
  containers: [
    '#chatroom-messages',
    '[data-chat-id]',
    '[data-testid="chat-messages"]',
    '.chatroom-messages',
    '.chat-messages-container',
    '.messages-list',
    '#chat-messages',
    '.chat-entries',
    '[class*="chatroom"] [class*="messages"]',
    '[class*="chat-list"]',
    '[class*="message-list"]',
  ],
  messages: [
    '[data-chat-entry]',
    '[data-chat-entry-id]',
    'div[id^="chat-entry-"]',
    '.chat-entry',
    '.chat-message-item',
    '[class*="chat-entry"]',
    '[class*="chat-message"]',
    '[class*="message-item"]',
    'li[data-id]',
  ],
  messageText: [
    '[data-chat-entry-content]',
    '.chat-entry-content',
    '.chat-message-content',
    '.message-text',
    '[class*="message-content"]',
    '[class*="chat-content"]',
    'span[class*="text"]',
  ],
};

export const ID_ATTRS = [
  'data-chat-entry-id',
  'data-id',
  'data-message-id',
  'id',
];

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

export function pickAll(root: ParentNode, list: readonly string[]): Element[] {
  for (const sel of list) {
    try {
      const found = root.querySelectorAll(sel);
      if (found.length > 0) return Array.from(found);
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function extractMessageId(el: Element): string | undefined {
  for (const attr of ID_ATTRS) {
    const val = el.getAttribute(attr);
    if (val) {
      // id attr often "chat-entry-<ulid>" — keep just the ulid for consistency with WS
      const stripped = val.replace(/^chat-entry-/, '');
      return stripped;
    }
  }
  return undefined;
}

export function extractMessageText(el: Element): string {
  const textEl = pickFirst(el, SELECTORS.messageText) ?? el;
  return (textEl.textContent ?? '').trim();
}
