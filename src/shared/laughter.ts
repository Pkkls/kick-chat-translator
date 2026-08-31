/**
 * Written laughter, by language.
 *
 * Why this file exists. Laughter is the most repeated thing in a chat and the
 * hardest for a language detector: franc is unreliable below about twenty
 * characters and "kkkkk" is five. Until now the product handled it in two
 * unrelated places, both grown by hand: an alternation inside `isNoise` that
 * covered about ten forms, and two French entries sitting in the short-word
 * table because somebody hit them. Measured on the shipped function before this
 * file existed: jaja, haha, rsrs, huehue, lolol, hehe and hihi were all skipped
 * in their repeated form, and xdxd was translated, because the pattern carried
 * `x+d+` and not the repeated syllable.
 *
 * Nothing reusable exists to import. The academic work on social-media text
 * normalisation treats laughter as a category to strip and publishes no lexicon;
 * the popular write-ups are prose, not data; the one machine-readable list found
 * on GitHub carries no licence at all, so it could not be used even as a
 * starting point. What is not anybody's property is the linguistic fact that
 * Thai writes 555 and Indonesian writes wkwk, and those facts are what this
 * table records, each with where it is attested.
 *
 * Sources, all consulted 2026-08-31 and cross-checked against each other:
 *   preply.com/en/d/laughing-around-the-world-map--lp  (26 languages)
 *   restofworld.org/2023/how-people-laugh-online       (journalism, widest set)
 *   blog.duolingo.com/laughter-in-different-languages
 *
 * The table does two jobs. It says whether a message is nothing but laughter,
 * which saves a provider call, and it says which language a form belongs to when
 * it belongs to one unambiguously. The second job follows the rule the
 * short-word table already states about itself: an entry earns a language only
 * if it is unambiguous against common English and against the other entries.
 * `haha`, `lol` and `xd` are used everywhere and mark nothing.
 *
 * A form in a non-Latin script mostly does not need to mark anything either:
 * `detectByScript` already resolves Arabic, Hebrew, Cyrillic, Hangul, kana, Thai
 * and Devanagari from the characters alone. The entries that earn their place as
 * language marks are therefore the Latin-script and digit ones, which are
 * exactly the ones a detector cannot resolve at five characters.
 */

interface FormeDeRire {
  /** Anchored on the whole message: these are checked against a lone token. */
  motif: RegExp;
  /** ISO-2 code when the form marks a language on its own, else undefined. */
  langue?: string;
  /** What it is, and where it is attested. */
  note: string;
}

const FORMES: FormeDeRire[] = [
  // ── Latin script, marks a language ──────────────────────────────────────
  {
    motif: /^(?:ja){2,}j?a?$/i,
    langue: 'es',
    note: 'Spanish: j is pronounced as English h, so jajaja reads hahaha',
  },
  {
    motif: /^(?:je){2,}j?e?$/i,
    langue: 'es',
    note: 'Spanish jejeje, the ironic register',
  },
  {
    motif: /^(?:ji){2,}j?i?$/i,
    langue: 'es',
    note: 'Spanish jijiji, the mischievous register',
  },
  {
    motif: /^(?:js){2,}j?s?$/i,
    langue: 'es',
    note: 'Spanish jsjsjs, jaja typed with the neighbouring key',
  },
  {
    motif: /^k{3,}$/i,
    langue: 'pt',
    note: 'Brazilian Portuguese kkkk. Three or more: kk alone is too short to claim a language',
  },
  {
    motif: /^(?:rs){2,}$/i,
    langue: 'pt',
    note: 'Brazilian Portuguese rsrsrs, repeated from riso, laughter',
  },
  {
    motif: /^(?:hue){2,}h?u?e?$/i,
    langue: 'pt',
    note: 'Brazilian Portuguese huehuehue',
  },
  { motif: /^m+d+r+$/i, langue: 'fr', note: 'French mort de rire' },
  { motif: /^p+t+d+r+$/i, langue: 'fr', note: 'French pete de rire' },
  {
    motif: /^m+o?u+ha(?:ha)+h?a?$/i,
    langue: 'fr',
    note: 'French mouhahaha, the villain laugh',
  },
  { motif: /^asg$/i, langue: 'sv', note: 'Swedish, short for asgarv, uproarious laughter' },
  {
    motif: /^(?:h[oø]){1,}(?:hø)(?:h[oø])*h?[oø]?$/i,
    langue: 'da',
    note: 'Danish hohohoe. At least one slashed o is required: plain hohoho is the Santa laugh and belongs to nobody',
  },
  {
    motif: /^(?:h[aæ])*(?:hæ)(?:h[aæ])*h?[aæ]?$/i,
    langue: 'da',
    note: 'Danish haehaehae. At least one ae is required, or this swallows hahaha, which marks nothing',
  },
  {
    motif: /^(?:wk){2,}w?k?$/i,
    langue: 'id',
    note: 'Indonesian wkwkwk',
  },
  { motif: /^wa?(?:kaka)+k?a?$/i, langue: 'id', note: 'Indonesian wakaka' },
  { motif: /^(?:xi){2,}x?i?$/i, langue: 'id', note: 'Indonesian xixixi' },
  { motif: /^(?:ha3)+$/i, langue: 'ms', note: 'Malay ha3, the 3 standing for a third ha' },
  {
    motif: /^5{3,}$/,
    langue: 'th',
    note: 'Thai: five is pronounced ha, so 555 reads hahaha. Also used in Lao',
  },
  {
    motif: /^w{3,}$/i,
    langue: 'ja',
    note: 'Japanese: w for warai, laughter. Three or more, so it cannot be a bare www host',
  },
  {
    motif: /^2+3{3,}$/,
    langue: 'zh',
    note: 'Mandarin 2333. Three threes minimum: 233 on its own is the emoticon number, and a number',
  },

  // ── Non-Latin scripts. The script check resolves the language already, so
  //    these earn their place by being recognised as laughter, not as marks.
  { motif: /^[ха]*(?:ах|ха){2,}[ха]*$/i, note: 'Cyrillic hahaha and ahahaha' },
  { motif: /^г{3,}$/i, note: 'Cyrillic gggg, the older Slavic form' },
  { motif: /^(?:хα|χα){2,}χ?α?$/i, langue: 'el', note: 'Greek chacha. Greek script is not in the script pre-check' },
  { motif: /^(?:χ[εοι]){2,}$/i, langue: 'el', note: 'Greek cheche, chocho and chichi' },
  { motif: /^ه{3,}$/, note: 'Arabic hhh' },
  { motif: /^خ{3,}$/, note: 'Arabic and Persian khkhkh' },
  { motif: /^ח{3,}$/, note: 'Hebrew chchch' },
  { motif: /^[ㅋㅎ]{2,}$/, note: 'Korean jamo kk and hh typed on their own' },
  { motif: /^(?:哈){2,}$/, note: 'Mandarin haha' },
  { motif: /^(?:呵){2,}$/, note: 'Mandarin hehe, the dry register' },
  { motif: /^(?:草|大草原)$/, note: 'Japanese grass, from www looking like blades of it' },
  { motif: /^(?:हा){2,}$/, note: 'Devanagari haha' },
  { motif: /^(?:হা\s?){2,}$/, note: 'Bengali haha' },

  // ── Latin script, marks nothing: used across too many languages ──────────
  { motif: /^a*(?:ha){2,}h?a*$/i, note: 'hahaha, everywhere' },
  { motif: /^(?:he){2,}h?e?$/i, note: 'hehehe, everywhere' },
  { motif: /^(?:hi){2,}h?i?$/i, note: 'hihihi, everywhere including Vietnamese' },
  { motif: /^(?:ah){2,}a?$/i, note: 'ahahah, common in Italian and Turkish' },
  { motif: /^l+o+l+(?:o+l+)*$/i, note: 'lol and lolol' },
  { motif: /^l+m+f?a+o+$/i, note: 'lmao and lmfao' },
  { motif: /^rofl$/i, note: 'rofl, rolling on the floor laughing, borrowed into many languages' },
  {
    motif: /^(?:x+d+|(?:xd){2,})$/i,
    note: 'xd and xdxd. The repeated syllable was the form that used to slip through',
  },
  { motif: /^ke+k+(?:w)?$/i, note: 'kek and kekw, from streaming chat' },
  { motif: /^u?wu$|^owo$/i, note: 'uwu and owo' },
];

/** Every message that is nothing but laughter, in any of the forms above. */
export function isLaughter(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return FORMES.some((f) => f.motif.test(t));
}

/**
 * The language a lone laugh belongs to, when it belongs to one.
 *
 * Returns undefined for `haha`, `lol`, `xd` and every other form used across
 * languages. A wrong answer here is worse than none: it would be handed to the
 * engine as the source language.
 */
export function laughterLanguage(text: string): string | undefined {
  const t = text.trim();
  if (!t) return undefined;
  for (const f of FORMES) {
    if (f.langue && f.motif.test(t)) return f.langue;
  }
  return undefined;
}

/** For tests and for anyone auditing the table rather than trusting it. */
export const LAUGHTER_FORMS: ReadonlyArray<Readonly<FormeDeRire>> = FORMES;
