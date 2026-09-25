/**
 * L'ablation du LEXIQUE, par langue puis par mot.
 *
 * `SHORT_WORD_LANG` compte pres de quatre cents entrees et n'a jamais ete
 * mesure entree par entree. Le faire naivement coute une heure : une ablation
 * relance les sept bancs, soit une dizaine de secondes, et 400 x 10 s fait 70
 * minutes. Donc deux etages.
 *
 *   sans argument   retire toutes les entrees d'une langue a la fois, 26 tours.
 *   avec une langue retire ses entrees une par une.
 *
 *   node --import tsx scratchpad/harness/lexique-ablation.mjs
 *   node --import tsx scratchpad/harness/lexique-ablation.mjs es
 *
 * Il faut `src/content/langDetectV0.ts` en place, comme les autres. Le fichier
 * source est restaure dans un `finally`.
 *
 * CE QU'IL FAUT LIRE. Le lexique a ete construit en lisant le corpus de chat 1
 * puis le corpus 3. Une entree qui ne bouge que ces deux-la ne prouve rien ;
 * les colonnes sont separees pour que ca se voie sans calcul.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOURCE = 'src/content/langDetect.ts';
const DIFF = 'scratchpad/harness/porte-diff.mjs';
const original = readFileSync(SOURCE, 'utf8');
const cible = process.argv[2];

/** Toutes les entrees du lexique, dans l'ordre du fichier. */
const ENTREES = [...original.matchAll(/\['([^']+)', '([a-z-]+)'\],/g)].map((m) => ({
  brut: m[0],
  mot: m[1],
  lang: m[2],
}));

const LANGUES = [...new Set(ENTREES.map((e) => e.lang))];

function mesure() {
  const out = execFileSync('node', ['--import', 'tsx', DIFF], { encoding: 'utf8' });
  const lire = (nom) => {
    const part = out.split('=== ').find((b) => b.startsWith(nom));
    const m = part && /sur\s+V0 .*?-> (\d+)r \/ (\d+)s \/ (\d+)w/.exec(part);
    return m ? m[1] | 0 : NaN;
  };
  return {
    // Les corpus sur lesquels le lexique a ete CHOISI.
    choisi: [lire('chat1'), lire('chat3'), lire('paire-reglage')],
    // Ceux qu'il n'a jamais vus.
    neuf: [
      lire('tatoeba'),
      lire('chat2'),
      lire('non-latin'),
      lire('paire-AVEUGLE'),
      // Le banc du clavier. Il porte le meme texte que chat1, donc il n'est pas
      // "neuf" au sens du vocabulaire, mais il est le SEUL a contenir des mots
      // sans diacritiques : sans lui, la moitie nue du lexique mesure zero.
      lire('chat1-SANS-DIACRITIQUES'),
    ],
  };
}

const ecart = (a, b) => a.map((v, i) => v - b[i]);
const fmt = (xs) => xs.map((n) => (n === 0 ? ' .' : (n > 0 ? '+' : '') + n).padStart(3)).join(' ');

try {
  const base = mesure();
  console.log(`${ENTREES.length} entrees, ${LANGUES.length} langues.`);
  console.log(`AVEC TOUT   choisi ${base.choisi.join(' ')}   neuf ${base.neuf.join(' ')}\n`);

  const lot = cible
    ? ENTREES.filter((e) => e.lang === cible).map((e) => ({ nom: e.mot, retire: [e.brut] }))
    : LANGUES.map((l) => ({
        nom: l,
        retire: ENTREES.filter((e) => e.lang === l).map((e) => e.brut),
      }));

  if (cible && lot.length === 0) {
    console.log(`aucune entree pour "${cible}". Langues : ${LANGUES.join(' ')}`);
  }

  console.log('           chat1 chat3 regl | tatoeba chat2 nonlat AVEUG CLAVIER');
  const morts = [];
  for (const { nom, retire } of lot) {
    let src = original;
    for (const brut of retire) src = src.replace(brut, '');
    writeFileSync(SOURCE, src, 'utf8');
    const sans = mesure();
    const surChoisi = ecart(base.choisi, sans.choisi);
    const surNeuf = ecart(base.neuf, sans.neuf);
    const transfere = surNeuf.some((n) => n !== 0);
    if (!transfere) morts.push(nom);
    console.log(
      `  ${nom.padEnd(10)} ${fmt(surChoisi)} | ${fmt(surNeuf)}` +
        `${transfere ? '   <= TRANSFERE' : surChoisi.some((n) => n !== 0) ? '   memorise' : '   ZERO partout'}`,
    );
  }
  console.log(`\nNe bougent aucun corpus neuf, ${morts.length} sur ${lot.length} :`);
  console.log('  ' + morts.join(' '));
} finally {
  writeFileSync(SOURCE, original, 'utf8');
  console.log(`\n${SOURCE} restaure.`);
}
