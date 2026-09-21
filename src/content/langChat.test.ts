import { describe, expect, it } from 'vitest';
import { runMatrix, type Cell, type Run } from './langMatrix';
import { LANG_CHAT } from './langChatCorpus';
import { LANG_CORPUS } from './langCorpus';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le meme detecteur, mesure sur du REGISTRE CHAT.
 *
 * `langMatrix.test.ts` mesure 5040 phrases ecrites de Tatoeba. Ce fichier mesure
 * 390 lignes de chat sur les 26 langues latines, celles que le pre-controle
 * d'ecriture ne sert pas du tout. Ce que le corpus vaut et ne vaut pas est ecrit
 * en entier en tete de `langChatCorpus.ts` et doit etre lu avant de citer un
 * chiffre d'ici : les lignes sont ecrites par ce projet, donc le rappel mesure
 * aussi le vocabulaire choisi. Le silence et les regressions, eux, tiennent.
 *
 * Deux regimes, parce qu'un chat contient les deux : tel quel, et diacritiques
 * retirees comme le fait un clavier presse.
 */

const DIACRITIQUES = /[̀-ͯ]/g;
const sansDiacritiques = (t: string): string =>
  t
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    // Ce que NFD ne decompose pas et qu'un clavier remplace quand meme.
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/đ/g, 'd')
    .replace(/ı/g, 'i');

const NU: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(LANG_CHAT).map(([l, v]) => [l, v.map(sansDiacritiques)]),
);

const CHAT_SURE = runMatrix(confidentLanguage, LANG_CHAT);
const CHAT_BRUT = runMatrix(detectLanguage, LANG_CHAT);
const NU_SURE = runMatrix(confidentLanguage, NU);
const NU_BRUT = runMatrix(detectLanguage, NU);

const plain = (c: Cell) => ({ right: c.right, silent: c.silent, wrong: c.wrong });
const muet = (c: Cell) => Math.round((100 * c.silent) / (c.right + c.silent + c.wrong));
const zeroRight = (run: Run): string[] =>
  [...run.byLang.entries()]
    .filter(([, b]) => b.short.right + b.medium.right + b.long.right === 0)
    .map(([lang]) => lang)
    .sort();

describe('le chemin sur, sur du chat', () => {
  // Le resultat qui compte le plus et qui n'etait pas acquis : sur 390 lignes de
  // chat dans 26 langues, la reponse sure n'est fausse AUCUNE fois. Les regles
  // ecrites contre des phrases de Tatoeba ne se mettent pas a mentir quand le
  // registre change ; elles se taisent.
  it('ne se trompe jamais, dans les deux regimes', () => {
    expect(CHAT_SURE.total.wrong).toBe(0);
    expect(NU_SURE.total.wrong).toBe(0);
  });

  // Et voici le prix, qui est le vrai chiffre de ce fichier. Il repond a la
  // question de la phase 1 : peut-on donner au moteur on-device la reponse sure
  // au lieu de la devinette ? Sur du chat latin la reponse sure est muette 85
  // fois sur 100, donc basculer enverrait presque tout ce chat au cloud, avec sa
  // latence et son quota. La reponse est non tant que ce chiffre n'a pas baisse,
  // et c'est le lexique de mots courts qui le fera baisser, pas une regle de
  // lettres de plus.
  it('se tait sur cinq lignes de chat sur six', () => {
    expect(plain(CHAT_SURE.total)).toEqual({ right: 59, silent: 331, wrong: 0 });
    expect(muet(CHAT_SURE.total)).toBe(85);
  });

  // Ce que coute le clavier, et c'est la fragilite de toute l'approche par
  // lettre exclusive mise en chiffre : sans diacritiques le rappel tombe des
  // deux tiers. Une regle qui lit ř ou ų ne lit plus rien des que l'utilisateur
  // tape vite, et c'est le cas majoritaire dans un chat sur telephone.
  it('perd les deux tiers de son rappel quand les diacritiques tombent', () => {
    expect(plain(NU_SURE.total)).toEqual({ right: 18, silent: 372, wrong: 0 });
    expect(muet(NU_SURE.total)).toBe(95);
  });
});

describe('le chemin brut, sur du chat', () => {
  // franc est nettement PIRE sur du chat que sur de la prose, et l'ecart est
  // dans le sens qui coute : 33 lignes fausses sur 100 contre 23 sur les memes
  // 26 langues de Tatoeba. Une ligne de cinq mots ne porte pas assez de
  // trigrammes pour lui, et c'est exactement le format du produit.
  it('se trompe sur une ligne de chat sur trois', () => {
    expect(plain(CHAT_BRUT.total)).toEqual({ right: 148, silent: 114, wrong: 128 });
    const tatoeba = runMatrix(detectLanguage, memesLangues());
    const partChat = CHAT_BRUT.total.wrong / 390;
    const partTatoeba = tatoeba.total.wrong / (26 * 120);
    expect(partChat).toBeGreaterThan(partTatoeba);
  });

  it('empire encore sans diacritiques', () => {
    expect(plain(NU_BRUT.total)).toEqual({ right: 118, silent: 133, wrong: 139 });
  });

  // Sept langues ne marquent pas un seul point sur le chemin BRUT, franc compris,
  // alors que Tatoeba n'en montrait que trois. `sk no da ca` s'effondrent au
  // passage au registre court : elles avaient des points sur des phrases
  // completes et n'en ont plus aucun sur cinq mots. C'est la file de travail
  // reelle, et elle n'est pas celle que Tatoeba dessinait.
  it('nomme les sept langues qu il ne trouve jamais sur du chat', () => {
    expect(zeroRight(CHAT_BRUT)).toEqual(['ca', 'da', 'et', 'fi', 'no', 'sk', 'sl']);
  });
});

/** Les memes 26 langues dans Tatoeba, pour que le contraste soit un calcul et pas une phrase. */
function memesLangues(): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = {};
  for (const l of Object.keys(LANG_CHAT)) {
    const lines = LANG_CORPUS[l];
    if (lines) out[l] = lines;
  }
  return out;
}

describe('le contraste avec Tatoeba, sur les memes langues', () => {
  // Le silence bouge peu, 82 a 85, et c'est contre-intuitif : on attendait que
  // le lexique de chat fasse mieux sur du chat. Il ne le fait pas parce qu'il ne
  // couvre que six langues sur vingt-six. Ce qui bouge vraiment est l'erreur de
  // franc, et elle bouge dans le mauvais sens.
  it('montre que le registre coute a franc et pas au chemin sur', () => {
    const t = runMatrix(confidentLanguage, memesLangues());
    expect(muet(t.total)).toBe(82);
    expect(muet(CHAT_SURE.total)).toBe(85);
    expect(t.total.wrong).toBe(5);
  });
});
