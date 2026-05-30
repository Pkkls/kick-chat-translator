import { loadSettings, saveSettings, watchSettings, type Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { TranslationPipeline } from './pipeline';
import {
  ensureStyles,
  mountFloatingBar,
  unmountFloatingBar,
  updateFloatingBar,
  updateLocalChip,
  type LocalChipState,
} from './injector';
import { ChatObserver } from './observer';
import { KickPusherClient } from './pusher';
import { extractChannelSlug, fetchChatroomId } from './kickApi';
import { localEngine } from './localEngine';
import { logPlatform, refresh7TV } from './platform';
import { langFlag } from '~/shared/languages';

const log = rootLogger.child('content');

async function main(): Promise<void> {
  let settings: Settings = await loadSettings();
  rootLogger.setEnabled(settings.debug);

  ensureStyles();

  const pipeline = new TranslationPipeline(settings);
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
    if (document.getElementById('kt-floating-bar')) return; // already mounted
    if (barPolling) return; // a host-search loop is already running
    barPolling = true;
    const tryMount = (attempt = 0): void => {
      if (document.getElementById('kt-floating-bar')) {
        barPolling = false;
        return;
      }
      const host = document.querySelector('#channel-chatroom');
      if (host) {
        mountFloatingBar(host, settings, {
          onToggle: (enabled) => void saveSettings({ enabled }),
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
        if (settings.showFloatingBar && !document.getElementById('kt-floating-bar')) mountBar();
      }, 500);
    }).observe(document.body, { childList: true, subtree: true });
  }

  async function attachForRoute(): Promise<void> {
    const slug = extractChannelSlug(location.pathname);
    if (slug === currentSlug) return;
    currentSlug = slug;
    log.debug('route change, channel slug:', slug);

    if (!slug) {
      observer.stop();
      unmountFloatingBar();
      return;
    }

    refresh7TV();
    logPlatform();
    observer.reset();
    observer.start();
    mountBar();

    if (pusher && settings.connectionMode !== 'dom') {
      const id = await fetchChatroomId(slug);
      if (id !== undefined) {
        log.debug('switching pusher chatroom to', id);
        pusher.switchChatroom(id);
      }
    }
  }

  if (settings.enabled) void attachForRoute();
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
      if (row.querySelector('.kt-translation, .kt-translation-inline')) continue;
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
          if (row.querySelector('.kt-translation, .kt-translation-inline')) continue;
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
    rootLogger.setEnabled(next.debug);
    updateFloatingBar(next);
    refreshChip();

    if (next.enabled && !wasEnabled) void attachForRoute();
    if (!next.enabled && wasEnabled) {
      observer.stop();
      pusher?.stop();
    }
    if (next.showFloatingBar) mountBar();
    else unmountFloatingBar();
  });

  log.info('Content script ready');
}

void main().catch((err: unknown) => {
  console.error('[KickTranslator] init error', err);
});
