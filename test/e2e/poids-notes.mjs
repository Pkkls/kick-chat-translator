/**
 * Aucune prose de table ne doit voyager sur une page Kick.
 *
 * Ce que la sonde mesurait avant : le champ `note` des tables linguistiques est
 * une VALEUR et pas un commentaire, il survit a la minification, et 42 des 45
 * notes de la table des rires partaient dans le script injecte, 1754 octets,
 * 0.85 pour cent de tout ce qu'un lecteur telecharge.
 *
 * Ce qui a change : les notes ont quitte l'entree pour une table a part, que le
 * code livre ne reference jamais et que l'elagage du bundle retire. La sonde
 * mesurait un nombre qui vaut zero maintenant, ce qui en fait une sonde qui ne
 * peut plus echouer. Elle est donc RETARGETEE plutot que supprimee : ce qu'elle
 * garde est la meme propriete, dite dans l'autre sens.
 *
 * Deux formes de regression sont cherchees, parce que les deux sont arrivees ou
 * peuvent arriver :
 *   1. une nouvelle table qui remet un champ `note` dans ses entrees ;
 *   2. une reference depuis le code livre a la table de notes existante, qui la
 *      ferait rentrer dans le bundle sans changer une ligne de la table.
 *
 * La porte du poids ne couvre ni l'une ni l'autre : 1754 octets sont 0.85 pour
 * cent, et la marge est de 2 pour cent, donc le retour des notes passerait sans
 * la faire rougir.
 *
 * Verifie dans l'artefact livre, pas dans un metafichier.
 */
import { readFileSync } from 'node:fs';

/** Tables dont les entrees ne doivent porter aucune prose. */
const TABLES = [
  'src/shared/laughter.ts',
  'src/shared/romanised.ts',
  'src/shared/arabizi.ts',
  'src/shared/langTiers.ts',
];

/** Tables de notes, qui existent pour les tests et doivent rester hors bundle. */
const NOTES_HORS_BUNDLE = [['src/shared/laughter.ts', 'LAUGHTER_NOTES']];

/** Assez long pour qu'une correspondance dans le bundle ne soit pas un hasard. */
const SONDE_MIN = 20;

const bundle = readFileSync('dist/assets/content.js', 'utf8');
if (bundle.length < 100_000) {
  console.error('SONDE MORTE: dist/assets/content.js absent ou trop petit, lancer npm run build.');
  process.exit(1);
}

// La VALEUR de chaque paire, jamais la cle. Premiere version de cette sonde :
// elle prenait toutes les chaines du bloc, donc les cles, qui sont les sources
// des motifs et vivent evidemment dans le bundle puisque ce sont les expressions
// executees. Elle a rapporte cinq fuites et le produit avait raison sur les cinq.
const paire = /'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

/** Les notes d'un objet exporte, du `= {` a la premiere accolade fermante seule. */
function chainesDe(fichier, nom) {
  const src = readFileSync(fichier, 'utf8');
  const debut = src.indexOf(`export const ${nom}`);
  if (debut === -1) return null;
  const ouvre = src.indexOf('{', debut);
  const ferme = src.indexOf('\n};', ouvre);
  if (ouvre === -1 || ferme === -1) return null;
  return [...src.slice(ouvre, ferme).matchAll(paire)].map((m) => m[2] ?? '');
}

const fuites = [];
let sondees = 0;

for (const [fichier, nom] of NOTES_HORS_BUNDLE) {
  const chaines = chainesDe(fichier, nom);
  if (chaines === null) {
    console.error(`SONDE MORTE: ${nom} introuvable dans ${fichier}.`);
    process.exit(1);
  }
  const longues = chaines.filter((s) => s.length > SONDE_MIN);
  if (longues.length === 0) {
    console.error(`SONDE MORTE: ${nom} ne contient aucune chaine de plus de ${SONDE_MIN} caracteres.`);
    process.exit(1);
  }
  sondees += longues.length;
  const dedans = longues.filter((s) => bundle.includes(s.slice(0, 40)));
  console.log(
    `  ${nom.padEnd(16)} ${String(longues.length).padStart(3)} notes, ` +
      `${String(dedans.length).padStart(3)} dans le bundle`,
  );
  for (const s of dedans) fuites.push(`${nom}: ${JSON.stringify(s.slice(0, 50))}`);
}

// Le champ `note` remis dans une entree de table, quelle que soit la table.
const champ = /note:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
for (const fichier of TABLES) {
  let src;
  try {
    src = readFileSync(fichier, 'utf8');
  } catch {
    console.log(`  ${fichier.padEnd(28)} absent`);
    continue;
  }
  const notes = [...src.matchAll(champ)].map((m) => m[1] ?? m[2] ?? '');
  const dedans = notes.filter((n) => n.length > SONDE_MIN && bundle.includes(n.slice(0, 40)));
  if (notes.length) {
    console.log(
      `  ${fichier.padEnd(28)} ${String(notes.length).padStart(3)} champs note, ` +
        `${String(dedans.length).padStart(3)} dans le bundle`,
    );
  }
  for (const n of dedans) fuites.push(`${fichier}: ${JSON.stringify(n.slice(0, 50))}`);
}

console.log(`\n${sondees} notes sondees contre ${bundle.length} octets de script injecte`);

if (fuites.length) {
  console.error(`FAIL: ${fuites.length} note(s) voyagent sur chaque page Kick :`);
  for (const f of fuites) console.error(`  ${f}`);
  process.exit(1);
}
console.log('poids-notes: OK, aucune prose de table dans le script injecte');
