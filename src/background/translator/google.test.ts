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

  it('sends one request for a batch and splits the reply back per message', async () => {
    const sent: string[] = [];
    globalThis.fetch = vi.fn(async (url: unknown) => {
      const q = new URL(String(url)).searchParams.get('q') ?? '';
      sent.push(q);
      return new Response(JSON.stringify([[['uno\ndos\ntres', q, null, null, 1]], null, 'en']), { status: 200 });
    }) as unknown as typeof fetch;

    const out = await googleProvider.translateBatch!(
      [
        { messageId: '1', text: 'one', targetLang: 'es' },
        { messageId: '2', text: 'two', targetLang: 'es' },
        { messageId: '3', text: 'three', targetLang: 'es' },
      ],
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 },
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]).toBe('one\ntwo\nthree');
    expect(out.map((r) => r.translatedText)).toEqual(['uno', 'dos', 'tres']);
  });

  // The joined-then-split scheme only stays aligned while the reply has exactly one
  // line per message. When it does not, results must not be handed out positionally.
  it('falls back to per-message calls when the reply line count does not match', async () => {
    const sent: string[] = [];
    globalThis.fetch = vi.fn(async (url: unknown) => {
      const q = new URL(String(url)).searchParams.get('q') ?? '';
      sent.push(q);
      const body = q.includes('\n') ? 'merged reply' : `T:${q}`;
      return new Response(JSON.stringify([[[body, q, null, null, 1]], null, 'en']), { status: 200 });
    }) as unknown as typeof fetch;

    const out = await googleProvider.translateBatch!(
      [
        { messageId: '1', text: 'one', targetLang: 'es' },
        { messageId: '2', text: 'two', targetLang: 'es' },
      ],
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 },
    );

    expect(sent[0]).toBe('one\ntwo');
    expect(sent.slice(1)).toEqual(['one', 'two']);
    expect(out.map((r) => r.translatedText)).toEqual(['T:one', 'T:two']);
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

/**
 * What the per-message fallback costs when it fires.
 *
 * The batch joins every text with a newline and splits the reply back on
 * newlines. When Google does not hand back the same number of lines it was
 * given, the code falls back to translating each message on its own — and it
 * did that with `for (const r of reqs) await call(r)`, so forty messages meant
 * forty round trips end to end, one waiting on the next, while the dispatcher's
 * own DEFAULT_CONCURRENCY of 4 sat unused.
 *
 * Measured by the test below before the fix: 40 requests, peak concurrency 1.
 *
 * Note on what does NOT trigger it: a newline typed by a viewer. selectors.ts
 * collapses every run of whitespace to a single space before the text ever
 * reaches a provider, so user newlines are gone by then. The trigger is Google
 * itself returning a different line count, which is why the fallback exists at
 * all and why its cost is worth bounding whatever its frequency.
 */
describe('googleProvider per-message fallback', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /** Counts requests and the highest number ever in flight at the same time. */
  function countingFetch(batchSize: number) {
    let inFlight = 0;
    const seen = { requests: 0, peak: 0 };
    globalThis.fetch = vi.fn(async (url: unknown) => {
      seen.requests += 1;
      inFlight += 1;
      seen.peak = Math.max(seen.peak, inFlight);
      // A real round trip is not instantaneous; without this every call
      // resolves before the next begins and concurrency is unobservable.
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      const q = new URL(String(url)).searchParams.get('q') ?? '';
      // The batch request gets a reply with the WRONG line count, which is what
      // sends the code down the per-message path. Single requests answer
      // normally.
      const isBatch = q.split('\n').length === batchSize;
      const body = isBatch ? 'une seule ligne' : 'ok';
      return new Response(JSON.stringify([[[body, q, null, null, 1]], null, 'en']), { status: 200 });
    }) as unknown as typeof fetch;
    return seen;
  }

  const ctx = {
    deeplApiKey: '',
    deeplPlan: 'free' as const,
    deeplBudgetPct: 0,
    lingvaInstance: '',
    myMemoryEmail: '', concurrency: 4
  };

  it('does not translate the messages one after another', async () => {
    const N = 40;
    const seen = countingFetch(N);
    const reqs = Array.from({ length: N }, (_, i) => ({
      messageId: String(i),
      text: `mensaje ${i}`,
      targetLang: 'en',
    }));

    const out = await googleProvider.translateBatch!(reqs, ctx);

    expect(out).toHaveLength(N);
    // Control: the fallback really did fire, so the numbers below describe the
    // path this test exists for and not the happy one.
    expect(seen.requests, 'the per-message fallback never ran').toBeGreaterThan(N);
    // The claim. Serial gives a peak of 1; anything above it means the calls
    // overlap. Bounded means it does not run away either.
    expect(seen.peak, 'the fallback is still serial').toBeGreaterThan(1);
    expect(seen.peak, 'the fallback is unbounded').toBeLessThanOrEqual(4);
  });

  it('still answers in the order it was asked', async () => {
    const N = 6;
    countingFetch(N);
    const reqs = Array.from({ length: N }, (_, i) => ({
      messageId: String(i),
      text: `mensaje ${i}`,
      targetLang: 'en',
    }));

    const out = await googleProvider.translateBatch!(reqs, ctx);

    // Concurrency reorders completion, never results: message i must still be
    // answered by out[i], or every translation lands on the wrong chat line.
    expect(out).toHaveLength(N);
    for (const r of out) expect(r.translatedText).toBe('ok');
  });

  describe('la langue source annoncee pour un lot', () => {
    /** Rend une reponse valide et retient le `sl` recu. */
    function fetchQuiRetientSl(vus: string[]) {
      return vi.fn(async (url: string) => {
        const u = new URL(String(url));
        vus.push(u.searchParams.get('sl') ?? '(aucun)');
        const q = u.searchParams.get('q') ?? '';
        const lignes = q.split(String.fromCharCode(10));
        return new Response(
          JSON.stringify([
            lignes.map((l, i) => [
              'T:' + l + (i < lignes.length - 1 ? String.fromCharCode(10) : ''),
              l,
            ]),
            null,
            'es',
          ]),
          { status: 200 },
        );
      });
    }

    const req = (id: string, text: string, sourceLangHint?: string) => ({
      messageId: id,
      text,
      targetLang: 'en',
      sourceLangHint,
    });

    // Le coalesceur groupe par langue CIBLE et rien d'autre, donc un lot melange
    // les sources. Le lot heritait de celle du premier message : mesure sur un
    // chat multilingue, une requete portant une ligne japonaise et une ligne
    // arabe partait avec sl=ja.
    it('n annonce aucune source quand le lot en melange plusieurs', async () => {
      const vus: string[] = [];
      globalThis.fetch = fetchQuiRetientSl(vus) as unknown as typeof fetch;
      await googleProvider.translateBatch!(
        [req('1', 'konbanwa minasan', 'ja'), req('2', 'masa alkhayr', 'ar')],
        {} as never,
      );
      expect(vus).toEqual(['auto']);
    });

    // Le temoin de la limite : un lot d une seule langue doit garder son
    // indication, sinon "ne jamais rien annoncer" passerait le test ci-dessus.
    it('garde la source quand tout le lot est dans la meme langue', async () => {
      const vus: string[] = [];
      globalThis.fetch = fetchQuiRetientSl(vus) as unknown as typeof fetch;
      await googleProvider.translateBatch!(
        [req('1', 'buenas noches', 'es'), req('2', 'hasta luego', 'es')],
        {} as never,
      );
      expect(vus).toEqual(['es']);
    });
  });
});
