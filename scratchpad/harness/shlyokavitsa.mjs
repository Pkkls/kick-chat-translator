/**
 * Le bulgare ecrit en lettres latines, la shlyokavitsa, et la question de savoir
 * si une table de marqueurs est la bonne forme pour lui.
 *
 * Ce que la passe precedente a mesure et laisse ouvert : franc eparpille,
 * `run` roumain sur "mnogo dobre igra", `pol` sur "mnogo smeshno", `ind` sur
 * "az sam tuk", `swe` sur "ai stiga be", et neuf lignes sur douze finissent
 * muettes. `sl` reste vide donc le moteur n'est pas trompe ; le degat est le
 * drapeau montre au lecteur et le saut "deja dans ta langue".
 *
 * Elle l'a decrit comme "une troisieme table du type romanised.ts". C'est faux
 * et c'est ce qui rend la question abordable : `romanised.ts` se definit comme
 * "les langues ecrites en lettres latines qui ne s'ecrivent pas ainsi", ce qui
 * est exactement la shlyokavitsa. Ce serait une quatrieme LANGUE dans une table
 * existante, pas une table.
 *
 * L'INTENTION, ecrite avant de compter, et c'est la regle que la table se donne
 * deja : un marqueur merite `bg` seul s'il est sans ambiguite contre l'anglais
 * courant, contre les autres entrees romanisees (ru, el, ja) et contre les
 * langues latines que le produit parle, plus les quatre que franc a rendues sur
 * de la shlyokavitsa, ro, pl, id et sv.
 *
 * Deux variantes sont mesurees, parce que la premiere a une faiblesse prevue :
 *   V1  marqueurs FORTS seuls, un suffit. C'est le mecanisme actuel de
 *       `romanisedLanguage`, sans une ligne de code a changer.
 *   V2  V1 plus des marqueurs FAIBLES, ceux qu'un chat ecrit vraiment et qui
 *       sont ambigus seuls, comptes seulement a partir de DEUX dans la ligne.
 *
 * Ce qui est tenu a l'ecart. Quatre lignes de shlyokavitsa ont ete ecrites hier
 * par une autre passe, avant que ces listes existent, et elles sont la seule
 * mesure de rappel qui ne soit pas de l'ajustement. Les vingt lignes ecrites ici
 * viennent apres et leur chiffre ne mesure que l'ajustement ; les deux sont
 * rendus separement.
 *
 * Le cote qui protege est tenu a l'ecart pour de bon : les faux positifs sont
 * comptes sur les deux bancs du depot, que ces listes n'ont jamais regardes.
 *
 * Une limite mesuree par personne : la shlyokavitsa remplace couramment des
 * lettres par des chiffres, 6 pour ш, 4 pour ч, q pour я, donc "6te" et "4ovek"
 * pour ще et човек. Aucune ligne ici ne le fait et aucun marqueur ne le couvre.
 */
import { readFileSync } from 'node:fs';

// ─── Lignes tenues a l'ecart, ecrites avant ces listes ─────────────────────
const INDEPENDANTES = [
  'mnogo dobre igra',
  'mnogo smeshno',
  'az sam tuk',
  'ai stiga be',
];

// ─── Lignes ecrites ici, donc de l'ajustement et rien de plus ──────────────
const MIENNES = [
  'kakvo stava tuka',
  'mnogo si dobar brat',
  'az mislya che shte pechelim',
  'zashto pravish taka',
  'tova e mnogo smeshno',
  'haide be stiga tolkova',
  'vsichko e nared',
  'blagodarya ti mnogo',
  'koga zapochva macha',
  'kade otide vsichko',
  'sega shte vidim',
  'chovek ne mozhe da povyarva',
  'kolko e chasa',
  'az sam tuk ot nachaloto',
  'dobre igra brat',
  'neshto ne e nared',
  'razbira se che da',
  'hubavo e taka',
  'tozi igrach e nevoobrazim',
  'nyama kak da stane',
];

// ─── Marqueurs, batis par PARADIGME et jamais par la liste des rates ───────

/** Sans ambiguite seuls. Un suffit. */
// La table se donne un plancher de CINQ lettres pour un marqueur qui decide
// seul, et ce plancher a rejete neuf de mes entrees. Il est respecte plutot que
// contourne : ce qui est plus court descend d'un etage.
const FORTS = [
  'kakvo', 'zashto', 'kolko', 'kakav', 'kakva',
  'chovek', 'neshto', 'vsichko', 'blagodarya', 'zdravey', 'zdravei',
  'hubavo', 'hubava', 'hubav', 'razbira',
];

/** Ce qu'un chat bulgare ecrit vraiment, et qui appartient aussi a d'autres. */
const FAIBLES = [
  'mnogo',    // le russe romanise l'ecrit pareil
  'dobre',    // polonais dobre
  'az',       // hongrois az, l'article defini
  'sam',      // prenom anglais, et serbe sam
  'tuk', 'tuka',
  'stiga',
  'smeshno',  // partage avec le russe
  'nali', 'sega', 'taka', 'nyama', 'nqma',
  'mislya', 'pravish', 'stava',
  // Descendus des forts par le plancher de cinq lettres. Ce sont des paradigmes
  // entiers, la particule du futur et les demonstratifs, et ils gardent leur
  // valeur : simplement ils ne decident plus seuls.
  'shte', 'kade', 'kude', 'koga',
  'tova', 'tozi', 'tazi', 'tezi',
  'sme',
];

const FORT = new Set(FORTS);
const FAIBLE = new Set(FAIBLES);

const jetons = (t) => t.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);

function v1(texte) {
  return jetons(texte).some((j) => FORT.has(j)) ? 'bg' : undefined;
}

function v2(texte) {
  const js = jetons(texte);
  if (js.some((j) => FORT.has(j))) return 'bg';
  const vus = new Set(js.filter((j) => FAIBLE.has(j)));
  return vus.size >= 2 ? 'bg' : undefined;
}

// ─── Le cote qui protege : les deux bancs du depot, jamais consultes ───────
// Les deux bancs n'ont pas la meme forme : le latin est un tableau de tuples
// `['<texte>', 'xx', ...]` et le non latin un objet de listes `'<texte>',`. Une
// premiere version ne lisait que la premiere et rapportait 63 lignes de controle
// la ou il y en a pres de deux cents. La sonde a refuse de continuer, ce qui est
// exactement ce pour quoi ce garde-fou existe.
function lignesDuBanc(fichier) {
  const src = readFileSync(fichier, 'utf8');
  const tuples = [...src.matchAll(/^\s*\['([^']+)',/gmu)].map((m) => m[1]);
  const seules = [...src.matchAll(/^\s*'([^']+)',\s*$/gmu)].map((m) => m[1]);
  return [...tuples, ...seules];
}

const CONTROLE = [
  ...lignesDuBanc('src/content/langDetect.latin.test.ts'),
  ...lignesDuBanc('src/content/langDetect.dix.test.ts'),
  // Les quatre langues que franc a rendues sur de la shlyokavitsa, en clair,
  // pour que le piege soit nomme et pas seulement espere.
  'ce faci acolo baiete', 'nu pot sa cred asta',       // ro
  'co jest grane tutaj', 'bardzo dobre zagranie',       // pl
  'apa yang terjadi disini', 'main bagus sekali',       // id
  'vad hander har', 'det var mycket bra',               // sv
  // Les trois langues deja romanisees dans la table, qui ne doivent pas bouger.
  'privet kak dela segodnya', 'spasibo bolshoe za stream',
  'ti kaneis re file einai kalo', 'konnichiwa minna genki desu ka',
];

// La collision nommee, comptee a part parce qu'elle n'est pas un defaut de la
// regle mais une propriete du texte : `mnogo` et `smeshno` s'ecrivent pareil en
// bulgare et en russe romanises. Une ligne russe qui ne porte que ces mots-la
// est indecidable, et la seule question est de savoir ce qu'il vaut mieux
// repondre dessus.
const COLLISION_RU = [
  'eto bylo mnogo smeshno',
  'mnogo smeshno segodnya',
  'ochen mnogo ludey tut',
  'spasibo bylo smeshno',
];

if (CONTROLE.length < 100) {
  console.error(`SONDE MUETTE: ${CONTROLE.length} lignes de controle, les bancs n ont pas ete lus.`);
  process.exit(2);
}

function rapport(nom, lignes, fn) {
  const pris = lignes.filter((l) => fn(l) === 'bg');
  console.log(`  ${nom.padEnd(26)} ${String(pris.length).padStart(2)}/${lignes.length}`);
  return pris;
}

for (const [nom, fn] of [['V1 forts seuls', v1], ['V2 forts + deux faibles', v2]]) {
  console.log(`\n## ${nom}\n`);
  console.log('  rappel');
  rapport('tenues a l ecart (4)', INDEPENDANTES, fn);
  rapport('ecrites ici (20)', MIENNES, fn);
  console.log('  faux positifs');
  const fp = rapport(`controle (${CONTROLE.length})`, CONTROLE, fn);
  for (const l of fp) console.log(`      ${JSON.stringify(l)}`);
  const col = rapport('collision ru (4)', COLLISION_RU, fn);
  for (const l of col) console.log(`      ${JSON.stringify(l)}`);
}

console.log(`\n## Ce que chaque ligne tenue a l ecart porte\n`);
for (const l of INDEPENDANTES) {
  const js = jetons(l);
  console.log(
    `  ${JSON.stringify(l).padEnd(24)} forts [${js.filter((j) => FORT.has(j)).join(' ')}]` +
      ` faibles [${js.filter((j) => FAIBLE.has(j)).join(' ')}]`,
  );
}
