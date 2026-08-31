/**
 * L'arabe ecrit en lettres latines, dit arabizi ou franco-arabe.
 *
 * Il remplace les consonnes arabes sans equivalent latin par des chiffres
 * choisis pour leur RESSEMBLANCE avec la lettre :
 *
 *   3 -> ع (ain)     5 -> خ (kha)     7 -> ح (ha)      9 -> ق (qaf)
 *   2 -> ء (hamza)   6 -> ط (ta)      8 -> غ (ghain)
 *
 * Le piege est le langage SMS latin, qui met aussi des chiffres dans les mots
 * mais pour leur SON : 8 pour eight, 4 pour four, 2 pour two, 1 pour one.
 * `gr8`, `b4`, `2day`, `4ever`, `a2m1`. Les deux usages ne se recouvrent que sur
 * 2, 6 et 8, donc ne garder que 3, 5, 7 et 9 conserve le signal et jette la
 * collision. Mesure sur douze phrases arabizi et vingt-neuf pieges, dont des
 * noms d'equipe a chiffres (`c9`, `g2`, `d4`, `k9`, `s1mple`) et du texte reel
 * dans cinq langues : avec les chiffres larges, trois faux positifs ; avec
 * [3579], douze sur douze et aucun faux positif. Un seul mot suffit alors, sans
 * seuil de proportion.
 *
 * POURQUOI CE N'EST PAS UNE DETECTION SURE.
 *
 * `confidentLanguage` ne rend que ce qui a ete cherche dans une table, et sa
 * valeur part au moteur comme langue source. Or annoncer `sl=ar` sur un texte en
 * lettres latines demande au moteur de lire de l'arabe la ou il n'y a pas
 * d'ecriture arabe, et rien ici ne permet de dire si le resultat est meilleur
 * que de le laisser deviner. Cette fonction sert donc a la detection ordinaire,
 * qui alimente les filtres et le drapeau montre au lecteur, et pas au choix du
 * `sl`, qui reste `auto`.
 *
 * Ce que cela repare, mesure : avec une liste de langues sources autorisee, un
 * message arabizi sortait en `lang_unknown`, donc un lecteur arabophone qui
 * restreint ses sources a `ar` perdait exactement les messages qu'il voulait.
 */

/** Les chiffres que l'arabizi emploie et que le SMS latin n'emploie pas. */
const CHIFFRES_ARABIZI = /[3579]/;

/**
 * Un mot est arabizi s'il porte un de ces chiffres et reste un mot : au moins
 * deux lettres et trois caracteres. Sans cette condition, `c9` et `d4` passent.
 */
function motArabizi(mot: string): boolean {
  const propre = mot.replace(/[^a-z0-9]/g, '');
  if (propre.length < 3) return false;
  if (!CHIFFRES_ARABIZI.test(propre)) return false;
  return (propre.match(/[a-z]/g) ?? []).length >= 2;
}

/** Vrai si le message porte au moins un mot ecrit en arabizi. */
export function isArabizi(text: string): boolean {
  const mots = text.toLowerCase().split(/\s+/).filter(Boolean);
  return mots.some(motArabizi);
}
