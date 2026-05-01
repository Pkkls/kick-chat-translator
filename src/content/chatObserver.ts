import { CHAT_SELECTORS } from '../shared/constants';

type MessageCallback = (element: Element, messageId: string, text: string) => void;

function resolveSelector(list: string[], root: Document | Element = document): Element | null {
  for (const sel of list) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch {}
  }
  return null;
}

function resolveAll(list: string[], root: Element): Element[] {
  for (const sel of list) {
    try {
      const els = root.querySelectorAll(sel);
      if (els.length > 0) return Array.from(els);
    } catch {}
  }
  return [];
}

// Last-resort: find chat container by looking for a scrollable div
// that contains many short text nodes (typical chat structure)
function findChatContainerFallback(): Element | null {
  const candidates = Array.from(
    document.querySelectorAll('div[class*="chat"], div[id*="chat"], section[class*="chat"]')
  );
  // Pick the one with most children
  let best: Element | null = null;
  let bestCount = 0;
  for (const el of candidates) {
    if (el.children.length > bestCount) {
      bestCount = el.children.length;
      best = el;
    }
  }
  if (best && bestCount > 2) {
    console.debug('[KickTranslator] Fallback container found:', best, 'children:', bestCount);
    return best;
  }
  return null;
}

function extractText(messageEl: Element): string {
  const textEl = resolveSelector(CHAT_SELECTORS.messageText, messageEl);
  return (textEl ?? messageEl).textContent?.trim() ?? '';
}

function extractId(messageEl: Element): string {
  const id =
    messageEl.getAttribute(CHAT_SELECTORS.messageId) ??
    messageEl.getAttribute('id') ??
    messageEl.getAttribute('data-message-id') ??
    messageEl.getAttribute('data-index');
  if (!id) {
    const text = extractText(messageEl);
    // Stable ID from position + partial text
    const idx = Array.from(messageEl.parentElement?.children ?? []).indexOf(messageEl);
    return 'kt_' + idx + '_' + text.slice(0, 12).replace(/\s/g, '');
  }
  return id;
}

export class ChatObserver {
  private observer: MutationObserver | null = null;
  private processedIds = new Set<string>();
  private callback: MessageCallback;
  private retryCount = 0;

  constructor(callback: MessageCallback) {
    this.callback = callback;
  }

  start(): void {
    this.retryCount = 0;
    this.poll();
  }

  private poll(): void {
    const container =
      resolveSelector(CHAT_SELECTORS.container) ?? findChatContainerFallback();

    if (container) {
      this.attach(container);
      return;
    }

    this.retryCount++;
    if (this.retryCount <= 3 || this.retryCount % 10 === 0) {
      console.debug('[KickTranslator] Chat container not found, retry', this.retryCount);
    }

    setTimeout(() => this.poll(), 800);
  }

  private attach(container: Element): void {
    console.debug('[KickTranslator] Attached to container:', container.tagName, container.className, container.id);

    // Detect message elements: try known selectors, else use direct children
    const tryMessages = resolveAll(CHAT_SELECTORS.message, container);
    console.debug('[KickTranslator] Existing messages found:', tryMessages.length);

    // Process existing messages
    for (const el of tryMessages) this.processMessage(el);

    // If no specific message selector works, fall back to observing direct children
    const useFallbackMessages = tryMessages.length === 0;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof Element)) continue;

          if (!useFallbackMessages) {
            if (this.matchesMessage(node)) {
              this.processMessage(node);
            } else {
              for (const el of resolveAll(CHAT_SELECTORS.message, node)) {
                this.processMessage(el);
              }
            }
          } else {
            // Fallback: treat every added element as a potential message
            this.processMessage(node);
          }
        }
      }
    });

    this.observer.observe(container, { childList: true, subtree: true });

    // Re-attach if the container leaves the DOM (channel switch)
    const sentinel = new MutationObserver(() => {
      if (!document.contains(container)) {
        console.debug('[KickTranslator] Container removed, re-scanning');
        this.observer?.disconnect();
        this.processedIds.clear();
        this.start();
        sentinel.disconnect();
      }
    });
    sentinel.observe(document.body, { childList: true, subtree: true });
  }

  private matchesMessage(el: Element): boolean {
    return CHAT_SELECTORS.message.some((sel) => {
      try { return el.matches(sel); } catch { return false; }
    });
  }

  private processMessage(el: Element): void {
    const id = extractId(el);
    if (this.processedIds.has(id)) return;
    this.processedIds.add(id);

    const text = extractText(el);
    if (!text || text.length < 3) return;

    this.callback(el, id, text);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.processedIds.clear();
  }
}
