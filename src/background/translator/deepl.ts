import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface DeeplResponse {
  translations: { detected_source_language: string; text: string }[];
}

function deeplLangCode(code: string): string {
  const lower = code.toLowerCase();
  if (lower === 'en') return 'EN-US';
  if (lower === 'pt') return 'PT-PT';
  if (lower === 'zh') return 'ZH';
  return code.toUpperCase().split('-')[0] ?? code.toUpperCase();
}

function endpointFor(ctx: ProviderContext): string {
  return ctx.deeplPlan === 'pro' ? PROVIDER_ENDPOINTS.deeplPro : PROVIDER_ENDPOINTS.deeplFree;
}

function checkStatus(status: number): void {
  if (status === 403) throw new ProviderError('deepl', 'auth', 'DeepL: invalid key');
  if (status === 456) throw new ProviderError('deepl', 'quota', 'DeepL: monthly quota exceeded');
  if (status === 429) throw new ProviderError('deepl', 'rate_limit', 'DeepL: rate-limited');
  if (status < 200 || status >= 300) {
    throw new ProviderError('deepl', `http_${status}`, `DeepL HTTP ${status}`);
  }
}

async function postForm(
  form: URLSearchParams,
  ctx: ProviderContext,
): Promise<DeeplResponse> {
  const res = await fetch(endpointFor(ctx), {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${ctx.deeplApiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
    signal: ctx.signal,
  });
  checkStatus(res.status);
  return (await res.json()) as DeeplResponse;
}

async function translate(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  if (!ctx.deeplApiKey) throw new ProviderError('deepl', 'no_key', 'DeepL API key missing');
  const form = new URLSearchParams();
  form.set('text', req.text);
  form.set('target_lang', deeplLangCode(req.targetLang));
  if (req.sourceLangHint) form.set('source_lang', deeplLangCode(req.sourceLangHint));

  const data = await postForm(form, ctx);
  const first = data.translations[0];
  if (!first) throw new ProviderError('deepl', 'empty', 'DeepL: empty response');
  return { translatedText: first.text, detectedLang: first.detected_source_language.toLowerCase() };
}

async function translateBatch(
  reqs: TranslationRequest[],
  ctx: ProviderContext,
): Promise<ProviderResult[]> {
  if (!ctx.deeplApiKey) throw new ProviderError('deepl', 'no_key', 'DeepL API key missing');
  if (reqs.length === 0) return [];
  const target = reqs[0]!.targetLang;
  const form = new URLSearchParams();
  form.set('target_lang', deeplLangCode(target));
  // DeepL preserves order and returns exactly one translation per `text` param.
  for (const r of reqs) form.append('text', r.text);

  const data = await postForm(form, ctx);
  if (data.translations.length !== reqs.length) {
    throw new ProviderError('deepl', 'count_mismatch', 'DeepL: result count mismatch');
  }
  return data.translations.map((t) => ({
    translatedText: t.text,
    detectedLang: t.detected_source_language.toLowerCase(),
  }));
}

export const deeplProvider: TranslationProvider = {
  id: 'deepl',
  requiresKey: true,
  supportsBatch: true,
  isConfigured: (ctx) => ctx.deeplApiKey.length > 0,
  translate,
  translateBatch,
};
