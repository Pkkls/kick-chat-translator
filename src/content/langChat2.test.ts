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

  // LE PRIX, et c'est le chiffre a citer quand on parle du produit.
  //
  // 46 % de rappel sur le corpus qui a servi a construire le lexique, 30 % sur
  // celui-ci. Seize points d'ecart, et ces seize points sont de la memorisation :
  // des mots choisis pour couvrir des lignes precises, qui couvrent ces lignes
  // et pas leurs voisines. Le vrai rappel du chemin sur sur du chat latin
  // inconnu est 30 %, pas 46, et c'est celui-la qu'il faut ecrire dans un
  // compte rendu.
  it('rappelle un tiers de moins que sur le corpus qui l a construit', () => {
    expect(plain(SURE2.total)).toEqual({ right: 77, silent: 183, wrong: 0 });
    expect(rappel(SURE1.total)).toBe(46);
    expect(rappel(SURE2.total)).toBe(30);
  });

  // Le chemin brut perd moins parce qu'il ne depend pas du lexique : franc lit
  // des trigrammes, pas des mots choisis a la main. Sa perte, 61 % a 55 %, est
  // du bruit d'echantillonnage plutot que de la memorisation.
  it('montre que seul le chemin qui depend du lexique perd au changement de corpus', () => {
    expect(plain(BRUT2.total)).toEqual({ right: 144, silent: 51, wrong: 65 });
    expect(rappel(BRUT2.total)).toBe(55);
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
