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

/**
 * Les mots a mesurer, group\u00e9s par la CONSTANTE qui les porte.
 *
 * Le nom de la constante n'est pas decoratif, il est la correction d'un bug qui
 * a fausse une passe entiere. La premiere version faisait
 * `source.replace('|' + mot, '')` sur tout le fichier, donc elle retirait la
 * PREMIERE occurrence de cette chaine ou qu'elle soit :
 *
 *   `|ni`  a mange le `ni` de `niya` dans la table tagalog
 *   `|je`  a mange le `je` de `ještě` dans le jeu tcheque
 *   `|dah` a mange le `dah` de `daha` dans le jeu turc
 *   `|lah` aurait mange le `lah` de `lahko` dans le jeu slovene
 *
 * Les chiffres qui en sortaient mesuraient la destruction d'une autre langue.
 * `lah` ressortait a +5 lignes Tatoeba, ce qui etait le slovene qui tombait.
 *
 * Le retrait est donc borne a la constante nommee, et il exige une frontiere
 * d'alternance des deux cotes, `|mot|` ou `|mot)`.
 */
const MOTS = {
  SEQUENCES_NORVEGIENNES: 'ei itt inn kje het ike'.split(' '),
  SEQUENCES_DANOISES: 'ej igt bliv æb øb kø uge dst hed igen'.split(' '),
};

/**
 * Retire `mot` de l'alternance de `constante`, et de nulle part ailleurs.
 * Rend `null` si le mot n'y est pas, pour que l'appelant le signale au lieu de
 * mesurer un fichier inchange et de conclure "zero".
 */
function sans(source, constante, mot) {
  const bloc = new RegExp(`(const ${constante} =\\s*/[^;]*;)`);
  const m = bloc.exec(source);
  if (!m) return null;
  const avant = m[1];
  const apres = avant.replace(new RegExp(`\\|${mot}(?=[|)])`), '');
  if (apres === avant) return null;
  return source.replace(avant, apres);
}

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
  for (const [constante, mots] of Object.entries(MOTS)) {
    console.log(`  -- ${constante} --`);
    for (const mot of mots) {
      const sansMot = sans(original, constante, mot);
      if (sansMot === null) {
        console.log(`  ${mot.padEnd(12)} INTROUVABLE dans ${constante}`);
        continue;
      }
      writeFileSync(SOURCE, sansMot, 'utf8');
      const sansLui = mesure();
      const d = (a, b) => a - b;
      const ailleurs = [
        d(base.tatoeba.r, sansLui.tatoeba.r),
        d(base.chat1.r, sansLui.chat1.r),
        d(base.chat2.r, sansLui.chat2.r),
        d(base.chat3.r, sansLui.chat3.r),
        d(base.aveugle.r, sansLui.aveugle.r),
      ];
      const gainReglage = d(base.reglage.r, sansLui.reglage.r);
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
