import type { ProviderId, TranslationRequest } from '~/shared/types';

export interface ProviderResult {
  translatedText: string;
  detectedLang: string;
}

export interface ProviderContext {
  deeplApiKey: string;
  deeplPlan: 'free' | 'pro';
  lingvaInstance: string;
  signal?: AbortSignal;
}

export interface TranslationProvider {
  readonly id: ProviderId;
  readonly requiresKey: boolean;
  /** Whether this provider can translate many texts in a single network call. */
  readonly supportsBatch: boolean;
  isConfigured(ctx: ProviderContext): boolean;
  translate(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult>;
  /**
   * Translate several texts that share the same target language in one call.
   * Implementations MUST return results in the same order as `reqs`.
   * Only called when `supportsBatch` is true.
   */
  translateBatch?(reqs: TranslationRequest[], ctx: ProviderContext): Promise<ProviderResult[]>;
}

export class ProviderError extends Error {
  constructor(
    public provider: ProviderId,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
