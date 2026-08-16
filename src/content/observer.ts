import {
  buildSyntheticId,
  extractMessageText,
  extractUsername,
  findAllRows,
  findChatContainer,
  matchesMessageRow,
  pickInjectionTarget,
} from './selectors';
import { rootLogger } from '~/shared/logger';
import { createMetrics } from '~/shared/metrics';

const log = rootLogger.child('observer');
const metrics = createMetrics('content');

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
  private containerWatcher: MutationObserver | undefined;
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
    this.detach();
  }

  reset(): void {
    this.detach();
    if (this.running) this.tryAttach();
  }

  /** Single teardown path: both observers are dropped together or neither is. */
  private detach(): void {
    this.listObserver?.disconnect();
    this.listObserver = undefined;
    this.containerWatcher?.disconnect();
    this.containerWatcher = undefined;
    this.container = undefined;
    this.seenIds.clear();
  }

  private tryAttach(): void {
    const container = findChatContainer(document);
    if (container) {
      metrics.count('dom.attach');
      this.attach(container);
      return;
    }
    // Selector health, the early warning for a Kick redesign. Today the only
    // signal is a toast the user sees once the extension is already broken; this
    // is the same fact, an hour earlier, in a number that can be read on demand.
    metrics.count('dom.container.miss');
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
    this.containerWatcher = new MutationObserver(() => {
      if (!document.contains(container)) {
        log.debug('container removed, rescanning');
        metrics.count('dom.container.remount');
        this.reset();
      }
    });
    this.containerWatcher.observe(document.body, { childList: true, subtree: true });
  }

  private process(row: Element): void {
    metrics.count('dom.row.seen');
    const text = extractMessageText(row);
    if (!text) {
      // A row the observer matched but whose text selector returned nothing. A
      // handful is normal (system lines, emote-only rows). A ratio climbing
      // toward dom.row.seen means the message selectors stopped matching, which
      // is exactly what a Kick markup change looks like from in here.
      metrics.count('dom.row.textEmpty');
      return;
    }
    const username = extractUsername(row) ?? '';
    if (!username) metrics.count('dom.row.noUsername');
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
