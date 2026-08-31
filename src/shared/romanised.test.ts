import { describe, expect, it } from 'vitest';
import { romanisedLanguage, ROMANISED_MARKERS } from './romanised';

describe('romanisedLanguage', () => {
  it.each([
    ['privet kak dela segodnya', 'ru'],
    ['spasibo bolshoe za stream', 'ru'],
    ['pozhaluysta pomogite mne', 'ru'],
    ['khorosho ochen khorosho', 'ru'],
    ['nichego ne ponyatno', 'ru'],
    ['konechno eto pravda', 'ru'],
    ['zdravstvuyte vsem privet', 'ru'],
    ['ti kaneis re file einai kalo', 'el'],
    ['kalimera se olous ti kanete', 'el'],
    ['kalispera paidia ti ginetai', 'el'],
    ['efharisto poli file mou', 'el'],
    ['giati to ekanes auto', 'el'],
    ['den katalava tipota', 'el'],
    ['konnichiwa minna genki desu ka', 'ja'],
    ['arigatou gozaimasu subarashii', 'ja'],
    ['ohayou gozaimasu minna san', 'ja'],
    ['yoroshiku onegaishimasu', 'ja'],
    ['ganbatte kudasai', 'ja'],
  ])('marque %s comme %s', (texte, langue) => {
    expect(romanisedLanguage(texte)).toBe(langue);
  });

  // Les temoins de frontiere qui comptent le plus : des mots japonais que
  // l argot internet anglais a adoptes. Un anglophone les ecrit sans parler un
  // mot de japonais, donc ils n ont rien a faire dans la table, et ce test
  // interdit de les y ajouter par confort.
  it.each([
    'that is so kawaii', 'sugoi play bro', 'senpai noticed me', 'baka gamer',
    'nice desu', 'sensei teach me', 'malaka is everywhere', 'gyro please',
  ])('ne marque pas l emprunt %s', (texte) => {
    expect(romanisedLanguage(texte)).toBeUndefined();
  });

  it.each([
    'hola amigos como estan todos', 'bonsoir tout le monde ca va',
    'guten abend zusammen wie geht es', 'herkese iyi aksamlar nasilsiniz',
    'boa noite pessoal tudo bem', 'good evening everyone how are you',
    'dobry wieczor wszystkim', 'buonasera a tutti come state',
  ])('laisse le texte des langues du produit tranquille : %s', (texte) => {
    expect(romanisedLanguage(texte)).toBeUndefined();
  });

  // Un message qui porte deux marqueurs qui ne s accordent pas n est ni l un ni
  // l autre. Sans cette regle, l ordre des mots deciderait de la langue.
  it('annule quand deux langues se disputent le message', () => {
    expect(romanisedLanguage('privet konnichiwa')).toBeUndefined();
    expect(romanisedLanguage('kalimera spasibo')).toBeUndefined();
  });

  it('n emploie que des codes ISO-2 et des marqueurs assez longs', () => {
    for (const [langue, mots] of Object.entries(ROMANISED_MARKERS)) {
      expect(langue).toMatch(/^[a-z]{2}$/);
      for (const m of mots) {
        expect(m).toMatch(/^[a-z]+$/);
        // Sous cinq lettres, un mot romanise entre en collision avec trop de
        // choses. C est ce qui tient `net`, `poka` et `davai` hors de la table.
        expect(m.length).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
