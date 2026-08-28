export const EXT_NAME = 'Kick Chat Translator';
export const EXT_PREFIX = '[KickTranslator]';

export const KICK_API_BASE = 'https://kick.com/api/v2';
export const KICK_CHANNEL_API = (slug: string): string => `${KICK_API_BASE}/channels/${slug}`;

export const PROVIDER_ENDPOINTS = {
  google: 'https://translate.googleapis.com/translate_a/single',
  deeplFree: 'https://api-free.deepl.com/v2/translate',
  deeplPro: 'https://api.deepl.com/v2/translate',
  myMemory: 'https://api.mymemory.translated.net/get',
  lingvaDefault: 'https://lingva.lunar.icu',
} as const;

// Public Lingva instances, rotated round-robin to spread load / dodge per-host 500s.
// Keep in sync with host_permissions in manifest.config.ts.
export const LINGVA_POOL = ['https://lingva.lunar.icu', 'https://lingva.ml'];

// Google web-endpoint client params; rotating helps avoid per-(IP,client) throttling.
export const GOOGLE_CLIENTS = ['gtx', 'dict-chrome-ex'];

export const DEEPL_BATCH_MAX = 40; // DeepL accepts up to 50 text params; stay under.
// Coalescing window: short enough to keep latency low on quiet chats; busy chats
// hit BATCH_MAX_ITEMS well before this elapses, so batching is preserved.
export const BATCH_WINDOW_MS = 180;
/**
 * The floor the coalescer drops to when holding a line collects nothing.
 *
 * A window earns its latency only if another line arrives during it, and
 * expected arrivals are rate x window: 180ms needs about 5.5 lines a second.
 * Measured on an ordinary channel, 40 translations in 90 seconds, the window
 * was 186ms of a 217ms median while 24 of 27 dispatches carried one message.
 * Small enough to still absorb a genuine burst arriving together, short enough
 * that nobody waits on an empty room.
 */
export const MIN_BATCH_WINDOW_MS = 40;
/** Fast chat: batching pays for itself, so hold longer and send fewer calls. */
export const MAX_BATCH_WINDOW_MS = 300;
export const BATCH_MAX_ITEMS = 40; // flush size — aligned with DeepL's batch cap (fewer requests)

// DeepL usage endpoints (quota display in the popup).
export const DEEPL_USAGE_FREE = 'https://api-free.deepl.com/v2/usage';
export const DEEPL_USAGE_PRO = 'https://api.deepl.com/v2/usage';

// MyMemory: a contact email lifts the anon cap (5k → 50k words/day). Optional.
export const MYMEMORY_CONTACT = '';

export const CACHE_DB = 'kt-cache';
export const CACHE_STORE = 'translations';
export const STATS_DB = 'kt-stats';

export const MIN_TEXT_LENGTH = 2;
export const MAX_TEXT_LENGTH = 800;

export const DEFAULT_CACHE_MAX = 2000;
export const DEFAULT_CACHE_TTL_HOURS = 24;
export const DEFAULT_CONCURRENCY = 4;
export const KEEPALIVE_INTERVAL_SEC = 25;

export const STORAGE_KEY_SETTINGS = 'kt.settings.v2';
/**
 * The DeepL key, kept OUT of the synced settings blob and on this device only.
 *
 * chrome.storage.sync replicates to Google and to every Chrome signed into the
 * same account. That is right for preferences and wrong for a credential: a key
 * typed on one machine would land on every other one, including shared or work
 * profiles the user never meant to give it to. storage.local stays put.
 */
export const STORAGE_KEY_DEEPL_KEY = 'kt.deeplKey.v1';
export const STORAGE_KEY_STATS = 'kt.stats.v1';
export const STORAGE_KEY_UPDATE = 'kt.update.v1';

// Self-update check: compare the installed version to the latest GitHub release.
export const GITHUB_REPO = 'Pkkls/kick-chat-translator';
/**
 * The listing's id on the Chrome Web Store.
 *
 * The store assigns it and it never changes for a listing, so comparing it to
 * `chrome.runtime.id` tells a store install from a zip without asking for the
 * `management` permission, which would send the listing back through a longer
 * review for a single boolean.
 */
export const CHROME_STORE_ID = 'nkkjmbkmacbdkboijmnhjnblcaiclhni';

export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
export const UPDATE_CHECK_TTL_MS = 6 * 60 * 60_000; // 6h

export const COMMON_BOTS = new Set([
  'streamelements',
  'nightbot',
  'fossabot',
  'moobot',
  'botrix',
  'kick',
  'kickbot',
]);

/** How many languages the composer chip keeps pinned. Four fits 340px; five does not. */
export const FAVORITE_LANGS_MAX = 4;
