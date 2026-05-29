export const EXT_NAME = 'Kick Chat Translator';
export const EXT_PREFIX = '[KickTranslator]';

// Pusher app key used by kick.com's public chat client.
// Refresh this from the live page (search the HTML for a 20-char hex string)
// if the WS starts rejecting connections with code 4001.
export const KICK_PUSHER_KEY = '3437aaddcdf6922d623e';
export const KICK_PUSHER_CLUSTER = 'us2';
export const KICK_PUSHER_WS = `wss://ws-${KICK_PUSHER_CLUSTER}.pusher.com/app/${KICK_PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;

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
export const LINGVA_POOL = [
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
  'https://lingva.garudalinux.org',
  'https://lingva.ml',
];

// Google web-endpoint client params; rotating helps avoid per-(IP,client) throttling.
export const GOOGLE_CLIENTS = ['gtx', 'dict-chrome-ex'];

export const DEEPL_BATCH_MAX = 40; // DeepL accepts up to 50 text params; stay under.
export const BATCH_WINDOW_MS = 400; // coalescing window
export const BATCH_MAX_ITEMS = 40; // flush size — aligned with DeepL's batch cap (fewer requests)

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
export const STORAGE_KEY_STATS = 'kt.stats.v1';

export const COMMON_BOTS = new Set([
  'streamelements',
  'nightbot',
  'fossabot',
  'moobot',
  'botrix',
  'kick',
  'kickbot',
]);
