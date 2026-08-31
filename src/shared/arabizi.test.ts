import { describe, expect, it } from 'vitest';
import { isArabizi } from './arabizi';

describe('isArabizi', () => {
  it.each([
    'ya 3ammi shu hal 7aki',
    'kifak ya 7abibi kif el 7al',
    '3youni enti a7la wa7de',
    'shu ya zalame 3am ta7ki jad',
    'ana 7ase7 kteer mn hal she',
    'sho ha3mal ya 5ai',
    '9alby ma3ak daymen',
    'mabrouk 3alek ya 3azizi',
    'wallah 7aram shu hal la3ib',
    'kel shi tamem el 7amdulillah',
    'ma3lesh ya sadi9i',
  ])('reconnait %s', (texte) => {
    expect(isArabizi(texte)).toBe(true);
  });

  // Les temoins de frontiere. Le langage SMS latin met aussi des chiffres dans
  // les mots, mais pour leur son : 8 pour eight, 4 pour four, 2 pour two, 1 pour
  // one. C'est pour eux que les chiffres retenus s'arretent a 3, 5, 7 et 9.
  it.each([
    'see you 2day', 'that was gr8', 'talk l8r', '4ever bro', 'be there b4 8',
    'w8 a sec', 'any1 up', 'some1 help', 'a2m1 les gars', 'koi 2 9', 'c cool bi1',
  ])('ne prend pas le SMS %s pour de l arabizi', (texte) => {
    expect(isArabizi(texte)).toBe(false);
  });

  // Noms d equipe et pseudos a chiffres, qui traversent tous les chats de jeu.
  // Sans la condition des deux lettres, `c9` et `d4` suffiraient a declencher.
  it.each([
    'c9 andy', 'faze clan vs c9', 'g2 esports gagne', 'k9 unit',
    's1mple insane', 'he plays on d4', 'level 99 boss', 'top 3 today',
    '1v1 me now', 'top1 player', 'gg 2-1', 'my k/d is 2.5',
  ])('ne prend pas %s pour de l arabizi', (texte) => {
    expect(isArabizi(texte)).toBe(false);
  });

  it.each([
    'hola amigos como estan', 'bonsoir tout le monde', 'que jugada increible',
    'herkese iyi aksamlar', 'good evening everyone',
  ])('laisse le texte ordinaire tranquille : %s', (texte) => {
    expect(isArabizi(texte)).toBe(false);
  });

  it('ne declenche pas sur un chiffre isole ni sur un mot trop court', () => {
    expect(isArabizi('3')).toBe(false);
    expect(isArabizi('a3')).toBe(false);
    expect(isArabizi('37')).toBe(false);
    // Trois caracteres dont deux lettres : c'est le plus petit mot accepte.
    expect(isArabizi('a3a')).toBe(true);
  });
});
