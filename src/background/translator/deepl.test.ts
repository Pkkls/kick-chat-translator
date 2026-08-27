import { afterEach, describe, expect, it, vi } from 'vitest';
import { deeplProvider } from './deepl';
import { ProviderError } from './types';

const baseCtx = { deeplApiKey: '', deeplPlan: 'free' as const, deeplBudgetPct: 0, lingvaInstance: '', myMemoryEmail: '', concurrency: 4 };

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

  it('skips unsupported targets without hitting the network', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    await expect(
      deeplProvider.translate({ messageId: '1', text: 'hi', targetLang: 'tl' }, { ...baseCtx, deeplApiKey: 'k:fx' }),
    ).rejects.toMatchObject({ code: 'unsupported' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps pt-br to the PT-BR target code', async () => {
    let sentBody = '';
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string }) => {
      sentBody = String(init.body);
      return new Response(JSON.stringify({ translations: [{ detected_source_language: 'EN', text: 'olá' }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    await deeplProvider.translate(
      { messageId: '1', text: 'hi', targetLang: 'pt-br' },
      { ...baseCtx, deeplApiKey: 'k:fx' },
    );
    expect(sentBody).toContain('target_lang=PT-BR');
  });

  it('sends formality=prefer_more for a formal compose into a supported target (JA)', async () => {
    let sentBody = '';
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string }) => {
      sentBody = String(init.body);
      return new Response(JSON.stringify({ translations: [{ detected_source_language: 'FR', text: 'こんにちは' }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    await deeplProvider.translate(
      { messageId: '1', text: 'bonjour', targetLang: 'ja', formal: true },
      { ...baseCtx, deeplApiKey: 'k:fx' },
    );
    expect(sentBody).toContain('formality=prefer_more');
  });

  it('sends one request for a whole batch, keeping the order', async () => {
    let sentBody = '';
    const fetchSpy = vi.fn(async (_url: unknown, init: { body?: string }) => {
      sentBody = String(init.body);
      return new Response(
        JSON.stringify({
          translations: [
            { detected_source_language: 'ES', text: 'one' },
            { detected_source_language: 'FR', text: 'two' },
            { detected_source_language: 'DE', text: 'three' },
          ],
        }),
        { status: 200 },
      );
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const out = await deeplProvider.translateBatch!(
      [
        { messageId: '1', text: 'uno', targetLang: 'en' },
        { messageId: '2', text: 'deux', targetLang: 'en' },
        { messageId: '3', text: 'drei', targetLang: 'en' },
      ],
      { ...baseCtx, deeplApiKey: 'k:fx' },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sentBody.match(/(^|&)text=/g)).toHaveLength(3);
    expect(out.map((r) => r.translatedText)).toEqual(['one', 'two', 'three']);
    expect(out.map((r) => r.detectedLang)).toEqual(['es', 'fr', 'de']);
  });

  it('rejects a response whose result count does not match the batch', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ translations: [{ detected_source_language: 'ES', text: 'one' }] }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;

    await expect(
      deeplProvider.translateBatch!(
        [
          { messageId: '1', text: 'uno', targetLang: 'en' },
          { messageId: '2', text: 'dos', targetLang: 'en' },
        ],
        { ...baseCtx, deeplApiKey: 'k:fx' },
      ),
    ).rejects.toMatchObject({ code: 'count_mismatch' });
  });

  it('does not hit the network for an empty batch', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    await expect(deeplProvider.translateBatch!([], { ...baseCtx, deeplApiKey: 'k:fx' })).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('omits formality on targets DeepL does not support it on (fi)', async () => {
    let sentBody = '';
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string }) => {
      sentBody = String(init.body);
      return new Response(JSON.stringify({ translations: [{ detected_source_language: 'FR', text: 'x' }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    await deeplProvider.translate(
      { messageId: '1', text: 'bonjour', targetLang: 'fi', formal: true },
      { ...baseCtx, deeplApiKey: 'k:fx' },
    );
    expect(sentBody).not.toContain('formality');
  });
});
