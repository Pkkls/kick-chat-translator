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
    expect(plain(CONFIDENT.total)).toEqual({ right: 2729, silent: 2296, wrong: 15 });
  });

  it('confidentLanguage on short lines, the regime a chat lives in', () => {
    expect(plain(CONFIDENT.shortOnly)).toEqual({ right: 840, silent: 828, wrong: 12 });
  });

  // The expensive one. This is the answer that deletes a message in silence when
  // it believes the line is already in the reader's language, and that is handed
  // to the on-device engine as a source language on Chrome, where the on-device
  // engine is the default.
  it('detectLanguage is wrong on a fifth of all lines', () => {
    expect(plain(DETECT.total)).toEqual({ right: 3628, silent: 603, wrong: 809 });
  });

  it('detectLanguage is wrong on a quarter of short lines', () => {
    expect(plain(DETECT.shortOnly)).toEqual({ right: 1049, silent: 305, wrong: 326 });
  });
});

const zeroRight = (run: typeof DETECT): string[] =>
  [...run.byLang.entries()]
    .filter(([, b]) => b.short.right + b.medium.right + b.long.right === 0)
    .map(([lang]) => lang)
    .sort();

describe('the languages the detector cannot name at all', () => {
  // EMPTY, and it took four passes to get there. Ten of forty-two scored zero at
  // the start of phase 2: never right, on any line, at any length. `zh-tw` left
  // on the two Chinese character sets, `ca lt lv sk` on the exclusive-letter
  // table, `da no` on the pair rule that reads ø and æ then picks with a word,
  // and the last three, `et fi sl`, on the chat lexicon, which was the only
  // thing that could reach them because they share every letter they use with a
  // neighbour and have no pair marker either.
  //
  // The list staying empty is now the assertion. A language falling back into it
  // is a regression, not a starting point.
  it('leaves no language scoring zero', () => {
    expect(zeroRight(DETECT)).toEqual([]);
  });

  // The other half of the same problem, and the reason phase 1 cannot simply
  // swap the raw guess for the safe one: the safe one now names all forty-two
  // languages of this corpus, where it named sixteen. Sixteen before the exclusive
  // letters, twenty-nine after them.
  //
  // Read this one with a caveat, because it flatters nothing and misleads in
  // both directions. Tatoeba is written sentences, and the short-word lexicon
  // that feeds `confidentLanguage` is a chat vocabulary: hola, merci, danke,
  // selam. A Spanish Tatoeba sentence contains none of them, so `es` scores zero
  // here while it would score on a real chat line. That is no longer a supposition:
  // `langChat.test.ts` measures it, and on chat register the two score 3 and 1 of
  // 15. They are an artefact of the corpus, not of the detector.
  it('leaves no language the confident path cannot name', () => {
    expect(zeroRight(CONFIDENT)).toEqual([]);
  });

  // Two scripts that were simply not counted. Every Bengali and Tamil line, at
  // every length, on both paths: 120 of 120. The gain is on the confident path,
  // which was mute on both and now hands the engine a source language it can
  // read straight off the alphabet.
  it('reads Bengali, Tamil and Greek off their alphabets', () => {
    // Greek was the same hole again, found two passes later: eleven scripts are
    // counted now and it was the eleventh. franc already named it, so the raw
    // path never moved and nothing looked broken; the confident path was mute,
    // so the engine was never told the source language of a Greek line although
    // the alphabet says it with no ambiguity at all. 0 to 120 on the confident
    // path, and the raw path is byte for byte what it was.
    for (const lang of ['bn', 'ta', 'el']) {
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
  it('still hands most of the Nordic languages to Swedish, and Catalan to Spanish', () => {
    // 48 and 44 before the pair rule. It scores both languages without closing
    // either pair, which is the same shape as Catalan below it: leaving the
    // zero list and fixing the confusion are two different things, and only the
    // first has happened.
    expect(DETECT.confusions.get('no->sv')).toBe(41);
    expect(DETECT.confusions.get('da->sv')).toBe(39);
    expect(DETECT.confusions.get('ca->es')).toBe(39);
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

describe('when a letter names a pair instead of a language, added 2026-09-21', () => {
  // The case the exclusive-letter table had to leave out. ø and æ belong to
  // Danish AND Norwegian, so they name nobody; but measured across all 5040
  // lines they touch those two languages and nothing else, 55 Danish lines and
  // 34 Norwegian. That is a strong signal on a set of two, and one more round
  // picks inside it.
  it('reads the pair marker on nothing but Danish and Norwegian', () => {
    const carriers = Object.entries(LANG_CORPUS)
      .filter(([, lines]) => lines.some((t) => /[øæ]/iu.test(t)))
      .map(([l]) => l)
      .sort();
    expect(carriers).toEqual(['da', 'no']);
  });

  // What the gate hands over for free, and the reason the rule works at all:
  // Swedish is already excluded, so mig/dig/sig and av become clean markers
  // behind it although they are unusable in the open. A word that is ambiguous
  // among forty-three can be decisive inside a pair of two.
  it('picks inside the pair on words that are ambiguous outside it', () => {
    expect(confidentLanguage('Han tog sit tøj af.')).toBe('da');
    expect(confidentLanguage('Kalven lærer av kua.')).toBe('no');
  });

  // Un cran de plus : `å` est ecrit par les TROIS langues, donc il nomme le trio
  // et il faut sortir le suedois avant de se servir de mots qui lui sont
  // ambigus. C'est ce qui a fait passer le suedois de 3 a 20 lignes sur la
  // moitie tenue a l'ecart.
  it('sort le suedois quand la lettre ne nomme que le trio', () => {
    expect(confidentLanguage('Jag är bra på spel.')).toBe('sv');
    expect(confidentLanguage('Jeg ser du står på, men ikke overanstreng deg.')).toBe('no');
    // Et le cas qui rend l'ordre necessaire : une ligne suedoise avec å seul,
    // sur laquelle mig, dig et sig ne seraient pas surs si on les consultait.
    expect(confidentLanguage('Snart är det vår.')).toBe('sv');
  });

  // Both sets or neither declines, same unanimous vote as everywhere else here.
  it('declines when the line carries both sets', () => {
    expect(confidentLanguage('Han tog sit tøj af, og han ville se meg.')).toBeUndefined();
  });

  // Nothing taken from the other forty, which is the protocol this repo applies
  // to any addition on the confident path.
  it('takes no line from any other language', () => {
    const into = [...CONFIDENT.confusions.keys()].filter((p) => /->(da|no)$/.test(p));
    expect(into).toEqual([]);
  });
});

describe('Malay written in the Arabic script, added 2026-09-21', () => {
  // Six of the 120 Malay lines are in Jawi, which is Arabic script, and the
  // script check read them correctly and concluded Arabic. Same shape as Persian
  // right above it: Jawi adds letters to the Arabic set, so those letters name
  // it. Three of the six carry one and are now read as Malay.
  it('reads Jawi letters as Malay rather than Arabic', () => {
    expect(confidentLanguage('دي سدڠ بلاجر بهاس ايڠڬريس.')).toBe('ms');
  });

  // The order inside the rule is what makes it work: Jawi is tested before
  // Persian because it uses چ, which is in the Persian set. Testing it after
  // would leave a Jawi line carrying a cheh reading as Persian, which is exactly
  // the ms->fa error that remains on the line that carries no Jawi letter.
  it('does not take Persian lines, which share the cheh', () => {
    const intoMalay = [...CONFIDENT.confusions.keys()].filter((p) => p.endsWith('->ms'));
    expect(intoMalay).toEqual([]);
    expect(CONFIDENT.byLang.get('fa')!.short.right
      + CONFIDENT.byLang.get('fa')!.medium.right
      + CONFIDENT.byLang.get('fa')!.long.right).toBe(113);
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
  it('is down to fifteen wrong answers, and they are these', () => {
    const rows = [...CONFIDENT.confusions.entries()].map(([p, n]) => `${p}=${n}`).sort();
    expect(rows).toEqual([
      'es->pt=1', 'fa->ar=7', 'lt->pt=1', 'ms->ar=2', 'ms->fa=1',
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
        if (
          entry === 'langMatrix.ts' ||
          entry === 'langCorpus.ts' ||
          entry === 'langChatCorpus.ts' ||
          entry === 'langMixedCorpus.ts'
        ) {
          continue;
        }
        if (/from '\.{0,2}[^']*lang(\w*Corpus|Matrix)'/.test(readFileSync(full, 'utf8'))) {
          offenders.push(full.slice(src.length + 1));
        }
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});
