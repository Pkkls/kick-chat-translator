import { LINGVA_POOL, PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface LingvaResponse {
  translation: string;
  info?: { detectedSource?: string };
}

// Rotate through the public pool so one overloaded host (500s) doesn't kill the
// whole provider. A user-supplied instance always takes priority.
let poolIdx = 0;
function instancesFor(ctx: ProviderContext): string[] {
  if (ctx.lingvaInstance) return [ctx.lingvaInstance];
  const ordered = LINGVA_POOL.map((_, i) => LINGVA_POOL[(poolIdx + i) % LINGVA_POOL.length]!);
  poolIdx = (poolIdx + 1) % LINGVA_POOL.length;
  return ordered;
}

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const instances = instancesFor(ctx);
  const source = req.sourceLangHint ?? 'auto';
  let lastErr: ProviderError | undefined;

  for (const raw of instances) {
    const base = raw.replace(/\/+$/, '');
    const url = `${base}/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(req.targetLang)}/${encodeURIComponent(req.text)}`;
    try {
      const res = await fetch(url, { signal: ctx.signal, credentials: 'omit' });
      if (res.status === 429) throw new ProviderError('lingva', 'rate_limit', 'Lingva: rate-limited');
      if (!res.ok) throw new ProviderError('lingva', `http_${res.status}`, `Lingva HTTP ${res.status}`);
      const data = (await res.json()) as LingvaResponse;
      if (!data.translation) throw new ProviderError('lingva', 'empty', 'Lingva: empty');
      return { translatedText: data.translation, detectedLang: data.info?.detectedSource ?? 'auto' };
    } catch (err: unknown) {
      lastErr =
        err instanceof ProviderError
          ? err
          : new ProviderError('lingva', 'network', err instanceof Error ? err.message : 'fetch failed');
      // try next instance
    }
  }
  throw lastErr ?? new ProviderError('lingva', 'unknown', 'Lingva: all instances failed');
}

// Default endpoint kept for reference / single-instance users.
export const LINGVA_DEFAULT = PROVIDER_ENDPOINTS.lingvaDefault;

export const lingvaProvider: TranslationProvider = {
  id: 'lingva',
  requiresKey: false,
  supportsBatch: false,
  isConfigured: () => true,
  translate: call,
};
