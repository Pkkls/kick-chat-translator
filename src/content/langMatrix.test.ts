import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { confidentRun, detectRun, type Cell } from './langMatrix';
import { LANG_CORPUS } from './langCorpus';
import { LANGUAGES } from '~/shared/languages';

/**
 * The cross-language baseline, asserted so the next change has to move it on
 * purpose. What the numbers mean and why they are never added together is in
 * `langMatrix.ts`; the human report is `scratchpad/harness/lang-matrix.md`,
 * rebuilt with `node --import tsx scratchpad/harness/lang-matrix.mjs`.
 *
 * These are a record of what the code does today, not a target. Moving them is
 * expected. Moving them without saying which way and why is not, and that is the
 * whole job of this file: `langDetect.latin.test.ts` has been holding 33 right /
 * 7 silent / 11 wrong on 51 lines for the same reason, and this is that
 * discipline on 5040 lines and 42 languages.
 */

const CONFIDENT = confidentRun();
const DETECT = detectRun();

const plain = (c: Cell) => ({ right: c.right, silent: c.silent, wrong: c.wrong });

describe('baseline, 2026-09-21, Tatoeba corpus', () => {
  // Doing its job: it answers on a quarter of the lines and is almost never
  // wrong. The engine detects the rest itself, which is the safe outcome.
  it('confidentLanguage stays quiet and is rarely wrong', () => {
    expect(plain(CONFIDENT.total)).toEqual({ right: 1262, silent: 3688, wrong: 90 });
  });

  it('confidentLanguage on short lines, the regime a chat lives in', () => {
    expect(plain(CONFIDENT.shortOnly)).toEqual({ right: 415, silent: 1213, wrong: 52 });
  });

  // The expensive one. This is the answer that deletes a message in silence when
  // it believes the line is already in the reader's language, and that is handed
  // to the on-device engine as a source language on Chrome, where the on-device
  // engine is the default.
  it('detectLanguage is wrong on a quarter of all lines', () => {
    expect(plain(DETECT.total)).toEqual({ right: 3019, silent: 804, wrong: 1217 });
  });

  it('detectLanguage is wrong on nearly a third of short lines', () => {
    expect(plain(DETECT.shortOnly)).toEqual({ right: 837, silent: 364, wrong: 479 });
  });
});

const zeroRight = (run: typeof DETECT): string[] =>
  [...run.byLang.entries()]
    .filter(([, b]) => b.short.right + b.medium.right + b.long.right === 0)
    .map(([lang]) => lang)
    .sort();

describe('the languages the detector cannot name at all', () => {
  // Ten of forty-two score zero. Not "often wrong": never right, on any line, at
  // any length. Listed rather than summarised because this is the work queue for
  // phase 2, and a language leaving this list is the phase's definition of
  // progress.
  it('names the ten that never score a single line', () => {
    expect(zeroRight(DETECT)).toEqual(['ca', 'da', 'et', 'fi', 'lt', 'lv', 'no', 'sk', 'sl', 'zh-tw']);
  });

  // The other half of the same problem, and the reason phase 1 cannot simply
  // swap the raw guess for the safe one: the safe one can only name sixteen
  // languages out of forty-two on this corpus.
  //
  // Read this one with a caveat, because it flatters nothing and misleads in
  // both directions. Tatoeba is written sentences, and the short-word lexicon
  // that feeds `confidentLanguage` is a chat vocabulary: hola, merci, danke,
  // selam. A Spanish Tatoeba sentence contains none of them, so `es` scores zero
  // here while it would score on a real chat line. The 26 are therefore an upper
  // bound on the gap, not a measurement of it. The chat corpus in phase 0b is
  // what settles it.
  it('names the twenty-six the confident path can never name on this corpus', () => {
    expect(zeroRight(CONFIDENT)).toEqual([
      'bn', 'ca', 'cs', 'da', 'el', 'es', 'et', 'fi', 'fr', 'hu', 'id', 'lt', 'lv',
      'ms', 'nl', 'no', 'pl', 'ro', 'sk', 'sl', 'sv', 'ta', 'tl', 'vi', 'zh', 'zh-tw',
    ]);
  });

  // Every traditional Chinese line, without exception, is answered as
  // simplified, flag of China included. franc has no trigram model for Han at
  // all: it resolves the whole script to `cmn`, and FRANC_MAP sends both `cmn`
  // and `zho` to `zh`. There is no rule to fix, there is a rule missing.
  it('answers every single traditional Chinese line as simplified', () => {
    const b = DETECT.byLang.get('zh-tw')!;
    expect(plain(b.short)).toEqual({ right: 0, silent: 0, wrong: 40 });
    expect(DETECT.confusions.get('zh-tw->zh')).toBe(120);
  });

  // The Scandinavian and Catalan cases are the same shape: a real language with
  // no rule of its own, absorbed by a bigger neighbour franc does model.
  it('hands the Nordic languages to Swedish and Catalan to Spanish', () => {
    expect(DETECT.confusions.get('no->sv')).toBe(48);
    expect(DETECT.confusions.get('da->sv')).toBe(44);
    expect(DETECT.confusions.get('ca->es')).toBe(43);
  });
});

describe('the corpus itself', () => {
  it('covers every offered language except the one Tatoeba cannot split', () => {
    const offered = LANGUAGES.map((l) => l.code);
    // pt-br is the only expected gap: Tatoeba publishes one Portuguese export
    // and does not mark the Brazilian/European split.
    expect(offered.filter((c) => !(c in LANG_CORPUS))).toEqual(['pt-br']);
    expect(Object.keys(LANG_CORPUS).filter((c) => !offered.includes(c))).toEqual([]);
  });

  it('never answers with a language the product does not offer', () => {
    const offered = new Set(LANGUAGES.map((l) => l.code));
    const bad = [...new Set([...CONFIDENT.confusions.keys(), ...DETECT.confusions.keys()])]
      .map((k) => k.split('->')[1]!)
      .filter((to) => !offered.has(to));
    expect([...new Set(bad)]).toEqual([]);
  });
});

describe('neither the corpus nor the matrix reaches the shipped extension', () => {
  // 206 KB of Tatoeba sentences inside a content script injected on every
  // kick.com page would be a real regression, and an accidental import is the
  // easy way to cause it. The guard is static so it does not need a build:
  // nothing outside a test or this module may name either file.
  it('is imported by tests only', () => {
    const src = resolve(process.cwd(), 'src');
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
        if (entry === 'langMatrix.ts' || entry === 'langCorpus.ts') continue;
        if (/from '\.{0,2}[^']*lang(Corpus|Matrix)'/.test(readFileSync(full, 'utf8'))) {
          offenders.push(full.slice(src.length + 1));
        }
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});
