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

const EMOJI_OR_SYMBOL = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{P}\p{S}\s]/u;

/**
 * Chat "noise" that should never be translated: emoji/symbol-only, laughter spam
 * (wwww, kkkk, jajaja, 草草草, lololol), single repeated character, digits/punct only.
 * Cheap to skip and avoids garbage translations like "WWWW" -> "wwww".
 */
export function isNoise(text: string): boolean {
  const t = text.trim();
  if (!t) return true;

  // strip emoji/symbols/punct/space — if nothing meaningful remains, it's noise
  const stripped = [...t].filter((ch) => !EMOJI_OR_SYMBOL.test(ch)).join('');
  if (stripped.length === 0) return true;

  const lower = stripped.toLowerCase();
  // single character repeated (wwww, ーーー, 草草草, !!!)
  if (/^(.)\1*$/u.test(lower)) return true;
  // laughter variants (wwww, kkkk, lol/lolol, jajaja, hahaha)
  if (/^(?:w+|ｗ+|k{2,}|x{2,}|(?:l+o+)+l*|(?:ja){2,}|(?:ha){2,}|(?:ah){2,})$/i.test(lower)) {
    return true;
  }
  // digits / punctuation only
  if (/^[\d\s.,!?'"()-]+$/u.test(t)) return true;

  return false;
}
