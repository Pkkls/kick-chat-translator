/**
 * QUELLE PREUVE L'ARABE PORTE-T-IL LUI-MEME.
 *
 * `arabeOuPersan` tranche par elimination : si rien ne dit ourdou, jawi ni
 * persan, la reponse est `ar`. C'est un DEFAUT et pas une lecture, et il coute
 * les quatre dernieres erreurs persanes du chemin sur : quatre lignes persanes
 * du banc s'ecrivent entierement avec le jeu arabe, ne portent aucun des six
 * mots persans, et ressortent arabes sans que rien dans le texte ne l'ait dit.
 *
 * Le crible a mots, `arabe-candidats.mjs`, a ete pousse a bout de ce cote et le
 * dit lui-meme : deux de ces quatre lignes n'ont AUCUN mot candidat, et les deux
 * autres n'ont que des mots deja refuses parce que l'arabe les ecrit aussi. La
 * suite n'est donc pas un mot persan de plus, c'est de demander a l'arabe de se
 * nommer, et de se taire quand il ne le fait pas.
 *
 * Ce script mesure la couverture des jeux de preuve candidats sur les quatre
 * langues en ecriture arabe. Ce qui compte :
 *   colonne ar   ce que le jeu couvre, donc le rappel qu'on garde
 *   colonne fa   le bruit, et il doit etre a zero ou presque
 *
 * LE GARDE, et il a une histoire. Un `\p{L}` ecrit dans un heredoc de shell
 * devient `p{L}`, quatre caracteres litteraux, et les bornes de mot cessent de
 * borner sans que rien n'echoue. Ca a fausse deux passes entieres de cette
 * branche. Le garde ci-dessous relit sa propre source et sort en 1 si la
 * sequence n'a pas survecu.
 *
 *   node --import tsx test/e2e/arabe-preuve.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT_NL } from '../../src/content/langChatNonLatin.ts';

const source = readFileSync(new URL(import.meta.url), 'utf8');
if (!/\[\^\\{1,2}p\{L\}\]/.test(source)) {
  console.error('La borne de mot a ete mangee a l ecriture. Rien de ce qui suit ne vaut.');
  process.exit(1);
}

const corpus = {};
for (const c of [LANG_CORPUS, LANG_CHAT_NL]) {
  for (const [l, v] of Object.entries(c)) corpus[l] = [...(corpus[l] ?? []), ...v];
}

/**
 * Les quatre lettres que l'orthographe arabe ecrit et que l'orthographe persane
 * remplace, une par une : teh marbuta que le persan ecrit `ه`, alef maksura
 * qu'il ecrit `ی`, yeh arabe U+064A qu'il ecrit `ی` U+06CC, kaf arabe U+0643
 * qu'il ecrit `ک` U+06A9. C'est la symetrie exacte de LETTRES_PERSANES.
 */
const LETTRES = '[ةىيك]';

/**
 * Les mots outils arabes que le crible rend a bruit zero et qui n'ont aucune
 * des quatre lettres.
 *
 * `من` est DEHORS et c'etait la premiere erreur de cette passe : c'est "de,
 * depuis" et "qui" en arabe, et c'est le pronom "je" en persan, au caractere
 * pres. Il portait a lui seul dix-sept des dix-neuf lignes de bruit.
 */
const MOTS = '(^|[^\\p{L}])(أن|لا|هل|هذه|هذا|عن|لم)([^\\p{L}]|$)';

/** L'article defini, colle au nom qui suit. Le persan ne le prend que dans des locutions arabes. */
const ARTICLE = '(^|[^\\p{L}])ال\\p{L}';

const JEUX = {
  'lettres seules': LETTRES,
  'mots seuls': MOTS,
  'article seul': ARTICLE,
  'lettres + mots': `${LETTRES}|${MOTS}`,
  'lettres + article': `${LETTRES}|${ARTICLE}`,
  'les trois': `${LETTRES}|${MOTS}|${ARTICLE}`,
};

console.log('jeu de preuve        ar couvert   fa (bruit)   ms (jawi)');
for (const [nom, motif] of Object.entries(JEUX)) {
  const re = new RegExp(motif, 'u');
  const col = (x) => {
    const v = corpus[x] ?? [];
    return `${String(v.filter((t) => re.test(t)).length).padStart(3)}/${String(v.length).padEnd(3)}`;
  };
  console.log(`  ${nom.padEnd(20)} ${col('ar')}    ${col('fa')}    ${col('ms')}`);
}

const complet = new RegExp(`${LETTRES}|${MOTS}|${ARTICLE}`, 'u');
console.log('\nLignes ARABES qu aucune des trois preuves ne couvre, donc qui deviendraient muettes :');
for (const t of corpus['ar'] ?? []) if (!complet.test(t)) console.log(`  ${t}`);
console.log('\nLignes PERSANES qu une preuve arabe couvre, donc le bruit en entier :');
for (const t of corpus['fa'] ?? []) if (complet.test(t)) console.log(`  ${t}`);
