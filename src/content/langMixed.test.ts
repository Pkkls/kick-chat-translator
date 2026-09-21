import { describe, expect, it } from 'vitest';
import { LANG_MIXED } from './langMixedCorpus';
import { confidentLanguage } from './langDetect';

/**
 * Le banc des lignes melangees, et la mesure qui ferme la question de
 * `SHORT_TEXT_MAX`.
 *
 * Pourquoi ce banc existe et pourquoi son chiffre se lit a l'envers des deux
 * autres est ecrit en entier en tete de `langMixedCorpus.ts` : sur une ligne qui
 * contient deux langues, la bonne reponse du chemin sur est le SILENCE, donc le
 * nombre a faire baisser est celui des lignes NOMMEES.
 *
 * LA MESURE, relevee en deplaçant la borne dans une copie de `langDetect.ts` et
 * en relançant les trois bancs a chaque cran. Elle n'est pas rejouee en CI parce
 * qu'elle demande de recompiler le module avec une constante differente ; la
 * recette est dans le protocole du handoff, section 4.2, et tient en cinq
 * minutes.
 *
 *   borne | melangees nommees | chat muet | chat justes | Tatoeba justes/faux
 *      20 |      10 / 50      |    74 %   |     103     |      2348 / 15
 *      25 |      16 / 50      |    71 %   |     115     |      2367 / 17
 *      30 |      25 / 50      |    69 %   |     121     |      2395 / 17
 *      40 |      34 / 50      |    69 %   |     121     |      2455 / 17
 *     999 |      34 / 50      |    69 %   |     121     |      2587 / 24
 *
 * CE QUE LA TABLE DIT, et c'est la reponse a une question qui trainait depuis
 * trois passes.
 *
 * Passer de 20 a 30 achete 18 lignes de chat contre 15 lignes melangees nommees
 * a tort, et fait monter les erreurs de Tatoeba de 15 a 17. Ce n'est pas un bon
 * echange : une ligne melangee nommee, c'est soit un message efface pour "deja
 * dans ta langue" alors que la moitie ne l'est pas, soit une langue source
 * imposee au moteur qui ne couvre que la moitie du texte.
 *
 * Passer de 30 a 40 ne rapporte RIEN du tout sur le chat, 121 lignes et 69 % de
 * silence des deux cotes, et fait passer les melangees de 25 a 34. C'est une
 * perte seche, et c'est le resultat le plus net du tableau.
 *
 * Lever la borne entierement rapporte beaucoup sur Tatoeba, 2348 a 2587, et rien
 * de plus sur le chat. C'est exactement le piege que ce banc existe pour montrer:
 * le corpus de prose applaudit une decision que le registre reel paie.
 *
 * La borne reste donc a 20, et elle n'est plus une decision heritee de huit
 * lignes de mesure mais de cinquante.
 */

const SOUS_LA_BORNE = 20;
const nommees = LANG_MIXED.filter((t) => confidentLanguage(t) !== undefined);

describe('les lignes qui changent de langue', () => {
  // Le chiffre de reference. Il doit BAISSER, jamais monter.
  it('en nomme dix sur cinquante, et c est le cout accepte du lexique', () => {
    expect(nommees.length).toBe(10);
  });

  // La preuve que c'est bien la borne qui fait le travail et pas autre chose :
  // toute ligne melangee nommee est une ligne courte. Aucune ligne longue ne
  // passe, parce que le lexique ne la regarde pas.
  it('ne nomme que des lignes sous la borne de vingt caracteres', () => {
    const longues = nommees.filter((t) => t.length > SOUS_LA_BORNE);
    expect(longues).toEqual([]);
  });

  // Les dix sont des salutations suivies d'un mot d'anglais de chat, le melange
  // le plus court et le plus frequent. C'est la limite connue du lexique : sur
  // `merci bro`, deux mots dont un francais, il n'y a pas de bonne reponse
  // evidente, et nommer le francais est defendable. Sur `merci bro that was
  // insane` il n'y en a plus, et c'est la borne qui l'empeche.
  it('nomme la salutation courte et rien de plus long', () => {
    expect(nommees).toEqual([
      'merci bro',
      'danke man',
      'gracias dude',
      'grazie mate',
      'tack man',
      'kiitos bro',
      'obrigado man',
      'salut guys',
      'hola chat',
      'ciao all',
    ]);
  });

  // Le cas qui a fixe la borne a l'origine, garde nommement : il doit rester
  // muet. Un lecteur francophone qui recoit cette ligne en `sl=fr` la perd.
  it('se tait sur la ligne qui a fixe la borne', () => {
    expect(confidentLanguage('merci bro that was insane')).toBeUndefined();
  });

  // Et la meme chose dans l'autre sens, anglais d'abord.
  it('se tait quand la langue etrangere arrive en fin de ligne', () => {
    expect(confidentLanguage('he is cracked bardzo dobrze')).toBeUndefined();
    expect(confidentLanguage('chat is going crazy que risa')).toBeUndefined();
  });
});
