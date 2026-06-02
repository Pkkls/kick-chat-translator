import { MYMEMORY_CONTACT, PROVIDER_ENDPOINTS } from '~/shared/constants';
import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

interface MyMemoryResponse {
  responseData: { translatedText: string; detectedLanguage?: string };
  responseStatus: number | string;
  responseDetails?: string;
  matches?: { language?: string }[];
}

// MyMemory expects RFC-3066 codes. A bare 2-letter code resolves to the dominant
// region, which mistranslates the variants we keep distinct (pt-br vs pt, the two
// Chinese scripts). Map those explicitly; everything else passes as its base code.
const MYMEMORY_CODES: Record<string, string> = {
  'pt-br': 'pt-BR',
  pt: 'pt-PT',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-tw': 'zh-TW',
  'zh-hant': 'zh-TW',
  nb: 'no',
  nn: 'no',
};

/** Map an internal ISO code to the closest code MyMemory expects (or autodetect). */
export function toMyMemoryCode(code: string | undefined): string {
  if (!code || code === 'auto') return 'autodetect';
  const c = code.toLowerCase();
  return MYMEMORY_CODES[c] ?? c.split('-')[0] ?? c;
}

async function call(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult> {
  const url = new URL(PROVIDER_ENDPOINTS.myMemory);
  url.searchParams.set('q', req.text);
  url.searchParams.set('langpair', `${toMyMemoryCode(req.sourceLangHint)}|${toMyMemoryCode(req.targetLang)}`);
  // An email lifts MyMemory's anon cap from 5k → 50k words/day.
  const email = ctx.myMemoryEmail || MYMEMORY_CONTACT;
  if (email) url.searchParams.set('de', email);

  const res = await fetch(url.toString(), { signal: ctx.signal, credentials: 'omit' });
  if (res.status === 429) {
    throw new ProviderError('mymemory', 'rate_limit', 'MyMemory: rate-limited');
  }
  if (!res.ok) {
    throw new ProviderError('mymemory', `http_${res.status}`, `MyMemory HTTP ${res.status}`);
  }
  const data = (await res.json()) as MyMemoryResponse;

  const status = Number(data.responseStatus);
  const details = data.responseDetails ?? '';
  // MyMemory signals daily-cap with a 200 body, not a 429.
  if (status === 429 || /USED ALL AVAILABLE FREE TRANSLATIONS|MYMEMORY WARNING/i.test(details)) {
    throw new ProviderError('mymemory', 'rate_limit', 'MyMemory: daily cap reached');
  }
  if (status !== 200) {
    throw new ProviderError('mymemory', 'api', details || `Status ${status}`);
  }

  const translated = data.responseData.translatedText;
  if (!translated) throw new ProviderError('mymemory', 'empty', 'MyMemory: empty');

  const detected = data.matches?.[0]?.language ?? data.responseData.detectedLanguage ?? 'auto';
  return {
    translatedText: translated,
    detectedLang: detected.toLowerCase().split('-')[0] ?? detected.toLowerCase(),
  };
}

export const myMemoryProvider: TranslationProvider = {
  id: 'mymemory',
  requiresKey: false,
  supportsBatch: false,
  isConfigured: () => true,
  translate: call,
};
