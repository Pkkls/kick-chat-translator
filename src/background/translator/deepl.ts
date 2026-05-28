import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface DeeplResponse {
  translations: { detected_source_language: string; text: string }[];
}

function deeplLangCode(code: string): string {
  // DeepL uses upper-case 2-letter codes, with EN-US/EN-GB variants
  const lower = code.toLowerCase();
  if (lower === 'en') return 'EN-US';
  if (lower === 'pt') return 'PT-PT';
  if (lower === 'zh') return 'ZH';
  return code.toUpperCase().split('-')[0] ?? code.toUpperCase();
}

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  if (!ctx.deeplApiKey) {
    throw new ProviderError('deepl', 'no_key', 'DeepL API key missing');
  }
  const endpoint = ctx.deeplPlan === 'pro' ? PROVIDER_ENDPOINTS.deeplPro : PROVIDER_ENDPOINTS.deeplFree;
  const form = new URLSearchParams();
  form.set('text', req.text);
  form.set('target_lang', deeplLangCode(req.targetLang));
  if (req.sourceLangHint) form.set('source_lang', deeplLangCode(req.sourceLangHint));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${ctx.deeplApiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
    signal: ctx.signal,
  });

  if (res.status === 403) {
    throw new ProviderError('deepl', 'auth', 'DeepL: invalid key');
  }
  if (res.status === 456) {
    throw new ProviderError('deepl', 'quota', 'DeepL: monthly quota exceeded');
  }
  if (res.status === 429) {
    throw new ProviderError('deepl', 'rate_limit', 'DeepL: rate-limited');
  }
  if (!res.ok) {
    throw new ProviderError('deepl', `http_${res.status}`, `DeepL HTTP ${res.status}`);
  }

  const data = (await res.json()) as DeeplResponse;
  const first = data.translations[0];
  if (!first) throw new ProviderError('deepl', 'empty', 'DeepL: empty response');

  return {
    translatedText: first.text,
    detectedLang: first.detected_source_language.toLowerCase(),
  };
}

export const deeplProvider: TranslationProvider = {
  id: 'deepl',
  requiresKey: true,
  isConfigured: (ctx) => ctx.deeplApiKey.length > 0,
  translate: call,
};
