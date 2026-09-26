/**
 * LA FEUILLE DU CONTENT SCRIPT, AVEC SES JETONS, comme le navigateur la voit.
 *
 * Douze portes lisaient `src/content/inject.css` avec `readFileSync` et le
 * posaient dans un `<style>`. Ca marchait tant que la feuille se suffisait a
 * elle-meme. Elle a cesse de se suffire le jour ou les couleurs sont passees en
 * jetons : la premiere ligne du fichier est maintenant
 *
 *     @import '../shared/theme.css';
 *
 * que Vite resout a la construction et qu'un `<style>` ne resout pas, faute de
 * base d'URL. Toutes les valeurs ecrites `rgb(var(--kt-green-rgb) / .55)`
 * deviennent alors invalides, et une declaration invalide n'est pas appliquee :
 * `border-inline-start: 2px solid <invalide>` rend **zero pixel**.
 *
 * LE SYMPTOME NE RESSEMBLAIT PAS A LA CAUSE. `rtl-live` annoncait "filet a 0px
 * au debut et 0px a la fin" sur quatre styles, ce qui se lit comme une regle
 * perdue dans le CSS alors que la regle est intacte et que c'est sa COULEUR qui
 * n'existe pas. Le build, lui, resout l'import : le produit livre n'a jamais
 * ete casse, seules les portes l'etaient.
 *
 * Cette fonction rend la feuille avec l'import remplace par son contenu. Un
 * seul niveau, parce qu'il n'y en a qu'un, et le garde le dit si ca change.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');

/** @param {string} relatif chemin depuis la racine du depot */
export function feuille(relatif = 'src/content/inject.css') {
  const source = readFileSync(path.join(RACINE, relatif), 'utf8');
  const base = path.dirname(path.join(RACINE, relatif));
  let reste = 0;
  const resolue = source.replace(/^@import\s+['"]([^'"]+)['"]\s*;\s*$/gm, (_, cible) => {
    reste++;
    return readFileSync(path.resolve(base, cible), 'utf8');
  });
  if (/^@import/m.test(resolue)) {
    throw new Error('un @import imbrique est reste : cette fonction ne resout quun niveau');
  }
  if (reste === 0 && /var\(--kt-/.test(resolue)) {
    throw new Error(
      `${relatif} utilise des jetons et n'importe rien : ils viennent d'ailleurs, cette porte mesurerait du vide`,
    );
  }
  return resolue;
}
