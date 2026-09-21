/**
 * Pourquoi une ligne reste muette derriere une porte : le DECLENCHEUR n'a pas
 * pris, ou il a pris et aucun mot ne tranche derriere ?
 *
 * Les deux se corrigent a des endroits opposes du fichier et rien ne les
 * distinguait. Le cote malais de la paire est a 4 lignes sur 30 et la question
 * decide de tout : etoffer le declencheur, ou etoffer le jeu de mots.
 *
 * Les trois regex sont RECOPIEES de `langDetect.ts`. C'est de la duplication et
 * elle est assumee : l'alternative est d'exporter trois constantes privees pour
 * un script de diagnostic. Le garde ci-dessous relit la source et casse si
 * elles ont diverge, ce qui est la seule chose qui compte.
 *
 *   node --import tsx scratchpad/harness/porte-diagnostic.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const SOURCE = readFileSync('src/content/langDetect.ts', 'utf8');

/** Extrait une regex du fichier par le nom de sa constante, telle qu'ecrite. */
function depuisLaSource(nom) {
  const m = new RegExp(`const ${nom} =\\s*(/[^;]+/[a-z]*);`).exec(SOURCE);
  if (!m) throw new Error(`${nom} introuvable dans langDetect.ts`);
  const corps = m[1];
  const fin = corps.lastIndexOf('/');
  return new RegExp(corps.slice(1, fin), corps.slice(fin + 1));
}

const DECLENCHEUR = depuisLaSource('MOTS_MALAIS_INDONESIENS');
const MALAIS = depuisLaSource('MOTS_MALAIS');
const INDONESIEN = depuisLaSource('MOTS_INDONESIENS');

for (const [lang, lignes] of Object.entries(LANG_CHAT_PAIRE_REGLAGE)) {
  const jeu = lang === 'ms' ? MALAIS : INDONESIEN;
  const autre = lang === 'ms' ? INDONESIEN : MALAIS;
  let ferme = 0;
  let ouverteSansMot = 0;
  let ouverteDeuxMots = 0;
  let nommee = 0;
  console.log(`\n=== ${lang} ===`);
  for (const t of lignes) {
    if (confidentLanguage(t) === lang) {
      nommee += 1;
      continue;
    }
    if (!DECLENCHEUR.test(t)) {
      ferme += 1;
      console.log(`  PORTE FERMEE        ${t}`);
    } else if (jeu.test(t) && autre.test(t)) {
      ouverteDeuxMots += 1;
      console.log(`  OUVERTE, LES DEUX   ${t}`);
    } else if (!jeu.test(t)) {
      ouverteSansMot += 1;
      console.log(`  OUVERTE, SANS MOT   ${t}`);
    }
  }
  console.log(
    `  -> nommees ${nommee}, porte fermee ${ferme}, ouverte sans mot ${ouverteSansMot}, ` +
      `ouverte avec les deux ${ouverteDeuxMots}`,
  );
}
