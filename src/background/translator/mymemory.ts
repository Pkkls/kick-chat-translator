import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface MyMemoryResponse {
  responseData: { translatedText: string; detectedLanguage?: string };
  responseStatus: number | string;
  responseDetails?: string;
  matches?: { language?: string }[];
}

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const url = new URL(PROVIDER_ENDPOINTS.myMemory);
  url.searchParams.set('q', req.text);
  url.searchParams.set('langpair', `${req.sourceLangHint ?? 'autodetect'}|${req.targetLang}`);

  const res = await fetch(url.toString(), { signal: ctx.signal, credentials: 'omit' });
  if (res.status === 429) {
    throw new ProviderError('mymemory', 'rate_limit', 'MyMemory: rate-limited (daily cap?)');
  }
  if (!res.ok) {
    throw new ProviderError('mymemory', `http_${res.status}`, `MyMemory HTTP ${res.status}`);
  }
  const data = (await res.json()) as MyMemoryResponse;

  const status = Number(data.responseStatus);
  if (status !== 200) {
    throw new ProviderError('mymemory', 'api', data.responseDetails ?? `Status ${status}`);
  }

  const detected =
    data.matches?.[0]?.language ?? data.responseData.detectedLanguage ?? 'auto';
  return {
    translatedText: data.responseData.translatedText,
    detectedLang: detected.toLowerCase().split('-')[0] ?? detected.toLowerCase(),
  };
}

export const myMemoryProvider: TranslationProvider = {
  id: 'mymemory',
  requiresKey: false,
  isConfigured: () => true,
  translate: call,
};
