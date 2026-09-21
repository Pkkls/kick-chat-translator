import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { confidentRun, detectRun, type Cell } from './langMatrix';
import { confidentLanguage } from './langDetect';
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
  // Doing its job: it answers on two lines in five and is almost never wrong.
  // The engine detects the rest itself, which is the safe outcome.
  it('confidentLanguage stays quiet and is rarely wrong', () => {
    expect(plain(CONFIDENT.total)).toEqual({ right: 2153, silent: 2869, wrong: 18 });
  });

  it('confidentLanguage on short lines, the regime a chat lives in', () => {
    expect(plain(CONFIDENT.shortOnly)).toEqual({ right: 652, silent: 1016, wrong: 12 });
  });

  // The expensive one. This is the answer that deletes a message in silence when
  // it believes the line is already in the reader's language, and that is handed
  // to the on-device engine as a source language on Chrome, where the on-device
  // engine is the default.
  it('detectLanguage is wrong on a fifth of all lines', () => {
    expect(plain(DETECT.total)).toEqual({ right: 3336, silent: 730, wrong: 974 });
  });

  it('detectLanguage is wrong on a quarter of short lines', () => {
    expect(plain(DETECT.shortOnly)).toEqual({ right: 939, silent: 357, wrong: 384 });
  });
});

const zeroRight = (run: typeof DETECT): string[] =>
  [...run.byLang.entries()]
    .filter(([, b]) => b.short.right + b.medium.right + b.long.right === 0)
    .map(([lang]) => lang)
    .sort();

describe('the languages the detector cannot name at all', () => {
  // Five of forty-two score zero. Not "often wrong": never right, on any line,
  // at any length. Listed rather than summarised because this is the work queue
  // for phase 2, and a language leaving this list is the phase's definition of
  // progress. Nine at the start of the phase; `ca lt lv sk` left it on the
  // exclusive-letter rule, and the five that remain are exactly the five with no
  // letter of their own. They need a lexicon, which is phase 0b.
  it('names the five that never score a single line', () => {
    expect(zeroRight(DETECT)).toEqual(['da', 'et', 'fi', 'no', 'sl']);
  });

  // The other half of the same problem, and the reason phase 1 cannot simply
  // swap the raw guess for the safe one: the safe one can only name twenty-nine
  // languages out of forty-two on this corpus. Sixteen before the exclusive
  // letters.
  //
  // Read this one with a caveat, because it flatters nothing and misleads in
  // both directions. Tatoeba is written sentences, and the short-word lexicon
  // that feeds `confidentLanguage` is a chat vocabulary: hola, merci, danke,
  // selam. A Spanish Tatoeba sentence contains none of them, so `es` scores zero
  // here while it would score on a real chat line. The thirteen are therefore an
  // upper bound on the gap, not a measurement of it. The chat corpus in phase 0b
  // is what settles it.
  it('names the thirteen the confident path can never name on this corpus', () => {
    expect(zeroRight(CONFIDENT)).toEqual([
      'da', 'el', 'es', 'et', 'fi', 'fr', 'id', 'ms', 'nl', 'no', 'sl', 'sv', 'tl',
    ]);
  });

  // Two scripts that were simply not counted. Every Bengali and Tamil line, at
  // every length, on both paths: 120 of 120. The gain is on the confident path,
  // which was mute on both and now hands the engine a source language it can
  // read straight off the alphabet.
  it('reads Bengali and Tamil off their alphabets, which nothing did before', () => {
    for (const lang of ['bn', 'ta']) {
      for (const run of [DETECT, CONFIDENT]) {
        const b = run.byLang.get(lang)!;
        expect(b.short.right + b.medium.right + b.long.right, lang).toBe(120);
      }
    }
  });

  // The Scandinavian case: a real language with no rule of its own, absorbed by
  // a bigger neighbour franc does model. Catalan used to sit here too and is
  // down by one line, which is the honest size of `l·l`: the middle dot is a
  // certainty when it appears and it appears twice in 120 lines.
  it('hands the Nordic languages to Swedish and most of Catalan to Spanish', () => {
    expect(DETECT.confusions.get('no->sv')).toBe(48);
    expect(DETECT.confusions.get('da->sv')).toBe(44);
    expect(DETECT.confusions.get('ca->es')).toBe(42);
  });
});

describe('a letter only one of the forty-three writes, added 2026-09-21', () => {
  // The whole case for putting this on the confident path: a letter no other
  // offered language writes is a lookup, not a guess, so it is the same kind of
  // fact as a whole script. The measurement that had to come back clean is this
  // one: the rule hands the engine ten more source languages and takes nothing
  // from the other thirty-two. It did not raise either wrong count: 91 and 54
  // before it, 90 and 53 after, the extra line coming from reading a letter
  // ahead of the lexicon. The counts are lower again now for a reason that has
  // nothing to do with this rule, and it is the block below.
  const NAMED = ['ca', 'cs', 'hu', 'lt', 'lv', 'pl', 'ro', 'sk', 'tr', 'vi'];

  it('never takes a line from a language that is not its own', () => {
    const into = [...CONFIDENT.confusions.keys()].filter((p) => NAMED.includes(p.split('->')[1]!));
    expect(into).toEqual([]);
  });

  it('names ten languages the confident path was mute on', () => {
    for (const lang of NAMED) {
      const b = CONFIDENT.byLang.get(lang)!;
      expect(b.short.right + b.medium.right + b.long.right, lang).toBeGreaterThan(0);
    }
  });

  // The one correction the bench forced on the table as designed. Polish was
  // meant to be found by ł, which no other offered language writes; but a letter
  // being exclusive to a language is not the same as a line carrying it being in
  // that language. This Slovak sentence is about the children of Łazarz and
  // holds no exclusive Slovak letter, so the unanimous vote does not save it.
  // żźćśń replaces ł and is strictly better: 70 Polish lines instead of 48, and
  // nothing taken. Putting ł back costs this line.
  it('does not read a Polish name in a Slovak sentence as Polish', () => {
    const line = 'Łazarzove deti si myslia, že ich mama Felicja je najkrajšia žena na svete.';
    expect(confidentLanguage(line)).not.toBe('pl');
  });

  // The pair the design flagged as the trap, kept here because the two sets are
  // one keystroke apart and a future edit merging them would be silent.
  it('keeps the Polish nasals out, which Lithuanian also writes', () => {
    expect(confidentLanguage('Ar tu eini į parduotuvę šiandien vakare?')).not.toBe('pl');
  });

  // The rule reads before the short-word lexicon, and that order is measured
  // rather than assumed: this line is the whole of the difference on 5040 lines.
  // It is Lithuanian, its ė settles it, and the lexicon used to see `mano` and
  // answer Portuguese. Putting the lexicon back in front costs exactly this.
  it('lets a letter beat a chat word that is a word in two languages', () => {
    expect(confidentLanguage('Ar ji mano draugė?')).toBe('lt');
  });

  // CONSTRUCTED, not measured, and the distinction matters enough to write down:
  // no line of the corpus carries two exclusive sets at once, so the bench says
  // nothing at all about this branch. It is kept because the register the corpus
  // does not have is the one that mixes languages in a single line, quoting a
  // name or a pseudonym, and that is what phase 0b is for. Until then this is a
  // guard with a hand-written check rather than a measurement.
  it('declines when two exclusive sets meet, which is a quote or a nickname', () => {
    expect(confidentLanguage('řeka')).toBe('cs');
    expect(confidentLanguage('ľad')).toBe('sk');
    expect(confidentLanguage('řeka ľad')).toBeUndefined();
  });
});

describe('the two Chinese scripts, fixed 2026-09-21', () => {
  // Before the rule: 120 of 120 traditional lines answered `zh`, flag of China
  // included. Read the recall with its caveat, spelled out in langDetect.ts: the
  // corpus is split from Tatoeba's single `cmn` export by character set and the
  // rule reads the same character set, so recall here is one statement said
  // twice. The distinction IS a character set, so there is nothing else to read.
  it('no longer answers every traditional line as simplified', () => {
    // 120 of 120 before, 15 now, and those 15 are not a rule failure: they carry
    // no marker from either script, so the rule declines, and franc then answers
    // the way it always has, `cmn` for the whole of Han, which FRANC_MAP sends
    // to `zh`. Closing those needs franc out of this path, not a longer list.
    expect(DETECT.confusions.get('zh-tw->zh')).toBe(15);
    expect(zeroRight(DETECT)).not.toContain('zh-tw');
  });

  // This is the half that is a measurement rather than a definition, and the
  // half that could have gone wrong: nothing outside Chinese trips the rule.
  it('never leaks into a language that is not Chinese', () => {
    const intoChinese = [...DETECT.confusions.entries()]
      .filter(([pair]) => /->zh(-tw)?$/.test(pair))
      .map(([pair, n]) => `${pair}=${n}`)
      .sort();
    // yue is expected and is the price of the rule: Cantonese is written in
    // traditional characters, so a yue line with every Cantonese word gone can
    // only be read by its script. zh-tw->zh is the franc fallback above.
    expect(intoChinese).toEqual(['yue->zh-tw=1', 'yue->zh=7', 'zh-tw->zh=15']);
  });

  // The confident path is the one that matters for this trade, because it is
  // what reaches the engine. There, the same leak is two lines out of 120.
  it('costs two Cantonese lines on the path that reaches the engine', () => {
    const leak = [...CONFIDENT.confusions.entries()].filter(([p]) => /->zh(-tw)?$/.test(p));
    expect(leak.reduce((s, [, n]) => s + n, 0)).toBe(2);
  });
});

describe('the Cyrillic fallback, fixed 2026-09-21', () => {
  // The biggest single defect the matrix ever found, and it was not a missing
  // rule: it was a guess wearing a lookup's clothes. `cyrilliqueQuelleLangue`
  // answered `ru` for any Cyrillic line it could not name, and it lives inside
  // `detectByScript`, so `confidentLanguage` took that guess for a reading and
  // handed it to the engine as a source language. 50 Bulgarian lines and 22
  // Ukrainian ones were called Russian: four fifths of the whole error budget of
  // the path that reaches the engine.
  it('no longer calls Bulgarian and Ukrainian lines Russian on the safe path', () => {
    expect(CONFIDENT.confusions.get('bg->ru')).toBeUndefined();
    expect(CONFIDENT.confusions.get('uk->ru')).toBeUndefined();
  });

  // What is left, in full, because eighteen is small enough to name and naming
  // it is what stops the next session from re-deriving it. Six of the eighteen
  // are Malay written in Jawi, which is Arabic script, so the script check is
  // reading the script correctly and the language behind it is the part nothing
  // here can see. Two are the known price of the Cantonese rule.
  it('is down to eighteen wrong answers, and they are these', () => {
    const rows = [...CONFIDENT.confusions.entries()].map(([p, n]) => `${p}=${n}`).sort();
    expect(rows).toEqual([
      'es->pt=1', 'fa->ar=7', 'lt->pt=1', 'ms->ar=5', 'ms->fa=1',
      'uk->bg=1', 'yue->zh-tw=1', 'yue->zh=1',
    ]);
  });

  // The half of the result that was not the point and matters more than the
  // point. Removing the fallback was expected to buy silence with recall; it
  // bought recall too, because franc models rus, ukr and bul and separates them
  // better than a hardcoded constant did. A rule that answers instead of a
  // better-informed component is worse than no rule.
  it('made the raw path better on both axes at once, not just quieter', () => {
    expect(DETECT.total.right).toBeGreaterThan(3325);
    expect(DETECT.total.wrong).toBeLessThan(1024);
  });

  // The fragile part, written down because it is invisible: the Russian
  // infinitive marker -ть also ends eleven Ukrainian lines of this corpus, and
  // it is harmless only because the Ukrainian test runs before it. Moving that
  // test below this one turns those eleven into Russian.
  it('keeps Ukrainian lines that end in the Russian infinitive marker', () => {
    for (const line of ['Дні стають довшими.', 'Птахи літають.', 'Я візьму участь.']) {
      expect(confidentLanguage(line), line).toBe('uk');
    }
  });

  // The Bulgarian article suffix, which neither Russian nor Ukrainian has. The
  // candidates that did not survive full exposure are named in langDetect.ts,
  // and -ите is the one to remember: it is the Russian plural imperative.
  it('reads Bulgarian off its suffixed definite article', () => {
    expect(confidentLanguage('Крушката изгоря.')).toBe('bg');
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
