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
