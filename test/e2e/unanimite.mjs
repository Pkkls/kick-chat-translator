/**
 * LES LIGNES QUE LA REGLE D'UNANIMITE FAIT TAIRE.
 *
 * `detectByExclusiveLetter` ne repond que si toutes les entrees qui se
 * declenchent nomment la meme langue. C'est ce qui rend la table sure : deux
 * avis differents valent mieux tus qu'arbitres au hasard. Mais chaque
 * desaccord est une ligne perdue, et personne ne les avait jamais comptees.
 *
 * L'ablation, elle, ne les voit qu'en creux : elle retire une entree a la fois,
 * donc un desaccord entre une entree a +96 et une entree a +5 ressort comme
 * `+96` d'un cote et `-1` de l'autre, ou pas du tout si les deux sont grosses.
 * Ce script les nomme directement, paire par paire.
 *
 * Les regex sont LUES dans le fichier source, jamais retapees. Une regex
 * retapee a la main dans un script a deja fausse deux passes de cette branche,
 * et le garde ci-dessous echoue si la lecture rend autre chose qu'une table.
 *
 *   node --import tsx test/e2e/unanimite.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';

const src = readFileSync('src/content/langDetect.ts', 'utf8');

/** Le bloc de la table des lettres exclusives, entre son ouverture et `];`. */
const debut = src.indexOf('const LETTRES_EXCLUSIVES');
if (debut < 0) throw new Error('LETTRES_EXCLUSIVES introuvable');
const fin = src.indexOf('\n];', debut);
const bloc = src.slice(debut, fin);

const entrees = [];
for (const ligne of bloc.split('\n')) {
  const m = /^\s*\[(\/.*\/[a-z]*),\s*'([a-z-]+)'\]/.exec(ligne.trim());
  if (!m) continue;
  const corps = m[1].slice(1, m[1].lastIndexOf('/'));
  const drapeaux = m[1].slice(m[1].lastIndexOf('/') + 1);
  entrees.push({ re: new RegExp(corps, drapeaux), lang: m[2], texte: m[1] });
}
if (entrees.length < 40) throw new Error(`table lue trop courte: ${entrees.length} entrees`);
console.log(`${entrees.length} entrees exclusives lues.\n`);

const bancs = [
  ['tatoeba', LANG_CORPUS],
  ['chat1', LANG_CHAT],
  ['chat2 AVEUGLE', LANG_CHAT2],
  ['chat3 reglage', LANG_CHAT3],
  ['paire mesure', LANG_CHAT_PAIRE],
  ['paire reglage', LANG_CHAT_PAIRE_REGLAGE],
];

/** paire triee -> { total, justes, exemples } */
const desaccords = new Map();
let lignesVues = 0;

for (const [nom, corpus] of bancs) {
  for (const [vraie, lignes] of Object.entries(corpus)) {
    for (const t of lignes) {
      lignesVues++;
      const vus = [...new Set(entrees.filter((e) => e.re.test(t)).map((e) => e.lang))];
      if (vus.length < 2) continue;
      const cle = [...vus].sort().join(' x ');
      const e = desaccords.get(cle) ?? { total: 0, recuperables: 0, exemples: [] };
      e.total++;
      // Une ligne dont la vraie langue est dans le desaccord est une ligne que
      // la table SAIT nommer et qu'elle refuse. Les autres sont du bruit que
      // l'unanimite a raison de taire.
      if (vus.includes(vraie)) e.recuperables++;
      if (e.exemples.length < 3) e.exemples.push(`${nom}/${vraie}: ${t.slice(0, 56)}`);
      desaccords.set(cle, e);
    }
  }
}

const rangs = [...desaccords.entries()].sort((a, b) => b[1].recuperables - a[1].recuperables || b[1].total - a[1].total);
const totalRecup = rangs.reduce((s, [, e]) => s + e.recuperables, 0);
const totalDes = rangs.reduce((s, [, e]) => s + e.total, 0);

console.log(`${lignesVues} lignes lues, ${totalDes} desaccords, dont ${totalRecup} ou la vraie langue est l'un des deux avis.\n`);
console.log('paire                       desaccords  recuperables');
for (const [cle, e] of rangs) {
  console.log(`  ${cle.padEnd(26)} ${String(e.total).padStart(5)} ${String(e.recuperables).padStart(13)}`);
  if (e.recuperables > 0) for (const x of e.exemples) console.log(`      ${x}`);
}
