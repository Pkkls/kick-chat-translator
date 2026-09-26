/**
 * QUEL MOT METTRE DANS UN JEU DE PORTE, et le seuil n'y est pas celui d'ailleurs.
 *
 * `langue-candidats.mjs` cherche ce qu'une langue ecrit et que PERSONNE d'autre
 * n'ecrit, parce qu'une entree de la table exclusive repond en plein air. Un
 * mot de jeu de porte n'a pas besoin d'etre aussi propre : il n'est consulte
 * que derriere une lettre, et la seule chose qui compte est que les AUTRES
 * LANGUES DE CETTE PORTE-LA ne l'ecrivent pas.
 *
 * C'est exactement ce que le fichier dit depuis la premiere porte : derriere
 * `õ`, `on`, `ei`, `ma`, `ta` et `ja` redeviennent utilisables alors qu'ils
 * sont impossibles en plein air. Ce script cherche ces mots-la, et il les
 * cherche sur les lignes que `porte-partagee-diagnostic.mjs` compte comme
 * "porte ouverte, aucun mot ne tranche", qui sont les seules ou ils serviront.
 *
 * LE BRUIT SE COMPTE DEUX FOIS, et les deux colonnes se lisent ensemble :
 *   rivaux    les autres langues de la porte qui s'ouvre. ZERO obligatoire.
 *   ailleurs  toutes les autres langues. Non bloquant, mais un mot qui y est
 *             tres present est un mot que la prochaine porte rendra faux, et
 *             c'est la lecon que `je` a coutee du cote malais.
 *
 *   node --import tsx test/e2e/porte-mots-candidats.mjs sk
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_DIX } from '../../src/content/langChatDixCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const source = readFileSync(new URL(import.meta.url), 'utf8');
if (!/\[\^\\{1,2}p\{L\}\]/.test(source)) {
  console.error('La borne de mot a ete mangee a l ecriture. Rien de ce qui suit ne vaut.');
  process.exit(1);
}

const CIBLE = process.argv[2] ?? 'sk';
const SEUIL = Number(process.argv[3] ?? 2);
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
if (!jeux[CIBLE]) {
  console.error(`${CIBLE} n'a pas de jeu de porte`);
  process.exit(1);
}

/**
 * LES CORPUS QU'ON A LE DROIT DE LIRE. `langChatCorpus2.ts` est AVEUGLE : il
 * sert a compter le bruit, jamais a proposer un candidat. Lui demander si un
 * mot y apparait ne l expose pas ; y chercher des mots, si. Protocole 4.4bis.
 */
const corpus = {};
for (const c of [LANG_CORPUS, LANG_CHAT, LANG_CHAT3, LANG_CHAT_DIX]) {
  for (const [l, v] of Object.entries(c)) corpus[l] = [...(corpus[l] ?? []), ...v];
}
const bruit = {};
for (const c of [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3, LANG_CHAT_DIX]) {
  for (const [l, v] of Object.entries(c)) bruit[l] = [...(bruit[l] ?? []), ...v];
}

/** Les lignes ou une porte s'ouvre et ou le jeu de la cible ne dit rien. */
const enAttente = [];
const rivauxDe = new Set();
for (const t of corpus[CIBLE] ?? []) {
  if (confidentLanguage(t) !== undefined) continue;
  const ouvertes = portes.filter((p) => p.langues.includes(CIBLE) && p.re.test(t));
  if (!ouvertes.length || jeux[CIBLE].test(t)) continue;
  enAttente.push(t);
  for (const p of ouvertes) for (const l of p.langues) if (l !== CIBLE) rivauxDe.add(l);
}
console.log(
  `${CIBLE} : ${enAttente.length} lignes attendent un mot derriere une porte.\n` +
    `Rivaux a surveiller : ${[...rivauxDe].sort().join(' ')}\n`,
);

const compte = new Map();
for (const t of enAttente) {
  for (const mot of new Set(t.toLowerCase().match(/\p{L}+/gu) ?? [])) {
    if (mot.length < 2) continue;
    compte.set(mot, (compte.get(mot) ?? 0) + 1);
  }
}

const lignes = [];
for (const [mot, n] of compte) {
  if (n < SEUIL) continue;
  const re = new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, 'iu');
  const rivaux = [];
  const ailleurs = [];
  for (const [l, v] of Object.entries(bruit)) {
    if (l === CIBLE) continue;
    const k = v.filter((t) => re.test(t)).length;
    if (!k) continue;
    (rivauxDe.has(l) ? rivaux : ailleurs).push(`${l}=${k}`);
  }
  lignes.push([mot, n, rivaux, ailleurs]);
}
lignes.sort((a, b) => b[1] - a[1]);

const propres = lignes.filter(([, , r]) => !r.length);
console.log(`${propres.length} candidats sans aucun rival, sur ${lignes.length}.\n`);
console.log('mot           lignes   ailleurs (non bloquant)');
for (const [mot, n, , ailleurs] of propres.slice(0, 35)) {
  console.log(`  ${mot.padEnd(12)} ${String(n).padStart(3)}   ${ailleurs.slice(0, 6).join(' ') || 'RIEN'}`);
}
const sales = lignes.filter(([, , r]) => r.length).slice(0, 10);
if (sales.length) {
  console.log('\n  refuses, le rival est dans la meme porte :');
  for (const [mot, n, rivaux] of sales) {
    console.log(`  ${mot.padEnd(12)} ${String(n).padStart(3)}   ${rivaux.slice(0, 6).join(' ')}`);
  }
}
