import type { TranslationRequest } from '~/shared/types';
import { ProviderError, type ProviderContext, type ProviderResult, type TranslationProvider } from './types';

// On-device translation via the Chromium built-in Translator API (Chrome >= 138).
// Local, unlimited, free, private — the only source with no per-IP ceiling.
// Often DISABLED in Brave, so this is feature-detected and optional.
//
// API surface (subject to the browser):
//   Translator.availability({sourceLanguage, targetLanguage}) ->
//     'unavailable' | 'downloadable' | 'downloading' | 'available'
//   Translator.create({sourceLanguage, targetLanguage}) -> { translate(text) }
// The API requires an EXPLICIT source language (no 'auto'); we rely on the
// detected sourceLangHint from the content pipeline.

interface TranslatorInstance {
  translate(text: string): Promise<string>;
}
interface TranslatorCtor {
  availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
}

function getCtor(): TranslatorCtor | undefined {
  const g = self as unknown as { Translator?: TranslatorCtor };
  return g.Translator;
}

export function isLocalApiPresent(): boolean {
  return getCtor() !== undefined;
}

let availabilityCache: boolean | undefined;
export async function probeLocalAvailability(): Promise<boolean> {
  const ctor = getCtor();
  if (!ctor) {
    availabilityCache = false;
    return false;
  }
  try {
    // ja->en is the canonical pair we care about; if the engine exists at all,
    // creating translators on demand will work for supported pairs.
    const a = await ctor.availability({ sourceLanguage: 'ja', targetLanguage: 'en' });
    availabilityCache = a !== 'unavailable';
  } catch {
    availabilityCache = false;
  }
  return availabilityCache;
}

export function lastKnownLocalAvailability(): boolean {
  return availabilityCache ?? isLocalApiPresent();
}

const instances = new Map<string, Promise<TranslatorInstance>>();

function instanceFor(source: string, target: string): Promise<TranslatorInstance> {
  const key = `${source}->${target}`;
  let p = instances.get(key);
  if (!p) {
    const ctor = getCtor();
    if (!ctor) {
      return Promise.reject(new ProviderError('local', 'unavailable', 'Translator API absent'));
    }
    p = ctor.create({ sourceLanguage: source, targetLanguage: target });
    instances.set(key, p);
    p.catch(() => instances.delete(key));
  }
  return p;
}

async function call(req: TranslationRequest, _ctx: ProviderContext): Promise<ProviderResult> {
  const ctor = getCtor();
  if (!ctor) throw new ProviderError('local', 'unavailable', 'Translator API absent');

  const source = (req.sourceLangHint ?? '').toLowerCase().split('-')[0] ?? '';
  if (!source || source === 'auto' || source === 'und') {
    throw new ProviderError('local', 'need_source', 'On-device needs a known source language');
  }
  const target = req.targetLang.toLowerCase().split('-')[0] ?? req.targetLang;
  if (source === target) {
    throw new ProviderError('local', 'same_lang', 'Source equals target');
  }

  let status: string;
  try {
    status = await ctor.availability({ sourceLanguage: source, targetLanguage: target });
  } catch (err: unknown) {
    throw new ProviderError('local', 'unavailable', err instanceof Error ? err.message : 'availability failed');
  }
  if (status === 'unavailable') {
    throw new ProviderError('local', 'pair_unavailable', `On-device: ${source}->${target} unsupported`);
  }

  let inst: TranslatorInstance;
  try {
    inst = await instanceFor(source, target);
  } catch (err: unknown) {
    throw err instanceof ProviderError
      ? err
      : new ProviderError('local', 'create_failed', err instanceof Error ? err.message : 'create failed');
  }

  const out = await inst.translate(req.text);
  if (!out.trim()) throw new ProviderError('local', 'empty', 'On-device: empty');
  return { translatedText: out, detectedLang: source };
}

export const localProvider: TranslationProvider = {
  id: 'local',
  requiresKey: false,
  supportsBatch: false,
  isConfigured: () => isLocalApiPresent(),
  translate: call,
};
