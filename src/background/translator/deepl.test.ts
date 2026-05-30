import { afterEach, describe, expect, it, vi } from 'vitest';
import { deeplProvider } from './deepl';
import { ProviderError } from './types';

const baseCtx = { deeplApiKey: '', deeplPlan: 'free' as const, deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '' };

describe('deeplProvider', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('requires an API key', async () => {
    await expect(
      deeplProvider.translate({ messageId: '1', text: 'x', targetLang: 'en' }, baseCtx),
    ).rejects.toMatchObject({ code: 'no_key' });
  });

  it('returns translated text on success', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          translations: [{ detected_source_language: 'JA', text: 'Hello' }],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const res = await deeplProvider.translate(
      { messageId: '1', text: 'こんにちは', targetLang: 'en' },
      { ...baseCtx, deeplApiKey: 'k:fx' },
    );
    expect(res.translatedText).toBe('Hello');
    expect(res.detectedLang).toBe('ja');
  });

  it('throws auth on 403', async () => {
    globalThis.fetch = vi.fn(async () => new Response('', { status: 403 })) as unknown as typeof fetch;
    await expect(
      deeplProvider.translate(
        { messageId: '1', text: 'x', targetLang: 'en' },
        { ...baseCtx, deeplApiKey: 'k:fx' },
      ),
    ).rejects.toMatchObject({ code: 'auth' });
  });

  it('throws quota on 456', async () => {
    globalThis.fetch = vi.fn(async () => new Response('', { status: 456 })) as unknown as typeof fetch;
    await expect(
      deeplProvider.translate(
        { messageId: '1', text: 'x', targetLang: 'en' },
        { ...baseCtx, deeplApiKey: 'k:fx' },
      ),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});
