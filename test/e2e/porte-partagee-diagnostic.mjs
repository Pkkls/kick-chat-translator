/**
 * LA MEME QUESTION QUE `porte-diagnostic.mjs`, POSEE A LA TABLE DES PORTES.
 *
 * `porte-diagnostic.mjs` couvre les deux portes ecrites a la main, le nordique
 * et le malais-indonesien, et il a paye deux fois : il a montre que la paire
 * malaise bloquait sur son DECLENCHEUR et que le nordique bloquait sur son TRI
 * INTERIEUR, ce qui se corrige a des endroits opposes du fichier.
 *
 * Les dix-neuf portes partagees de `PORTES_PARTAGEES` n'avaient jamais eu droit
 * a la question. Trois causes de silence au lieu de deux, parce qu'une porte
 * partagee nomme plus de deux langues :
 *
 *   aucune porte        la ligne ne porte aucune lettre qui ouvre quoi que ce
 *                       soit. Il n'y a rien a corriger derriere une porte.
 *   porte sans mot      une porte s'ouvre, le jeu de la langue ne repond pas.
 *                       C'est le jeu de mots qu'il faut etoffer.
 *   porte avec rival    le jeu repond ET celui d'une autre langue de la meme
 *                       porte repond, donc `porteQuelleLangue` se tait. C'est
 *                       le mot partage qu'il faut retirer ou resserrer.
 *
 * RESULTAT DU PREMIER PASSAGE, sur le catalan, qui est le plus gros bloc encore
 * ouvert de la matrice : 155 lignes, 48 nommees, **63 sans aucune porte**, 42
 * porte ouverte sans mot, 2 avec un rival. La moitie du probleme catalan n'est
 * donc pas derriere une porte du tout : ces lignes s'ecrivent sans accent,
 * `Bon dia!`, `Tinc dues filles.`, `No vull tornar.`, et aucune lettre ne peut
 * les atteindre. Ce qu'il leur faut est une entree exclusive, sequence ou mot,
 * pas un jeu de porte plus gros.
 *
 * Les regex sont RELUES dans la source, jamais retapees.
 *
 *   node --import tsx test/e2e/porte-partagee-diagnostic.mjs ca
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const CIBLE = process.argv[2] ?? 'ca';
const src = readFileSync('src/content/langDetect.ts', 'utf8');

const blocPortes = src.slice(
  src.indexOf('const PORTES_PARTAGEES'),
  src.indexOf('\n];', src.indexOf('const PORTES_PARTAGEES')),
);
const portes = [];
for (const ligne of blocPortes.split('\n')) {
  const m = /^\s*\[(\/.*?\/[a-z]*),\s*\[([^\]]+)\]\]/.exec(ligne.trim());
  if (!m) continue;
  const corps = m[1].slice(1, m[1].lastIndexOf('/'));
  portes.push({
    re: new RegExp(corps, m[1].slice(m[1].lastIndexOf('/') + 1)),
    langues: m[2].split(',').map((x) => x.trim().replace(/'/g, '')),
    texte: m[1],
  });
}

const blocJeux = src.slice(
  src.indexOf('const JEUX_DE_PORTE'),
  src.indexOf('\n};', src.indexOf('const JEUX_DE_PORTE')),
);
const jeux = {};
for (const ligne of blocJeux.split('\n')) {
  const m = /^\s*([a-z-]+):\s*(\/.*\/[a-z]*),/.exec(ligne.trim());
  if (!m) continue;
  const corps = m[2].slice(1, m[2].lastIndexOf('/'));
  jeux[m[1]] = new RegExp(corps, m[2].slice(m[2].lastIndexOf('/') + 1));
}
if (portes.length < 15 || Object.keys(jeux).length < 15) {
  console.error(`table lue trop courte : ${portes.length} portes, ${Object.keys(jeux).length} jeux`);
  process.exit(1);
}
console.log(`${portes.length} portes lues, ${Object.keys(jeux).length} jeux de mots.`);

const lignes = [];
for (const c of [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3]) {
  for (const t of c[CIBLE] ?? []) lignes.push(t);
}

let nommees = 0;
const compte = { aucunePorte: 0, sansMot: 0, rival: 0 };
const exemples = { aucunePorte: [], sansMot: [], rival: [] };

for (const t of lignes) {
  if (confidentLanguage(t) !== undefined) {
    nommees++;
    continue;
  }
  const ouvertes = portes.filter((p) => p.langues.includes(CIBLE) && p.re.test(t));
  if (!ouvertes.length) {
    compte.aucunePorte++;
    if (exemples.aucunePorte.length < 12) exemples.aucunePorte.push(t);
    continue;
  }
  if (!jeux[CIBLE]?.test(t)) {
    compte.sansMot++;
    if (exemples.sansMot.length < 12) exemples.sansMot.push(`${ouvertes[0].texte}  ${t}`);
    continue;
  }
  const rivales = ouvertes[0].langues.filter((l) => l !== CIBLE && jeux[l]?.test(t));
  compte.rival++;
  if (exemples.rival.length < 12) {
    exemples.rival.push(`${ouvertes[0].texte} contre ${rivales.join(' ')}  ${t}`);
  }
}

console.log(
  `\n${CIBLE} : ${lignes.length} lignes, ${nommees} nommees, ` +
    `${compte.aucunePorte} sans aucune porte, ${compte.sansMot} porte ouverte sans mot, ` +
    `${compte.rival} porte ouverte avec un rival.`,
);
for (const [nom, liste] of Object.entries(exemples)) {
  if (!liste.length) continue;
  console.log(`\n--- ${nom} ---`);
  for (const x of liste) console.log(`  ${x.slice(0, 90)}`);
}
