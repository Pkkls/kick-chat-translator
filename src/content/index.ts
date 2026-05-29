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

  function mountBar(): void {
    if (!settings.showFloatingBar) return;
    const tryMount = (attempt = 0): void => {
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
        return;
      }
      if (attempt < 30) setTimeout(() => tryMount(attempt + 1), 400);
    };
    tryMount();
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

  const origPush = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<typeof origPush>): void => {
    origPush(...args);
    void attachForRoute();
  }) as typeof history.pushState;
  window.addEventListener('popstate', () => void attachForRoute());

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
