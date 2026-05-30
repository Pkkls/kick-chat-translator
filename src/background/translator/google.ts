import { GOOGLE_CLIENTS, PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

// Undocumented Google web endpoint — no API key, used by translate.google.com.
// Soft-bans per IP after bursts: returns HTTP 200 with EMPTY/`und` data instead
// of 429. We must treat that empty payload as a rate-limit so the dispatcher
// backs off, otherwise it would silently produce garbage forever.

let clientIdx = 0;
function nextClient(): string {
  const c = GOOGLE_CLIENTS[clientIdx % GOOGLE_CLIENTS.length] ?? 'gtx';
  clientIdx += 1;
  return c;
}

async function tryWithClient(req: TranslationRequest, client: string, signal?: AbortSignal): Promise<ProviderResult> {
  const url = new URL(PROVIDER_ENDPOINTS.google);
  url.searchParams.set('client', client);
  url.searchParams.set('sl', req.sourceLangHint ?? 'auto');
  url.searchParams.set('tl', req.targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', req.text);

  let res: Response;
  try {
    res = await fetch(url.toString(), { method: 'GET', signal, credentials: 'omit' });
  } catch (err: unknown) {
    throw new ProviderError('google', 'network', err instanceof Error ? err.message : 'fetch failed');
  }

  if (res.status === 429) throw new ProviderError('google', 'rate_limit', 'Google rate-limited');
  if (!res.ok) throw new ProviderError('google', `http_${res.status}`, `Google HTTP ${res.status}`);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ProviderError('google', 'rate_limit', 'Google: non-JSON (soft block)');
  }

  if (!Array.isArray(data)) {
    throw new ProviderError('google', 'rate_limit', 'Google: unexpected payload (soft block)');
  }

  const segments = data[0];
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new ProviderError('google', 'rate_limit', 'Google: empty segments (soft block)');
  }

  const translated = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('');

  if (!translated.trim()) {
    throw new ProviderError('google', 'rate_limit', 'Google: blank translation (soft block)');
  }

  const detected = typeof data[2] === 'string' ? data[2] : 'auto';
  return { translatedText: translated, detectedLang: detected };
}

// Smart client rotation: on rate-limit, immediately retry with the alternate
// client instead of failing the whole request. Doubles effective free capacity.
async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const primary = nextClient();
  try {
    return await tryWithClient(req, primary, ctx.signal);
  } catch (err: unknown) {
    if (err instanceof ProviderError && err.code === 'rate_limit') {
      // Try the other client before giving up.
      const fallback = GOOGLE_CLIENTS.find((c) => c !== primary) ?? primary;
      if (fallback !== primary) return tryWithClient(req, fallback, ctx.signal);
    }
    throw err;
  }
}

export const googleProvider: TranslationProvider = {
  id: 'google',
  requiresKey: false,
  supportsBatch: false,
  isConfigured: () => true,
  translate: call,
};
