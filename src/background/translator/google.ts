import { GOOGLE_CLIENTS, PROVIDER_ENDPOINTS } from '~/shared/constants';
import { ConcurrencyQueue } from '../queue';
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

// Google's web endpoint wants regional tags for Chinese; base codes elsewhere.
const GOOGLE_CODES: Record<string, string> = { zh: 'zh-CN', 'zh-tw': 'zh-TW', 'pt-br': 'pt' };
function googleLangCode(code: string): string {
  return GOOGLE_CODES[code.toLowerCase()] ?? code.toLowerCase();
}

async function tryWithClient(req: TranslationRequest, client: string, signal?: AbortSignal): Promise<ProviderResult> {
  const url = new URL(PROVIDER_ENDPOINTS.google);
  url.searchParams.set('client', client);
  url.searchParams.set('sl', req.sourceLangHint ? googleLangCode(req.sourceLangHint) : 'auto');
  url.searchParams.set('tl', googleLangCode(req.targetLang));
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

// Batch: join texts with \n, Google preserves newlines in output.
async function batchCall(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]> {
  if (reqs.length <= 1) {
    const r = await call(reqs[0]!, ctx);
    return [r];
  }
  const joined = reqs.map((r) => r.text).join('\n');
  const fakeReq: TranslationRequest = { ...reqs[0]!, text: joined };
  const result = await call(fakeReq, ctx);
  const lines = result.translatedText.split('\n');
  // If Google merged/split lines differently, fall back to per-item.
  //
  // This was `for (const r of reqs) results.push(await call(r, ctx))`: forty
  // messages meant forty round trips end to end, each waiting on the one
  // before, while the concurrency the user set sat unused. Measured on the
  // fallback path: 40 requests at a peak concurrency of 1.
  //
  // Capped rather than unleashed, and capped on the user's own number. The
  // endpoint soft-bans per IP by answering 200 with an empty payload, so the
  // fallback firing is already a bad moment to start shouting: the worst case
  // here stays at the ceiling the dispatcher uses for its own per-item path,
  // which is a budget this codebase has been living inside all along.
  if (lines.length !== reqs.length) {
    const pool = new ConcurrencyQueue(Math.max(1, ctx.concurrency));
    // Indexed writes, not pushes. Completion order under concurrency is not
    // request order, and the dispatcher aligns results to requests by position:
    // a push would hand every translation to the wrong chat line.
    const results = new Array<ProviderResult>(reqs.length);
    await Promise.all(
      reqs.map((r, i) =>
        pool.add(async () => {
          results[i] = await call(r, ctx);
        }),
      ),
    );
    return results;
  }
  return lines.map((line) => ({
    translatedText: line,
    detectedLang: result.detectedLang,
  }));
}

export const googleProvider: TranslationProvider = {
  id: 'google',
  requiresKey: false,
  supportsBatch: true,
  isConfigured: () => true,
  translate: call,
  translateBatch: batchCall,
};
