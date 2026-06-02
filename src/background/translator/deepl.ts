import { PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface DeeplResponse {
  translations: { detected_source_language: string; text: string }[];
}

const DEEPL_TARGETS: Record<string, string> = {
  en: 'EN-US',
  pt: 'PT-PT',
  'pt-br': 'PT-BR',
  zh: 'ZH-HANS',
  'zh-tw': 'ZH-HANT',
  no: 'NB',
};

// Target languages DeepL can produce — anything else must fall through to Google/MyMemory.
const DEEPL_SUPPORTED = new Set([
  'en', 'fr', 'es', 'pt', 'pt-br', 'de', 'it', 'nl', 'pl', 'sv', 'cs', 'sk', 'ro', 'ru',
  'uk', 'tr', 'ar', 'ja', 'ko', 'zh', 'zh-tw', 'fi', 'no', 'da', 'el', 'hu', 'bg', 'sl',
  'et', 'lt', 'lv', 'id',
]);

function deeplTargetCode(code: string): string {
  const lower = code.toLowerCase();
  return DEEPL_TARGETS[lower] ?? lower.toUpperCase().split('-')[0] ?? lower.toUpperCase();
}

// Source langs take NO regional suffix (EN, PT, ZH — never EN-US / PT-BR / ZH-HANT).
function deeplSourceCode(code: string): string {
  return code.toUpperCase().split('-')[0] ?? code.toUpperCase();
}

function assertDeeplTarget(code: string): void {
  if (!DEEPL_SUPPORTED.has(code.toLowerCase())) {
    throw new ProviderError('deepl', 'unsupported', `DeepL has no target language ${code}`);
  }
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
  assertDeeplTarget(req.targetLang);
  const form = new URLSearchParams();
  form.set('text', req.text);
  form.set('target_lang', deeplTargetCode(req.targetLang));
  if (req.sourceLangHint) form.set('source_lang', deeplSourceCode(req.sourceLangHint));
  // Untranslated context improves disambiguation on short chat lines.
  if (req.context) form.set('context', req.context);

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
  assertDeeplTarget(target);
  const form = new URLSearchParams();
  form.set('target_lang', deeplTargetCode(target));
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
