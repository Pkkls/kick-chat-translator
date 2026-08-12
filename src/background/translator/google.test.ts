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
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '' },
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
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '' },
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
      { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '' },
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
        { deeplApiKey: '', deeplPlan: 'free', deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '' },
      ),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});
