import { createMetrics, readAllMetrics } from '~/shared/metrics';

/**
 * Publish the collected metrics where a page-context reader can see them.
 *
 * Instrumentation that nobody can read is not instrumentation. The samples land
 * in chrome.storage.local, which is reachable only from an extension context: the
 * service worker, the options page, or a content script's isolated world. A
 * console attached to the Kick tab, or any external driver evaluating JS in the
 * page, sits in a different world and cannot see `chrome` at all. Nine measures
 * shipped in item 97 with no way out.
 *
 * The content script bridges the two worlds, because it is the one piece that
 * lives in the isolated world while sharing the page's DOM. It writes the whole
 * snapshot into a `<script type="application/json">` node, which the parser stores
 * and never executes, so reading it is one line and needs no handshake:
 *
 *   JSON.parse(document.getElementById('kt-metrics-dump').textContent)
 *
 * INTEGRATION BUILDS ONLY. The call site is guarded by `__KT_METRICS__`, so a
 * release build drops the call, then tree-shaking drops this module and the sink
 * it imports. scripts/check-strip.ts fails the build if any of that stops being
 * true, which is what makes the guarantee worth stating.
 */
const NODE_ID = 'kt-metrics-dump';
const REFRESH_MS = 5000;

export function mountMetricsBridge(): void {
  if (document.getElementById(NODE_ID)) return;

  const node = document.createElement('script');
  node.type = 'application/json';
  node.id = NODE_ID;
  document.documentElement.appendChild(node);

  const write = async (): Promise<void> => {
    try {
      const snapshots = await readAllMetrics();
      // The content script's own sink has not necessarily flushed yet, so its
      // live counters are read straight from memory rather than from storage.
      // Without this the page-side series lag by up to one flush interval, and
      // a short session can look emptier than it was.
      const live = createMetrics('content').snapshot();
      node.textContent = JSON.stringify({
        at: Date.now(),
        href: location.href,
        snapshots: live ? [...snapshots.filter((s) => s.scope !== 'content'), live] : snapshots,
      });
    } catch (err: unknown) {
      // A bridge that dies silently would read as "no metrics collected", which
      // is the one wrong conclusion this whole mechanism exists to prevent.
      node.textContent = JSON.stringify({ at: Date.now(), error: String(err) });
    }
  };

  void write();
  setInterval(() => void write(), REFRESH_MS);
}
