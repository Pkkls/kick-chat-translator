/**
 * PROTOTYPE, hors production : l'anglais nomme par le NOMBRE de marqueurs.
 *
 * LE PROBLEME. L'anglais est a 38 lignes sur 120 sur le chemin sur et c'est la
 * quatrieme plus faible langue de la matrice. Ses meilleurs marqueurs sont
 * refuses, et tous pour la meme raison : `the` 43 lignes, `you` 33, `inte` 21,
 * tous a bruit nul dans les quarante-deux autres langues, tous attrapes par le
 * banc des lignes melangees. **L'anglais est la langue avec laquelle tout le
 * monde melange**, donc un marqueur anglais propre reste un mauvais marqueur.
 *
 * Or `ignoreEnglish` a besoin que l'anglais soit nomme, section 10.
 *
 * L'IDEE. Changer la FORME de la regle au lieu de chercher un meilleur mot.
 * Un marqueur unique ne distingue pas `the` dans une phrase anglaise de `the`
 * dans `grazie bro you are cracked`. Deux conditions ensemble le font :
 *
 *   1. au moins N mots anglais DISTINCTS sur la ligne ;
 *   2. et aucun mot d'aucune autre langue.
 *
 * Une ligne melangee porte par construction un mot de l'autre langue, donc la
 * deuxieme condition la rejette quel que soit le nombre de mots anglais.
 *
 * Ce script mesure N = 1 a 4 sur les cinq corpus et n'ecrit rien.
 *
 * ===================== RESULTAT : NEGATIF, ET POURQUOI =====================
 *
 * N   anglaises gagnees (tatoeba)   volees   melangees nommees
 * 1   +68 / 82                        26        40 / 60
 * 2   +38 / 82                         0         2 / 60
 * 3   +11 / 82                         0         0 / 60
 * 4    +3 / 82                         0         0 / 60
 *
 * CE QUI MARCHE, et c'est le resultat interessant : **des N=2, le vol tombe a
 * ZERO** sur les quatre corpus. La deuxieme condition fait le travail. Un
 * marqueur anglais unique est inutilisable, deux marqueurs plus l'absence de
 * toute autre langue ne volent rien a personne. La forme de la regle etait
 * bien le probleme, pas le choix des mots.
 *
 * CE QUI LE TUE : a N=2 le banc des lignes melangees en nomme DEUX, donc son
 * veto s'applique. Les deux sont
 *     `that clip called merci beaucoup was wild`
 *     `the guy named bardzo just subbed`
 * c'est-a-dire de l'anglais dont le mot etranger est un NOM PROPRE, un titre
 * de clip et un pseudo. On peut soutenir que les nommer anglaises est correct
 * pour le produit. On ne peut pas redefinir ce que mesure un corpus pour faire
 * passer une regle, et c'est exactement ce que ca serait.
 *
 * Au seuil admissible, N=3, le rendement est de +11 lignes sur Tatoeba et +1
 * sur le chat, zero sur l'aveugle, pour une liste de cinquante mots et un
 * mecanisme de comptage qui n'existe nulle part ailleurs dans le fichier.
 * **Pas livre.** Le rapport est plus mauvais que tout ce qui a ete livre cette
 * session, et le mecanisme est plus cher.
 *
 * A ROUVRIR SI : le corpus melange gagne des lignes ou l'etranger n'est pas un
 * nom propre, ce qui deplacerait le seuil de 3 a 2 et ferait passer le gain de
 * 11 a 38. C'est le seul endroit du fichier ou deux lignes de corpus decident
 * d'un facteur trois.
 *
 *   node --import tsx scratchpad/harness/anglais-essai.mjs
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_MIXED } from '../../src/content/langMixedCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

/**
 * Les mots anglais. Pris dans la sortie du crible, section "mots qu'une seule
 * langue ecrit, sans bruit du tout", plus les plus frequents de la langue qui
 * y figurent. Aucun n'est utilisable SEUL, c'est tout le point.
 */
const ANGLAIS =
  /(^|[^\p{L}])(the|you|your|that|this|what|not|and|of|is|are|was|were|have|has|with|for|but|they|them|his|her|here|there|how|would|could|should|like|just|about|people|because|when|from|all|out|up|down|more|than|been|will|can|get|got|know|think|going|really)([^\p{L}]|$)/giu;

/**
 * Un mot d'une autre langue, au sens le plus large disponible : si le chemin
 * sur sait nommer la ligne dans une langue qui n'est pas l'anglais, la ligne
 * n'est pas anglaise. C'est deliberement grossier, et c'est ce qui rend la
 * regle honnete : elle ne s'applique que la ou tout le reste s'est tu.
 */
const autreLangue = (t) => {
  const r = confidentLanguage(t);
  return r !== undefined && r !== 'en';
};

const compte = (t) => new Set([...t.toLowerCase().matchAll(ANGLAIS)].map((m) => m[2])).size;

function essai(n) {
  const nomme = (t) => !autreLangue(t) && compte(t) >= n;
  const res = {};
  for (const [nomCorpus, corpus] of [
    ['tatoeba', LANG_CORPUS],
    ['chat1', LANG_CHAT],
    ['chat2-AVEUGLE', LANG_CHAT2],
    ['chat3', LANG_CHAT3],
  ]) {
    let justes = 0;
    let volees = 0;
    let total = 0;
    for (const [lang, lignes] of Object.entries(corpus)) {
      for (const t of lignes) {
        // La regle ne s'applique qu'aux lignes que le detecteur laisse muettes.
        if (confidentLanguage(t) !== undefined) continue;
        if (lang === 'en') total += 1;
        if (!nomme(t)) continue;
        if (lang === 'en') justes += 1;
        else volees += 1;
      }
    }
    res[nomCorpus] = { justes, volees, total };
  }
  const melangees = LANG_MIXED.filter((t) => confidentLanguage(t) === undefined && nomme(t)).length;
  return { res, melangees };
}

console.log('N = nombre de mots anglais DISTINCTS exiges, sur les lignes aujourd hui MUETTES\n');
console.log('N   corpus          anglaises gagnees / muettes   lignes volees   melangees nommees');
for (const n of [1, 2, 3, 4]) {
  const { res, melangees } = essai(n);
  for (const [nomCorpus, r] of Object.entries(res)) {
    console.log(
      `${n}   ${nomCorpus.padEnd(15)} ${String(r.justes).padStart(4)} / ${String(r.total).padEnd(4)}` +
        `              ${String(r.volees).padStart(4)}` +
        `${nomCorpus === 'tatoeba' ? `            ${melangees} / 60` : ''}`,
    );
  }
  console.log('');
}
