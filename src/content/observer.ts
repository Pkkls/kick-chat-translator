import {
  SELECTORS,
  buildSyntheticId,
  extractMessageText,
  extractUsername,
  findAllRows,
  matchesMessageRow,
  pickFirst,
  pickInjectionTarget,
} from './selectors';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('observer');

export interface DomMessage {
  /** The row element (`div[data-index]`). */
  rowElement: Element;
  /** Container we should append translations into (kept INSIDE the message bubble). */
  injectionTarget: Element;
  id: string;
  text: string;
  usernameGuess: string | undefined;
}

type Callback = (msg: DomMessage) => void;

const PROCESSED_MARK = 'data-kt-id';

export class ChatObserver {
  private listObserver: MutationObserver | undefined;
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
    this.listObserver?.disconnect();
    this.listObserver = undefined;
    this.container = undefined;
    this.seenIds.clear();
  }

  reset(): void {
    this.listObserver?.disconnect();
    this.listObserver = undefined;
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
    this.pollHandle = setTimeout(() => this.tryAttach(), 500);
  }

  private attach(container: Element): void {
    log.debug('attached to', container.tagName, container.className);
    this.container = container;

    for (const row of findAllRows(container)) this.process(row);

    // Virtual scrollers recycle DOM nodes: when a row is reused its inner content
    // is REPLACED (a childList mutation on the subtree), so childList+subtree is
    // sufficient. We deliberately do NOT watch characterData/attributes — on a
    // fast chat those fire constantly and would thrash the callback for no gain.
    this.listObserver = new MutationObserver((mutations) => {
      const candidates = new Set<Element>();
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (matchesMessageRow(node)) candidates.add(node);
          else {
            for (const row of findAllRows(node)) candidates.add(row);
          }
        }
      }
      for (const row of candidates) this.process(row);
    });
    this.listObserver.observe(container, { childList: true, subtree: true });

    // Detect re-mount of the container (channel switch) at the document level.
    const watcher = new MutationObserver(() => {
      if (!document.contains(container)) {
        log.debug('container removed, rescanning');
        watcher.disconnect();
        this.reset();
      }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
  }

  private process(row: Element): void {
    const text = extractMessageText(row);
    if (!text) return;
    const username = extractUsername(row) ?? '';
    const id = buildSyntheticId(row, username, text);

    // If the row already carries our id mark AND it matches, we already processed it.
    const prev = row.getAttribute(PROCESSED_MARK);
    if (prev === id) return;
    if (this.seenIds.has(id)) {
      row.setAttribute(PROCESSED_MARK, id);
      return;
    }
    this.seenIds.add(id);
    row.setAttribute(PROCESSED_MARK, id);
    // Bound memory on long sessions (hours of fast chat).
    if (this.seenIds.size > 4000) this.cap(3000);

    this.cb({
      rowElement: row,
      injectionTarget: pickInjectionTarget(row),
      id,
      text,
      usernameGuess: username || undefined,
    });
  }

  cap(maxSeen = 5000): void {
    if (this.seenIds.size <= maxSeen) return;
    const arr = Array.from(this.seenIds);
    this.seenIds = new Set(arr.slice(-maxSeen));
  }
}
