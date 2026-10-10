import { GOOGLE_CLIENTS, GOOGLE_MULTI_ENDPOINT, PROVIDER_ENDPOINTS } from '~/shared/constants';
import { ConcurrencyQueue } from '../queue';
import { createMetrics } from '~/shared/metrics';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

// Undocumented Google web endpoint — no API key, used by translate.google.com.
// Soft-bans per IP after bursts: returns HTTP 200 with EMPTY/`und` data instead
// of 429. We must treat that empty payload as a rate-limit so the dispatcher
// backs off, otherwise it would silently produce garbage forever.

const metrics = createMetrics('sw');

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

/**
 * Batch: one request, one entry per line, and Google translates and detects
 * each entry on its own.
 *
 * This used to join the lines with \n into one text, and Google detects ONE
 * source for a text. Measured on the free endpoint with the chat corpora, one
 * batch per reader language for all 42 targets, six English lines and two
 * foreign ones each: 5 of 84 foreign lines came back right, 41 untouched (the
 * content script drops those) and 38 garbled and shown as a translation, such
 * as Hebrew "same thing again" rendered in Dutch as "I think it is fine".
 * Splitting the batch by language fixed that at 215 requests for the 42
 * batches. `translate_a/t` takes the lines as repeated `q` fields and answers
 * `[translation, detected]` per line (a bare translation when `sl` is given),
 * so the lines stay apart inside one request: replayed on the same batches,
 * 84 of 84 foreign lines and 252 of 252 English
 * lines matched their translation alone, Google's per-line detection was right
 * on 182 of 184, in 42 requests, one per batch, as before the split.
 *
 * A looked-up source is sent as `sl` only when every line shares it.
 */
async function batchCall(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]> {
  if (reqs.length <= 1) {
    const r = await call(reqs[0]!, ctx);
    return [r];
  }
  return multiCall(reqs, ctx);
}

/** Thrown when the reply does not line up with the request, never seen by the chain. */
class ShapeError extends Error {}

async function multiWithClient(reqs: TranslationRequest[], client: string, signal?: AbortSignal): Promise<ProviderResult[]> {
  const first = reqs[0]!;
  // A source is announced only when every line has the same looked-up one.
  const hints = new Set(reqs.map((r) => r.sourceLangHint));
  const sl = hints.size === 1 ? first.sourceLangHint : undefined;
  const url = new URL(GOOGLE_MULTI_ENDPOINT);
  url.searchParams.set('client', client);
  url.searchParams.set('sl', sl ? googleLangCode(sl) : 'auto');
  url.searchParams.set('tl', googleLangCode(first.targetLang));
  // POST: forty lines of non-Latin chat percent-encode past what a URL carries.
  const body = new URLSearchParams();
  for (const r of reqs) body.append('q', r.text);

  let res: Response;
  try {
    res = await fetch(url.toString(), { method: 'POST', body, signal, credentials: 'omit' });
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
  if (!Array.isArray(data) || data.length === 0) {
    throw new ProviderError('google', 'rate_limit', 'Google: unexpected payload (soft block)');
  }
  if (data.length !== reqs.length) throw new ShapeError(`${data.length} answers for ${reqs.length} lines`);
  const out = data.map((entry: unknown, i): ProviderResult => {
    const pair = Array.isArray(entry) ? entry : [entry];
    if (typeof pair[0] !== 'string') throw new ShapeError(`entry ${i} is not a translation`);
    // A looked-up language beats Google's guess for the badge: Persian is
    // looked up from its letters, and Google may still call it Arabic.
    const detected = reqs[i]!.sourceLangHint ?? (typeof pair[1] === 'string' ? pair[1] : 'auto');
    return { translatedText: pair[0], detectedLang: detected };
  });
  if (out.every((r) => !r.translatedText.trim())) {
    throw new ProviderError('google', 'rate_limit', 'Google: blank translations (soft block)');
  }
  return out;
}

/** One request for a group of lines, with the client rotation `call` uses. */
async function multiCall(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]> {
  if (reqs.length === 1) return [await call(reqs[0]!, ctx)];
  let out: ProviderResult[];
  try {
    const primary = nextClient();
    try {
      out = await multiWithClient(reqs, primary, ctx.signal);
    } catch (err: unknown) {
      const fallback = GOOGLE_CLIENTS.find((c) => c !== primary) ?? primary;
      if (!(err instanceof ProviderError && err.code === 'rate_limit') || fallback === primary) throw err;
      out = await multiWithClient(reqs, fallback, ctx.signal);
    }
  } catch (err: unknown) {
    if (!(err instanceof ShapeError)) throw err;
    // How often this path is taken at all decides whether it deserves to exist.
    if (__KT_METRICS__) {
      metrics.count('google.batch.fallback');
      metrics.timing('google.batch.fallback.items', reqs.length);
    }
    return perLine(reqs, reqs.map((_, i) => i), ctx, []);
  }
  // A blank line among answered ones is asked again alone rather than shown blank.
  const blank = out.flatMap((r, i) => (r.translatedText.trim() ? [] : [i]));
  return blank.length > 0 ? perLine(reqs, blank, ctx, out) : out;
}

/**
 * Per-line calls, capped on the user's own concurrency.
 *
 * The cap matters: this was once `for (const r of reqs) await call(r)`, forty
 * round trips end to end, measured at 40 requests at a peak concurrency of 1.
 * Indexed writes, not pushes, or completion order would hand each translation
 * to the wrong chat line.
 */
async function perLine(
  reqs: TranslationRequest[],
  which: number[],
  ctx: ProviderContext,
  base: ProviderResult[],
): Promise<ProviderResult[]> {
  const results = [...base];
  const pool = new ConcurrencyQueue(Math.max(1, ctx.concurrency || 1));
  await Promise.all(
    which.map((i) =>
      pool.add(async () => {
        results[i] = await call(reqs[i]!, ctx);
      }),
    ),
  );
  return results;
}

export const googleProvider: TranslationProvider = {
  id: 'google',
  requiresKey: false,
  supportsBatch: true,
  isConfigured: () => true,
  translate: call,
  translateBatch: batchCall,
};
