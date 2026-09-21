/**
 * Le crible des portes : quel caractere non-ASCII est ecrit par un PETIT nombre
 * de langues, et n'est ni deja une lettre exclusive ni deja une porte.
 *
 * File de travail point 2, "chercher ce qui MANQUE dans les tables". Ce script
 * existe parce que les portes en place sont sorties d'une relecture de table et
 * pas d'un effort d'invention, et qu'une relecture faite a la main se trompe :
 * `c` cedille et `o` accent aigu avaient ete proposes comme candidats alors
 * qu'ils etaient deja des portes, et `c` accent aigu comme candidat alors qu'il
 * est deja une lettre exclusive polonaise. Trois erreurs sur quatre propositions.
 *
 * ETAT AU 2026-09-21 : les trois listes sortent VIDES. Le crible a lettre est
 * epuise. Le relancer apres un changement de corpus, pas avant, et l'etendre
 * aux bigrammes pour qu'il ait de nouveau quelque chose a dire.
 *
 *   node --import tsx scratchpad/harness/porte-candidats.mjs
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';

// Deja pris. Recopie a la main depuis langDetect.ts, donc a reverifier si le
// fichier bouge ; le script imprime les deux listes pour que ca se voie.
const EXCLUSIVES =
  'řěůľĺŕżźćśńőűėįųģķļņāēīığşșțñßœû' +
  // Les trente-cinq du vietnamien : les trois d'origine, plus les trente-deux
  // que ce crible a rendues au premier passage.
  'ơưđạấốếờủảợậệớộắữởểịầừặũềựẽọứụỏửổẹằ';
const PORTES = 'äšüóúçéíöďťňýèàôêâãîìòčăąęū';

// MESURES ET REJETEES. Sans cette liste le crible les repropose a chaque
// passage, parce qu'il ne voit que les corpus et pas les decisions.
//
//   ł   polonais seul, mais il voyage dans les noms propres. Une ligne slovaque
//       du corpus parle des enfants de Łazarz et ne porte aucune lettre slovaque.
//       `żźćśń` prend 70 lignes polonaises contre 48 pour ł, et zero ailleurs.
//   õ   partage avec le portugais a une ligne, donc il est une PORTE dediee
//       (`estonienOuPortugais`) et non une lettre exclusive.
//   ù   italien autant que vietnamien, `piu` l'ecrit.
//   å ø æ  scandinaves, deja pris par les fonctions dediees en amont.
const REJETES = 'łõùåøæ';

// Les seules langues qui peuvent tirer d'une porte a lettre : les latines. Une
// ligne en cyrillique ou en arabe est deja nommee par le pre-controle.
const LATINES = new Set([
  'ca', 'cs', 'da', 'de', 'en', 'es', 'et', 'fi', 'fr', 'hu', 'id', 'it', 'lt',
  'lv', 'ms', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv', 'tl', 'tr', 'vi',
]);

const corpora = [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3];

/** char -> lang -> nombre de lignes qui le portent */
const vu = new Map();
for (const corpus of corpora) {
  for (const [lang, lignes] of Object.entries(corpus)) {
    if (!LATINES.has(lang)) continue;
    for (const ligne of lignes) {
      for (const c of new Set(ligne.toLowerCase())) {
        if (c.charCodeAt(0) < 128) continue;
        if (!/\p{L}/u.test(c)) continue;
        // BORNE A L'ECRITURE LATINE, et sans elle le crible ment. Le corpus
        // malais contient six lignes en jawi, donc en ecriture arabe. Comme
        // `ar` et `fa` ne sont pas dans LATINES, leurs lettres ne sont comptees
        // que pour `ms` et le crible les rend comme "lettres exclusives
        // malaises manquantes" : alef, waw, ya, ra. Les ajouter a la table
        // nommerait `ms` sur toute ligne arabe du monde.
        //
        // Le jawi a bien ses lettres a lui, ڠ ڤ ڬ ڽ ݢ ۏ, et elles sont deja
        // lues par LETTRES_JAWI. Ce crible-ci ne parle que du latin.
        if (!/\p{Script=Latin}/u.test(c)) continue;
        if (!vu.has(c)) vu.set(c, new Map());
        const m = vu.get(c);
        m.set(lang, (m.get(lang) ?? 0) + 1);
      }
    }
  }
}

const etat = (c) =>
  EXCLUSIVES.includes(c)
    ? 'exclusive'
    : PORTES.includes(c)
      ? 'PORTE'
      : REJETES.includes(c)
        ? 'rejete'
        : 'libre';

// Une langue qui n'ecrit le caractere qu'une ou deux fois sur des milliers de
// lignes est du bruit : un nom propre, une citation. Le seuil coupe a trois,
// et les langues sous le seuil sont imprimees a part pour qu'on les voie.
const SEUIL = 3;

const lignes = [];
for (const [c, m] of vu) {
  const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
  const faibles = [...m.entries()].filter(([, n]) => n < SEUIL).map(([l]) => l);
  if (fortes.length === 0 || fortes.length > 4) continue;
  lignes.push({ c, fortes, faibles, total: fortes.reduce((s, [, n]) => s + n, 0) });
}
lignes.sort((a, b) => b.total - a.total);

console.log(`caractere  etat        lignes  langues (>= ${SEUIL} lignes)   [bruit < ${SEUIL}]`);
for (const { c, fortes, faibles, total } of lignes) {
  console.log(
    `    ${c}      ${etat(c).padEnd(10)} ${String(total).padStart(5)}  ` +
      `${fortes.map(([l, n]) => `${l}=${n}`).join(' ').padEnd(34)} ` +
      `${faibles.length ? '[' + faibles.join(' ') + ']' : ''}`,
  );
}

console.log('\nLES CANDIDATS, portes libres a deux langues fortes ou plus :');
for (const { c, fortes, total } of lignes) {
  if (etat(c) !== 'libre' || fortes.length < 2) continue;
  console.log(`  ${c}  ${total} lignes  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ')}`);
}

// L'autre moitie du crible, et c'est le point 2 de la file : un caractere
// qu'UNE seule langue ecrit et qui n'est pas dans la table des lettres
// exclusives est un marqueur gratuit qu'on a simplement oublie. C'est comme ca
// que `ñ`, `ß`, `œ` et le grec sont entres, trois passes trop tard.
console.log('\nLES LETTRES EXCLUSIVES QUI MANQUENT, une seule langue et hors table :');
const parLangue = new Map();
for (const { c, fortes, total } of lignes) {
  if (etat(c) !== 'libre' || fortes.length !== 1) continue;
  const l = fortes[0][0];
  if (!parLangue.has(l)) parLangue.set(l, []);
  parLangue.get(l).push([c, total]);
}
for (const [l, cs] of [...parLangue.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const tot = cs.reduce((s, [, n]) => s + n, 0);
  console.log(`  ${l}  ${cs.length} caracteres, ${tot} lignes  ${cs.map(([c, n]) => `${c}=${n}`).join(' ')}`);
}

console.log('\nLES EXCLUSIVES QUE LA MESURE CONTREDIT, si la table a derive :');
for (const { c, fortes } of lignes) {
  if (etat(c) !== 'exclusive' || fortes.length < 2) continue;
  console.log(`  ${c}  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ')}`);
}

/**
 * DEUXIEME PASSE : LES SEQUENCES.
 *
 * La passe a lettre est epuisee, et elle ne peut structurellement rien dire de
 * plus : elle compte des caracteres isoles. Or la table contient deja quatre
 * marqueurs de sequence, `yy` finnois, `öö` estonien, `ção` portugais et `l·l`
 * catalan, chacun trouve a la main. Personne n'a jamais cherche les autres.
 *
 * Meme forme que la passe a lettre, et surtout MEME SEUIL DE BRUIT : une langue
 * compte pour une sequence si elle l'ecrit sur trois lignes ou plus. Sans ce
 * seuil, chaque bigramme du latin apparait dans les vingt-six langues une fois
 * ou deux et rien ne ressort.
 *
 * Deux sorties, comme au-dessus : les sequences qu'UNE langue ecrit sont des
 * marqueurs exclusifs candidats, celles que deux a quatre ecrivent sont des
 * portes candidates.
 */
const TAILLES = [2, 3];
const PLANCHER = 20; // lignes, tous corpus confondus

const vuSeq = new Map();
for (const corpus of corpora) {
  for (const [lang, lgns] of Object.entries(corpus)) {
    if (!LATINES.has(lang)) continue;
    for (const ligne of lgns) {
      const t = ligne.toLowerCase();
      const seqs = new Set();
      for (const taille of TAILLES) {
        for (let i = 0; i + taille <= t.length; i += 1) {
          const s = t.slice(i, i + taille);
          // Que des lettres : une sequence qui enjambe un espace ou un emoji
          // decrit la mise en page et pas la langue.
          if (!/^\p{Script=Latin}+$/u.test(s)) continue;
          seqs.add(s);
        }
      }
      for (const s of seqs) {
        if (!vuSeq.has(s)) vuSeq.set(s, new Map());
        const m = vuSeq.get(s);
        m.set(lang, (m.get(lang) ?? 0) + 1);
      }
    }
  }
}

const seqExclusives = [];
const seqPortes = [];
for (const [s, m] of vuSeq) {
  const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
  if (fortes.length === 0 || fortes.length > 4) continue;
  const total = fortes.reduce((acc, [, n]) => acc + n, 0);
  if (total < PLANCHER) continue;
  const faibles = [...m.entries()].filter(([, n]) => n < SEUIL);
  const bruit = faibles.reduce((acc, [, n]) => acc + n, 0);
  (fortes.length === 1 ? seqExclusives : seqPortes).push({ s, fortes, total, bruit, faibles });
}
const parTotal = (a, b) => b.total - a.total;

// Le bruit STRICTEMENT NUL d'abord : une sequence qu'une seule langue ecrit et
// que pas une ligne d'aucune autre ne porte est un marqueur exclusif gratuit,
// au meme titre qu'une lettre. C'est comme ca que `ão`, `cê` et `ía` sont
// entres, alors que `ção` etait la depuis trois passes en n'en voyant qu'un bout.
console.log(`\nSEQUENCES A BRUIT STRICTEMENT NUL, candidates exclusives :`);
for (const x of seqExclusives.filter((y) => y.bruit === 0).sort(parTotal).slice(0, 40)) {
  console.log(`  ${x.s.padEnd(5)} ${String(x.total).padStart(4)} ${x.fortes[0][0]}`);
}

console.log(`\nSEQUENCES QU'UNE SEULE LANGUE ECRIT (>= ${PLANCHER} lignes, bruit a part) :`);
for (const { s, fortes, total, bruit, faibles } of seqExclusives.sort(parTotal).slice(0, 30)) {
  console.log(
    `  ${s.padEnd(4)} ${String(total).padStart(4)} ${fortes[0][0]}` +
      `${bruit ? `   bruit ${bruit} lignes dans ${faibles.length} langues [${faibles.map(([l]) => l).join(' ')}]` : '   bruit ZERO'}`,
  );
}

console.log(`\nSEQUENCES QUE DEUX A QUATRE LANGUES ECRIVENT, portes candidates :`);
for (const { s, fortes, total, bruit } of seqPortes.sort(parTotal).slice(0, 25)) {
  console.log(
    `  ${s.padEnd(4)} ${String(total).padStart(4)}  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ')}` +
      `${bruit ? `   bruit ${bruit}` : ''}`,
  );
}

/**
 * TROISIEME PASSE : LES MOTS.
 *
 * C'est celle qui compte depuis `c3f2942`. Une porte declenchee par un MOT a
 * fait pour la paire scandinave ce que trois tours de lettres n'avaient pas
 * fait, et elle survit au clavier sans diacritiques, ce qu'aucune regle de
 * lettre ne fait.
 *
 * Elle remplace aussi la passe a sequence pour tout ce qui est ASCII : une
 * sequence ASCII se declenche a l'interieur du mot qui la tranche, mesure et
 * rejete, alors qu'un TOKEN entier ne peut pas se confondre avec un autre token.
 *
 * Le decoupage est celui de `SHORT_WORD_LANG` : sur les non-lettres. Un
 * candidat qui contient un espace ne peut correspondre a rien, piege documente
 * au protocole 4.6.
 *
 * Deux usages, et c'est pour ca que la sortie est groupee par PAIRE :
 *   - un mot que deux langues seules ecrivent est un DECLENCHEUR de porte ;
 *   - une fois la porte ouverte, un mot propre a l'une des deux TRANCHE.
 * La deuxieme moitie se crible avec `lang-screen.mjs`, qui existe pour ca.
 */
const PLANCHER_MOT = 4;
const vuMot = new Map();
for (const corpus of corpora) {
  for (const [lang, lgns] of Object.entries(corpus)) {
    if (!LATINES.has(lang)) continue;
    for (const ligne of lgns) {
      for (const mot of new Set(ligne.toLowerCase().split(/[^\p{L}]+/u))) {
        if (mot.length < 2) continue;
        if (!/^\p{Script=Latin}+$/u.test(mot)) continue;
        if (!vuMot.has(mot)) vuMot.set(mot, new Map());
        const m = vuMot.get(mot);
        m.set(lang, (m.get(lang) ?? 0) + 1);
      }
    }
  }
}

/** paire "a+b" -> mots que ces deux langues seules ecrivent */
const paires = new Map();
const motsSolo = [];
for (const [mot, m] of vuMot) {
  const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
  const total = fortes.reduce((acc, [, n]) => acc + n, 0);
  if (total < PLANCHER_MOT) continue;
  const bruit = [...m.entries()].filter(([, n]) => n < SEUIL).reduce((acc, [, n]) => acc + n, 0);
  if (fortes.length === 1) {
    motsSolo.push({ mot, lang: fortes[0][0], total, bruit });
  } else if (fortes.length === 2) {
    const cle = fortes.map(([l]) => l).sort().join('+');
    if (!paires.has(cle)) paires.set(cle, []);
    paires.get(cle).push({ mot, fortes, total, bruit });
  }
}

// Une paire nommee en argument sort EN ENTIER et sans plancher, pour qu'on
// puisse travailler un declencheur precis sans relire tout le tableau :
//
//   node --import tsx scratchpad/harness/porte-candidats.mjs id+ms
//
// Les langues sont triees alphabetiquement dans la cle, donc `id+ms` et pas
// `ms+id`. Le corpus de la paire n'est PAS lu ici et ne doit pas l'etre : il
// mesure ce qui sort d'ici, il ne sert pas a le choisir.
const demandee = process.argv[2];

/**
 * LES SEQUENCES QUI TRIENT DEUX LANGUES, et c'est une question differente de
 * celle que la passe a sequences pose plus haut.
 *
 * Derriere une porte il ne reste que deux langues, donc le seuil n'est plus
 * trois lignes, il est ZERO : une ligne de l'autre cote n'est pas du bruit,
 * c'est une erreur. Et ce qui separe deux langues proches est le plus souvent
 * une LETTRE DANS UN MOT, pas un mot : le danois ecrit `g` la ou le norvegien
 * ecrit `k`, `øj` la ou il ecrit `øy`. Quatre paires de lettres ont fait pour
 * ce tri ce que onze mots ne faisaient pas.
 *
 * Sortie : les sequences qu'une des deux ecrit et que l'autre n'ecrit JAMAIS,
 * les autres langues etant hors sujet puisque la porte les a deja ecartees.
 */
if (demandee && demandee.includes('+')) {
  const [a, b] = demandee.split('+');
  const tri = [];
  for (const [s, m] of vuSeq) {
    const na = m.get(a) ?? 0;
    const nb = m.get(b) ?? 0;
    if (na === 0 && nb === 0) continue;
    if (na > 0 && nb > 0) continue;
    const gagnante = na > 0 ? a : b;
    const total = na > 0 ? na : nb;
    if (total < 2) continue;
    tri.push({ s, gagnante, total, ailleurs: [...m.entries()].filter(([l]) => l !== a && l !== b) });
  }
  console.log(`\n${demandee.toUpperCase()}, SEQUENCES QUE L'UNE ECRIT ET L'AUTRE JAMAIS :`);
  for (const { s, gagnante, total, ailleurs } of tri.sort((x, y) => y.total - x.total).slice(0, 30)) {
    console.log(
      `  ${s.padEnd(5)} ${gagnante}=${String(total).padStart(3)}   ` +
        `hors paire ${ailleurs.length ? ailleurs.map(([l, n]) => `${l}=${n}`).join(' ') : 'aucune'}`,
    );
  }
}

if (demandee) {
  const mots = [];
  for (const [mot, m] of vuMot) {
    const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
    if (fortes.length !== 2) continue;
    if (fortes.map(([l]) => l).sort().join('+') !== demandee) continue;
    const bruit = [...m.entries()].filter(([, n]) => n < SEUIL);
    mots.push({ mot, fortes, total: fortes.reduce((s, [, n]) => s + n, 0), bruit });
  }
  console.log(`\n${demandee.toUpperCase()}, TOUS LES MOTS PARTAGES, sans plancher :`);
  for (const { mot, fortes, total, bruit } of mots.sort((a, b) => b.total - a.total)) {
    console.log(
      `  ${mot.padEnd(14)} ${String(total).padStart(3)}  ${fortes.map(([l, n]) => `${l}=${n}`).join(' ').padEnd(16)}` +
        `${bruit.length ? ` bruit ${bruit.map(([l, n]) => `${l}=${n}`).join(' ')}` : ' bruit ZERO'}`,
    );
  }
}

console.log(`\nMOTS QUE DEUX LANGUES SEULES ECRIVENT, declencheurs de porte (>= ${PLANCHER_MOT} lignes) :`);
const parPoids = [...paires.entries()]
  .map(([cle, mots]) => [cle, mots.sort(parTotal), mots.reduce((s, m) => s + m.total, 0)])
  .sort((a, b) => b[2] - a[2])
  .slice(0, 14);
for (const [cle, mots, poids] of parPoids) {
  console.log(`  ${cle.padEnd(8)} ${String(poids).padStart(4)} lignes`);
  for (const { mot, fortes, bruit } of mots.slice(0, 6)) {
    console.log(
      `      ${mot.padEnd(12)} ${fortes.map(([l, n]) => `${l}=${n}`).join(' ').padEnd(18)}` +
        `${bruit ? ` bruit ${bruit}` : ' bruit ZERO'}`,
    );
  }
}

console.log(`\nMOTS QU'UNE SEULE LANGUE ECRIT, sans bruit du tout (>= ${PLANCHER_MOT} lignes) :`);
const solo = motsSolo.filter((m) => m.bruit === 0).sort(parTotal);
const parLang = new Map();
for (const m of solo) {
  if (!parLang.has(m.lang)) parLang.set(m.lang, []);
  parLang.get(m.lang).push(m);
}
for (const [l, ms] of [...parLang.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12)) {
  console.log(`  ${l.padEnd(4)} ${ms.map(({ mot, total }) => `${mot}=${total}`).join(' ')}`);
}
