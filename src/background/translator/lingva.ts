import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface LingvaResponse {
  translation: string;
  info?: { detectedSource?: string };
}

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const base = (ctx.lingvaInstance || PROVIDER_ENDPOINTS.lingvaDefault).replace(/\/+$/, '');
  const source = req.sourceLangHint ?? 'auto';
  const url = `${base}/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(req.targetLang)}/${encodeURIComponent(req.text)}`;

  const res = await fetch(url, { signal: ctx.signal, credentials: 'omit' });
  if (res.status === 429) {
    throw new ProviderError('lingva', 'rate_limit', 'Lingva: rate-limited');
  }
  if (!res.ok) {
    throw new ProviderError('lingva', `http_${res.status}`, `Lingva HTTP ${res.status}`);
  }

  const data = (await res.json()) as LingvaResponse;
  if (!data.translation) throw new ProviderError('lingva', 'empty', 'Lingva: empty');
  return {
    translatedText: data.translation,
    detectedLang: data.info?.detectedSource ?? 'auto',
  };
}

export const lingvaProvider: TranslationProvider = {
  id: 'lingva',
  requiresKey: false,
  isConfigured: () => true,
  translate: call,
};
