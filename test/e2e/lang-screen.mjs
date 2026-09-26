/**
 * Cribler un marqueur candidat contre les TROIS corpus, d'un coup.
 *
 *   node --import tsx test/e2e/lang-screen.mjs mot merci danke hola
 *   node --import tsx test/e2e/lang-screen.mjs fin ção eux lijk
 *   node --import tsx test/e2e/lang-screen.mjs brut "[¿¡]" "l·l"
 *
 * Trois modes, parce que les marqueurs de ce fichier sont de trois natures :
 *   mot   le candidat est un token entier, borne des deux cotes
 *   fin   le candidat est une fin de mot
 *   brut  le candidat est une expression, utilisee telle quelle
 *
 * POURQUOI CE SCRIPT EXISTE PLUTOT QUE D'ETRE RETAPE A CHAQUE FOIS. Il a ete
 * retape cinq fois dans la meme passe et il s'est casse deux fois de la meme
 * facon : ecrit dans un heredoc, le `\\p{L}` de la classe perd sa barre et
 * `[^\\p{L}]` devient `[^p{L}]`, quatre caracteres litteraux. La borne de mot
 * cesse de borner, chaque test devient une recherche de sous-chaine, et le
 * crible invente des occurrences etrangeres qui font rejeter de bons candidats.
 *
 * La deuxieme fois, le garde cense l'attraper etait casse pareil : il testait
 * `source.includes('\\p{L}')`, et en JavaScript `'\\p{L}'` vaut `'p{L}'`, que la
 * source cassee contient. Un controle ecrit dans le langage qu'il controle tombe
 * dans le meme piege. Le garde ci-dessous porte donc sur la source COMPILEE, par
 * une expression reguliere, et le script refuse de tourner s'il echoue.
 *
 * Lecture de la sortie : une seule langue sur la ligne veut dire que le candidat
 * est exclusif SUR CES CORPUS, ce qui n'est pas la meme chose qu'exclusif. La
 * mesure oppose un veto, elle ne choisit pas. Un candidat qui mesure propre mais
 * qui est un mot courant dans une langue que le corpus echantillonne mal reste
 * dehors : `-ijo` mesurait propre pour le slovene et c'est l'espagnol `dijo`.
 *
 * La colonne MELANGE compte les lignes du banc `langMixedCorpus.ts`. Elle doit
 * rester a zero : un marqueur qui repond sur une ligne a deux langues fait
 * exactement ce que le chemin sur ne doit pas faire.
 */

import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_MIXED } from '../../src/content/langMixedCorpus.ts';

const MODES = {
  mot: (m) => new RegExp('(^|[^\\p{L}])(' + m + ')([^\\p{L}]|$)', 'iu'),
  fin: (m) => new RegExp('(' + m + ')([^\\p{L}]|$)', 'iu'),
  brut: (m) => new RegExp(m, 'iu'),
};

const mode = process.argv[2];
const candidats = process.argv.slice(3);
if (!MODES[mode] || candidats.length === 0) {
  console.error('usage: lang-screen.mjs <mot|fin|brut> <candidat> [candidat...]');
  process.exit(2);
}

// Le garde porte sur la source compilee, jamais sur une chaine que JS reinterprete.
if (mode !== 'brut') {
  const src = MODES[mode]('x').source;
  if (!/\[\^\\p\{L\}\]/.test(src)) {
    console.error('REGEX CASSE, mesure invalide. source =', src);
    process.exit(1);
  }
}

const par = {};
for (const [l, v] of Object.entries(LANG_CORPUS)) par[l] = [...v];
for (const [l, v] of Object.entries(LANG_CHAT)) par[l] = [...(par[l] ?? []), ...v];
const total = Object.values(par).reduce((s, v) => s + v.length, 0);

console.log(`crible sur ${total} lignes de Tatoeba et de chat, plus ${LANG_MIXED.length} lignes melangees`);
console.log(`mode ${mode}, regex temoin : ${MODES[mode]('x').source}\n`);

for (const c of candidats) {
  const re = MODES[mode](c);
  const hits = [];
  for (const [l, v] of Object.entries(par)) {
    const n = v.filter((t) => re.test(t)).length;
    if (n) hits.push([l, n]);
  }
  hits.sort((a, b) => b[1] - a[1]);
  const mel = LANG_MIXED.filter((t) => re.test(t)).length;
  const verdict = hits.length === 1 && mel === 0 ? 'EXCLUSIF' : hits.length === 0 ? 'absent' : `${hits.length} langues`;
  console.log(
    `${c.padEnd(12)} ${verdict.padEnd(11)} ${hits.map(([l, n]) => `${l}=${n}`).join(' ')}${mel ? `   MELANGE=${mel}` : ''}`,
  );
}
