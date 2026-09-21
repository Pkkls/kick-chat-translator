/**
 * Le crible des portes : quel caractere non-ASCII est ecrit par un PETIT nombre
 * de langues, et n'est ni deja une lettre exclusive ni deja une porte.
 *
 * File de travail point 2, "chercher ce qui MANQUE dans les tables". Ce script
 * existe parce que les portes en place sont sorties d'une relecture de table et
 * pas d'un effort d'invention, et qu'une relecture faite a la main se trompe :
 * `c` cedille et `o` accent aigu avaient ete proposes comme candidats alors
 * qu'ils etaient deja des portes, et `c` accent aigu comme candidat alors qu'il
 * est deja une lettre exclusive polonaise. Trois erreurs sur quatre propositions.
 *
 * ETAT AU 2026-09-21 : les trois listes sortent VIDES. Le crible a lettre est
 * epuise. Le relancer apres un changement de corpus, pas avant, et l'etendre
 * aux bigrammes pour qu'il ait de nouveau quelque chose a dire.
 *
 *   node --import tsx scratchpad/harness/porte-candidats.mjs
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';

// Deja pris. Recopie a la main depuis langDetect.ts, donc a reverifier si le
// fichier bouge ; le script imprime les deux listes pour que ca se voie.
const EXCLUSIVES =
  'řěůľĺŕżźćśńőűėįųģķļņāēīığşșțñßœû' +
  // Les trente-cinq du vietnamien : les trois d'origine, plus les trente-deux
  // que ce crible a rendues au premier passage.
  'ơưđạấốếờủảợậệớộắữởểịầừặũềựẽọứụỏửổẹằ';
const PORTES = 'äšüóúçéíöďťňýèàôêâãîìòčăąęū';

// MESURES ET REJETEES. Sans cette liste le crible les repropose a chaque
// passage, parce qu'il ne voit que les corpus et pas les decisions.
//
//   ł   polonais seul, mais il voyage dans les noms propres. Une ligne slovaque
//       du corpus parle des enfants de Łazarz et ne porte aucune lettre slovaque.
//       `żźćśń` prend 70 lignes polonaises contre 48 pour ł, et zero ailleurs.
//   õ   partage avec le portugais a une ligne, donc il est une PORTE dediee
//       (`estonienOuPortugais`) et non une lettre exclusive.
//   ù   italien autant que vietnamien, `piu` l'ecrit.
//   å ø æ  scandinaves, deja pris par les fonctions dediees en amont.
const REJETES = 'łõùåøæ';

// Les seules langues qui peuvent tirer d'une porte a lettre : les latines. Une
// ligne en cyrillique ou en arabe est deja nommee par le pre-controle.
const LATINES = new Set([
  'ca', 'cs', 'da', 'de', 'en', 'es', 'et', 'fi', 'fr', 'hu', 'id', 'it', 'lt',
  'lv', 'ms', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv', 'tl', 'tr', 'vi',
]);

const corpora = [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3];

/** char -> lang -> nombre de lignes qui le portent */
const vu = new Map();
for (const corpus of corpora) {
  for (const [lang, lignes] of Object.entries(corpus)) {
    if (!LATINES.has(lang)) continue;
    for (const ligne of lignes) {
      for (const c of new Set(ligne.toLowerCase())) {
        if (c.charCodeAt(0) < 128) continue;
        if (!/\p{L}/u.test(c)) continue;
        // BORNE A L'ECRITURE LATINE, et sans elle le crible ment. Le corpus
        // malais contient six lignes en jawi, donc en ecriture arabe. Comme
        // `ar` et `fa` ne sont pas dans LATINES, leurs lettres ne sont comptees
        // que pour `ms` et le crible les rend comme "lettres exclusives
        // malaises manquantes" : alef, waw, ya, ra. Les ajouter a la table
        // nommerait `ms` sur toute ligne arabe du monde.
        //
        // Le jawi a bien ses lettres a lui, ڠ ڤ ڬ ڽ ݢ ۏ, et elles sont deja
        // lues par LETTRES_JAWI. Ce crible-ci ne parle que du latin.
        if (!/\p{Script=Latin}/u.test(c)) continue;
        if (!vu.has(c)) vu.set(c, new Map());
        const m = vu.get(c);
        m.set(lang, (m.get(lang) ?? 0) + 1);
      }
    }
  }
}

const etat = (c) =>
  EXCLUSIVES.includes(c)
    ? 'exclusive'
    : PORTES.includes(c)
      ? 'PORTE'
      : REJETES.includes(c)
        ? 'rejete'
        : 'libre';

// Une langue qui n'ecrit le caractere qu'une ou deux fois sur des milliers de
// lignes est du bruit : un nom propre, une citation. Le seuil coupe a trois,
// et les langues sous le seuil sont imprimees a part pour qu'on les voie.
const SEUIL = 3;

const lignes = [];
for (const [c, m] of vu) {
  const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
  const faibles = [...m.entries()].filter(([, n]) => n < SEUIL).map(([l]) => l);
  if (fortes.length === 0 || fortes.length > 4) continue;
  lignes.push({ c, fortes, faibles, total: fortes.reduce((s, [, n]) => s + n, 0) });
}
lignes.sort((a, b) => b.total - a.total);

console.log(`caractere  etat        lignes  langues (>= ${SEUIL} lignes)   [bruit < ${SEUIL}]`);
for (const { c, fortes, faibles, total } of lignes) {
  console.log(
    `    ${c}      ${etat(c).padEnd(10)} ${String(total).padStart(5)}  ` +
      `${fortes.map(([l, n]) => `${l}=${n}`).join(' ').padEnd(34)} ` +
      `${faibles.length ? '[' + faibles.join(' ') + ']' : ''}`,
  );
}

console.log('\nLES CANDIDATS, portes libres a deux langues fortes ou plus :');
for (const { c, fortes, total } of lignes) {
  if (etat(c) !== 'libre' || fortes.length < 2) continue;
  console.log(`  ${c}  ${total} lignes  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ')}`);
}

// L'autre moitie du crible, et c'est le point 2 de la file : un caractere
// qu'UNE seule langue ecrit et qui n'est pas dans la table des lettres
// exclusives est un marqueur gratuit qu'on a simplement oublie. C'est comme ca
// que `ñ`, `ß`, `œ` et le grec sont entres, trois passes trop tard.
console.log('\nLES LETTRES EXCLUSIVES QUI MANQUENT, une seule langue et hors table :');
const parLangue = new Map();
for (const { c, fortes, total } of lignes) {
  if (etat(c) !== 'libre' || fortes.length !== 1) continue;
  const l = fortes[0][0];
  if (!parLangue.has(l)) parLangue.set(l, []);
  parLangue.get(l).push([c, total]);
}
for (const [l, cs] of [...parLangue.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const tot = cs.reduce((s, [, n]) => s + n, 0);
  console.log(`  ${l}  ${cs.length} caracteres, ${tot} lignes  ${cs.map(([c, n]) => `${c}=${n}`).join(' ')}`);
}

console.log('\nLES EXCLUSIVES QUE LA MESURE CONTREDIT, si la table a derive :');
for (const { c, fortes } of lignes) {
  if (etat(c) !== 'exclusive' || fortes.length < 2) continue;
  console.log(`  ${c}  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ')}`);
}
