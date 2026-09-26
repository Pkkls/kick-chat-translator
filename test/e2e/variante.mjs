/**
 * MESURER UNE VARIANTE SANS LA COMMITTER, sur les neuf bancs d'un coup.
 *
 * Le protocole 4.2 demande le diff de la carte de confusions, pas un total, et
 * le protocole 4.6 demande de mesurer les DEUX formes d'une correction avant
 * d'en choisir une. Fait a la main, cela veut dire editer le fichier livre,
 * lancer le diff, le relire, defaire, recommencer, et le seul resultat certain
 * est qu'une des variantes finira committee par accident.
 *
 * Ce script remplace une chaine LITTERALE dans `src/content/langDetect.ts`,
 * lance `porte-diff.mjs`, imprime son resume, et restaure le fichier quoi qu il
 * arrive. La chaine est litterale et non une regex : sur cette branche, une
 * regex retapee a la main a deja fausse deux passes entieres.
 *
 *   git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts
 *   node --import tsx test/e2e/variante.mjs "<avant>" "<apres>"
 *   rm src/content/langDetectV0.ts
 *
 * `<apres>` vide supprime la chaine, ce qui est la variante SUPPRESSION.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOURCE = 'src/content/langDetect.ts';
const DIFF = 'test/e2e/porte-diff.mjs';

const avant = process.argv[2];
const apres = process.argv[3] ?? '';
if (avant === undefined) {
  console.error('usage: node --import tsx test/e2e/variante.mjs "<avant>" "<apres>"');
  process.exit(1);
}

const original = readFileSync(SOURCE, 'utf8');
const occurrences = original.split(avant).length - 1;
if (occurrences !== 1) {
  console.error(`la chaine apparait ${occurrences} fois, il en faut exactement une.`);
  process.exit(1);
}

console.log(`avant: ${JSON.stringify(avant)}`);
console.log(`apres: ${JSON.stringify(apres)}\n`);

try {
  writeFileSync(SOURCE, original.replace(avant, apres));
  const out = execFileSync('node', ['--import', 'tsx', DIFF], { encoding: 'utf8' });
  for (const ligne of out.split('\n')) {
    // Tout ce qui a bouge, plus les en-tetes de banc pour situer.
    if (/^=== /.test(ligne)) console.log(ligne);
    else if (/IDENTIQUE/.test(ligne)) continue;
    else if (/\[r\s+=\s+\|\s+s\s+=\s+\|\s+w\s+=\]/.test(ligne)) continue;
    else if (ligne.trim()) console.log(ligne);
  }
} finally {
  writeFileSync(SOURCE, original);
  console.log('\nsrc/content/langDetect.ts restaure.');
}
