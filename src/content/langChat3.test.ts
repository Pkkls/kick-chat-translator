import { describe, expect, it } from 'vitest';
import { runMatrix, type Cell } from './langMatrix';
import { LANG_CHAT } from './langChatCorpus';
import { LANG_CHAT2 } from './langChatCorpus2';
import { LANG_CHAT3 } from './langChatCorpus3';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le corpus de REGLAGE, et ce qu'il a deja attrape.
 *
 * Les trois corpus de chat n'ont pas le meme role et les melanger reviendrait a
 * n'en avoir qu'un :
 *   corpus 1  a servi a choisir des mots, donc il ne mesure plus le rappel. Il
 *             reste un banc de non-regression.
 *   corpus 2  est AVEUGLE. On le mesure en total, on ne lit jamais ses lignes.
 *   corpus 3  celui-ci. On a le droit d'y lire et d'y choisir.
 *
 * Ses chiffres bougeront a chaque tour de lexique, c'est sa fonction. Ce qui ne
 * doit pas bouger est la colonne des erreurs.
 */

const SURE3 = runMatrix(confidentLanguage, LANG_CHAT3);
const BRUT3 = runMatrix(detectLanguage, LANG_CHAT3);
const plain = (c: Cell) => ({ right: c.right, silent: c.silent, wrong: c.wrong });

describe('le corpus de reglage', () => {
  // L'invariant, le meme que sur les deux autres corpus de chat.
  it('ne fait aucune erreur sur le chemin sur', () => {
    expect(SURE3.total.wrong).toBe(0);
  });

  it('en nomme 78 sur 260', () => {
    expect(plain(SURE3.total)).toEqual({ right: 78, silent: 182, wrong: 0 });
    expect(plain(BRUT3.total)).toEqual({ right: 143, silent: 43, wrong: 74 });
  });

  // CE QU'IL A ATTRAPE LE JOUR DE SA CREATION, et c'est la justification de son
  // existence en une ligne.
  //
  // `-ekt` etait entre dans la table des motifs exclusifs comme marqueur
  // neerlandais. Il mesurait propre sur les 5490 lignes de Tatoeba et du premier
  // corpus de chat : trois lignes neerlandaises, zero ailleurs. Ce corpus l'a
  // fait tomber en quatre lignes d'un coup, parce que `perfekt` est allemand,
  // suedois, norvegien et danois, comme `direkt`, `korrekt` et `objekt`.
  //
  // Quatre lignes ecrites sans y penser ont invalide un motif que 5490 autres
  // avaient laisse passer. C'est le protocole 4.6 en action : une absence sur un
  // corpus ne prouve rien, et le seul remede est un corpus de plus.
  it('garde les quatre lignes qui ont fait tomber -ekt', () => {
    expect(confidentLanguage('dieses emote ist perfekt')).not.toBe('nl');
    expect(confidentLanguage('den emoten är perfekt')).not.toBe('nl');
    expect(confidentLanguage('den emoten er perfekt')).not.toBe('nl');
    expect(confidentLanguage('den emote er perfekt')).not.toBe('nl');
  });

  // Les trois corpus doivent rester distincts, sinon les roles se melangent.
  it('ne partage aucune ligne avec les deux autres', () => {
    const autres = new Set([...Object.values(LANG_CHAT).flat(), ...Object.values(LANG_CHAT2).flat()]);
    const communes = Object.values(LANG_CHAT3).flat().filter((t) => autres.has(t));
    expect(communes).toEqual([]);
  });
});
