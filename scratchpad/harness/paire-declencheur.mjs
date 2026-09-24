/**
 * QUEL MOT OUVRIRAIT LA PORTE MALAIS-INDONESIEN, et pour combien de lignes.
 *
 * `porte-diagnostic.mjs` a etabli le diagnostic : sur les trente lignes
 * malaises du corpus de reglage, VINGT-QUATRE ont la porte FERMEE. Le jeu de
 * mots malais derriere n'y est pour rien, il n'est jamais consulte. Ce qui
 * manque est le DECLENCHEUR, la liste des mots que les deux langues partagent.
 *
 * Ce script le cherche. Il prend les tokens du corpus de REGLAGE, qui est celui
 * sur lequel on a le droit de lire, et pour chacun il demande deux choses :
 *
 *   combien de lignes aujourd hui muettes il ouvrirait
 *   et surtout : quelle AUTRE langue l ecrit
 *
 * La deuxieme est celle qui decide, et elle est plus dure qu elle n en a l air.
 * Un declencheur qui prend sur une ligne tcheque ouvre la porte sur du tcheque,
 * et derriere la porte `je`, `tak` et `dah` nomment le malais : le francais, le
 * tcheque et le turc partent au malais d un coup. C est exactement le defaut
 * que le protocole 4.10 nomme, et il a deja coute des lignes deux fois.
 *
 * Un candidat n est donc retenu que si sa colonne "ailleurs" est VIDE sur les
 * 6170 lignes etiquetees de tous les corpus.
 *
 * LE GARDE : un `\p{L}` ecrit dans un heredoc de shell devient `p{L}`, quatre
 * caracteres litteraux, et les bornes de mot cessent de borner sans que rien
 * n echoue. Ca a fausse deux passes entieres de cette branche.
 *
 *   node --import tsx scratchpad/harness/paire-declencheur.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_NL } from '../../src/content/langChatNonLatin.ts';
import { LANG_CHAT_DIX } from '../../src/content/langChatDixCorpus.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const source = readFileSync(new URL(import.meta.url), 'utf8');
if (!/\[\^\\{1,2}p\{L\}\]/.test(source)) {
  console.error('La borne de mot a ete mangee a l ecriture. Rien de ce qui suit ne vaut.');
  process.exit(1);
}

/** Les trois listes, relues dans la source pour ne pas les retaper. */
function depuisLaSource(nom) {
  const src = readFileSync('src/content/langDetect.ts', 'utf8');
  const bloc = new RegExp(`const ${nom} =\\s*\\n?\\s*(/[^\\n]*/[a-z]*);`).exec(src);
  if (!bloc) throw new Error(`${nom} introuvable`);
  const m = bloc[1];
  const corps = m.slice(1, m.lastIndexOf('/'));
  const mots = /\(([a-zA-Z|]+)\)/.exec(corps.replace(/\(\^\|\[\^\\p\{L\}\]\)/, ''));
  return { re: new RegExp(corps, m.slice(m.lastIndexOf('/') + 1)), mots: mots ? mots[1].split('|') : [] };
}

const DECLENCHEUR = depuisLaSource('MOTS_MALAIS_INDONESIENS');
const JEU_ID = depuisLaSource('MOTS_INDONESIENS');
const JEU_MS = depuisLaSource('MOTS_MALAIS');
const dejaPris = new Set([...DECLENCHEUR.mots, ...JEU_ID.mots, ...JEU_MS.mots]);
console.log(
  `declencheur ${DECLENCHEUR.mots.length} mots, jeu id ${JEU_ID.mots.length}, jeu ms ${JEU_MS.mots.length}.\n`,
);

/** Toutes les lignes etiquetees, paire de reglage exclue de la colonne "ailleurs". */
const ailleurs = [];
for (const c of [
  LANG_CORPUS,
  LANG_CHAT,
  LANG_CHAT2,
  LANG_CHAT3,
  LANG_CHAT_NL,
  LANG_CHAT_DIX,
  LANG_CHAT_PAIRE,
  LANG_CHAT_PAIRE_REGLAGE,
]) {
  for (const [lang, lignes] of Object.entries(c)) {
    if (lang === 'ms' || lang === 'id') continue;
    for (const t of lignes) ailleurs.push([lang, t]);
  }
}
console.log(`${ailleurs.length} lignes etiquetees hors de la paire.\n`);

/** Les lignes de reglage que la porte laisse muettes aujourd hui. */
const muettes = [];
for (const [lang, lignes] of Object.entries(LANG_CHAT_PAIRE_REGLAGE)) {
  for (const t of lignes) {
    if (confidentLanguage(t) === undefined && !DECLENCHEUR.re.test(t)) muettes.push([lang, t]);
  }
}
console.log(`${muettes.length} lignes de reglage ont la porte FERMEE.\n`);

/** Les tokens de ces lignes-la, par frequence. */
const compte = new Map();
for (const [, t] of muettes) {
  for (const mot of new Set(t.toLowerCase().match(/[a-z]+/g) ?? [])) {
    compte.set(mot, (compte.get(mot) ?? 0) + 1);
  }
}

const lignes = [];
for (const [mot, n] of compte) {
  if (n < 2) continue;
  if (dejaPris.has(mot)) continue;
  const re = new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, 'iu');
  const vus = new Map();
  for (const [lang, t] of ailleurs) if (re.test(t)) vus.set(lang, (vus.get(lang) ?? 0) + 1);
  lignes.push([mot, n, [...vus.entries()].map(([l, k]) => `${l}=${k}`).join(' ')]);
}
lignes.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

console.log('mot          ouvre   ailleurs (une seule ligne suffit a refuser)');
for (const [mot, n, det] of lignes) {
  console.log(`  ${mot.padEnd(12)} ${String(n).padStart(3)}   ${det || 'RIEN'}`);
}

const propres = lignes.filter(([, , d]) => !d);
console.log(
  `\n${propres.length} candidats propres sur ${lignes.length}. Ils n ouvrent la porte que si\n` +
    'le jeu de la langue a quelque chose derriere : les deux moities se mesurent\n' +
    'ENSEMBLE, separement elles rendent zero toutes les deux.',
);

/**
 * LES CANDIDATS MORPHOLOGIQUES, et c'est ce que la file de travail demande.
 *
 * Un declencheur fait de mots pleins memorise le corpus : `kucing`, `klinik` et
 * `bola` sont des mots qu'il faut avoir vus. La morphologie, elle, ne memorise
 * rien : le malais et l'indonesien collent tous les deux `-nya`, `-kan`, `-lah`
 * et les prefixes `ber-`, `meng-`, `ter-`, et une ligne qui en porte un est de
 * la paire quel que soit son vocabulaire.
 *
 * Meme regle qu'au-dessus : une seule ligne ailleurs suffit a refuser.
 */
const MORPHO = [
  ['-nya (3 lettres devant)', String.raw`\p{L}{3,}nya([^\p{L}]|$)`],
  ['-kan (3 lettres devant)', String.raw`\p{L}{3,}kan([^\p{L}]|$)`],
  ['-lah (3 lettres devant)', String.raw`\p{L}{3,}lah([^\p{L}]|$)`],
  ['ber- en tete de mot', String.raw`(^|[^\p{L}])ber\p{L}{3,}`],
  ['meng- en tete de mot', String.raw`(^|[^\p{L}])meng\p{L}{2,}`],
  ['ter- en tete de mot', String.raw`(^|[^\p{L}])ter\p{L}{3,}`],
  ['mem- en tete de mot', String.raw`(^|[^\p{L}])mem\p{L}{3,}`],
  ['peng- en tete de mot', String.raw`(^|[^\p{L}])peng\p{L}{2,}`],
  ['se- + reduplication', String.raw`(^|[^\p{L}])se\p{L}{3,}`],
];

console.log('\nmotif                      ouvre   ailleurs');
for (const [nom, motif] of MORPHO) {
  const re = new RegExp(motif, 'iu');
  const ouvre = muettes.filter(([, t]) => re.test(t)).length;
  const vus = new Map();
  for (const [lang, t] of ailleurs) if (re.test(t)) vus.set(lang, (vus.get(lang) ?? 0) + 1);
  const det = [...vus.entries()].sort((a, b) => b[1] - a[1]).map(([l, k]) => `${l}=${k}`).join(' ');
  console.log(`  ${nom.padEnd(24)} ${String(ouvre).padStart(3)}   ${det || 'RIEN'}`);
}

/**
 * OU LA PORTE S'OUVRE-T-ELLE HORS DE LA PAIRE, et c'est la question de surete.
 *
 * Derriere la porte, un mot du jeu malais ou indonesien nomme la langue sans
 * autre controle. Tant que la porte ne s'ouvre que sur du malais et de
 * l'indonesien, les deux jeux peuvent contenir des mots courts et communs. Des
 * qu'elle s'ouvre ailleurs, chaque mot court des deux jeux devient un piege.
 *
 * Cette liste est donc la contrainte qui borne les deux jeux, et elle se relit
 * avant d'y ajouter quoi que ce soit.
 */
const horsPaire = ailleurs.filter(([, t]) => DECLENCHEUR.re.test(t));
const parLangue = new Map();
for (const [lang] of horsPaire) parLangue.set(lang, (parLangue.get(lang) ?? 0) + 1);
console.log(`\n${horsPaire.length} lignes HORS PAIRE ouvrent la porte :`);
for (const [lang, n] of [...parLangue.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${lang.padEnd(6)} ${n}`);
}
for (const [lang, t] of horsPaire.slice(0, 25)) console.log(`    ${lang.padEnd(6)} ${t.slice(0, 64)}`);
