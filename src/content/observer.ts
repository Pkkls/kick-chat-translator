import { SELECTORS, pickAll, pickFirst, extractMessageId, extractMessageText } from './selectors';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('observer');

export interface DomMessage {
  element: Element;
  id: string;
  text: string;
  usernameGuess: string | undefined;
}

type Callback = (msg: DomMessage) => void;

export class ChatObserver {
  private observer: MutationObserver | undefined;
  private container: Element | undefined;
  private pollHandle: ReturnType<typeof setTimeout> | undefined;
  private seenIds = new Set<string>();
  private cb: Callback;
  private running = false;

  constructor(cb: Callback) {
    this.cb = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tryAttach();
  }

  stop(): void {
    this.running = false;
    if (this.pollHandle) clearTimeout(this.pollHandle);
    this.observer?.disconnect();
    this.observer = undefined;
    this.container = undefined;
    this.seenIds.clear();
  }

  /** Force re-scan (e.g., on channel switch). */
  reset(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.container = undefined;
    this.seenIds.clear();
    if (this.running) this.tryAttach();
  }

  private tryAttach(): void {
    const container = pickFirst(document, SELECTORS.containers);
    if (container) {
      this.attach(container);
      return;
    }
    this.pollHandle = setTimeout(() => this.tryAttach(), 600);
  }

  private attach(container: Element): void {
    log.debug('attached', container.tagName, container.className);
    this.container = container;

    for (const el of pickAll(container, SELECTORS.messages)) {
      this.process(el);
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (!(node instanceof Element)) continue;
          // direct match
          if (this.matches(node)) this.process(node);
          // descendants
          for (const child of pickAll(node, SELECTORS.messages)) this.process(child);
        }
      }
    });
    this.observer.observe(container, { childList: true, subtree: true });

    // Re-attach on detach (channel change)
    const watcher = new MutationObserver(() => {
      if (!document.contains(container)) {
        log.debug('container detached, re-scanning');
        watcher.disconnect();
        this.observer?.disconnect();
        this.observer = undefined;
        this.container = undefined;
        this.seenIds.clear();
        if (this.running) this.tryAttach();
      }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
  }

  private matches(el: Element): boolean {
    for (const sel of SELECTORS.messages) {
      try {
        if (el.matches(sel)) return true;
      } catch {
        /* invalid selector, ignore */
      }
    }
    return false;
  }

  private process(el: Element): void {
    let id = extractMessageId(el);
    const text = extractMessageText(el);
    if (!text || text.length === 0) return;
    if (!id) {
      // fallback: deterministic id from position + text prefix
      const idx = Array.from(el.parentElement?.children ?? []).indexOf(el);
      id = `dom_${idx}_${text.slice(0, 16).replace(/\s+/g, '_')}`;
    }
    if (this.seenIds.has(id)) return;
    this.seenIds.add(id);
    const usernameEl = el.querySelector('[class*="username"], [class*="user-name"], .chat-message-identity');
    const usernameGuess = usernameEl?.textContent?.trim().toLowerCase();
    this.cb({ element: el, id, text, usernameGuess });
  }

  cap(maxSeen = 5000): void {
    if (this.seenIds.size <= maxSeen) return;
    // simple trim: rebuild keeping last N
    const arr = Array.from(this.seenIds);
    this.seenIds = new Set(arr.slice(-maxSeen));
  }
}
