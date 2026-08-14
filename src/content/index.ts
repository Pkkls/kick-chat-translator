import { loadSettings, saveSettings, watchSettings, type Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { TranslationPipeline } from './pipeline';
import {
  TRANSLATION_SELECTOR,
  applyShowOriginal,
  ensureStyles,
  mountFloatingBar,
  showToast,
  unmountFloatingBar,
  updateFloatingBar,
  updateLocalChip,
  type LocalChipState,
} from './injector';
import { ChatObserver } from './observer';
import { ComposeController } from './compose';
import { KickPusherClient } from './pusher';
import { SELECTORS, findChatPanel, findComposer, pickFirst } from './selectors';
import { extractChannelSlug, fetchChannelLangIso, fetchChatroomId } from './kickApi';
import { localEngine } from './localEngine';
import { logPlatform, refresh7TV } from './platform';
import { langFlag } from '~/shared/languages';

const log = rootLogger.child('content');
// One-shot guard so the "Kick DOM changed" warning toast shows at most once per page.
let domWarned = false;

async function main(): Promise<void> {
  let settings: Settings = await loadSettings();
  rootLogger.setEnabled(settings.debug);

  ensureStyles();
  applyShowOriginal(settings.showOriginal);

  const pipeline = new TranslationPipeline(settings);
  const compose = new ComposeController(settings);
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

  let pusher: KickPusherClient | undefined;
  if (settings.connectionMode !== 'dom') {
    pusher = new KickPusherClient((wsMsg) => {
      void pipeline.onWebSocketMessage({
        id: wsMsg.id,
        text: wsMsg.content,
        channel: currentSlug ?? '',
        username: wsMsg.username,
        isBot: wsMsg.isBot,
      });
    });
  }

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
          onToggle: (enabled) => void saveSettings({ enabled }),
          onTargetLang: (targetLang) => void saveSettings({ targetLang }),
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

  async function attachForRoute(): Promise<void> {
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

    if (pusher && settings.connectionMode !== 'dom') {
      const id = await fetchChatroomId(slug);
      if (id !== undefined) {
        log.debug('switching pusher chatroom to', id);
        pusher.switchChatroom(id);
      }
    }
  }

  // Compose preview is independent of the incoming-translation master switch, so
  // attach the route machinery when either feature is on.
  if (settings.enabled || settings.composeEnabled) void attachForRoute();
  if (settings.showFloatingBar) mountBar();
  watchBar();

  const origPush = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<typeof origPush>): void => {
    origPush(...args);
    void attachForRoute();
  }) as typeof history.pushState;
  window.addEventListener('popstate', () => void attachForRoute());

  // Retry on focus: when pauseWhenHidden is ON and the user comes back to this tab,
  // messages that arrived while hidden are marked (data-kt-id) but never translated.
  // Sweep visible rows that have no translation and re-submit them.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !settings.enabled || !settings.pauseWhenHidden) return;
    const rows = document.querySelectorAll('#channel-chatroom div[data-index][data-kt-id]');
    let retried = 0;
    for (const row of rows) {
      // Already has a translation → skip.
      if (row.querySelector(TRANSLATION_SELECTOR)) continue;
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
          if (row.querySelector(TRANSLATION_SELECTOR)) continue;
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

  watchSettings((next) => {
    const wasEnabled = settings.enabled;
    settings = next;
    pipeline.updateSettings(next);
    compose.updateSettings(next);
    rootLogger.setEnabled(next.debug);
    updateFloatingBar(next);
    applyShowOriginal(next.showOriginal);
    refreshChip();

    if (next.enabled && !wasEnabled) void attachForRoute();
    if (!next.enabled && wasEnabled) {
      observer.stop();
      pusher?.stop();
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
