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
 *   node --import tsx test/e2e/porte-diagnostic.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
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

/**
 * LE NORDIQUE, meme question sur une porte de forme differente.
 *
 * Trois declencheurs au lieu d'un, `ø æ`, `å`, et les mots dano-norvegiens, et
 * deux jeux qui tranchent. La question reste la meme : si une ligne danoise est
 * muette, est-ce qu'aucun declencheur n'a pris, ou est-ce que le jeu danois n'a
 * rien a dire derriere ?
 */
const LETTRES_DN = depuisLaSource('LETTRES_DANO_NORVEGIENNES');
const A_ROND = depuisLaSource('A_ROND_SCANDINAVE');
const MOTS_DN = depuisLaSource('MOTS_DANO_NORVEGIENS');
const MOTS_NO = depuisLaSource('MOTS_NORVEGIENS');
const MOTS_DA = depuisLaSource('MOTS_DANOIS');

for (const lang of ['no', 'da']) {
  const jeu = lang === 'no' ? MOTS_NO : MOTS_DA;
  const autre = lang === 'no' ? MOTS_DA : MOTS_NO;
  let nommee = 0;
  let ferme = 0;
  let sansMot = 0;
  let lesDeux = 0;
  const exemples = [];
  for (const t of LANG_CORPUS[lang] ?? []) {
    if (confidentLanguage(t) === lang) {
      nommee += 1;
      continue;
    }
    if (!LETTRES_DN.test(t) && !A_ROND.test(t) && !MOTS_DN.test(t)) {
      ferme += 1;
      if (exemples.length < 4) exemples.push(`FERMEE     ${t}`);
      continue;
    }
    if (jeu.test(t) && autre.test(t)) lesDeux += 1;
    else if (!jeu.test(t)) {
      sansMot += 1;
      if (exemples.length < 8) exemples.push(`SANS MOT   ${t}`);
    }
  }
  console.log(`\n=== ${lang} (Tatoeba) ===`);
  exemples.forEach((e) => console.log(`  ${e}`));
  console.log(
    `  -> nommees ${nommee}, aucun declencheur ${ferme}, ouverte sans mot ${sansMot}, ` +
      `ouverte avec les deux ${lesDeux}`,
  );
}
