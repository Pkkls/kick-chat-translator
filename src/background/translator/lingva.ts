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

// Lingva carries the message in the URL path, where percent-encoding inflates
// non-ASCII by up to 9x: a full-length CJK line reaches ~7 KB, and proxies in
// front of the public instances commonly cap the request line at 4 KB.
const MAX_ENCODED_TEXT = 4000;

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  // 'unsupported' is the code the chain cascades on without counting it against
  // the provider's health, which is what this is: Lingva is fine, this one
  // message just cannot be expressed as a URL.
  const encodedText = encodeURIComponent(req.text);
  if (encodedText.length > MAX_ENCODED_TEXT) {
    throw new ProviderError(
      'lingva',
      'unsupported',
      `Lingva: encoded text ${encodedText.length} > ${MAX_ENCODED_TEXT} bytes`,
    );
  }

  const instances = instancesFor(ctx);
  const source = req.sourceLangHint ?? 'auto';
  let lastErr: ProviderError | undefined;

  for (const raw of instances) {
    const base = raw.replace(/\/+$/, '');
    const url = `${base}/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(req.targetLang)}/${encodedText}`;
    try {
      const res = await fetch(url, { signal: ctx.signal, credentials: 'omit' });
      if (res.status === 429) throw new ProviderError('lingva', 'rate_limit', 'Lingva: rate-limited');
      // A language Lingva does not carry is not a broken instance, and must not
      // be counted as one: a 400 here would mark every instance in the pool
      // unhealthy in turn and take Lingva out of the chain for every other
      // language too. Measured: Lingva publishes 109 codes and Cantonese is not
      // among them, and `GET /api/v1/en/yue/hello` answers 400 with
      // {"error":"Invalid target language code."}. 'unsupported' is the code the
      // chain cascades on for free, same as the over-long URL above.
      if (res.status === 400) {
        const body = await res.text();
        if (/invalid (source|target) language code/i.test(body)) {
          throw new ProviderError('lingva', 'unsupported', `Lingva has no ${source} → ${req.targetLang}`);
        }
        throw new ProviderError('lingva', 'http_400', 'Lingva HTTP 400');
      }
      if (!res.ok) throw new ProviderError('lingva', `http_${res.status}`, `Lingva HTTP ${res.status}`);
      const data = (await res.json()) as LingvaResponse;
      if (!data.translation) throw new ProviderError('lingva', 'empty', 'Lingva: empty');
      return { translatedText: data.translation, detectedLang: data.info?.detectedSource ?? 'auto' };
    } catch (err: unknown) {
      // A missing language is missing on every instance in the pool, so trying
      // the rest is eight requests spent to learn the same thing.
      if (err instanceof ProviderError && err.code === 'unsupported') throw err;
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
