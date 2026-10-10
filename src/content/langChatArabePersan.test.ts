import { describe, expect, it } from 'vitest';
import { runMatrix, type Cell } from './langMatrix';
import { LANG_CHAT_AR_FA } from './langChatArabePersan';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le chat arabe dialectal contre le chat persan. Ce que le corpus mesure et sa
 * limite sont ecrits en tete de `langChatArabePersan.ts`.
 */

const DETECT = runMatrix(detectLanguage, LANG_CHAT_AR_FA);
const SURE = runMatrix(confidentLanguage, LANG_CHAT_AR_FA);
const plain = (c: Cell) => ({ right: c.right, silent: c.silent, wrong: c.wrong });
const total = (run: typeof DETECT, l: string) => {
  const b = run.byLang.get(l)!;
  return {
    right: b.short.right + b.medium.right + b.long.right,
    silent: b.short.silent + b.medium.silent + b.long.silent,
    wrong: b.short.wrong + b.medium.wrong + b.long.wrong,
  };
};

describe('chat arabe contre chat persan, 2026-10-09', () => {
  // Avant `MOTS_ARABES_CHAT` : 19 justes, 13 muettes, 8 fausses, dont sept
  // rendues persanes par franc (`مرحبا`, `منور`, `شو صار`...). Les deux
  // fausses qui restent sont `ممتاز`, que le persan ecrit aussi et qui reste
  // dehors, et `برافو`.
  it('nomme l arabe du chat que franc prenait pour du persan', () => {
    expect(total(DETECT, 'ar')).toEqual({ right: 31, silent: 7, wrong: 2 });
  });

  // Le chiffre qui garde la porte : il etait le meme avant les mots arabes.
  it('ne prend rien au persan', () => {
    expect(total(DETECT, 'fa')).toEqual({ right: 30, silent: 9, wrong: 1 });
  });

  // Les mots ne nourrissent pas la reponse sure : elle n'a pas bouge.
  it('laisse la langue source sure telle qu elle etait', () => {
    expect(plain(SURE.total)).toEqual({ right: 39, silent: 41, wrong: 0 });
  });

  it('lit les salutations arabes comme de l arabe', () => {
    for (const t of ['مرحبا', 'مرحبا شباب', 'شو صار', 'وش صار', 'منور', 'نورت', 'حلو', 'تسلم']) {
      expect(detectLanguage(t), t).toBe('ar');
    }
  });

  // Les pieges : des mots que les deux langues ecrivent, employes a la persane.
  // Aucun ne doit sortir arabe.
  it('ne lit pas en arabe les mots que le persan ecrit aussi', () => {
    for (const t of ['ممتاز بود', 'تمام شد', 'بس کن', 'خلاص شدم']) {
      expect(detectLanguage(t), t).not.toBe('ar');
    }
  });
});
