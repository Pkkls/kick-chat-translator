import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

// Undocumented Google web endpoint — no API key, used by translate.google.com.
// Rate limits exist (per IP, soft) but are generous; we cache aggressively.
async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const url = new URL(PROVIDER_ENDPOINTS.google);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', req.sourceLangHint ?? 'auto');
  url.searchParams.set('tl', req.targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('dt', 'ld'); // detected language
  url.searchParams.set('q', req.text);

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal: ctx.signal,
    credentials: 'omit',
  });

  if (res.status === 429) {
    throw new ProviderError('google', 'rate_limit', 'Google rate-limited');
  }
  if (!res.ok) {
    throw new ProviderError('google', `http_${res.status}`, `Google HTTP ${res.status}`);
  }

  // Response format: [[[trans, src, ...], ...], null, detectedLang, ...]
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new ProviderError('google', 'shape', 'Unexpected payload');
  }

  const segments = data[0];
  if (!Array.isArray(segments)) {
    throw new ProviderError('google', 'shape', 'No segments');
  }

  const translated = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('');

  const detected = typeof data[2] === 'string' ? data[2] : 'auto';

  return { translatedText: translated, detectedLang: detected };
}

export const googleProvider: TranslationProvider = {
  id: 'google',
  requiresKey: false,
  isConfigured: () => true,
  translate: call,
};
