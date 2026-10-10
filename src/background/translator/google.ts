import { GOOGLE_CLIENTS, PROVIDER_ENDPOINTS } from '~/shared/constants';
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
 * Batch: lines that share a source language travel together, joined with \n.
 *
 * Joining is only safe within one language. Google detects ONE source for the
 * whole joined text and translates every line from it. Measured on the free
 * endpoint with the chat corpora, one batch per reader language for all 42
 * targets, six English lines and two foreign ones each: the foreign lines came
 * back untouched, which the content script drops, or worse, garbled and shown
 * as a translation. Polish read as Portuguese "moje łącze é uma piada fatal",
 * Danish spelled out in hanzi, Hebrew "same thing again" rendered in Dutch as
 * "I think it is fine". The same lines sent alone were all translated right.
 *
 * So a line joins a request only with lines of the same looked-up source
 * (sent as `sl`), or failing that of the same guessed one (sent as auto: the
 * guess only decides who travels together). A line with neither goes alone.
 * In a joined group without `sl`, a line that comes back unchanged is asked
 * again on its own, for the guess that put it there may have been wrong.
 *
 * Replayed on the same 42 batches against the live endpoint, each foreign line
 * compared with its translation alone: right 5 of 84 before, 83 of 84 after,
 * none left untouched, and the 252 English lines unchanged at 247 matching.
 * The price is requests, and it is paid only where languages mix: 215 for
 * those 42 batches against 42. A chat in one language still forms one group.
 */
async function batchCall(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]> {
  if (reqs.length <= 1) {
    const r = await call(reqs[0]!, ctx);
    return [r];
  }
  const groups = new Map<string, number[]>();
  reqs.forEach((r, i) => {
    const key = r.sourceLangHint ? `sl:${r.sourceLangHint}` : r.langGuess ? `guess:${r.langGuess}` : `alone:${i}`;
    const g = groups.get(key);
    if (g) g.push(i);
    else groups.set(key, [i]);
  });
  const results = new Array<ProviderResult>(reqs.length);
  const pool = new ConcurrencyQueue(Math.max(1, ctx.concurrency || 1));
  const unchanged: number[] = [];
  await Promise.all(
    [...groups.entries()].map(([key, idx]) =>
      pool.add(async () => {
        const out = await joinedCall(idx.map((i) => reqs[i]!), ctx);
        const guessed = key.startsWith('guess:') && idx.length > 1;
        idx.forEach((i, k) => {
          results[i] = out[k]!;
          if (guessed && sameText(out[k]!.translatedText, reqs[i]!.text)) unchanged.push(i);
        });
      }),
    ),
  );
  if (__KT_METRICS__ && unchanged.length > 0) metrics.count('google.batch.unchanged', unchanged.length);
  // Asked again on its own, the line gets its own detection too. A failed
  // second ask keeps the first answer rather than failing the lines that were
  // translated, which would send the whole batch down the chain again.
  await Promise.all(
    unchanged.map((i) =>
      pool.add(async () => {
        try {
          results[i] = await call(reqs[i]!, ctx);
        } catch {
          // keep the batch answer
        }
      }),
    ),
  );
  return results;
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** One request for lines that share a source language, split back per line. */
async function joinedCall(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]> {
  if (reqs.length === 1) return [await call(reqs[0]!, ctx)];
  const joined = reqs.map((r) => r.text).join('\n');
  // Every line of a group carries the same hint, or none: the group was made
  // on it. A batch used to inherit the hint of its FIRST message and send a
  // Japanese and an Arabic line together with `sl=ja`.
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
    // How often this path is taken at all. Bounding its cost was worth doing
    // whatever the frequency; knowing the frequency is what decides whether the
    // join-and-split scheme should survive.
    if (__KT_METRICS__) {
      metrics.count('google.batch.fallback');
      metrics.timing('google.batch.fallback.items', reqs.length);
    }
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
