import type { ProviderId, ProviderStatus, TranslationOutcome, TranslationRequest } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { ConcurrencyQueue } from '../queue';
import { googleProvider } from './google';
import { deeplProvider } from './deepl';
import { myMemoryProvider } from './mymemory';
import { lingvaProvider } from './lingva';
import { localProvider } from './local';
import { ProviderError, type ProviderContext, type TranslationProvider } from './types';

const log = rootLogger.child('translator');

const PROVIDERS: Record<ProviderId, TranslationProvider> = {
  local: localProvider,
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
  local: { consecutiveFailures: 0, cooldownUntilMs: 0 },
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

function ok(req: TranslationRequest, id: ProviderId, translatedText: string, detectedLang: string): TranslationOutcome {
  return {
    ok: true,
    result: {
      messageId: req.messageId,
      translatedText,
      detectedLang: detectedLang.toLowerCase(),
      provider: id,
      cached: false,
    },
  };
}

function eligibleOrder(settings: Settings, ctx: ProviderContext): ProviderId[] {
  const live = settings.providerOrder.filter((id) => {
    const provider = PROVIDERS[id];
    if (!provider) return false;
    if (provider.requiresKey && !provider.isConfigured(ctx)) return false;
    if (health[id].cooldownUntilMs > Date.now()) return false;
    return true;
  });
  if (live.length > 0) return live;
  // Everyone cooling down: try the one recovering soonest (still respects config).
  return [...settings.providerOrder]
    .filter((id) => {
      const p = PROVIDERS[id];
      return Boolean(p) && (!p!.requiresKey || p!.isConfigured(ctx));
    })
    .sort((a, b) => health[a].cooldownUntilMs - health[b].cooldownUntilMs);
}

/**
 * Translate a group of requests that share the same target language.
 * Returns outcomes aligned by index. Uses batch calls where the provider
 * supports it, otherwise per-item with a concurrency cap. Unresolved items
 * cascade to the next provider in the chain.
 */
export async function translateGroup(
  reqs: TranslationRequest[],
  settings: Settings,
  concurrency: number,
): Promise<TranslationOutcome[]> {
  const ctx = buildContext(settings);
  const results = new Array<TranslationOutcome | undefined>(reqs.length);
  const unresolved = new Set<number>(reqs.map((_, i) => i));
  let lastError: ProviderError | undefined;

  for (const id of eligibleOrder(settings, ctx)) {
    if (unresolved.size === 0) break;
    const provider = PROVIDERS[id];
    if (!provider) continue;
    const indices = [...unresolved];

    if (provider.supportsBatch && provider.translateBatch && indices.length > 1) {
      const batchReqs = indices.map((i) => reqs[i]!);
      try {
        const out = await provider.translateBatch(batchReqs, ctx);
        markSuccess(id);
        out.forEach((r, k) => {
          const idx = indices[k]!;
          results[idx] = ok(reqs[idx]!, id, r.translatedText, r.detectedLang);
          unresolved.delete(idx);
        });
        continue;
      } catch (err: unknown) {
        lastError = asProviderError(id, err);
        log.warn(`batch ${id} failed:`, lastError.code, lastError.message);
        markFailure(id, lastError.message);
        // fall through to next provider with the same unresolved set
        continue;
      }
    }

    // Per-item path with concurrency cap.
    const pool = new ConcurrencyQueue(Math.max(1, concurrency));
    let anySuccess = false;
    let anyFail = false;
    await Promise.all(
      indices.map((idx) =>
        pool.add(async () => {
          try {
            const r = await provider.translate(reqs[idx]!, ctx);
            if (!r.translatedText.trim()) throw new ProviderError(id, 'empty', 'empty');
            results[idx] = ok(reqs[idx]!, id, r.translatedText, r.detectedLang);
            unresolved.delete(idx);
            anySuccess = true;
          } catch (err: unknown) {
            lastError = asProviderError(id, err);
            anyFail = true;
          }
        }),
      ),
    );
    if (anySuccess) markSuccess(id);
    else if (anyFail) markFailure(id, lastError?.message ?? 'failed');
  }

  return reqs.map((req, i) => results[i] ?? failOutcome(req, lastError));
}

function asProviderError(id: ProviderId, err: unknown): ProviderError {
  return err instanceof ProviderError
    ? err
    : new ProviderError(id, 'unknown', err instanceof Error ? err.message : String(err));
}

function failOutcome(_req: TranslationRequest, lastError?: ProviderError): TranslationOutcome {
  return {
    ok: false,
    error: {
      code: lastError?.code ?? 'no_provider',
      message: lastError?.message ?? 'All providers failed',
      provider: lastError?.provider,
    },
  };
}

/** Single-request convenience wrapper. */
export async function translateWithFallback(
  req: TranslationRequest,
  settings: Settings,
): Promise<TranslationOutcome> {
  const [outcome] = await translateGroup([req], settings, 1);
  return outcome ?? failOutcome(req);
}

export function getProviderStatus(settings: Settings): ProviderStatus[] {
  const ctx = buildContext(settings);
  return settings.providerOrder.map((id) => {
    const provider = PROVIDERS[id];
    const h = health[id];
    const configured = provider ? !provider.requiresKey || provider.isConfigured(ctx) : false;
    return {
      id,
      available: Boolean(provider) && configured && h.cooldownUntilMs <= Date.now(),
      lastError: h.lastError,
      lastUsedMs: h.lastUsedMs,
    };
  });
}

export function anyProviderReady(settings: Settings): boolean {
  const ctx = buildContext(settings);
  return eligibleOrder(settings, ctx).length > 0;
}
