import { describe, expect, it } from 'vitest';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * The rule these exercise is measured, not asserted: the numbers live in
 * scratchpad/harness/canto-bench.mjs, which reads the two regexes straight out of
 * langDetect.ts so the bench cannot drift from the source. 32 of 35 held-out
 * Cantonese lines, 11 of 12 code-mixed, zero false positives on 40 lines of
 * standard Chinese.
 *
 * What is asserted here is the part a number cannot express: the cases that were
 * decided rather than measured, and the neighbouring behaviour that had to stay
 * exactly as it was.
 */

describe('Cantonese detection', () => {
  it('reads a vernacular line as yue, confidently enough to send as the source', () => {
    for (const line of ['佢哋去咗邊度呀', '你唔好玩啦', '有冇人喺度', '點解唔開槍']) {
      expect(confidentLanguage(line), line).toBe('yue');
    }
  });

  it('reads Cantonese carried by a word rather than by a character', () => {
    // No single character here is Cantonese-only. The pairing is.
    for (const line of ['邊個贏咗', '屋企好靜', '得閒傾下', '呢度好多人']) {
      expect(confidentLanguage(line), line).toBe('yue');
    }
  });

  it('survives the English a Hong Kong chat mixes in', () => {
    // Latin is skipped by the script counter, so the han majority is computed on
    // the Chinese alone and the mixing costs nothing.
    expect(confidentLanguage('push 啦唔好等')).toBe('yue');
    expect(confidentLanguage('唔該 mod 幫手 ban 佢')).toBe('yue');
    expect(confidentLanguage('個 setup 幾錢㗎')).toBe('yue');
  });

  it('reads a marker outside the basic multilingual plane', () => {
    // 𨋢 is a surrogate pair. A rule written over UTF-16 code units would see two
    // halves of nothing.
    expect(confidentLanguage('搭𨋢落去')).toBe('yue');
  });
});

describe('standard Chinese is left exactly as it was', () => {
  it('stays unnamed in traditional characters', () => {
    for (const line of ['這個位置真的很好', '他們去哪裡了', '我現在真的很累', '笑死我了']) {
      expect(confidentLanguage(line), line).toBeUndefined();
    }
  });

  it('stays unnamed in simplified characters', () => {
    for (const line of ['这个位置真的很好', '他们去哪里了', '为什么不开枪']) {
      expect(confidentLanguage(line), line).toBeUndefined();
    }
  });

  // Chinese has no spaces, so a two-character marker can be straddled by two
  // unrelated words. Six lines built on that defect took four markers out of the
  // rule; these are the ones that stayed out.
  it('is not fooled by a marker straddling two unrelated words', () => {
    expect(confidentLanguage('反而家裡更安靜')).toBeUndefined(); // 反而 + 家裡
    expect(confidentLanguage('我依家長的意思去做')).toBeUndefined(); // 依 + 家長
    expect(confidentLanguage('大家一起食飯吧')).toBeUndefined(); // Taiwanese Mandarin writes 食飯 too
  });

  // 咩 is Cantonese except when it is a sheep, and a sheep is always doubled.
  it('keeps 咩 but not the sheep', () => {
    expect(confidentLanguage('咩事啊')).toBe('yue');
    expect(confidentLanguage('你估我唔知咩')).toBe('yue');
    expect(confidentLanguage('小羊咩咩叫')).toBeUndefined();
  });

  it('leaves Japanese and Korean where they were', () => {
    expect(confidentLanguage('これはすごい')).toBe('ja');
    expect(confidentLanguage('이거 진짜 대박')).toBe('ko');
  });
});

describe('what the rule deliberately does not catch', () => {
  // A Cantonese line made only of characters standard Chinese also uses is not
  // distinguishable from standard Chinese by looking at it. Naming it would be a
  // guess, and `confidentLanguage` exists to refuse guesses.
  it('says nothing about a line with no marker', () => {
    expect(confidentLanguage('收皮啦你')).toBeUndefined();
    expect(confidentLanguage('幾時再開台')).toBeUndefined();
  });

  // The two-character floor in detectByScript predates this and still applies: a
  // single CJK character is not enough signal to name a language.
  it('needs two scripted characters, one marker is not enough on its own', () => {
    expect(confidentLanguage('嘢')).toBeUndefined();
    expect(confidentLanguage('好嘢')).toBe('yue');
  });

  it('agrees with itself between the confident and the guessing path', () => {
    expect(detectLanguage('佢哋去咗邊度呀')).toBe('yue');
  });
});
