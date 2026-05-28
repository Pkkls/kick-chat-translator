export type ProviderId = 'google' | 'deepl' | 'mymemory' | 'lingva';

export type DisplayStyle = 'below' | 'inline' | 'replace' | 'hover';

export type Theme = 'dark' | 'light' | 'system';

export interface NormalizedMessage {
  /** Stable id from Pusher payload or DOM extraction. */
  id: string;
  /** Channel slug. */
  channel: string;
  /** Sender username (lowercased). */
  username: string;
  /** Plain text after stripping emotes / @mentions / urls. */
  text: string;
  /** Raw text as received. */
  rawText: string;
  /** Emote / mention / url tokens preserved for re-render. */
  tokens: TextToken[];
  /** ISO timestamp ms. */
  timestampMs: number;
  /** Source ("pusher" or "dom"). */
  origin: 'pusher' | 'dom';
}

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
