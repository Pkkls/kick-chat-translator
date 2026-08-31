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
import { isLaughter } from '~/shared/laughter';

/**
 * Une promenade sur une rangee du clavier, pas un mot.
 *
 * Le martelement est frequent et couteux : mesure sur quinze formes attestees,
 * dont le turc `askfhsjkd` et l'espagnol `asdasdasd`, ZERO n'etait ecarte. Les
 * quinze partaient au moteur, et trois en ressortaient avec une langue :
 * `asdasdasd` portugais, `zxcvbnm` espagnol, `hjkhjkhjk` neerlandais. Une langue
 * fausse sur un message qui n'en a aucune.
 *
 * Le critere est la proportion de paires de lettres voisines qui vivent sur la
 * MEME rangee du clavier. Le critere evident, l'absence de voyelles, a ete
 * mesure et jete : le tcheque a de vrais mots sans voyelle, `krk`, `prst`,
 * `smrt`, et un filtre qui les avale ecarte de la parole en silence.
 *
 * Seuils choisis sur mesure, pas au jugement. Contre quinze martelements et
 * quarante mots reels pris dans le pire cas, consonnes alignees des langues
 * slaves comprises : a 0,6 il reste deux faux positifs, `wzglad` et `jugada` ;
 * a partir de 0,65 il n'y en a plus aucun et les quinze sont pris. 0,7 laisse la
 * marge des deux cotes. Sous six lettres le signal ne veut rien dire, au-dessus
 * de sept on commence a rater `zxcvbnm`.
 *
 * Ce que ce critere ne pretend pas etre : universel. Les rangees sont celles de
 * QWERTY. Un martelement tape sur AZERTY tombe en grande partie dans les memes
 * lettres, la rangee du milieu ne differant que par ses extremites, mais ce
 * n'est pas mesure et le filtre ne s'applique qu'a un message d'un seul mot,
 * ou le doute coute le moins.
 */
const RANGEES_CLAVIER = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const MARTELEMENT_LONGUEUR_MIN = 6;
const MARTELEMENT_PROPORTION = 0.7;

export function isKeyboardSmash(text: string): boolean {
  const t = text.trim().toLowerCase();
  // Un seul mot : c'est ainsi que le martelement se tape, et restreindre la
  // regle a ce cas est ce qui garde une phrase reelle hors de portee.
  if (/\s/.test(t)) return false;
  const lettres = t.replace(/[^a-z]/g, '');
  if (lettres.length < MARTELEMENT_LONGUEUR_MIN) return false;
  if (lettres.length !== t.length) return false;

  // Un mot etire n'est pas un martelement, et il en porte pourtant la signature :
  // une lettre tenue vit forcement sur une seule rangee. Mesure : `siiiiiiii` et
  // `NOOOOOO` etaient pris a tort par la seule regle des rangees. Ce qui les
  // separe est le nombre de lettres differentes, six ou plus contre deux ou
  // trois, ou bien un GROUPE de lettres repete plutot qu'une lettre tenue :
  // `asdasdasd` est trois fois "asd", `holaaaaa` est "hola" plus un a tenu.
  // Le rire est teste avant celui-ci dans `isNoise`, donc `jajaja` et `wkwkwk`
  // n'arrivent jamais ici.
  const distinctes = new Set(lettres).size;
  const groupeRepete = /^(.{2,4})\1{2,}$/.test(lettres);
  if (distinctes < 6 && !groupeRepete) return false;

  let memeRangee = 0;
  for (let i = 0; i < lettres.length - 1; i++) {
    const a = RANGEES_CLAVIER.findIndex((r) => r.includes(lettres[i]!));
    const b = RANGEES_CLAVIER.findIndex((r) => r.includes(lettres[i + 1]!));
    if (a >= 0 && a === b) memeRangee++;
  }
  return memeRangee / (lettres.length - 1) >= MARTELEMENT_PROPORTION;
}

export function isNoise(text: string): boolean {
  const t = text.trim();
  if (!t) return true;

  // strip emoji/symbols/punct/space — if nothing meaningful remains, it's noise
  const stripped = [...t].filter((ch) => !EMOJI_OR_SYMBOL.test(ch)).join('');
  if (stripped.length === 0) return true;

  const lower = stripped.toLowerCase();
  // single character repeated (wwww, ーーー, 草草草, !!!)
  if (/^(.)\1*$/u.test(lower)) return true;
  // Le rire vit dans `~/shared/laughter`, une table par langue avec ses
  // sources, plutot qu'une alternation grossie a la main ici. Elle sert deux
  // fois : reconnaitre un message qui n'est que du rire, et dire de quelle
  // langue une forme releve quand elle en marque une.
  if (isLaughter(lower)) return true;
  // Sur le texte ORIGINAL, pas sur `lower` : le filtrage ci-dessus retire les
  // espaces, et le martelement se reconnait a ce qu'il est d'un seul mot. Passe
  // la version sans espaces, "hahaha ha que risa" devient un mot de quinze
  // lettres majoritairement sur la rangee du milieu, donc du martelement.
  if (isKeyboardSmash(t)) return true;
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
