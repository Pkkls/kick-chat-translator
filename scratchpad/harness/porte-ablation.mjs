/**
 * L'ABLATION : ce que chaque entree de la table rapporte SEULE.
 *
 * Ce script existe parce qu'un total de lot ne dit pas qui l'a gagne. Un lot de
 * cinq entrees a rendu +4 lignes, et l'ablation a montre que DEUX d'entre elles
 * rapportaient zero sur les quatre corpus. Sans ce passage elles partaient en
 * production comme poids mort, mesurees propres et parfaitement inutiles.
 *
 * `porte-diff.mjs` repond a "ce lot vole-t-il une ligne". Celui-ci repond a
 * "quelle ligne de la table merite d'exister". Les deux se lancent avant un
 * commit qui touche la table.
 *
 * Il RETIRE une entree, remesure, et recommence. Le fichier source est restaure
 * dans un `finally`, donc une interruption ne le laisse pas mutile ; si ca
 * arrivait quand meme, `git checkout src/content/langDetect.ts` suffit.
 *
 *   git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts
 *   node --import tsx scratchpad/harness/porte-ablation.mjs
 *   rm src/content/langDetectV0.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOURCE = 'src/content/langDetect.ts';
const DIFF = 'scratchpad/harness/porte-diff.mjs';

const original = readFileSync(SOURCE, 'utf8');

/**
 * Les lignes qui sont une entree de table, dans LES DEUX tables : une porte
 * partagee, `[/x/iu, ['aa', 'bb']]`, et une lettre exclusive, `[/x/iu, 'aa']`.
 *
 * Il n'y a aucune raison de ne cribler que la premiere. La table des lettres
 * exclusives est la plus ancienne du fichier, donc c'est elle qui a eu le plus
 * d'occasions de se faire tuer par un ajout posterieur.
 *
 * Une entree ecrite sur plusieurs lignes est invisible a cette regex. Le
 * compteur imprime en tete est la pour qu'on s'en apercoive.
 */
const entrees = original
  .split('\n')
  .map((ligne, i) => ({ ligne, i }))
  .filter(({ ligne }) => /^\s*\[\/.*\/[a-z]*,\s*(\[|')/.test(ligne));

function mesure() {
  const out = execFileSync('node', ['--import', 'tsx', DIFF], { encoding: 'utf8' });
  const bloc = (nom) => {
    const part = out.split('=== ').find((b) => b.startsWith(nom));
    const m = part && /sur\s+V0 .*?-> (\d+)r \/ (\d+)s \/ (\d+)w/.exec(part);
    return m ? { r: +m[1], w: +m[3] } : { r: NaN, w: NaN };
  };
  const nommees = /nommees  V0 \d+ -> (\d+)/.exec(out);
  return {
    tatoeba: bloc('tatoeba'),
    chat1: bloc('chat1'),
    chat2: bloc('chat2'),
    chat3: bloc('chat3'),
    melange: nommees ? +nommees[1] : NaN,
  };
}

const court = (l) => l.trim().replace(/\s+/g, ' ').slice(0, 58);

try {
  const base = mesure();
  console.log(
    `AVEC TOUT                                                  ` +
      `${base.tatoeba.r} ${base.chat1.r} ${base.chat2.r} ${base.chat3.r}  melange ${base.melange}\n`,
  );
  console.log(`${entrees.length} entrees trouvees, une ligne chacune.\n`);
  console.log('entree retiree                                        ce qu elle rapporte');
  for (const { ligne, i } of entrees) {
    const lignes = original.split('\n');
    lignes.splice(i, 1);
    writeFileSync(SOURCE, lignes.join('\n'), 'utf8');
    const sans = mesure();
    const d = (a, b) => {
      const n = a - b;
      return n === 0 ? '  .' : (n > 0 ? '+' : '') + n;
    };
    const gains = [
      d(base.tatoeba.r, sans.tatoeba.r),
      d(base.chat1.r, sans.chat1.r),
      d(base.chat2.r, sans.chat2.r),
      d(base.chat3.r, sans.chat3.r),
    ];
    const mort = gains.every((g) => g === '  .');
    const vole = base.tatoeba.w !== sans.tatoeba.w || base.melange !== sans.melange;
    console.log(
      `  ${court(ligne).padEnd(60)} ${gains.join(' ')}` +
        `${mort ? '   <= ZERO, a retirer' : ''}${vole ? '   <= touche aussi les erreurs' : ''}`,
    );
  }
} finally {
  writeFileSync(SOURCE, original, 'utf8');
  console.log(`\n${SOURCE} restaure.`);
}
