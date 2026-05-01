import {
  MessageToBackground,
  TranslationRequest,
  TranslationResponse,
} from '../shared/types';
import { MYMEMORY_API_URL, LIBRETRANSLATE_URL, CACHE_MAX_SIZE } from '../shared/constants';
import { getSettings, saveSettings } from '../shared/storage';

const cache = new Map<string, TranslationResponse>();

// ─── MyMemory (primary) ───────────────────────────────────────────────────────
// Supports auto-detection, 1000 req/day free, no key
async function translateWithMyMemory(
  req: TranslationRequest
): Promise<TranslationResponse> {
  const url = new URL(MYMEMORY_API_URL);
  url.searchParams.set('q', req.text);
  // langpair "autodetect|en" is supported by MyMemory
  url.searchParams.set('langpair', `autodetect|${req.targetLang}`);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json();
  if (data.responseStatus !== 200) throw new Error(`MyMemory: ${data.responseDetails}`);

  const translated: string = data.responseData.translatedText;
  // MyMemory encodes lang as "JA" or "JA-JP" in matches
  const detectedLang: string =
    data.matches?.[0]?.language ?? data.responseData.detectedLanguage ?? 'unknown';

  // Already English: MyMemory returns the same text unchanged
  const lowerTranslated = translated.toLowerCase().trim();
  const lowerOriginal = req.text.toLowerCase().trim();
  if (lowerTranslated === lowerOriginal) {
    return { messageId: req.messageId, translatedText: '', detectedLang, source: 'mymemory' };
  }

  return { messageId: req.messageId, translatedText: translated, detectedLang, source: 'mymemory' };
}

// ─── LibreTranslate public instance (fallback) ────────────────────────────────
// Quality: uses Argos Translate models — good for Japanese, Korean, Arabic
// Public instances may have rate limits; we only hit this when MyMemory fails
async function translateWithLibreTranslate(
  req: TranslationRequest
): Promise<TranslationResponse> {
  const res = await fetch(LIBRETRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: req.text,
      source: 'auto',
      target: req.targetLang,
      format: 'text',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LibreTranslate HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(`LibreTranslate: ${data.error}`);

  const translated: string = data.translatedText;
  const detectedLang: string = data.detectedLanguage?.language ?? 'unknown';

  const isAlreadyEnglish =
    translated.toLowerCase().trim() === req.text.toLowerCase().trim() ||
    detectedLang.toLowerCase() === req.targetLang.toLowerCase();

  if (isAlreadyEnglish) {
    return { messageId: req.messageId, translatedText: '', detectedLang, source: 'libretranslate' };
  }

  return { messageId: req.messageId, translatedText: translated, detectedLang, source: 'libretranslate' };
}

// ─── Dispatcher with fallback chain ──────────────────────────────────────────
async function translate(req: TranslationRequest): Promise<TranslationResponse> {
  const cacheKey = `${req.text}::${req.targetLang}`;
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey)!, messageId: req.messageId };
  }

  let result: TranslationResponse;

  try {
    result = await translateWithMyMemory(req);
  } catch (err) {
    console.warn('[KickTranslator] MyMemory failed, trying LibreTranslate:', err);
    result = await translateWithLibreTranslate(req);
  }

  cache.set(cacheKey, result);
  if (cache.size > CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  return result;
}

// ─── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (msg: MessageToBackground, _sender, sendResponse) => {
    if (msg.type === 'TRANSLATE') {
      translate(msg.payload)
        .then((r) => sendResponse({ type: 'TRANSLATION_RESULT', payload: r }))
        .catch((err) =>
          sendResponse({
            type: 'TRANSLATION_ERROR',
            payload: { messageId: msg.payload.messageId, error: String(err) },
          })
        );
      return true;
    }
    if (msg.type === 'GET_SETTINGS') {
      getSettings().then((s) => sendResponse({ type: 'SETTINGS', payload: s }));
      return true;
    }
    if (msg.type === 'SAVE_SETTINGS') {
      saveSettings(msg.payload).then(() =>
        sendResponse({ type: 'SETTINGS', payload: msg.payload })
      );
      return true;
    }
  }
);
