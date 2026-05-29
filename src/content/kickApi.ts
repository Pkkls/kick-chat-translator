import { KICK_CHANNEL_API } from '~/shared/constants';

interface ChannelResponse {
  chatroom?: { id: number };
  slug?: string;
  user?: { username?: string };
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

const chatroomCache = new Map<string, number>();

export async function fetchChatroomId(slug: string): Promise<number | undefined> {
  if (chatroomCache.has(slug)) return chatroomCache.get(slug);
  try {
    const res = await fetch(KICK_CHANNEL_API(slug), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as ChannelResponse;
    const id = data.chatroom?.id;
    if (typeof id === 'number') {
      chatroomCache.set(slug, id);
      return id;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
