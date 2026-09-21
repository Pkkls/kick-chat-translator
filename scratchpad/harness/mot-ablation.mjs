/**
 * L'ablation au MOT, pour les trois jeux de la porte malais-indonesien.
 *
 * `porte-ablation.mjs` retire une LIGNE de table. Celui-ci retire un mot dans
 * une alternance de regex, ce que l'autre ne sait pas faire, et c'est ce qu'il
 * faut quand un tour ajoute quarante mots d'un coup.
 *
 * LE CRITERE QU'IL APPLIQUE, et c'est lui qui compte plus que le script : un
 * mot choisi en lisant le corpus de REGLAGE ne prouve rien en bougeant ce
 * corpus-la. Il doit bouger un corpus qu'il n'a pas vu. Le script imprime donc
 * deux colonnes separees, `reglage` et `ailleurs`, et un mot dont `ailleurs`
 * est vide est de la memorisation, quelle que soit sa colonne de gauche.
 *
 *   git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts
 *   node --import tsx scratchpad/harness/mot-ablation.mjs
 *   rm src/content/langDetectV0.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOURCE = 'src/content/langDetect.ts';
const DIFF = 'scratchpad/harness/porte-diff.mjs';
const original = readFileSync(SOURCE, 'utf8');

/** Les mots ajoutes au tour qu'on mesure, un par jeu. */
const MOTS = {
  declencheur: 'menang kalah kucing lagu ulang bulan demam panjang baju anjing tidur kampung belajar bangun minggu depan hari siapa baru rindu agak'.split(' '),
  indonesien: 'gue temen dateng telat abis kangen nongkrong nyokap hape lucu semalem kemarin seru berisik'.split(' '),
  malais: 'dah korang lepak jiran sejuk comel bising'.split(' '),
};

function mesure() {
  const out = execFileSync('node', ['--import', 'tsx', DIFF], { encoding: 'utf8' });
  const lire = (nom) => {
    const part = out.split('=== ').find((b) => b.startsWith(nom));
    const m = part && /sur\s+V0 .*?-> (\d+)r \/ (\d+)s \/ (\d+)w/.exec(part);
    return m ? { r: +m[1], w: +m[3] } : { r: NaN, w: NaN };
  };
  return {
    tatoeba: lire('tatoeba'),
    chat1: lire('chat1'),
    chat2: lire('chat2'),
    chat3: lire('chat3'),
    aveugle: lire('paire-AVEUGLE'),
    reglage: lire('paire-reglage'),
  };
}

try {
  const base = mesure();
  console.log(
    `AVEC TOUT   tatoeba ${base.tatoeba.r}  chat1 ${base.chat1.r}  chat2 ${base.chat2.r}  ` +
      `chat3 ${base.chat3.r}  paire-AVEUGLE ${base.aveugle.r}  paire-reglage ${base.reglage.r}\n`,
  );
  console.log('mot            reglage   ailleurs (tatoeba chat1 chat2 chat3 AVEUGLE)');
  const morts = [];
  for (const [jeu, mots] of Object.entries(MOTS)) {
    console.log(`  -- ${jeu} --`);
    for (const mot of mots) {
      // Retire le mot de son alternance, avec sa barre, sans toucher au reste.
      const sansMot = original.replace(`|${mot}`, '');
      if (sansMot === original) {
        console.log(`  ${mot.padEnd(12)} INTROUVABLE dans le fichier`);
        continue;
      }
      writeFileSync(SOURCE, sansMot, 'utf8');
      const sans = mesure();
      const d = (a, b) => a - b;
      const ailleurs = [
        d(base.tatoeba.r, sans.tatoeba.r),
        d(base.chat1.r, sans.chat1.r),
        d(base.chat2.r, sans.chat2.r),
        d(base.chat3.r, sans.chat3.r),
        d(base.aveugle.r, sans.aveugle.r),
      ];
      const gainReglage = d(base.reglage.r, sans.reglage.r);
      const transfere = ailleurs.some((n) => n !== 0);
      if (!transfere) morts.push(mot);
      console.log(
        `  ${mot.padEnd(12)} ${String(gainReglage).padStart(4)}      ` +
          `${ailleurs.map((n) => (n === 0 ? ' .' : (n > 0 ? '+' : '') + n).padStart(3)).join(' ')}` +
          `${transfere ? '   <= TRANSFERE' : ''}`,
      );
    }
  }
  console.log(`\nMots qui ne bougent QUE le corpus de reglage, ${morts.length} sur ${Object.values(MOTS).flat().length} :`);
  console.log('  ' + morts.join(' '));
} finally {
  writeFileSync(SOURCE, original, 'utf8');
  console.log(`\n${SOURCE} restaure.`);
}
