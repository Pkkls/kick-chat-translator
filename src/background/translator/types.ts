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
  isConfigured(ctx: ProviderContext): boolean;
  translate(req: TranslationRequest, ctx: ProviderContext): Promise<ProviderResult>;
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
