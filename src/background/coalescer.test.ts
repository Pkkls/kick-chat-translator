import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { Settings } from '~/shared/settings';
import type { TranslationOutcome, TranslationRequest } from '~/shared/types';
import { BATCH_MAX_ITEMS } from '~/shared/constants';
import { TranslationCoalescer } from './coalescer';
import { translateGroup } from './translator';
import type { TranslationCache } from './cache';
import type { StatsTracker } from './stats';

vi.mock('./translator', () => ({ translateGroup: vi.fn() }));

const mockTranslateGroup = translateGroup as unknown as Mock;

function okOutcome(req: TranslationRequest): TranslationOutcome {
  return {
    ok: true,
    result: {
      messageId: req.messageId,
      translatedText: `t:${req.text}`,
      detectedLang: 'es',
      provider: 'deepl',
      cached: false,
    },
  };
}

function makeCoalescer() {
  const recordRequest = vi.fn();
  const recordError = vi.fn();
  const cache = {
    key: (text: string, target: string) => `${target}:${text}`,
    set: vi.fn(async () => undefined),
  } as unknown as TranslationCache;
  const stats = { recordRequest, recordError } as unknown as StatsTracker;
  const coalescer = new TranslationCoalescer({
    getSettings: () => ({ concurrency: 4 }) as Settings,
    cache,
    stats,
  });
  return { coalescer, recordRequest, recordError };
}

function req(text: string, targetLang = 'en', messageId = text): TranslationRequest {
  return { messageId, text, targetLang };
}

describe('TranslationCoalescer', () => {
  beforeEach(() => {
    mockTranslateGroup.mockReset();
    mockTranslateGroup.mockImplementation((reqs: TranslationRequest[]) =>
      Promise.resolve(reqs.map(okOutcome)),
    );
  });

  it('sends one dispatch for messages submitted in the same window', async () => {
    const { coalescer } = makeCoalescer();
    const results = await Promise.all([
      coalescer.submit(req('uno')),
      coalescer.submit(req('dos')),
      coalescer.submit(req('tres')),
    ]);

    expect(mockTranslateGroup).toHaveBeenCalledTimes(1);
    expect((mockTranslateGroup.mock.calls[0]![0] as TranslationRequest[]).map((r) => r.text)).toEqual([
      'uno',
      'dos',
      'tres',
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it('translates duplicated text once and resolves every caller', async () => {
    const { coalescer, recordRequest } = makeCoalescer();
    const [a, b] = await Promise.all([coalescer.submit(req('same')), coalescer.submit(req('same', 'en', '2'))]);

    const dispatched = mockTranslateGroup.mock.calls[0]![0] as TranslationRequest[];
    expect(dispatched).toHaveLength(1);
    expect(a.ok && a.result.translatedText).toBe('t:same');
    expect(b.ok && b.result.translatedText).toBe('t:same');
    // The extra caller is booked as a cache hit, not a second provider call.
    expect(recordRequest.mock.calls.filter((c) => c[3] === true)).toHaveLength(1);
  });

  it('keeps different target languages in separate dispatches', async () => {
    const { coalescer } = makeCoalescer();
    await Promise.all([coalescer.submit(req('hola', 'en')), coalescer.submit(req('hola', 'fr'))]);

    expect(mockTranslateGroup).toHaveBeenCalledTimes(2);
    const targets = mockTranslateGroup.mock.calls
      .map((c) => (c[0] as TranslationRequest[])[0]!.targetLang)
      .sort();
    expect(targets).toEqual(['en', 'fr']);
  });

  it('flushes immediately once the batch is full instead of waiting for the window', async () => {
    const { coalescer } = makeCoalescer();
    const pending = Array.from({ length: BATCH_MAX_ITEMS }, (_, i) => coalescer.submit(req(`m${i}`)));
    await Promise.all(pending);

    expect(mockTranslateGroup).toHaveBeenCalledTimes(1);
    expect(mockTranslateGroup.mock.calls[0]![0]).toHaveLength(BATCH_MAX_ITEMS);
  });

  it('resolves every caller with an error when the dispatch throws', async () => {
    const { coalescer, recordError } = makeCoalescer();
    mockTranslateGroup.mockRejectedValue(new Error('network down'));

    const results = await Promise.all([coalescer.submit(req('uno')), coalescer.submit(req('dos'))]);
    expect(results.every((r) => !r.ok)).toBe(true);
    expect(recordError).toHaveBeenCalledTimes(2);
  });
});
