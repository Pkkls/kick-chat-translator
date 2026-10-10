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
  /** Prefer the polite/formal register where the engine supports it (compose → others; keigo for JA). */
  formal?: boolean;
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

/** One finished day of usage, retained so the popup can chart a trend. */
export interface DayStat {
  day: string;
  requests: number;
  cacheHits: number;
}

/**
 * Ce que le cache sait de lui-meme.
 *
 * `entries` est le compte reel dans IndexedDB, un seul appel a keys(). `oldest`
 * est l'age de la plus vieille entree EN MEMOIRE et pas dans la base : le Map
 * est deja la et le lire ne coute rien, tandis que dater toutes les entrees
 * stockees demanderait une lecture par cle. C'est un echantillon, et la page
 * le dit plutot que de le presenter comme un maximum.
 */
export interface CacheStats {
  /** Entrees dans IndexedDB. */
  entries: number;
  /** Entrees actuellement en memoire. */
  inMemory: number;
  /** Age en ms de la plus vieille entree en memoire, absent si elle est vide. */
  oldestMs?: number;
  /** Le plafond en vigueur, pour que l'appelant n'ait pas a le recroiser. */
  maxEntries: number;
}

export interface UsageStats {
  totalRequests: number;
  totalCacheHits: number;
  totalErrors: number;
  byProvider: Partial<Record<ProviderId, number>>;
  byLang: Record<string, number>;
  byChannel: Record<string, number>;
  charsSent: number;
  /** Messages refuses par le budget par chaine. Absent avant ce champ. */
  throttled?: number;
  todayKey: string;
  /** Finished days, oldest first. Absent on records stored before this field existed. */
  history?: DayStat[];
}
