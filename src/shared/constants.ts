export const EXT_NAME = 'Kick Chat Translator';
export const EXT_PREFIX = '[KickTranslator]';

export const KICK_PUSHER_KEY = 'eb1d5f283081a78b932c';
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
