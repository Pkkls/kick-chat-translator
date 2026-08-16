import { defaultSettings, loadSettings, resetSettings, saveSettings, watchSettings, type Settings } from '~/shared/settings';
import { onMessage, type RuntimeResponse } from '~/shared/messages';
import { rootLogger } from '~/shared/logger';
import { createMetrics } from '~/shared/metrics';
import { TranslationCache, warmTargets } from './cache';
import { resolveTargetLang } from '~/shared/languages';
import { TokenBucket } from './queue';
import { StatsTracker } from './stats';
import { TranslationCoalescer } from './coalescer';
import { anyProviderReady, getProviderStatus, setDeeplUsagePct } from './translator';
import { installKeepalive } from './keepalive';
import { getUpdateStatus } from './updateChecker';
import { DEEPL_USAGE_FREE, DEEPL_USAGE_PRO, STORAGE_KEY_SETTINGS } from '~/shared/constants';
import type { ProviderId, TranslationOutcome, TranslationRequest } from '~/shared/types';

const log = rootLogger.child('sw');
const metrics = createMetrics('sw');

let settings: Settings = defaultSettings();
const cache = new TranslationCache(settings.cacheMaxEntries, settings.cacheTtlHours * 3_600_000);
const stats = new StatsTracker();
const channelBuckets = new Map<string, TokenBucket>();
const coalescer = new TranslationCoalescer({ getSettings: () => settings, cache, stats });

function bucketFor(channel: string): TokenBucket {
  let b = channelBuckets.get(channel);
  if (!b) {
    b = new TokenBucket(settings.perChannelBudgetPerMin, settings.perChannelBudgetPerMin);
    channelBuckets.set(channel, b);
  }
  return b;
}

function applySettings(next: Settings): void {
  // Auto-promote DeepL to #1 when a key is configured but DeepL is missing from the chain.
  if (next.deeplApiKey && !next.providerOrder.includes('deepl')) {
    next = { ...next, providerOrder: ['deepl', ...next.providerOrder] };
    void chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: next });
    log.info('DeepL key detected, auto-added to provider chain as #1');
  }
  settings = next;
  cache.setConfig(next.cacheMaxEntries, next.cacheTtlHours * 3_600_000);
  for (const b of channelBuckets.values()) {
    b.setRate(next.perChannelBudgetPerMin, next.perChannelBudgetPerMin);
  }
  rootLogger.setEnabled(next.debug);
}

async function handleTranslate(req: TranslationRequest): Promise<TranslationOutcome> {
  if (!settings.enabled) {
    return { ok: false, error: { code: 'disabled', message: 'Extension disabled' } };
  }

  // There used to be a same-language short-circuit here: with an English target,
  // any text more than 85% basic Latin was declared already English and never
  // sent to a provider. An ASCII ratio cannot tell English from any other language
  // written in the Latin alphabet, so it refused Spanish, Turkish, Finnish,
  // French and the rest, while Japanese and Korean went through untouched because
  // of their script. Measured on saved chat with an English target it dropped 66
  // of 76 Spanish lines, 40 of 51 Turkish, and 0 of 43 Korean.
  // Deciding what is already in the user's language belongs to the content script,
  // which runs a real detector and honours the ignoreEnglish setting before it
  // ever calls in here.

  if (!req.noCache) {
    // IndexedDB, on the path of every single line. A hit is the fastest possible
    // answer, but a miss still pays this before anything else starts, and the
    // measured hit rate is 10%.
    const cached = await metrics.measure('leg.cache.lookup', () => cache.get(req.text, req.targetLang));
    if (cached) {
      const provider = cached.provider as ProviderId;
      stats.recordRequest(provider, cached.detectedLang, req.text.length, true, req.channel);
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
  }

  if (req.channel && !bucketFor(req.channel).tryTake()) {
    return { ok: false, error: { code: 'channel_budget', message: 'Channel budget exhausted' } };
  }

  // Skip-silent: if every cloud provider is cooling down, fail fast (no queue buildup).
  if (!anyProviderReady(settings)) {
    return { ok: false, error: { code: 'saturated', message: 'No provider available' } };
  }

  return coalescer.submit(req);
}

interface DeeplUsage {
  configured: boolean;
  count: number;
  limit: number;
}
let deeplUsageCache: { at: number; value: DeeplUsage } | undefined;

async function fetchDeeplUsage(): Promise<DeeplUsage> {
  if (!settings.deeplApiKey) return { configured: false, count: 0, limit: 0 };
  // Throttle: DeepL counts usage calls lightly, but no need to hammer.
  if (deeplUsageCache && Date.now() - deeplUsageCache.at < 30_000) {
    return deeplUsageCache.value;
  }
  const url = settings.deeplPlan === 'pro' ? DEEPL_USAGE_PRO : DEEPL_USAGE_FREE;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `DeepL-Auth-Key ${settings.deeplApiKey}` },
    });
    if (!res.ok) return { configured: true, count: 0, limit: 0 };
    const j = (await res.json()) as { character_count?: number; character_limit?: number };
    const value: DeeplUsage = {
      configured: true,
      count: j.character_count ?? 0,
      limit: j.character_limit ?? 0,
    };
    deeplUsageCache = { at: Date.now(), value };
    // Feed the translator's budget pacing.
    if (value.limit > 0) setDeeplUsagePct(Math.round((value.count / value.limit) * 100));
    return value;
  } catch {
    return { configured: true, count: 0, limit: 0 };
  }
}

// Auto-refresh DeepL usage every 5 min so budget pacing reacts in near-real-time.
function scheduleDeeplUsageRefresh(): void {
  setInterval(() => {
    if (settings.deeplApiKey && settings.providerOrder.includes('deepl')) {
      void fetchDeeplUsage();
    }
  }, 5 * 60_000);
}

async function init(): Promise<void> {
  settings = await loadSettings();
  applySettings(settings);
  await stats.load();
  await cache.warm(200, warmTargets(resolveTargetLang(settings.targetLang), stats.current().byLang));
  log.info('Service worker initialized');
  installKeepalive();
  scheduleDeeplUsageRefresh();
  // Seed the budget pacing on startup.
  if (settings.deeplApiKey) void fetchDeeplUsage();
}

void init();
watchSettings(applySettings);

onMessage(async (msg): Promise<RuntimeResponse | void> => {
  switch (msg.type) {
    case 'translate': {
      // The worker's own share of the round trip. `leg.roundtrip` on the content
      // side covers the same request plus transport and, in MV3, whatever it cost
      // to wake this worker up. The difference between the two is that cost, and
      // nothing has ever put a number on it.
      const outcome = await metrics.measure('leg.sw.total', () => handleTranslate(msg.payload));
      return { type: 'translate.result', payload: outcome };
    }
    case 'stats.local':
      stats.recordRequest('local', msg.payload.lang, msg.payload.chars, false);
      return { type: 'ack' };
    case 'settings.get':
      return { type: 'settings', payload: settings };
    case 'settings.set': {
      const next = await saveSettings(msg.payload);
      applySettings(next);
      return { type: 'settings', payload: next };
    }
    case 'settings.reset': {
      const fresh = await resetSettings();
      applySettings(fresh);
      return { type: 'settings', payload: fresh };
    }
    case 'stats.get':
      return { type: 'stats', payload: stats.current() };
    case 'stats.reset': {
      const fresh = await stats.reset();
      return { type: 'stats', payload: fresh };
    }
    case 'providers.status':
      return { type: 'providers', payload: getProviderStatus(settings) };
    case 'deepl.usage':
      return { type: 'deepl.usage', payload: await fetchDeeplUsage() };
    case 'cache.clear':
      await cache.clear();
      return { type: 'ack' };
    case 'open.options':
      await chrome.runtime.openOptionsPage();
      return { type: 'ack' };
    case 'update.status':
      return { type: 'update.info', payload: await getUpdateStatus(msg.force) };
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
