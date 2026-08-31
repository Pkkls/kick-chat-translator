import { describe, expect, it } from 'vitest';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le banc latin, ligne par ligne, verdict courant compris.
 *
 * C'est un registre, pas une cible. La troisieme colonne est ce que la detection
 * REND aujourd'hui et la quatrieme ce qu'elle ose envoyer au moteur comme langue
 * source ; quand la troisieme ne vaut pas la deuxieme, la ligne est un defaut
 * connu et mesure, pas un comportement voulu.
 *
 * Le pendant non latin, `langDetect.dix.test.ts`, se tient a un plancher net,
 * vingt-cinq sur vingt-cinq, parce que l'ecriture decide. Ici c'est franc qui
 * decide et les taux vont de 1 sur 4 a 4 sur 5 selon la langue : un plancher n'y
 * serait que du bruit, et une cible inventee serait pire. Ce que ce fichier
 * garantit est plus utile qu'un plancher : toute modification du detecteur, de
 * la table de mots courts ou des tables de rires fait rougir exactement les
 * lignes qui bougent, et la revue voit le sens du mouvement.
 *
 * Il est ici parce que la grille des 41 cas a ete mesuree, jamais commitee,
 * perdue, puis remesuree, et que le corpus court prenait le meme chemin. Un
 * fichier de tests ne pese rien dans le bundle livre, `audit-poids` le verifie.
 */
type Ligne = [texte: string, vraie: string, rendu: string | undefined, source: string | undefined];

const BANC: Ligne[] = [
  ['que hace este tipo', 'es', 'es', 'es'],
  ['no puede ser jaja', 'es', 'es', 'es'],
  ['esta jugando muy mal hoy', 'es', undefined, undefined],
  ['alguien sabe que paso', 'es', 'fr', undefined],
  ['me encanta este stream', 'es', 'es', undefined],
  ['se ha suscrito por 3 meses', 'es', 'es', undefined],
  ['dale que se puede', 'es', 'es', 'es'],
  ['estan todos dormidos o que', 'es', 'pt', undefined],
  ['esse cara e muito bom', 'pt', 'pt', undefined],
  ['nao acredito nisso', 'pt', 'pt', 'pt'],
  ['ta jogando demais hoje', 'pt', undefined, undefined],
  ['alguem sabe o que aconteceu', 'pt', 'pt', undefined],
  ['que isso mano kkkk', 'pt', 'pt', 'pt'],
  ['vamos ganhar essa', 'pt', 'pt', 'pt'],
  ['il joue vraiment mal la', 'fr', 'fr', undefined],
  ['quelqu un a vu ce qui s est passe', 'fr', 'fr', undefined],
  ['trop fort le mec', 'fr', 'fr', 'fr'],
  ['je comprends rien du tout', 'fr', 'fr', undefined],
  ['ca part en cacahuete', 'fr', 'es', undefined],
  ['non ci posso credere', 'it', 'it', undefined],
  ['sta giocando malissimo', 'it', undefined, undefined],
  ['qualcuno ha visto cosa e successo', 'it', 'it', undefined],
  ['che bella partita', 'it', 'it', undefined],
  ['der spielt richtig schlecht', 'de', 'de', undefined],
  ['was ist denn hier los', 'de', 'de', undefined],
  ['hat jemand gesehen was passiert ist', 'de', 'de', undefined],
  ['das war echt stark', 'de', 'de', undefined],
  ['bu adam cok iyi oynuyor', 'tr', undefined, undefined],
  ['ne oluyor burada', 'tr', 'tr', 'tr'],
  ['inanamiyorum ya', 'tr', 'id', undefined],
  ['goren var mi ne oldu', 'tr', 'tr', undefined],
  ['hij speelt echt slecht', 'nl', 'nl', undefined],
  ['wat gebeurt er nu', 'nl', 'de', undefined],
  ['dat was echt goed man', 'nl', 'de', undefined],
  ['on gra naprawde slabo', 'pl', undefined, undefined],
  ['co tu sie dzieje', 'pl', 'pl', undefined],
  ['nie moge w to uwierzyc', 'pl', 'pl', undefined],
  ['dia main jelek banget', 'id', undefined, undefined],
  ['ada apa sih ini', 'id', 'ms', undefined],
  ['gila sih ini keren', 'id', undefined, undefined],
  ['joaca foarte prost azi', 'ro', 'fr', undefined],
  ['ce se intampla aici', 'ro', 'ro', undefined],
  ['han spelar riktigt daligt', 'sv', 'sv', undefined],
  ['vad hander har nu', 'sv', 'sv', undefined],
  ['hraje fakt spatne dneska', 'cs', 'cs', undefined],
  ['co se to tu deje', 'cs', 'pt', undefined],
  ['no choi qua te hom nay', 'vi', 'pt', undefined],
  ['he is playing so bad today', 'en', 'en', undefined],
  ['anyone know what happened', 'en', 'en', undefined],
  ['that was actually insane', 'en', 'en', undefined],
  ['chat is going crazy rn', 'en', 'tl', undefined],
];

describe('le banc latin, ligne par ligne', () => {
  it.each(BANC)('%s', (texte, _vraie, rendu, source) => {
    expect(detectLanguage(texte)).toBe(rendu);
    expect(confidentLanguage(texte)).toBe(source);
  });
});

describe('les totaux du banc latin', () => {
  // Ces trois nombres sont ce que la passe a publie. Ils sont ici pour qu'un
  // changement du detecteur les fasse bouger sous les yeux de la revue plutot
  // que dans un journal que personne ne rouvre. Le banc a deja servi : il etait
  // a 28 justes, 10 silences et 13 fausses, et l'ajout des mots de structure
  // dans `SHORT_WORD_LANG` a fait rougir exactement six lignes, toutes dans le
  // bon sens, dont deux qui passaient de FAUSSES a justes.
  it('sont 33 justes, 7 silences et 11 fausses avec assurance sur 51', () => {
    let justes = 0;
    let silences = 0;
    let faux = 0;
    for (const [, vraie, rendu] of BANC) {
      if (rendu === undefined) silences++;
      else if (rendu === vraie) justes++;
      else faux++;
    }
    expect({ justes, silences, faux, total: BANC.length }).toEqual({
      justes: 33,
      silences: 7,
      faux: 11,
      total: 51,
    });
  });

  // Le chiffre qui decide depuis la comparaison franc contre tinyld : combien de
  // lignes non anglaises finissent classees anglaises, donc jetees en silence
  // par `ignoreEnglish`. Une seule, et c'est une ligne anglaise, donc zero.
  it('ne classent aucune ligne non anglaise comme anglaise', () => {
    const anglicisees = BANC.filter(([, vraie, rendu]) => vraie !== 'en' && rendu === 'en');
    expect(anglicisees).toEqual([]);
  });

  // Une reponse SURE est celle qui part au moteur comme `sl`. Une seule erreur
  // ici coute plus cher que dix mauvais drapeaux, donc le banc l'interdit.
  it('ne declarent jamais une source sure fausse', () => {
    const menteuses = BANC.filter(([, vraie, , source]) => source !== undefined && source !== vraie);
    expect(menteuses).toEqual([]);
  });
});
