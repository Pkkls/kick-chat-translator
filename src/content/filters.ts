import { COMMON_BOTS } from '~/shared/constants';
import type { Settings } from '~/shared/settings';

export interface MessageMeta {
  username: string;
  channel: string;
  isBot: boolean;
}

export function shouldDropByUserOrChannel(meta: MessageMeta, settings: Settings): string | undefined {
  if (settings.ignoreBots && (meta.isBot || COMMON_BOTS.has(meta.username))) {
    return 'bot';
  }
  if (settings.blacklistUsers.includes(meta.username)) return 'user_blacklisted';
  if (settings.blacklistChannels.includes(meta.channel)) return 'channel_blacklisted';
  if (settings.whitelistChannels.length > 0 && !settings.whitelistChannels.includes(meta.channel)) {
    return 'channel_not_whitelisted';
  }
  return undefined;
}

export function shouldDropBySourceLang(detected: string | undefined, settings: Settings): string | undefined {
  if (settings.sourceLangAllowlist.length === 0) return undefined;
  if (!detected) return 'lang_unknown';
  if (!settings.sourceLangAllowlist.includes(detected)) return 'lang_not_allowed';
  return undefined;
}

export function isSameLanguageAsTarget(detected: string | undefined, target: string): boolean {
  if (!detected) return false;
  return detected.toLowerCase() === target.toLowerCase();
}
