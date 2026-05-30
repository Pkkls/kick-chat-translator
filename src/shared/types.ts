export type ProviderId = 'local' | 'google' | 'deepl' | 'mymemory' | 'lingva';

export type TextToken =
  | { kind: 'text'; value: string }
  | { kind: 'emote'; id: string; name: string }
  | { kind: 'mention'; user: string }
  | { kind: 'url'; href: string };

export interface TranslationRequest {
  messageId: string;
  text: string;
  targetLang: string;
  sourceLangHint?: string;
  channel?: string;
  /** Surrounding chat lines (untranslated) to disambiguate — DeepL `context`. */
  context?: string;
  /** Force a fresh translation, bypassing the cache (re-translate button). */
  noCache?: boolean;
}

export interface TranslationResult {
  messageId: string;
  translatedText: string;
  detectedLang: string;
  provider: ProviderId;
  cached: boolean;
}

export type TranslationOutcome =
  | { ok: true; result: TranslationResult }
  | { ok: false; error: { code: string; message: string; provider?: ProviderId } };

export interface ProviderStatus {
  id: ProviderId;
  available: boolean;
  remainingDaily?: number;
  lastError?: string;
  lastUsedMs?: number;
  /** Seconds until this provider exits its error cooldown (0 = ready). */
  cooldownLeftSec?: number;
}

export interface UsageStats {
  totalRequests: number;
  totalCacheHits: number;
  totalErrors: number;
  byProvider: Partial<Record<ProviderId, number>>;
  byLang: Record<string, number>;
  charsSent: number;
  todayKey: string;
}
