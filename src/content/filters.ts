import { COMMON_BOTS } from '~/shared/constants';
import { foldCase } from '~/shared/normalize';
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
  const user = foldCase(meta.username);
  if (settings.blacklistUsers.some((u) => foldCase(u) === user)) return 'user_blacklisted';
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

const baseLang = (code: string): string => code.toLowerCase().split('-')[0] ?? code.toLowerCase();

/**
 * Same language as the target? Compares base languages so regional variants count
 * as a match (pt ≡ pt-BR, zh ≡ zh-TW) — no point translating a message that's
 * already in the reader's language.
 */
export function isSameLanguageAsTarget(detected: string | undefined, target: string): boolean {
  if (!detected) return false;
  return baseLang(detected) === baseLang(target);
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
  // laughter variants across languages:
  //  EN wwww/lol/lolol/haha · BR-PT kkkk/rsrs/huehue · ES jaja · xd/xddd · hehe/hihi · uwu/owo
  // `(xd){2,}` en plus de `x+d+` : la syllabe repetee est la forme courante et
  // elle passait. Mesure sur la fonction livree : xd, xdd, xddd ecartes, xdxd,
  // xdxdxd, xdxdxdxd et XDXDXD traduits, alors que jaja, haha, rsrs, huehue,
  // lolol, hehe et hihi le sont tous sous leur forme repetee.
  if (
    /^(?:w+|ｗ+|k{2,}|x{2,}|x+d+|(?:xd){2,}|(?:rs)+|(?:hue)+|(?:l+o+)+l*|(?:ja){2,}|(?:ha){2,}|(?:ah){2,}|(?:he){2,}|(?:hi){2,}|u?wu|owo)$/i.test(
      lower,
    )
  ) {
    return true;
  }
  // digits / punctuation only
  if (/^[\d\s.,!?'"()-]+$/u.test(t)) return true;

  return false;
}

/**
 * Flatten stretched characters, for a second attempt at a line the engine refused.
 *
 * NOT used as a preprocessing step, and that is the whole point. Measured against
 * Google on real chat: it already handles some stretching well, "sooo goood" comes
 * back as "tellement bon", and flattening first turns that into "alors mon Dieu".
 * Normalising every line trades one failure for another.
 *
 * What it does rescue is the lines the engine hands straight back untranslated:
 * "BINNNNNNNGOOOOOOO" and "muuuuy biennnn" return unchanged, and flattened they
 * become "BINGO" and "très bien". So this runs only after that has happened, where
 * it cannot make anything worse than the nothing already obtained.
 *
 * Repeats only. An isolated Japanese prolongation is deliberately left alone: it
 * carries meaning, and stripping it turns コーヒー into コヒ, ラーメン into ラメン and
 * スーパー into スパ. Elongation of the おーわーりー kind is therefore not handled,
 * because no rule tested here separates it from a real word without a dictionary.
 */
export function normalizeElongation(text: string): string {
  return text
    // Three or more of the same letter is not a word in any language we target.
    .replace(/(\p{L})\1{2,}/gu, '$1')
    // Repeated prolongation marks; a single one is left in place.
    .replace(/ー{2,}/gu, 'ー')
    .replace(/([!?！？])\1{2,}/gu, '$1$1')
    .trim();
}
