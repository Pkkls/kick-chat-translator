import { defaultSettings, loadSettings, saveSettings, watchSettings, type Settings } from '~/shared/settings';
import { onMessage, type RuntimeResponse } from '~/shared/messages';
import { rootLogger } from '~/shared/logger';
import { TranslationCache } from './cache';
import { ConcurrencyQueue, TokenBucket } from './queue';
import { StatsTracker } from './stats';
import { getProviderStatus, translateWithFallback } from './translator';
import { installKeepalive } from './keepalive';
import type { ProviderId, TranslationOutcome, TranslationRequest } from '~/shared/types';

const log = rootLogger.child('sw');

let settings: Settings = defaultSettings();
const cache = new TranslationCache(settings.cacheMaxEntries, settings.cacheTtlHours * 3_600_000);
const queue = new ConcurrencyQueue(settings.concurrency);
const stats = new StatsTracker();
const channelBuckets = new Map<string, TokenBucket>();

function bucketFor(channel: string): TokenBucket {
  let b = channelBuckets.get(channel);
  if (!b) {
    b = new TokenBucket(settings.perChannelBudgetPerMin, settings.perChannelBudgetPerMin);
    channelBuckets.set(channel, b);
  }
  return b;
}

function applySettings(next: Settings): void {
  settings = next;
  cache.setConfig(next.cacheMaxEntries, next.cacheTtlHours * 3_600_000);
  queue.setLimit(next.concurrency);
  for (const b of channelBuckets.values()) {
    b.setRate(next.perChannelBudgetPerMin, next.perChannelBudgetPerMin);
  }
  rootLogger.setEnabled(next.debug);
}

async function handleTranslate(req: TranslationRequest): Promise<TranslationOutcome> {
  if (!settings.enabled) {
    return { ok: false, error: { code: 'disabled', message: 'Extension disabled' } };
  }

  const cached = await cache.get(req.text, req.targetLang);
  if (cached) {
    const provider = cached.provider as ProviderId;
    stats.recordRequest(provider, cached.detectedLang, req.text.length, true);
    return {
      ok: true,
      result: {
        messageId: req.messageId,
        translatedText: cached.translatedText,
        detectedLang: cached.detectedLang,
        provider,
        cached: true,
      },
    };
  }

  if (req.channel && !bucketFor(req.channel).tryTake()) {
    return { ok: false, error: { code: 'channel_budget', message: 'Channel budget exhausted' } };
  }

  const outcome = await queue.add(() => translateWithFallback(req, settings));
  if (outcome.ok) {
    await cache.set(req.text, req.targetLang, {
      translatedText: outcome.result.translatedText,
      detectedLang: outcome.result.detectedLang,
      provider: outcome.result.provider,
    });
    stats.recordRequest(
      outcome.result.provider,
      outcome.result.detectedLang,
      req.text.length,
      false,
    );
  } else {
    stats.recordError();
  }
  return outcome;
}

async function init(): Promise<void> {
  settings = await loadSettings();
  applySettings(settings);
  await stats.load();
  await cache.warm();
  log.info('Service worker initialized');
  installKeepalive();
}

void init();

watchSettings(applySettings);

onMessage(async (msg): Promise<RuntimeResponse | void> => {
  switch (msg.type) {
    case 'translate': {
      const outcome = await handleTranslate(msg.payload);
      return { type: 'translate.result', payload: outcome };
    }
    case 'settings.get':
      return { type: 'settings', payload: settings };
    case 'settings.set': {
      const next = await saveSettings(msg.payload);
      applySettings(next);
      return { type: 'settings', payload: next };
    }
    case 'stats.get':
      return { type: 'stats', payload: stats.current() };
    case 'stats.reset': {
      const fresh = await stats.reset();
      return { type: 'stats', payload: fresh };
    }
    case 'providers.status':
      return { type: 'providers', payload: getProviderStatus(settings) };
    case 'cache.clear':
      await cache.clear();
      return { type: 'ack' };
    case 'ping':
      return { type: 'ack' };
    default:
      return undefined;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  log.info('Installed / updated');
  void init();
});
