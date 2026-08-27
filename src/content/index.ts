import type { Settings } from '~/shared/settings';
// Deliberately NOT ~/shared/settings: that module carries zod, and importing a
// value from it puts the whole schema runtime on every Kick page. See the header
// of settingsClient.ts for the measurement.
import { fetchSettings, patchSettings, watchSettings } from '~/shared/settingsClient';
import { rootLogger } from '~/shared/logger';
import { TranslationPipeline } from './pipeline';
import {
  HANDLED_SELECTOR,
  applyChatScheme,
  applyShowOriginal,
  ensureStyles,
  mountFloatingBar,
  removeAllArtifacts,
  showToast,
  unmountFloatingBar,
  updateFloatingBar,
  updateLocalChip,
  type LocalChipState,
} from './injector';
import { ChatObserver } from './observer';
import { mountMetricsBridge } from './metricsBridge';
import { ComposeController } from './compose';
import { SELECTORS, findChatPanel, findComposer, pickFirst, pickInjectionTarget } from './selectors';
import { extractChannelSlug, fetchChannelLangIso } from './kickApi';
import { localEngine } from './localEngine';
import { logPlatform, refresh7TV } from './platform';
import { langFlag } from '~/shared/languages';

const log = rootLogger.child('content');
// One-shot guard so the "Kick DOM changed" warning toast shows at most once per page.
let domWarned = false;

async function main(): Promise<void> {
  // Integration builds only. `__KT_METRICS__` is the constant false in a release,
  // so esbuild folds this branch away and tree-shaking takes the module and the
  // metrics sink with it. check-strip.ts fails the build if it does not.
  if (__KT_METRICS__) mountMetricsBridge();

  let settings: Settings = await fetchSettings();
  rootLogger.setEnabled(settings.debug);

  ensureStyles();
  applyChatScheme();
  applyShowOriginal(settings.showOriginal);

  // Kick's theme switch repaints the page without reloading it, so the stamp
  // has to follow. Watching the root's class and style attributes is enough:
  // every theme system on the site flips one of the two, and the probe is a
  // handful of getComputedStyle calls.
  const themeWatch = new MutationObserver(() => applyChatScheme());
  for (const node of [document.documentElement, document.body]) {
    themeWatch.observe(node, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  }

  const pipeline = new TranslationPipeline(settings);
  const compose = new ComposeController(settings, (patch) => void patchSettings(patch));
  let currentSlug: string | undefined;

  const observer = new ChatObserver((msg) => {
    void pipeline.onDomMessage({
      rowElement: msg.rowElement,
      injectionTarget: msg.injectionTarget,
      id: msg.id,
      text: msg.text,
      channel: currentSlug ?? '',
      username: msg.usernameGuess ?? '',
      isBot: false,
    });
  });

  // ── On-device chip state ───────────────────────────────────────────
  function computeLocalChip(): LocalChipState {
    if (!settings.localEnabled || !localEngine.present()) return { kind: 'hidden' };
    const tgt = settings.targetLang;
    if (localEngine.hasReadyForTarget(tgt)) return { kind: 'ready' };
    const downloadable = localEngine.downloadablePairs().filter((p) => p.tgt === tgt);
    const downloading = downloadable.find((p) => localEngine.stateOf(p.src, p.tgt) === 'downloading');
    if (downloading) {
      return { kind: 'downloading', pct: localEngine.progressOf(downloading.src, downloading.tgt) };
    }
    if (downloadable.length > 0) return { kind: 'download', label: langFlag(downloadable[0]!.src) };
    return { kind: 'hidden' };
  }

  function refreshChip(): void {
    updateLocalChip(computeLocalChip());
  }
  localEngine.onChange(refreshChip);

  let barPolling = false;
  function mountBar(): void {
    if (!settings.showFloatingBar) return;
    if (barPolling) return; // a host-search loop is already running
    barPolling = true;
    const tryMount = (attempt = 0): void => {
      const host = findChatPanel();
      if (host) {
        // A bar left behind in the hidden copy of the panel is not a mounted bar.
        // Drop it, otherwise the presence check below keeps reporting success while
        // the user sees nothing.
        for (const stale of document.querySelectorAll('#kt-floating-bar')) {
          if (!host.contains(stale)) stale.remove();
        }
        if (host.querySelector('#kt-floating-bar')) {
          barPolling = false;
          return;
        }
        mountFloatingBar(host, settings, {
          onToggle: (enabled) => void patchSettings({ enabled }),
          onTargetLang: (targetLang) => void patchSettings({ targetLang }),
          onOpenOptions: () => void chrome.runtime.sendMessage({ type: 'open.options' }),
          onEnableLocal: () => {
            const pairs = localEngine.downloadablePairs().filter((p) => p.tgt === settings.targetLang);
            void localEngine.download(pairs.length ? pairs : localEngine.downloadablePairs());
          },
        });
        refreshChip();
        barPolling = false;
        return;
      }
      if (attempt < 30) setTimeout(() => tryMount(attempt + 1), 400);
      else barPolling = false;
    };
    tryMount();
  }

  // Kick's SPA re-renders the chat subtree, which can wipe the floating bar even
  // when #channel-chatroom itself stays mounted (the message observer keeps
  // working via its own re-attach watcher, but the bar would silently vanish and
  // the user loses the on/off toggle). Re-add it whenever it goes missing.
  // Bar re-mount guard: debounce with 500ms timeout instead of rAF.
  // On a fast chat rAF fires every frame (16ms), creating noise. 500ms is calm and
  // still fast enough to re-mount the bar before the user notices.
  let barGuardTimer: ReturnType<typeof setTimeout> | undefined;
  function watchBar(): void {
    new MutationObserver(() => {
      if (barGuardTimer) return;
      barGuardTimer = setTimeout(() => {
        barGuardTimer = undefined;
        // Presence has to be asked of the panel on screen, not of the document:
        // the id survives inside the hidden copy Kick leaves behind.
        if (settings.showFloatingBar && !findChatPanel()?.querySelector('#kt-floating-bar')) mountBar();
      }, 500);
    }).observe(document.body, { childList: true, subtree: true });
  }

  // If the chat panel is present but neither the message list nor the composer can
  // be found after a grace period, Kick almost certainly changed its DOM — surface
  // it once instead of failing silently (so the user knows to update the extension).
  function scheduleHealthCheck(slug: string): void {
    setTimeout(() => {
      if (currentSlug !== slug) return; // navigated away
      if (!document.querySelector('#channel-chatroom')) return; // no chat view at all
      const containerFound = pickFirst(document, SELECTORS.containers) !== null;
      const composerFound = findComposer() !== null;
      if (!containerFound && !composerFound && !domWarned) {
        domWarned = true;
        log.warn('chat container & composer not found — Kick DOM likely changed');
        showToast('Kick Chat Translator: chat not found — Kick may have updated. An extension update may be needed.');
      }
    }, 12_000);
  }

  function attachForRoute(): void {
    const slug = extractChannelSlug(location.pathname);
    if (slug === currentSlug) return;
    currentSlug = slug;
    log.debug('route change, channel slug:', slug);

    if (!slug) {
      observer.stop();
      unmountFloatingBar();
      compose.stop();
      compose.setChannelLang(undefined);
      return;
    }

    refresh7TV();
    logPlatform();
    observer.reset();
    observer.start();
    mountBar();
    // Compose preview self-gates on composeEnabled and finds the composer itself.
    compose.start();
    scheduleHealthCheck(slug);

    // Auto-detect the channel's chat language (Kick API) → the compose target in
    // 'auto' mode, so the user writes in the channel's language with no setup.
    void fetchChannelLangIso(slug).then((lang) => compose.setChannelLang(lang));
  }

  // Compose preview is independent of the incoming-translation master switch, so
  // attach the route machinery when either feature is on.
  if (settings.enabled || settings.composeEnabled) attachForRoute();
  if (settings.showFloatingBar) mountBar();
  watchBar();

  const origPush = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<typeof origPush>): void => {
    origPush(...args);
    attachForRoute();
  }) as typeof history.pushState;
  window.addEventListener('popstate', () => attachForRoute());

  // Retry on focus: when pauseWhenHidden is ON and the user comes back to this tab,
  // messages that arrived while hidden are marked (data-kt-id) but never translated.
  // Sweep visible rows that have no translation and re-submit them.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !settings.enabled || !settings.pauseWhenHidden) return;
    const rows = document.querySelectorAll('#channel-chatroom div[data-index][data-kt-id]');
    let retried = 0;
    for (const row of rows) {
      // Already has a translation → skip.
      if (row.querySelector(HANDLED_SELECTOR)) continue;
      // Remove the mark so the observer re-processes it.
      row.removeAttribute('data-kt-id');
      retried++;
    }
    if (retried > 0) {
      log.debug(`Tab visible again, retrying ${retried} untranslated rows`);
      observer.reset();
      observer.start();
    }
  });

  // Prefetch on scroll-stop: when the user scrolls up to read old messages and
  // pauses, translate any visible rows that don't have a translation yet.
  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  const chatContainer = document.querySelector('#channel-chatroom .no-scrollbar');
  if (chatContainer) {
    chatContainer.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!settings.enabled) return;
        const rows = chatContainer.querySelectorAll('div[data-index][data-kt-id]');
        let retried = 0;
        for (const row of rows) {
          if (row.querySelector(HANDLED_SELECTOR)) continue;
          row.removeAttribute('data-kt-id');
          retried++;
        }
        if (retried > 0) {
          log.debug(`Scroll-stop prefetch: retrying ${retried} untranslated rows`);
          observer.reset();
          observer.start();
        }
      }, 800);
    }, { passive: true });
  }

  // Note: the "pause when hidden" quota guard lives in the pipeline, which reads
  // document.hidden live per message. The observer stays running (cheap when the
  // tab is hidden since translation bails immediately) — this avoids any
  // stuck-paused state from missed visibilitychange events.

  /**
   * Settings baked into a line at injection time.
   *
   * A line carries the answer that was true when it was drawn: the language it
   * was translated into, the shape it was drawn in, and which badges were on.
   * Nothing re-reads any of them afterwards, so changing one leaves every line
   * already on screen showing the previous answer until the page is reloaded.
   *
   * `showOriginal` is deliberately absent. It is applied through a class on the
   * document root, so it already follows the setting live and re-running rows for
   * it would be work with no effect.
   */
  const RERENDER_KEYS = [
    'targetLang',
    'displayStyle',
    'showSourceBadge',
    'showProviderBadge',
  ] as const satisfies readonly (keyof Settings)[];

  /**
   * Re-run every row we already handled, for when the answer would now differ.
   *
   * The row mark (`data-kt-id`) is built from index + username + text and never
   * from any of the settings above, so a line already drawn still matches its own
   * mark and `ChatObserver.process` drops it as seen.
   *
   * Clearing the mark AND the artifact under it is what makes a row eligible
   * again; `reset()` rescans the container, the same two steps the scroll-stop
   * prefetch above already relies on.
   *
   * Only a target change costs a request. The pipeline hits the in-tab cache
   * first, keyed by text and target, so a style or badge change re-draws every
   * line from memory and reaches no engine.
   */
  function retranslateHandledRows(): void {
    const rows = document.querySelectorAll('div[data-index][data-kt-id]');
    for (const row of rows) {
      removeAllArtifacts(pickInjectionTarget(row));
      row.removeAttribute('data-kt-id');
    }
    log.debug(`display settings changed: re-running ${rows.length} rows`);
    observer.reset();
    observer.start();
  }

  watchSettings((next) => {
    const wasEnabled = settings.enabled;
    const prev = settings;
    settings = next;
    pipeline.updateSettings(next);
    compose.updateSettings(next);
    rootLogger.setEnabled(next.debug);
    updateFloatingBar(next);
    applyShowOriginal(next.showOriginal);
    refreshChip();

    // Ordered after updateSettings on purpose: the rows are re-run through the
    // pipeline, which must already hold the new settings when they arrive.
    if (next.enabled && RERENDER_KEYS.some((k) => prev[k] !== next[k])) retranslateHandledRows();

    if (next.enabled && !wasEnabled) attachForRoute();
    if (!next.enabled && wasEnabled) {
      observer.stop();
    }
    if (next.showFloatingBar) mountBar();
    else unmountFloatingBar();
  });

  // The Debug tab lives in the options page, another context entirely, and the
  // decisions are made here. It asks, we answer: no subscription, no polling,
  // and nothing leaves this page unless someone opens that tab.
  chrome.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
    if (msg?.type !== 'debug.decisions') return false;
    sendResponse({ type: 'debug.decisions', payload: pipeline.recentDecisions() });
    return false;
  });

  log.info('Content script ready');
}

void main().catch((err: unknown) => {
  console.error('[KickTranslator] init error', err);
});
