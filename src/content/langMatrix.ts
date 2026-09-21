/**
 * Every language in the product, scored against every other one.
 *
 * Test-only module. Nothing in the shipped extension imports it, and
 * `langMatrix.test.ts` holds it to that. It lives here rather than in the
 * harness folder because it has to import `langDetect.ts` with its `~/` alias,
 * which only the TypeScript build and vitest resolve.
 *
 * Each detection rule in this repo was measured when it was written, against the
 * one or two languages it was written to separate. None was measured against the
 * other forty. This is that measurement, and it is why the file exists: a marker
 * added for Bulgarian can take a line from Russian, and nothing until now would
 * have said so.
 *
 * TWO NUMBERS, NEVER ADDED TOGETHER. They do not cost the same thing.
 *
 *   confidentLanguage  is the `sl` handed to the translation engine. Wrong here
 *                      means asking the engine to translate from a language the
 *                      text is not in.
 *   detectLanguage     is franc's guess included. It drives three decisions in
 *                      pipeline.ts: deleting a message in silence when it thinks
 *                      it recognises the reader's own language (:183), the
 *                      source language forced on the on-device engine, which is
 *                      the default engine on Chrome (:255), and the flag shown
 *                      (:256). Wrong here means a message nobody ever sees.
 *
 * THREE OUTCOMES, and silence is not failure. `undefined` means the detector
 * declined, which sends the line to the engine with no source language and lets
 * the engine decide. That is the safe outcome, and `confidentLanguage` is built
 * to prefer it. A wrong answer is the expensive one.
 *
 * BANDED BY LENGTH because the corpus is written sentences and a chat is not.
 * Tatoeba has no chat register, so the short band, 20 characters or fewer, is
 * the closest thing to the regime the product runs in, and it is the band to
 * read first. `SHORT_TEXT_MAX` in langDetect.ts is 20 for the same reason.
 */

import { confidentLanguage, detectLanguage } from './langDetect';
import { LANG_CORPUS } from './langCorpus';

export type Band = 'short' | 'medium' | 'long';

export const bandOf = (text: string): Band =>
  text.length <= 20 ? 'short' : text.length <= 40 ? 'medium' : 'long';

export interface Cell {
  right: number;
  silent: number;
  wrong: number;
}

const emptyCell = (): Cell => ({ right: 0, silent: 0, wrong: 0 });

export interface Run {
  /** Per language, per band. */
  byLang: Map<string, Record<Band, Cell>>;
  /** `from->to` for every wrong answer, counted. */
  confusions: Map<string, number>;
  total: Cell;
  shortOnly: Cell;
}

export function runMatrix(
  detector: (t: string) => string | undefined,
  corpus: Readonly<Record<string, readonly string[]>> = LANG_CORPUS,
): Run {
  const byLang = new Map<string, Record<Band, Cell>>();
  const confusions = new Map<string, number>();
  const total = emptyCell();
  const shortOnly = emptyCell();

  for (const [lang, lines] of Object.entries(corpus)) {
    const bands: Record<Band, Cell> = { short: emptyCell(), medium: emptyCell(), long: emptyCell() };
    for (const line of lines) {
      const answer = detector(line);
      const outcome: keyof Cell = answer === undefined ? 'silent' : answer === lang ? 'right' : 'wrong';
      const b = bandOf(line);
      bands[b][outcome] += 1;
      total[outcome] += 1;
      if (b === 'short') shortOnly[outcome] += 1;
      if (outcome === 'wrong') {
        const key = `${lang}->${answer}`;
        confusions.set(key, (confusions.get(key) ?? 0) + 1);
      }
    }
    byLang.set(lang, bands);
  }
  return { byLang, confusions, total, shortOnly };
}

export const confidentRun = (): Run => runMatrix(confidentLanguage);
export const detectRun = (): Run => runMatrix(detectLanguage);

/**
 * Messages a reader would never see, per reading language.
 *
 * `pipeline.ts:183` drops a line without a word when the detector says it is
 * already in the reader's language. So every wrong answer naming language T is
 * a line deleted from the screen of every reader whose target is T. This counts
 * them: for each T, how many lines that are NOT in T were answered T.
 *
 * It is the same confusion data read from the other end. The matrix asks "where
 * do this language's lines go"; this asks "what lands on this reader".
 */
export function silentlyDeleted(run: Run): Map<string, number> {
  const perTarget = new Map<string, number>();
  for (const [pair, n] of run.confusions) {
    const to = pair.split('->')[1]!;
    perTarget.set(to, (perTarget.get(to) ?? 0) + n);
  }
  return perTarget;
}

const pct = (n: number, d: number) => (d === 0 ? '0' : ((n / d) * 100).toFixed(0));
const sum = (c: Cell) => c.right + c.silent + c.wrong;

function cellRow(c: Cell): string {
  const n = sum(c);
  return `${String(c.right).padStart(4)} | ${String(c.silent).padStart(4)} | ${String(c.wrong).padStart(4)} | ${pct(c.right, n).padStart(3)}% | ${pct(c.silent, n).padStart(3)}% | ${pct(c.wrong, n).padStart(3)}%`;
}

const merge = (b: Record<Band, Cell>): Cell => ({
  right: b.short.right + b.medium.right + b.long.right,
  silent: b.short.silent + b.medium.silent + b.long.silent,
  wrong: b.short.wrong + b.medium.wrong + b.long.wrong,
});

/** The human-readable report. Written to scratchpad/harness/lang-matrix.md. */
export function report(confident: Run, detect: Run, stamp: string): string {
  const langs = Object.keys(LANG_CORPUS).length;
  const lines = Object.values(LANG_CORPUS).reduce((s, v) => s + v.length, 0);
  const out: string[] = [];

  out.push('# Cross-language detection matrix');
  out.push('');
  out.push(`Generated ${stamp} by \`npx tsx scratchpad/harness/lang-matrix.mjs\`. Do not hand-edit.`);
  out.push('');
  out.push(`Corpus: ${langs} languages, ${lines} lines, Tatoeba CC-BY 2.0 FR. See \`src/content/langCorpus.ts\`.`);
  out.push('');
  out.push('`right` the detector named the language the line is in. `silent` it declined,');
  out.push('which sends the line to the engine with no source language and is the safe');
  out.push('outcome. `wrong` it named another language. Never add `right` and `silent`.');
  out.push('');

  for (const [title, note, r] of [
    ['confidentLanguage', 'The source language handed to the translation engine. Wrong here translates from a language the text is not in.', confident],
    ['detectLanguage', 'Drives the silent delete (pipeline.ts:183), the source forced on the on-device engine (:255) and the flag shown (:256). Wrong here means a message nobody sees.', detect],
  ] as const) {
    out.push(`## ${title}`);
    out.push('');
    out.push(note);
    out.push('');
    out.push('| scope | right | silent | wrong | right% | silent% | wrong% |');
    out.push('|---|---:|---:|---:|---:|---:|---:|');
    out.push(`| all lines | ${cellRow(r.total)} |`);
    out.push(`| short only (<=20 chars) | ${cellRow(r.shortOnly)} |`);
    out.push('');
    out.push('### Languages whose lines are most often given to another language');
    out.push('');
    out.push('| lang | right | silent | wrong | right% | silent% | wrong% |');
    out.push('|---|---:|---:|---:|---:|---:|---:|');
    const worst = [...r.byLang.entries()]
      .map(([lang, b]) => ({ lang, c: merge(b) }))
      .sort((a, z) => z.c.wrong - a.c.wrong)
      .slice(0, 15);
    for (const { lang, c } of worst) out.push(`| ${lang} | ${cellRow(c)} |`);
    out.push('');
    out.push('### Pairs that steal the most lines');
    out.push('');
    out.push('| from -> to | lines |');
    out.push('|---|---:|');
    for (const [pair, n] of [...r.confusions.entries()].sort((a, z) => z[1] - a[1]).slice(0, 25)) {
      out.push(`| ${pair} | ${n} |`);
    }
    out.push('');
  }

  out.push('## Per language, per length band, detectLanguage');
  out.push('');
  out.push('| lang | short r/s/w | medium r/s/w | long r/s/w |');
  out.push('|---|---|---|---|');
  for (const lang of [...detect.byLang.keys()].sort()) {
    const b = detect.byLang.get(lang)!;
    const f = (c: Cell) => `${c.right}/${c.silent}/${c.wrong}`;
    out.push(`| ${lang} | ${f(b.short)} | ${f(b.medium)} | ${f(b.long)} |`);
  }
  out.push('');
  return out.join('\n');
}
