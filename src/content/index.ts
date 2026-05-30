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
  let barGuardScheduled = false;
  function watchBar(): void {
    new MutationObserver(() => {
      if (barGuardScheduled) return;
      barGuardScheduled = true;
      requestAnimationFrame(() => {
        barGuardScheduled = false;
        if (settings.showFloatingBar && !document.getElementById('kt-floating-bar')) mountBar();
      });
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
