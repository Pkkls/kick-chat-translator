export interface Settings {
  enabled: boolean;
  showOriginal: boolean;
  displayStyle: 'inline' | 'below' | 'replace';
  targetLang: string;
}

export interface TranslationRequest {
  messageId: string;
  text: string;
  targetLang: string;
}

export interface TranslationResponse {
  messageId: string;
  translatedText: string;
  detectedLang: string;
  source: 'mymemory' | 'libretranslate';
}

export type MessageToBackground =
  | { type: 'TRANSLATE'; payload: TranslationRequest }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; payload: Partial<Settings> };

export type MessageFromBackground =
  | { type: 'TRANSLATION_RESULT'; payload: TranslationResponse }
  | { type: 'TRANSLATION_ERROR'; payload: { messageId: string; error: string } }
  | { type: 'SETTINGS'; payload: Settings };
