import { franc } from 'franc-min';
import { francToIso2 } from '~/shared/languages';
import { laughterLanguage } from '~/shared/laughter';
import { isArabizi } from '~/shared/arabizi';
import { romanisedLanguage } from '~/shared/romanised';

const COMMON_SHORT_TOKENS = new Set([
  'lol',
  'lmao',
  'lmfao',
  'omg',
  'wtf',
  'gg',
  'ggs',
  'ez',
  'wp',
  'kek',
  'rip',
  'bruh',
  'bro',
  'sus',
  'yo',
  'hi',
  'hey',
  'haha',
  'yes',
  'no',
  'ok',
  'okay',
  'nice',
  'good',
  'bad',
  'pog',
  'pogchamp',
  'kappa',
  'omegalul',
  'monkas',
]);

/**
 * Chat words that identify their language on their own.
 *
 * franc is unreliable below ~20 characters: it returns 'und', the ASCII check
 * below then calls the message English, and `ignoreEnglish` silently drops it.
 * A short foreign message is therefore the case most likely to be missed, so
 * these words are checked first. Entries must be unambiguous against common
 * English and against each other, which is why near-twins across Spanish and
 * Portuguese ("gente", "vamos", "cara") are deliberately absent.
 */
const SHORT_WORD_LANG = new Map<string, string>([
  ['hola', 'es'], ['gracias', 'es'], ['buenas', 'es'], ['buenos', 'es'], ['adios', 'es'],
  ['adiós', 'es'], ['vale', 'es'], ['venga', 'es'], ['joder', 'es'], ['oye', 'es'],
  ['chaval', 'es'], ['hostia', 'es'], ['mucho', 'es'], ['muchas', 'es'], ['siempre', 'es'],
  ['entonces', 'es'], ['también', 'es'], ['tambien', 'es'], ['ahora', 'es'],

  ['salut', 'fr'], ['bonjour', 'fr'], ['bonsoir', 'fr'], ['merci', 'fr'], ['oui', 'fr'],
  ['ouais', 'fr'], ['voilà', 'fr'], ['voila', 'fr'], ['putain', 'fr'], ['mdr', 'fr'],
  ['ptdr', 'fr'], ['quoi', 'fr'], ['alors', 'fr'], ['toujours', 'fr'], ['jamais', 'fr'],
  ['beaucoup', 'fr'], ['très', 'fr'], ['pourquoi', 'fr'], ['enfin', 'fr'],

  ['obrigado', 'pt'], ['obrigada', 'pt'], ['valeu', 'pt'], ['mano', 'pt'], ['saudade', 'pt'],
  ['você', 'pt'], ['voce', 'pt'], ['então', 'pt'], ['entao', 'pt'], ['muito', 'pt'],
  ['muita', 'pt'], ['beleza', 'pt'], ['caralho', 'pt'], ['porra', 'pt'], ['rapaz', 'pt'],
  ['também', 'pt'], ['tambem', 'pt'],

  ['danke', 'de'], ['hallo', 'de'], ['tschüss', 'de'], ['bitte', 'de'], ['nicht', 'de'],
  ['doch', 'de'], ['geil', 'de'], ['krass', 'de'], ['vielen', 'de'], ['gerne', 'de'],
  ['wirklich', 'de'], ['natürlich', 'de'], ['warum', 'de'], ['weil', 'de'], ['aber', 'de'],
  ['immer', 'de'], ['nein', 'de'],

  ['ciao', 'it'], ['grazie', 'it'], ['prego', 'it'], ['allora', 'it'], ['perché', 'it'],
  ['perche', 'it'], ['però', 'it'], ['quindi', 'it'], ['davvero', 'it'], ['ragazzi', 'it'],
  ['cazzo', 'it'], ['magari', 'it'], ['comunque', 'it'], ['anche', 'it'], ['adesso', 'it'],
  ['oggi', 'it'],

  ['selam', 'tr'], ['merhaba', 'tr'], ['tamam', 'tr'], ['güzel', 'tr'], ['guzel', 'tr'],
  ['kanka', 'tr'], ['teşekkür', 'tr'], ['tesekkur', 'tr'], ['evet', 'tr'], ['hayır', 'tr'],
  ['hayir', 'tr'], ['kardeşim', 'tr'],
]);

/**
 * Longest message still treated as "short" for detection purposes.
 *
 * Monte a 30, mesure, et redescendu. Le gain etait reel : sur 13 lignes
 * etrangeres de 23 a 31 caracteres portant un mot de la table, 10 lues juste a
 * 20 et 12 a 30, et sur 8 lignes anglaises portant elles aussi un mot de la
 * table le degat restait a 2, un veto sur un `eng` explicite de franc payant
 * l'ecart. Ce que ce banc-la ne pouvait pas voir, c'est le message qui change de
 * langue en cours de route. Sur 8 lignes melangees, passer de 20 a 30 fait
 * passer les lignes tuees avant l'appel de 3 a 6 et les `sl` declares sur une
 * seule moitie de 0 a 4 : "merci bro that was insane" part alors au moteur en
 * `sl=fr` et disparait pour un lecteur francophone. Le veto ne rattrape rien la,
 * franc ne rend `eng` sur aucune des 8.
 *
 * La borne tient donc a 20 parce que le melange de langues est plus frequent
 * dans un chat que la phrase etrangere de 25 caracteres, pas parce que 20 aurait
 * ete mesure comme optimal.
 */
const SHORT_TEXT_MAX = 20;

/** Unanimous vote from the lexicon, or undefined when the words disagree. */
function detectByShortWords(text: string): string | undefined {
  let vote: string | undefined;
  for (const token of text.toLowerCase().split(/[^\p{L}]+/u)) {
    // Une forme de rire est un fait sur le texte au meme titre qu'un mot de la
    // table : `jajaja` est espagnol, `kkkk` bresilien, `wkwk` indonesien. C'est
    // ce qui permet a `confidentLanguage` de s'en servir, alors qu'il refuse la
    // reponse de franc. `haha`, `lol` et `xd` ne marquent rien et ne votent pas.
    const lang = token ? (SHORT_WORD_LANG.get(token) ?? laughterLanguage(token)) : undefined;
    if (!lang) continue;
    if (vote && vote !== lang) return undefined;
    vote = lang;
  }
  return vote;
}

/** Unicode script → language mapping. More reliable than franc on short texts. */
function detectByScript(text: string): string | undefined {
  // Count non-ASCII, non-space chars by script range.
  let han = 0; // CJK ideographs — ambiguous between Chinese and Japanese
  let kana = 0; // hiragana / katakana — exclusive to Japanese
  let hangul = 0;
  let arabic = 0;
  let cyrillic = 0;
  // L'hebreu est aussi peu ambigu que l'arabe depuis son ecriture, et il
  // manquait. Mesure : franc-min ne le couvre pas du tout, il rend `und` sur une
  // phrase hebraique complete, donc `detectLanguage` rendait undefined et le
  // pipeline ecartait le message pour langue inconnue. L'hebreu est pourtant une
  // des 42 langues proposees et la fiche des stores annonce l'ecriture de droite
  // a gauche par "arabe, hebreu, persan".
  let hebrew = 0;
  let thai = 0;
  let devanagari = 0;
  let total = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c <= 0x7f || /\s/.test(ch)) continue;
    total++;
    if (c >= 0x3040 && c <= 0x30ff) kana++;
    else if ((c >= 0x3400 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff)) han++;
    // Syllables, plus the compatibility jamo Korean chat writes on their own
    // (ㅋㅋ, ㅠㅠ, ㅇㅇ). Without them those letters counted toward the total while
    // feeding no script, which pushed a short line below the majority threshold.
    else if ((c >= 0xac00 && c <= 0xd7af) || (c >= 0x3130 && c <= 0x318f)) hangul++;
    else if (c >= 0x0600 && c <= 0x06ff) arabic++;
    else if (c >= 0x0590 && c <= 0x05ff) hebrew++;
    else if (c >= 0x0400 && c <= 0x04ff) cyrillic++;
    else if (c >= 0x0e00 && c <= 0x0e7f) thai++;
    else if (c >= 0x0900 && c <= 0x097f) devanagari++;
  }
  if (total < 2) return undefined;
  const pct = (n: number) => n / total > 0.5;
  // Any kana ⇒ Japanese (Chinese never uses it). Pure Han is ambiguous → defer to
  // franc so Chinese isn't mislabelled as Japanese.
  if (kana > 0) return 'ja';
  if (pct(hangul)) return 'ko';
  if (pct(han)) return undefined;
  if (pct(arabic)) return 'ar';
  if (pct(hebrew)) return 'he';
  if (pct(cyrillic)) return 'ru';
  if (pct(thai)) return 'th';
  if (pct(devanagari)) return 'hi';
  return undefined;
}

/**
 * Detect language with hybrid approach: Unicode script check first (reliable
 * for CJK/Arabic/Cyrillic/etc.), then franc-min for Latin scripts.
 * Returns ISO-2 code or undefined when not confident enough.
 * Returns 'en' for short trivial chat tokens that franc cannot resolve.
 */
/**
 * The paths that read the text rather than guess at it: the trivial-token table,
 * the chat-word lexicon, and the Unicode script check. Everything here is a lookup,
 * so a hit is a fact about the text, not a probability.
 */
function detectByLookup(trimmed: string): string | undefined {
  // ASCII short message: probably English chat-speak
  const lower = trimmed.toLowerCase();
  if (trimmed.length < 12 && /^[a-z0-9\s!?.,'-]+$/.test(lower)) {
    const tokens = lower.split(/\s+/).filter(Boolean);
    if (tokens.every((t) => COMMON_SHORT_TOKENS.has(t.replace(/[^a-z0-9]/g, '')))) {
      return 'en';
    }
  }

  // Short Latin message: a known chat word beats franc, which guesses at this length.
  if (trimmed.length <= SHORT_TEXT_MAX) {
    const byWord = detectByShortWords(trimmed);
    if (byWord) return byWord;
  }

  // Unicode script pre-check: more reliable than franc on short texts.
  // CJK, Arabic, Cyrillic etc. are unambiguous from their script alone.
  return detectByScript(trimmed);
}

/**
 * The language only when it was looked up rather than guessed, so it is safe to
 * hand to a translation engine as the source language.
 *
 * Franc's answer and the pure-ASCII fallback are deliberately withheld. Measured
 * on saved chat, franc got 16 of 85 Spanish lines and 13 of 51 Turkish lines
 * right; forcing one of its wrong answers on the engine makes it translate from
 * a language the text is not in, which either returns the text unchanged (the
 * line is then dropped without a word) or returns something that is not what was
 * said. Sending nothing lets the engine detect the language itself.
 */
export function confidentLanguage(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed.length === 0 ? undefined : detectByLookup(trimmed);
}

export function detectLanguage(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) return undefined;

  const lookedUp = detectByLookup(trimmed);
  if (lookedUp) return lookedUp;

  // L'arabizi, apres la recherche en table et avant franc.
  //
  // Il n'est pas dans `detectByLookup` a dessein : ce que cette fonction rend
  // part au moteur comme langue source via `confidentLanguage`, et annoncer
  // `sl=ar` sur du texte en lettres latines n'a pas ete mesure. Ici, la reponse
  // alimente les filtres et le drapeau, et le moteur continue de deviner seul.
  //
  // Ce que cela repare : avec une liste de langues sources autorisee, un message
  // arabizi sortait en `lang_unknown`, donc un lecteur arabophone qui restreint
  // ses sources a `ar` perdait exactement les messages qu'il voulait lire.
  // Les langues ecrites au clavier latin sans l'etre : russe, grec, japonais
  // romanises. Meme place et meme raison que l'arabizi : la reponse nourrit les
  // filtres et le drapeau, pas le `sl` envoye au moteur, parce qu'annoncer une
  // ecriture qui n'est pas dans le texte n'a pas ete mesure.
  const romanise = romanisedLanguage(trimmed);
  if (romanise) return romanise;

  if (isArabizi(trimmed)) return 'ar';

  const francCode = franc(trimmed, { minLength: 3 });
  if (francCode === 'und') {
    // Heuristic: pure ASCII = probably English
    if (/^\p{ASCII}+$/u.test(trimmed)) return 'en';
    return undefined;
  }
  return francToIso2(francCode);
}

export function isLikelyEnglish(text: string): boolean {
  return detectLanguage(text) === 'en';
}
