/**
 * Le diff complet, V0 contre l'arbre de travail, sur les six corpus.
 *
 * Protocole section 4.2 : un total stable peut cacher une erreur echangee
 * contre une autre, donc c'est la carte de confusions qui decide, cle par cle.
 * V0 est `git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts`,
 * a supprimer avant la gate, le garde statique de langMatrix.test.ts le voit.
 *
 *   node --import tsx scratchpad/harness/porte-diff.mjs
 */
import { runMatrix } from '../../src/content/langMatrix.ts';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_NL } from '../../src/content/langChatNonLatin.ts';
import { LANG_CHAT_DIX } from '../../src/content/langChatDixCorpus.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { LANG_MIXED } from '../../src/content/langMixedCorpus.ts';
import * as neuf from '../../src/content/langDetect.ts';
import * as vieux from '../../src/content/langDetectV0.ts';

/**
 * Diacritiques retirees, comme le fait un clavier presse. Copie de la fonction
 * de `langChat.test.ts` : si l'une des deux bouge, l'autre doit suivre.
 */
const MARQUES = /[̀-ͯ]/g;
const sansDiacritiques = (t) =>
  t
    .normalize('NFD')
    .replace(MARQUES, '')
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/đ/g, 'd')
    .replace(/ı/g, 'i');
const nu = (corpus) =>
  Object.fromEntries(Object.entries(corpus).map(([l, v]) => [l, v.map(sansDiacritiques)]));

const BANCS = [
  ['tatoeba', LANG_CORPUS],
  ['chat1-flatte', LANG_CHAT],
  ['chat2-AVEUGLE', LANG_CHAT2],
  ['chat3-reglage', LANG_CHAT3],
  ['non-latin', LANG_CHAT_NL],
  // Les quatre langues non latines dont le produit PARLE la langue, cent lignes
  // de chat. Elles vivaient en dur dans langDetect.dix.test.ts, donc ce diff ne
  // les voyait pas : un lot a fait taire trois lignes arabes d'ici pendant que
  // les neuf autres bancs disaient AUCUNE confusion nouvelle.
  ['chat-dix', LANG_CHAT_DIX],
  // La paire malais-indonesien, en registre familier. Le premier MESURE, le
  // second est celui sur lequel on a le droit de choisir. Les lire dans cet
  // ordre : un gain sur le reglage seul ne prouve rien.
  ['paire-AVEUGLE', LANG_CHAT_PAIRE],
  ['paire-reglage', LANG_CHAT_PAIRE_REGLAGE],
  // LE CLAVIER, et sans ce banc une ablation ment. La moitie des entrees de
  // lexique existent en double, forme accentuee et forme nue, et la forme nue ne
  // sert QUE sur des lignes tapees vite. Aucun autre banc n'en contient, donc
  // une ablation qui s'arrete au-dessus conclut que `khong`, `loti` et `kapec`
  // sont morts, et elle casserait le seul cas pour lequel ils ont ete ecrits.
  ['chat1-SANS-DIACRITIQUES', nu(LANG_CHAT)],
  // ET TATOEBA DEPOUILLE, parce que 390 lignes ne suffisaient pas. Le banc au-
  // dessus sortait a zero erreur pendant que le meme depouillement sur 5040
  // lignes en montrait TRENTE : `vi -> pt` neuf fois, `vi -> sv` trois, toutes
  // des collisions de clavier invisibles a 390 lignes. Un banc trop petit ne
  // rend pas zero, il rend une conclusion fausse, exactement comme un banc
  // absent, protocole 4.8.
  ['tatoeba-SANS-DIACRITIQUES', nu(LANG_CORPUS)],
];

const n = (c) => c.right + c.silent + c.wrong;
const rappel = (c) => Math.round((100 * c.right) / n(c));
const muet = (c) => Math.round((100 * c.silent) / n(c));
const cell = (c) => `${c.right}r / ${c.silent}s / ${c.wrong}w`;
const delta = (a, b) => {
  const d = b - a;
  return d === 0 ? '   =' : (d > 0 ? '+' : '') + d;
};

function diffCell(nom, a, b) {
  console.log(
    `  ${nom.padEnd(14)} V0 ${cell(a).padEnd(22)} -> ${cell(b).padEnd(22)}  ` +
      `[r ${delta(a.right, b.right)} | s ${delta(a.silent, b.silent)} | w ${delta(a.wrong, b.wrong)}]` +
      `  rappel ${rappel(a)} -> ${rappel(b)} %, muet ${muet(a)} -> ${muet(b)} %`,
  );
}

function diffConfusions(av, ap) {
  const cles = new Set([...av.keys(), ...ap.keys()]);
  const lignes = [];
  for (const k of [...cles].sort()) {
    const a = av.get(k) ?? 0;
    const b = ap.get(k) ?? 0;
    if (a !== b) lignes.push(`      ${k.padEnd(12)} ${a} -> ${b}`);
  }
  if (lignes.length === 0) console.log('      carte de confusions IDENTIQUE');
  else lignes.forEach((l) => console.log(l));
}

for (const [nom, corpus] of BANCS) {
  console.log(`\n=== ${nom} ===`);
  for (const [voie, cle] of [
    ['sur', 'confidentLanguage'],
    ['brut', 'detectLanguage'],
  ]) {
    const a = runMatrix(vieux[cle], corpus);
    const b = runMatrix(neuf[cle], corpus);
    diffCell(voie, a.total, b.total);
    if (voie === 'sur') {
      diffCell('sur-court', a.shortOnly, b.shortOnly);
      diffConfusions(a.confusions, b.confusions);
    }
  }
}

// Le banc melange se lit a l'envers : une ligne NOMMEE est une erreur.
console.log('\n=== melange (a l envers : nommees = mauvais) ===');
const nommees = (f) => LANG_MIXED.filter((t) => f(t) !== undefined);
const av = nommees(vieux.confidentLanguage);
const ap = nommees(neuf.confidentLanguage);
console.log(`  nommees  V0 ${av.length} -> ${ap.length} sur ${LANG_MIXED.length}`);
for (const t of ap.filter((t) => !av.includes(t))) {
  console.log(`      NOUVELLE  ${neuf.confidentLanguage(t)}  ${t}`);
}
for (const t of av.filter((t) => !ap.includes(t))) {
  console.log(`      partie    ${vieux.confidentLanguage(t)}  ${t}`);
}

// Les lignes que le nouveau detecteur se met a rater, tous corpus confondus.
console.log('\n=== les lignes retournees a tort, par corpus ===');
for (const [nom, corpus] of BANCS) {
  for (const [lang, lignes] of Object.entries(corpus)) {
    for (const t of lignes) {
      const a = vieux.confidentLanguage(t);
      const b = neuf.confidentLanguage(t);
      if (a === b) continue;
      if (b !== undefined && b !== lang) {
        console.log(`  ${nom} ${lang} CASSE   ${a ?? 'muet'} -> ${b}   ${t}`);
      }
    }
  }
}
