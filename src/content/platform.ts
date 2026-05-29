import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('platform');

let cached: boolean | undefined;

/**
 * Detect the 7TV browser extension, which re-renders Kick chat and wraps message
 * text in `span.seventv-text-token` (instead of native `span.font-normal`).
 * Our text extraction already prefers 7TV tokens; this detection lets us log it
 * and lets callers adapt if needed.
 */
export function has7TV(): boolean {
  if (cached !== undefined) return cached;
  cached = detect();
  return cached;
}

function detect(): boolean {
  try {
    if (
      document.querySelector(
        '.seventv-chat-observer, .seventv-chat-list, #seventv-message-container, seventv-container',
      )
    ) {
      return true;
    }
    if (document.querySelector('[class^="seventv"], [class*=" seventv-"]')) return true;
    if (typeof customElements !== 'undefined' && customElements.get('seventv-container')) return true;
    return false;
  } catch {
    return false;
  }
}

/** Re-evaluate (7TV can load after our content script). Updates the cache. */
export function refresh7TV(): boolean {
  cached = detect();
  return cached;
}

export function logPlatform(): void {
  log.info(has7TV() ? '7TV detected — using 7TV text tokens' : 'native Kick chat (no 7TV)');
}
