import type { ProviderStatus, TranslationOutcome, TranslationRequest, UsageStats } from './types';
import type { Settings } from './settings';

export type RuntimeMessage =
  | { type: 'translate'; payload: TranslationRequest }
  | { type: 'settings.get' }
  | { type: 'settings.set'; payload: Partial<Settings> }
  | { type: 'stats.get' }
  | { type: 'stats.reset' }
  | { type: 'providers.status' }
  | { type: 'cache.clear' }
  | { type: 'open.options' }
  | { type: 'stats.local'; payload: { lang: string; chars: number } }
  | { type: 'ping' };

export type RuntimeResponse =
  | { type: 'translate.result'; payload: TranslationOutcome }
  | { type: 'settings'; payload: Settings }
  | { type: 'stats'; payload: UsageStats }
  | { type: 'providers'; payload: ProviderStatus[] }
  | { type: 'ack' }
  | { type: 'error'; payload: { message: string } };

export function send(msg: RuntimeMessage): Promise<RuntimeResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res: RuntimeResponse | undefined) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!res) {
        reject(new Error('No response'));
        return;
      }
      resolve(res);
    });
  });
}

type HandlerResult = RuntimeResponse | void;

export function onMessage(
  handler: (
    msg: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
  ) => Promise<HandlerResult> | HandlerResult,
): void {
  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, sender, sendResponse) => {
    const result = handler(msg, sender);
    if (result instanceof Promise) {
      result
        .then((r) => {
          if (r) sendResponse(r);
        })
        .catch((err: unknown) =>
          sendResponse({
            type: 'error',
            payload: { message: err instanceof Error ? err.message : String(err) },
          } satisfies RuntimeResponse),
        );
      return true;
    }
    if (result) sendResponse(result);
    return false;
  });
}
