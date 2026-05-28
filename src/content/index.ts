import { loadSettings, watchSettings, type Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { TranslationPipeline } from './pipeline';
import { ensureStyles } from './injector';
import { ChatObserver } from './observer';
import { KickPusherClient } from './pusher';
import { extractChannelSlug, fetchChatroomId } from './kickApi';

const log = rootLogger.child('content');

async function main(): Promise<void> {
  const settings = await loadSettings();
  rootLogger.setEnabled(settings.debug);

  ensureStyles();

  const pipeline = new TranslationPipeline(settings);
  let currentSettings: Settings = settings;
  let currentSlug: string | undefined;

  const observer = new ChatObserver((msg) => {
    void pipeline.onDomMessage({
      ...msg,
      channel: currentSlug ?? '',
      username: msg.usernameGuess ?? '',
      isBot: false,
    });
  });

  let pusher: KickPusherClient | undefined;
  if (currentSettings.connectionMode !== 'dom') {
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

  async function attachForRoute(): Promise<void> {
    const slug = extractChannelSlug(location.pathname);
    if (slug === currentSlug) return;
    currentSlug = slug;
    log.debug('route change, channel slug:', slug);

    if (!slug) {
      observer.stop();
      return;
    }

    observer.reset();
    observer.start();

    if (pusher && currentSettings.connectionMode !== 'dom') {
      const id = await fetchChatroomId(slug);
      if (id !== undefined) {
        log.debug('switching pusher chatroom to', id);
        pusher.switchChatroom(id);
      }
    }
  }

  // Initial attach
  if (currentSettings.enabled) {
    void attachForRoute();
  }

  // SPA navigation hook
  const origPush = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<typeof origPush>): void => {
    origPush(...args);
    void attachForRoute();
  }) as typeof history.pushState;
  window.addEventListener('popstate', () => void attachForRoute());

  watchSettings((next) => {
    const wasEnabled = currentSettings.enabled;
    currentSettings = next;
    pipeline.updateSettings(next);
    rootLogger.setEnabled(next.debug);

    if (next.enabled && !wasEnabled) {
      void attachForRoute();
    }
    if (!next.enabled && wasEnabled) {
      observer.stop();
      pusher?.stop();
    }
  });

  log.info('Content script ready');
}

void main().catch((err: unknown) => {
  console.error('[KickTranslator] init error', err);
});
