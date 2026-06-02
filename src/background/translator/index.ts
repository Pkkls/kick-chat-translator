import type { ProviderStatus, TranslationOutcome, TranslationRequest } from '~/shared/types';
import type { CloudProviderId, Settings } from '~/shared/settings';
import { rootLogger } from '~/shared/logger';
import { decodeHtmlEntities } from '~/shared/decode';
import { ConcurrencyQueue } from '../queue';
import { googleProvider } from './google';
import { deeplProvider } from './deepl';
import { myMemoryProvider } from './mymemory';
import { lingvaProvider } from './lingva';
import { ProviderError, type ProviderContext, type TranslationProvider } from './types';

const log = rootLogger.child('translator');

// On-device ('local') runs in the content script (localEngine.ts) — the SW chain
// is cloud-only.
const PROVIDERS: Record<CloudProviderId, TranslationProvider> = {
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

const health: Record<CloudProviderId, ProviderHealth> = {
  google: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  deepl: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  mymemory: { consecutiveFailures: 0, cooldownUntilMs: 0 },
  lingva: { consecutiveFailures: 0, cooldownUntilMs: 0 },
};

function buildContext(settings: Settings, signal?: AbortSignal): ProviderContext {
  return {
    deeplApiKey: settings.deeplApiKey,
    deeplPlan: settings.deeplPlan,
    deeplBudgetPct: settings.deeplBudgetPct,
    lingvaInstance: settings.lingvaInstance,
    myMemoryEmail: settings.myMemoryEmail,
    signal,
  };
}

function markFailure(id: CloudProviderId, code: string, message: string): void {
  // 'unsupported' = the provider can't translate to this target — not a health
  // problem. Skip it for this request without cooling the provider down.
  if (code === 'unsupported') return;
  const h = health[id];
  h.lastError = message;
  h.lastErrorMs = Date.now();
  h.consecutiveFailures += 1;
  const cf = h.consecutiveFailures;
  let backoffMs: number;
  if (code === 'rate_limit') {
    // Transient throttle — recover fast (seconds), never black out for minutes.
    backoffMs = Math.min(10_000, 1500 * 2 ** (cf - 1));
  } else if (code === 'quota' || code === 'auth' || code === 'no_key') {
    // Configuration / monthly-quota problems won't fix themselves soon.
    backoffMs = 5 * 60_000;
  } else {
    // Network / unknown — moderate exponential, capped at 1 min.
    backoffMs = Math.min(60_000, 2000 * 2 ** (cf - 1));
  }
  h.cooldownUntilMs = Date.now() + backoffMs;
}

function markSuccess(id: CloudProviderId): void {
  const h = health[id];
  h.consecutiveFailures = 0;
  h.cooldownUntilMs = 0;
  h.lastError = undefined;
  h.lastUsedMs = Date.now();
  stickyProvider = id;
}

function ok(req: TranslationRequest, id: CloudProviderId, translatedText: string, detectedLang: string): TranslationOutcome {
  return {
    ok: true,
    result: {
      messageId: req.messageId,
      translatedText: decodeHtmlEntities(translatedText),
      detectedLang: detectedLang.toLowerCase(),
      provider: id,
      cached: false,
    },
  };
}

// DeepL budget pacing: the SW sets this from the usage cache so the translator
// can skip DeepL when the user's monthly budget % is reached.
let deeplUsagePct = 0;
export function setDeeplUsagePct(pct: number): void {
  deeplUsagePct = pct;
}

function isDeeplBudgetExhausted(ctx: ProviderContext): boolean {
  if (ctx.deeplBudgetPct <= 0) return false; // 0 = no limit
  return deeplUsagePct >= ctx.deeplBudgetPct;
}

// Provider sticky: prefer the last provider that succeeded to avoid unnecessary
// switching (and toast spam). Only overridden when that provider enters cooldown.
let stickyProvider: CloudProviderId | undefined;

function eligibleOrder(settings: Settings, ctx: ProviderContext): CloudProviderId[] {
  const live = settings.providerOrder.filter((id) => {
    const provider = PROVIDERS[id];
    if (!provider) return false;
    if (provider.requiresKey && !provider.isConfigured(ctx)) return false;
    if (health[id].cooldownUntilMs > Date.now()) return false;
    if (id === 'deepl' && isDeeplBudgetExhausted(ctx)) return false;
    return true;
  });
  if (live.length === 0) {
    // Everyone cooling down: try the one recovering soonest (still respects config).
    return [...settings.providerOrder]
      .filter((id) => {
        const p = PROVIDERS[id];
        if (!p || (p.requiresKey && !p.isConfigured(ctx))) return false;
        if (id === 'deepl' && isDeeplBudgetExhausted(ctx)) return false;
        return true;
      })
      .sort((a, b) => health[a].cooldownUntilMs - health[b].cooldownUntilMs);
  }
  // Sticky: if the last successful provider is still live, put it first.
  if (stickyProvider && live.includes(stickyProvider) && live[0] !== stickyProvider) {
    return [stickyProvider, ...live.filter((id) => id !== stickyProvider)];
  }
  return live;
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
        markFailure(id, lastError.code, lastError.message);
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
    else if (anyFail) markFailure(id, lastError?.code ?? 'unknown', lastError?.message ?? 'failed');
  }

  return reqs.map((req, i) => results[i] ?? failOutcome(req, lastError));
}

function asProviderError(id: CloudProviderId, err: unknown): ProviderError {
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
  const now = Date.now();
  return settings.providerOrder.map((id) => {
    const provider = PROVIDERS[id];
    const h = health[id];
    const configured = provider ? !provider.requiresKey || provider.isConfigured(ctx) : false;
    const budgetPaused = id === 'deepl' && isDeeplBudgetExhausted(ctx);
    const cooldownLeft = h.cooldownUntilMs > now ? Math.ceil((h.cooldownUntilMs - now) / 1000) : 0;
    return {
      id,
      available: Boolean(provider) && configured && h.cooldownUntilMs <= now && !budgetPaused,
      lastError: budgetPaused ? `Budget paused (${deeplUsagePct}% used)` : h.lastError,
      lastUsedMs: h.lastUsedMs,
      cooldownLeftSec: cooldownLeft,
    };
  });
}

export function anyProviderReady(settings: Settings): boolean {
  const ctx = buildContext(settings);
  return eligibleOrder(settings, ctx).length > 0;
}
