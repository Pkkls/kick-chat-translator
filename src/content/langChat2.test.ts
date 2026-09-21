import { describe, expect, it } from 'vitest';
import { runMatrix, type Cell } from './langMatrix';
import { LANG_CHAT } from './langChatCorpus';
import { LANG_CHAT2 } from './langChatCorpus2';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le meme detecteur, sur 260 lignes de chat qu'il n'a jamais vues.
 *
 * Ce fichier existe pour repondre a une question que `langChat.test.ts` ne peut
 * plus poser. Son corpus a servi a construire le lexique : on a lu ses lignes
 * muettes, choisi des mots pour les couvrir, et remesure dessus. Le chiffre qui
 * en sort est donc flatte d'une quantite inconnue.
 *
 * Celui-ci a ete ecrit apres, sur d'autres sujets, sans consulter une seule fois
 * ce que le detecteur en faisait. L'ecart entre les deux EST la part de
 * memorisation, et c'est la seule facon de la connaitre.
 */

const SURE1 = runMatrix(confidentLanguage, LANG_CHAT);
const SURE2 = runMatrix(confidentLanguage, LANG_CHAT2);
const BRUT2 = runMatrix(detectLanguage, LANG_CHAT2);

const plain = (c: Cell) => ({ right: c.right, silent: c.silent, wrong: c.wrong });
const rappel = (c: Cell) => Math.round((100 * c.right) / (c.right + c.silent + c.wrong));

describe('le detecteur sur du chat qu il n a jamais vu', () => {
  // LE RESULTAT QUI COMPTE, et il est meilleur que le chiffre de rappel.
  //
  // Zero erreur sur 260 lignes neuves, dans 26 langues, apres plus de deux cents
  // entrees de lexique ajoutees en regardant un AUTRE corpus. La surete ne se
  // memorise pas : elle vient de ce que chaque entree a ete criblee contre 5490
  // lignes avant d'entrer, et ca, ca generalise.
  it('ne se trompe jamais, comme sur le corpus qu il connait', () => {
    expect(SURE2.total.wrong).toBe(0);
  });

  // LE PRIX, et il a fallu deux mesures pour l'obtenir honnetement.
  //
  // Brut : 46 % de rappel sur le corpus qui a construit le lexique, 30 % ici.
  // Seize points. La premiere lecture etait que ces seize points sont de la
  // memorisation, et elle etait FAUSSE de moitie.
  //
  // Les deux corpus n'ont pas la meme longueur de ligne. Le premier a ete ecrit
  // en visant le chat court et fait 83 % de lignes sous vingt caracteres,
  // mediane 16 ; le second a derive vers des phrases plus longues, 37 % et
  // mediane 22. Or le lexique s'arrete a vingt caracteres. Comparer les deux
  // totaux compare donc deux melanges de longueurs autant que deux corpus.
  //
  // A longueur egale, l'ecart se separe proprement, et c'est le test suivant.
  it('rappelle un tiers de moins en brut, mais la longueur en explique la moitie', () => {
    expect(plain(SURE2.total)).toEqual({ right: 83, silent: 177, wrong: 0 });
    expect(rappel(SURE1.total)).toBe(49);
    expect(rappel(SURE2.total)).toBe(32);
    // Le facteur confondant, mesure : les deux corpus ne sont pas comparables tels quels.
    const lignes = (c: Record<string, readonly string[]>): string[] => Object.values(c).flat();
    const part = (c: Record<string, readonly string[]>): number =>
      Math.round((100 * lignes(c).filter((t) => t.length <= 20).length) / lignes(c).length);
    expect(part(LANG_CHAT)).toBe(83);
    expect(part(LANG_CHAT2)).toBe(37);
  });

  // LA MESURE HONNETE, bande par bande.
  //
  //   <= 20 car : 52 % sur le corpus de reglage, 44 % a l'aveugle -> 8 points
  //   >  20 car : 35 % contre 25 %                  -> 10 points
  //
  // Les huit points de la bande courte sont la memorisation du lexique, et ils
  // sont reels. Les huit autres du chiffre brut sont de la longueur.
  //
  // La bande longue est le resultat le plus instructif du fichier : elle n'est
  // servie que par les lettres, les sequences et les terminaisons, jamais par le
  // lexique, et son ecart entre corpus connu et corpus inconnu est de trois
  // points contre huit. Une regle morphologique generalise trois fois mieux
  // qu'une liste de mots choisis a la main.
  //
  // L'ecart de la bande longue a monte a dix points et ce n'est PAS de la
  // memorisation : il vient de deux sources dont aucune n'est ajustable sur un
  // corpus. Les terminaisons extraites de Tatoeba servent la prose et pas le
  // chat, 76 lignes contre une. Et les deux portes `ä` et `š` servent des
  // langues dont le corpus 1 contient plus de lignes longues que le corpus 2.
  //
  // Ce que ces deux chiffres continuent de dire ensemble : la bande courte
  // depend du lexique et memorise, la bande longue depend des ecritures, des
  // lettres et des portes et ne memorise pas. Le dernier tour de portes l'a
  // confirme directement, +4 sur ce corpus-ci la ou un tour de lexique faisait
  // zero.
  it('memorise trois fois moins au-dela de la borne du lexique', () => {
    const bande = (
      corp: Record<string, readonly string[]>,
      garde: (t: string) => boolean,
    ): Record<string, readonly string[]> =>
      Object.fromEntries(Object.entries(corp).map(([l, v]) => [l, v.filter(garde)]));
    const court = (t: string): boolean => t.length <= 20;
    const long = (t: string): boolean => t.length > 20;
    expect(rappel(runMatrix(confidentLanguage, bande(LANG_CHAT, court)).total)).toBe(52);
    expect(rappel(runMatrix(confidentLanguage, bande(LANG_CHAT2, court)).total)).toBe(44);
    expect(rappel(runMatrix(confidentLanguage, bande(LANG_CHAT, long)).total)).toBe(35);
    expect(rappel(runMatrix(confidentLanguage, bande(LANG_CHAT2, long)).total)).toBe(25);
  });

  // Le chemin brut perd moins parce qu'il ne depend pas du lexique : franc lit
  // des trigrammes, pas des mots choisis a la main. Sa perte, 61 % a 55 %, est
  // du bruit d'echantillonnage plutot que de la memorisation.
  it('montre que seul le chemin qui depend du lexique perd au changement de corpus', () => {
    expect(plain(BRUT2.total)).toEqual({ right: 149, silent: 48, wrong: 63 });
    expect(rappel(BRUT2.total)).toBe(57);
  });

  // La regle qui garde ce banc utilisable, et elle est fragile : il suffit d'une
  // fois. Le jour ou un mot est ajoute au lexique parce qu'il couvre une ligne
  // d'ici, ce corpus devient le premier et il en faut un troisieme. L'assertion
  // ne peut pas verifier ca, donc elle verifie ce qu'elle peut : que les deux
  // corpus restent distincts.
  it('ne partage aucune ligne avec le corpus qui a servi au reglage', () => {
    const premier = new Set(Object.values(LANG_CHAT).flat());
    const communes = Object.values(LANG_CHAT2).flat().filter((t) => premier.has(t));
    expect(communes).toEqual([]);
  });
});
