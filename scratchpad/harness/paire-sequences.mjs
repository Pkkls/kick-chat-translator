/**
 * LES SEQUENCES QUI SEPARENT DEUX LANGUES PROCHES, pour n'importe quelle paire.
 *
 * Ecrit pour le tri interieur danois-norvegien, ou il a valu trente-deux lignes
 * d'un coup, et generalise parce que la question se repose a l'identique pour
 * le catalan contre l'espagnol, le slovaque contre le tcheque, le portugais
 * contre l'espagnol.
 *
 * CE QUI LE REND UTILE EST LE DIAGNOSTIC QUI LE PRECEDE, pas lui. Pour le
 * nordique, `porte-diagnostic.mjs` a montre que 34 lignes norvegiennes
 * n'ouvraient pas la porte mais que QUARANTE-SIX l'ouvraient sans que rien ne
 * tranche derriere. Les deux se corrigent a des endroits opposes du fichier.
 * Lancer ce crible-ci sans avoir pose la question revient a etoffer la moitie
 * qui n'est pas le probleme.
 *
 * Ce qu'il cherche est une SEQUENCE et pas un mot, et le rapport a ete mesure :
 * onze mots plus quatre sequences valent dix lignes, les sequences seules en
 * valent sept, les mots seuls trois. Ce qui separe deux langues proches est
 * presque toujours une lettre DANS un mot, `bøger` contre `bøker`, et une
 * sequence porte sur n'importe quel mot.
 *
 * DEUX SEUILS, ET ILS NE SONT PAS LES MEMES :
 *
 *   colonne B       ZERO, toujours. Le tri se fait entre DEUX langues, donc une
 *                   ligne de l'autre cote n'est pas du bruit, c'est une erreur.
 *   colonne ailleurs   zero si la regle doit vivre en plein air, dans la table
 *                   des lettres exclusives. Libre si elle vit DERRIERE une
 *                   porte qui a deja ecarte tout le reste, ce qui est le cas du
 *                   tri nordique et du tri malais-indonesien.
 *
 * Le bruit se compte sur TOUTES les lignes et pas seulement sur celles qui
 * entrent dans la porte aujourd'hui : une ligne qui n'entre pas maintenant peut
 * entrer des que le declencheur bouge. C'est la lecon que `je` a coutee du cote
 * malais.
 *
 * ET LE CORPUS NE PEUT PAS REFUSER CE QU'IL NE CONTIENT PAS. La sortie est une
 * liste de candidats, pas une liste de reponses : `unn` sort propre pour le
 * norvegien et le danois ecrit `kunne`, `lik` sort propre et le danois ecrit
 * `politik`. Chaque candidat retenu doit pouvoir s'enoncer comme une regle
 * d'orthographe, sinon il mesure une absence.
 *
 *   node --import tsx scratchpad/harness/paire-sequences.mjs no da
 *   node --import tsx scratchpad/harness/paire-sequences.mjs ca es
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_DIX } from '../../src/content/langChatDixCorpus.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const [A, B] = [process.argv[2] ?? 'no', process.argv[3] ?? 'da'];
const SEUIL = Number(process.argv[4] ?? 3);

const corpus = {};
for (const c of [
  LANG_CORPUS,
  LANG_CHAT,
  LANG_CHAT2,
  LANG_CHAT3,
  LANG_CHAT_DIX,
  LANG_CHAT_PAIRE,
  LANG_CHAT_PAIRE_REGLAGE,
]) {
  for (const [l, v] of Object.entries(c)) corpus[l] = [...(corpus[l] ?? []), ...v];
}
if (!corpus[A] || !corpus[B]) {
  console.error(`langue inconnue : ${A} ou ${B}`);
  process.exit(1);
}
console.log(`${A} ${corpus[A].length} lignes, ${B} ${corpus[B].length}, seuil ${SEUIL}.`);

const muettes = (l) => corpus[l].filter((t) => confidentLanguage(t) === undefined);
console.log(`muettes aujourd hui : ${A} ${muettes(A).length}, ${B} ${muettes(B).length}.`);

/** Toutes les sous-chaines de 2 a 4 lettres d'un corpus, avec le nombre de LIGNES. */
function sequences(lignes) {
  const vu = new Map();
  for (const t of lignes) {
    const s = t.toLowerCase();
    const dedans = new Set();
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= s.length; i++) {
        const bout = s.slice(i, i + n);
        if (!/^\p{L}+$/u.test(bout)) continue;
        dedans.add(bout);
      }
    }
    for (const bout of dedans) vu.set(bout, (vu.get(bout) ?? 0) + 1);
  }
  return vu;
}

const vu = {};
for (const l of Object.keys(corpus)) vu[l] = sequences(corpus[l]);

function propose(cible, autre) {
  const mutes = muettes(cible).map((t) => t.toLowerCase());
  const out = [];
  for (const [bout, n] of vu[cible]) {
    if (n < SEUIL) continue;
    if (vu[autre].get(bout)) continue;
    const ferme = mutes.filter((t) => t.includes(bout)).length;
    if (!ferme) continue;
    const ailleurs = Object.keys(corpus)
      .filter((l) => l !== cible && l !== autre && vu[l].get(bout))
      .map((l) => `${l}=${vu[l].get(bout)}`);
    out.push([bout, n, ferme, ailleurs]);
  }
  // Une sequence dont une plus courte, elle aussi retenue, fait deja le travail
  // n'apporte rien : c'est du poids mort que l'ablation sortirait plus tard.
  const courtes = new Set(out.map(([b]) => b));
  const gardes = out.filter(([bout]) => {
    for (let n = 2; n < bout.length; n++) {
      for (let i = 0; i + n <= bout.length; i++) {
        if (courtes.has(bout.slice(i, i + n))) return false;
      }
    }
    return true;
  });
  gardes.sort((a, b) => b[2] - a[2] || b[1] - a[1]);
  console.log(`\n=== ${cible}, sequences que ${autre} n ecrit JAMAIS ===`);
  console.log('sequence   lignes   muettes prises   ailleurs');
  for (const [bout, n, ferme, ailleurs] of gardes.slice(0, 30)) {
    const det = ailleurs.length ? ailleurs.slice(0, 8).join(' ') : 'RIEN';
    console.log(`  ${bout.padEnd(8)} ${String(n).padStart(4)}   ${String(ferme).padStart(6)}           ${det}`);
  }
  console.log(`  ${gardes.length} candidats, ${gardes.filter(([, , , a]) => !a.length).length} sans aucune autre langue.`);
}

propose(A, B);
propose(B, A);
