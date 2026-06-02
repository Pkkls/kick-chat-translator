import { KICK_CHANNEL_API } from '~/shared/constants';
import { normalizeLang } from '~/shared/languages';

interface ChannelResponse {
  chatroom?: { id: number };
  slug?: string;
  user?: { username?: string };
  // Present only while the channel is live. `lang_iso` is a clean ISO-639-1 code
  // (e.g. "en", "es", "ja") set by the streamer — the language the channel chats in.
  livestream?: { lang_iso?: string; language?: string } | null;
}

export function extractChannelSlug(pathname: string): string | undefined {
  // Avoid known non-channel routes
  const RESERVED = new Set([
    '',
    'browse',
    'categories',
    'category',
    'community',
    'community-guidelines',
    'following',
    'subscriptions',
    'help',
    'jobs',
    'about',
    'tos',
    'privacy',
    'video',
    'videos',
    'clips',
    'search',
    'creator-program',
    'wallet',
    'dashboard',
    'settings',
    'analytics',
    'vods',
  ]);
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  if (!first) return undefined;
  if (RESERVED.has(first.toLowerCase())) return undefined;
  // /<slug> or /<slug>/<sub>
  return first.toLowerCase();
}

export interface ChannelMeta {
  chatroomId?: number;
  /** The channel's broadcast language as a supported ISO-2 code, when live. */
  langIso?: string;
}

interface CachedMeta extends ChannelMeta {
  at: number;
}

// Cache TTL: the chatroom id is stable, but `langIso` only appears once a channel
// goes live — so re-fetch periodically rather than caching "unknown" forever.
const META_TTL_MS = 5 * 60_000;
const metaCache = new Map<string, CachedMeta>();

async function fetchChannelMeta(slug: string): Promise<ChannelMeta> {
  const cached = metaCache.get(slug);
  // Serve from cache unless it's stale, or it's missing a language we might now find.
  if (cached && Date.now() - cached.at < META_TTL_MS && cached.langIso) return cached;
  try {
    const res = await fetch(KICK_CHANNEL_API(slug), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return cached ?? {};
    const data = (await res.json()) as ChannelResponse;
    const rawLang = data.livestream?.lang_iso;
    const meta: CachedMeta = {
      chatroomId: typeof data.chatroom?.id === 'number' ? data.chatroom.id : cached?.chatroomId,
      langIso: rawLang ? normalizeLang(rawLang) : cached?.langIso,
      at: Date.now(),
    };
    metaCache.set(slug, meta);
    return meta;
  } catch {
    return cached ?? {};
  }
}

export async function fetchChatroomId(slug: string): Promise<number | undefined> {
  return (await fetchChannelMeta(slug)).chatroomId;
}

/** The channel's chat language (ISO-2), or undefined when offline / unknown. */
export async function fetchChannelLangIso(slug: string): Promise<string | undefined> {
  return (await fetchChannelMeta(slug)).langIso;
}
