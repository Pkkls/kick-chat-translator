import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleProvider } from './google';
import { ProviderError } from './types';

describe('googleProvider', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses the gtx response and returns translated text + detected lang', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify([[['Hello', 'こんにちは', null, null, 1]], null, 'ja']), {
        status: 200,
      }),
    ) as unknown as typeof fetch;

    const res = await googleProvider.translate(
      { messageId: '1', text: 'こんにちは', targetLang: 'en' },
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 },
    );

    expect(res.translatedText).toBe('Hello');
    expect(res.detectedLang).toBe('ja');
  });

  it('throws ProviderError on rate-limit', async () => {
    globalThis.fetch = vi.fn(async () => new Response('', { status: 429 })) as unknown as typeof fetch;
    await expect(
      googleProvider.translate(
        { messageId: '1', text: 'x', targetLang: 'en' },
        { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 },
      ),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});

const ctx = { deeplApiKey: '', deeplPlan: 'free' as const, deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 };

interface Seen {
  method: string;
  path: string;
  sl: string | null;
  q: string[];
}

/**
 * Answers both endpoints like Google does: `single` with its nested segments,
 * `t` with `[translation, detected]` per line, or a bare translation per line
 * when `sl` is given. `answer` decides the multi reply, line by line.
 */
function fakeGoogle(seen: Seen[], answer?: (q: string[], sl: string | null) => unknown) {
  globalThis.fetch = vi.fn(async (url: unknown, init?: RequestInit) => {
    const u = new URL(String(url));
    const sl = u.searchParams.get('sl');
    if (u.pathname.endsWith('/single')) {
      const q = u.searchParams.get('q') ?? '';
      seen.push({ method: 'GET', path: 'single', sl, q: [q] });
      return new Response(JSON.stringify([[[`T:${q}`, q, null, null, 1]], null, 'xx']), { status: 200 });
    }
    const q = (init?.body as URLSearchParams).getAll('q');
    seen.push({ method: init?.method ?? 'GET', path: 't', sl, q });
    const body = answer ? answer(q, sl) : q.map((l) => (sl === 'auto' ? [`T:${l}`, `d:${l.slice(0, 2)}`] : `T:${l}`));
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
}

const req = (id: string, text: string, sourceLangHint?: string) => ({ messageId: id, text, targetLang: 'fr', sourceLangHint });

/**
 * A batch used to be one text joined with newlines, and Google detects ONE
 * source for a text: measured on the free endpoint, 41 of 84 foreign lines in
 * mixed batches came back untouched and 38 garbled. translate_a/t takes each
 * line as its own `q` and detects each one; replayed on the same batches, 84 of
 * 84 matched their translation alone, in one request per batch.
 */
describe('googleProvider batch', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends the lines as separate fields of one POST and reads each answer back', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen);
    const out = await googleProvider.translateBatch!([req('1', 'so close'), req('2', 'moje lacze'), req('3', 'que golazo')], ctx);
    expect(seen).toEqual([{ method: 'POST', path: 't', sl: 'auto', q: ['so close', 'moje lacze', 'que golazo'] }]);
    expect(out.map((r) => r.translatedText)).toEqual(['T:so close', 'T:moje lacze', 'T:que golazo']);
    expect(out.map((r) => r.detectedLang)).toEqual(['d:so', 'd:mo', 'd:qu']);
  });

  it('announces a source only when every line has the same looked-up one', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen);
    await googleProvider.translateBatch!([req('1', 'konbanwa', 'ja'), req('2', 'masa alkhayr', 'ar')], ctx);
    const out = await googleProvider.translateBatch!([req('1', 'buenas', 'es'), req('2', 'hasta luego', 'es')], ctx);
    expect(seen.map((s) => s.sl)).toEqual(['auto', 'es']);
    // With `sl` Google answers bare strings, and the hint is the language.
    expect(out.map((r) => [r.translatedText, r.detectedLang])).toEqual([['T:buenas', 'es'], ['T:hasta luego', 'es']]);
  });

  it('prefers a looked-up language over Google\'s detection for the badge', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen, (q) => q.map((l) => [`T:${l}`, 'ar']));
    const out = await googleProvider.translateBatch!([req('1', 'سلام چطوری', 'fa'), req('2', 'hello')], ctx);
    expect(out.map((r) => r.detectedLang)).toEqual(['fa', 'ar']);
  });

  it('asks a line again alone when its answer comes back blank', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen, (q) => q.map((l, i) => [i === 1 ? '' : `T:${l}`, 'en']));
    const out = await googleProvider.translateBatch!([req('1', 'one'), req('2', 'two'), req('3', 'three')], ctx);
    expect(seen.map((s) => s.path)).toEqual(['t', 'single']);
    expect(out.map((r) => r.translatedText)).toEqual(['T:one', 'T:two', 'T:three']);
  });

  it('treats an empty reply as a soft block, like the single endpoint', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen, () => []);
    await expect(googleProvider.translateBatch!([req('1', 'a'), req('2', 'b')], ctx)).rejects.toMatchObject({ code: 'rate_limit' });
  });
});

/**
 * When the reply does not line up with the lines sent, nothing is handed out
 * by position: each line is asked alone. That fallback was once serial, forty
 * round trips end to end, measured at a peak concurrency of 1.
 */
describe('googleProvider per-message fallback', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function countingFetch() {
    let inFlight = 0;
    const seen = { requests: 0, peak: 0 };
    globalThis.fetch = vi.fn(async (url: unknown) => {
      seen.requests += 1;
      inFlight += 1;
      seen.peak = Math.max(seen.peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      const u = new URL(String(url));
      if (u.pathname.endsWith('/t')) return new Response(JSON.stringify([['une seule ligne', 'es']]), { status: 200 });
      return new Response(JSON.stringify([[['ok', 'x', null, null, 1]], null, 'es']), { status: 200 });
    }) as unknown as typeof fetch;
    return seen;
  }

  it('does not translate the messages one after another', async () => {
    const N = 40;
    const seen = countingFetch();
    const reqs = Array.from({ length: N }, (_, i) => ({ messageId: String(i), text: `mensaje ${i}`, targetLang: 'en' }));
    const out = await googleProvider.translateBatch!(reqs, ctx);
    expect(out).toHaveLength(N);
    expect(seen.requests, 'the per-message fallback never ran').toBeGreaterThan(N);
    expect(seen.peak, 'the fallback is still serial').toBeGreaterThan(1);
    expect(seen.peak, 'the fallback is unbounded').toBeLessThanOrEqual(4);
  });

  it('still answers in the order it was asked', async () => {
    countingFetch();
    const reqs = Array.from({ length: 6 }, (_, i) => ({ messageId: String(i), text: `mensaje ${i}`, targetLang: 'en' }));
    const out = await googleProvider.translateBatch!(reqs, ctx);
    expect(out).toHaveLength(6);
    for (const r of out) expect(r.translatedText).toBe('ok');
  });
});

describe('googleProvider language codes', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // Le cantonais est le premier code que GOOGLE_CODES ne touche pas et qui
  // n'est pas non plus un code a deux lettres : il passe tel quel, et c'est la
  // seule chose a verifier. Mesure directe sur l'endpoint gratuit, sl=yue et
  // tl=yue repondent tous les deux, et tl=yue rend 唔, un mot que zh-TW ne
  // produit jamais. Sans ce test, une entree ajoutee par erreur dans
  // GOOGLE_CODES casserait la langue sans que rien ne le dise.
  it('passe yue tel quel, sans le confondre avec une variante du chinois', async () => {
    const seen: Seen[] = [];
    fakeGoogle(seen);
    await googleProvider.translate(
      { messageId: '1', text: '佢哋去咗邊度呀', targetLang: 'en', sourceLangHint: 'yue' },
      {} as never,
    );
    expect(seen.map((x) => x.sl)).toEqual(['yue']);
  });
});
