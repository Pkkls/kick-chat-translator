import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractChannelSlug, fetchChannelLangIso } from './kickApi';

const mockFetch = (body: unknown, status = 200): void => {
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
};

describe('extractChannelSlug', () => {
  it('returns the first path segment for a channel URL', () => {
    expect(extractChannelSlug('/adinross')).toBe('adinross');
    expect(extractChannelSlug('/adinross/clips')).toBe('adinross');
  });

  it('returns undefined for reserved routes', () => {
    expect(extractChannelSlug('/browse')).toBeUndefined();
    expect(extractChannelSlug('/community')).toBeUndefined();
    expect(extractChannelSlug('/settings')).toBeUndefined();
    expect(extractChannelSlug('/')).toBeUndefined();
  });

  it('lowercases the slug', () => {
    expect(extractChannelSlug('/AdinRoss')).toBe('adinross');
  });
});

describe('fetchChannelLangIso', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('extracts and normalizes the live channel language', async () => {
    mockFetch({ chatroom: { id: 1 }, livestream: { lang_iso: 'ES' } });
    expect(await fetchChannelLangIso('kt-test-es')).toBe('es');
  });

  it('normalizes regional variants (pt-BR)', async () => {
    mockFetch({ livestream: { lang_iso: 'pt-BR' } });
    expect(await fetchChannelLangIso('kt-test-ptbr')).toBe('pt-br');
  });

  it('returns undefined for an offline channel', async () => {
    mockFetch({ chatroom: { id: 2 }, livestream: null });
    expect(await fetchChannelLangIso('kt-test-offline')).toBeUndefined();
  });

  it('tolerates a 403 (Cloudflare) without throwing', async () => {
    mockFetch('', 403);
    await expect(fetchChannelLangIso('kt-test-403')).resolves.toBeUndefined();
  });
});
