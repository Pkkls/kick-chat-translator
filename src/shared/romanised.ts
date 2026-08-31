/**
 * Les langues ecrites en lettres latines qui ne s'ecrivent pas ainsi.
 *
 * Un lecteur russe, grec ou japonais tape souvent son message au clavier latin,
 * sans changer de disposition. Le texte reste sa langue et perd son ecriture,
 * donc le pre-controle par ecriture ne voit rien et le detecteur, qui ne connait
 * que des lettres latines, repond pour une langue latine.
 *
 * Ce que cela coutait, mesure avant d'ecrire une ligne :
 *
 *   privet kak dela segodnya      -> id     (indonesien)
 *   spasibo bolshoe za stream     -> cs
 *   pozhaluysta pomogite mne      -> it
 *   khorosho ochen khorosho       -> sv
 *   nichego ne ponyatno           -> pl
 *   ti kaneis re file einai kalo  -> rien
 *   konnichiwa minna genki desu ka-> rien
 *
 * Le russe est le pire des trois : une reponse fausse mais assuree. Avec une
 * liste de langues sources autorisee il sort en `lang_not_allowed`, et avec
 * l'indonesien pour cible il n'est pas traduit du tout, puisque le produit le
 * croit deja dans la langue du lecteur.
 *
 * LA REGLE D'ADMISSION, celle que la table des mots courts se donne deja : une
 * entree ne merite une langue que si elle est sans ambiguite contre l'anglais
 * courant ET contre les autres entrees. C'est ce qui exclut d'emblee les mots
 * japonais passes dans l'argot internet anglais, `kawaii`, `sugoi`, `senpai`,
 * `baka`, `desu`, `sensei`, qu'un anglophone ecrit sans parler un mot de
 * japonais. Meme raison pour le grec `malaka`, et pour `davai` ou `net` en
 * russe, trop courts ou trop communs ailleurs.
 *
 * Mesure sur vingt phrases translitterees et vingt pieges, ceux ci-dessus
 * compris : vingt marquees, zero faux positif.
 *
 * CE N'EST PAS UNE REPONSE SURE, pour la meme raison que l'arabizi. Ce que rend
 * `confidentLanguage` part au moteur comme langue source, et annoncer `sl=ru`
 * sur un texte en lettres latines demande au moteur de lire du cyrillique la ou
 * il n'y en a pas. Ces marqueurs alimentent la detection ordinaire, qui nourrit
 * les filtres et le drapeau montre au lecteur ; le moteur continue de deviner.
 */

/** Marqueurs par langue, chacun choisi pour n'exister que la une fois romanise. */
const MARQUEURS: Record<string, readonly string[]> = {
  ru: [
    'privet', 'spasibo', 'pozhaluysta', 'khorosho', 'nichego', 'ochen',
    'konechno', 'zdravstvuyte', 'ponyatno', 'pravda', 'pobeda', 'bolshoe',
  ],
  el: [
    'kalimera', 'kalispera', 'kaneis', 'kanete', 'efharisto', 'ginetai',
    'katalava', 'tipota', 'paidia', 'simera', 'ekanes',
  ],
  ja: [
    'konnichiwa', 'arigatou', 'gozaimasu', 'ohayou', 'yoroshiku',
    'onegaishimasu', 'kudasai', 'ganbatte', 'subarashii',
  ],
};

const TABLE = new Map<string, string>();
for (const [langue, mots] of Object.entries(MARQUEURS)) {
  for (const m of mots) TABLE.set(m, langue);
}

/**
 * La langue d'un message ecrit en lettres latines mais qui n'est pas latin.
 *
 * Le vote suit la meme regle que la table des mots courts : deux marqueurs qui
 * ne s'accordent pas annulent la reponse, parce qu'un message qui porte a la
 * fois un marqueur russe et un marqueur grec n'est pas plus l'un que l'autre.
 */
export function romanisedLanguage(text: string): string | undefined {
  let vote: string | undefined;
  for (const jeton of text.toLowerCase().split(/[^\p{L}]+/u)) {
    const langue = jeton ? TABLE.get(jeton) : undefined;
    if (!langue) continue;
    if (vote && vote !== langue) return undefined;
    vote = langue;
  }
  return vote;
}

/** Pour les tests et pour qui veut auditer la table plutot que la croire. */
export const ROMANISED_MARKERS = MARQUEURS;
