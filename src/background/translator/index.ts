import type { ProviderId, ProviderStatus, TranslationOutcome, TranslationRequest } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { googleProvider } from './google';
import { deeplProvider } from './deepl';
import { myMemoryProvider } from './mymemory';
import { lingvaProvider } from './lingva';
import { ProviderError, type ProviderContext, type TranslationProvider } from './types';

const log = rootLogger.child('translator');

const PROVIDERS: Record<ProviderId, TranslationProvider> = {
  google: googleProvider,
  deepl: deeplProvider,
  mymemory: myMemoryProvider,
  lingva: lingvaProvider,
};

interface ProviderHealth {
  lastError?: string;
  lastErrorMs?: number;
  lastUsedMs?: number;
  consecutiveFailures: number;
  cooldownUntilMs: number;
}

const health: Record<ProviderId, ProviderHealth> = {
  google: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  deepl: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  mymemory: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  lingva: { consecutiveFailures: 0, cooldownUntilMs: 0 },
};

function buildContext(settings: Settings, signal?: AbortSignal): ProviderContext {
  return {
    deeplApiKey: settings.deeplApiKey,
    deeplPlan: settings.deeplPlan,
    lingvaInstance: settings.lingvaInstance,
    signal,
  };
}

function markFailure(id: ProviderId, message: string): void {
  const h = health[id];
  h.lastError = message;
  h.lastErrorMs = Date.now();
  h.consecutiveFailures += 1;
  // Exponential cooldown, max 5 min
  const backoffMs = Math.min(5 * 60_000, 2000 * 2 ** (h.consecutiveFailures - 1));
  h.cooldownUntilMs = Date.now() + backoffMs;
}

function markSuccess(id: ProviderId): void {
  const h = health[id];
  h.consecutiveFailures = 0;
  h.cooldownUntilMs = 0;
  h.lastError = undefined;
  h.lastUsedMs = Date.now();
}

export interface TranslateOptions {
  signal?: AbortSignal;
}

export async function translateWithFallback(
  req: TranslationRequest,
  settings: Settings,
  opts: TranslateOptions = {},
): Promise<TranslationOutcome> {
  const ctx = buildContext(settings, opts.signal);
  const order = settings.providerOrder.filter((id) => {
    const provider = PROVIDERS[id];
    if (!provider) return false;
    if (provider.requiresKey && !provider.isConfigured(ctx)) return false;
    if (health[id].cooldownUntilMs > Date.now()) return false;
    return true;
  });

  // If everyone is on cooldown, try the one that will recover soonest
  const candidates: ProviderId[] = order.length > 0
    ? order
    : [...settings.providerOrder].sort(
        (a, b) => health[a].cooldownUntilMs - health[b].cooldownUntilMs,
      );

  let lastError: ProviderError | undefined;

  for (const id of candidates) {
    const provider = PROVIDERS[id];
    if (!provider) continue;
    try {
      const t0 = performance.now();
      const result = await provider.translate(req, ctx);
      log.debug(`translated via ${id} in ${(performance.now() - t0).toFixed(0)}ms`);
      markSuccess(id);
      return {
        ok: true,
        result: {
          messageId: req.messageId,
          translatedText: result.translatedText,
          detectedLang: result.detectedLang.toLowerCase(),
          provider: id,
          cached: false,
        },
      };
    } catch (err: unknown) {
      const pe =
        err instanceof ProviderError
          ? err
          : new ProviderError(id, 'unknown', err instanceof Error ? err.message : String(err));
      log.warn(`provider ${id} failed:`, pe.code, pe.message);
      markFailure(id, pe.message);
      lastError = pe;
    }
  }

  return {
    ok: false,
    error: {
      code: lastError?.code ?? 'no_provider',
      message: lastError?.message ?? 'All providers failed',
      provider: lastError?.provider,
    },
  };
}

export function getProviderStatus(settings: Settings): ProviderStatus[] {
  const ctx = buildContext(settings);
  return settings.providerOrder.map((id) => {
    const provider = PROVIDERS[id];
    const h = health[id];
    return {
      id,
      available: provider ? (!provider.requiresKey || provider.isConfigured(ctx)) && h.cooldownUntilMs <= Date.now() : false,
      lastError: h.lastError,
      lastUsedMs: h.lastUsedMs,
    };
  });
}
