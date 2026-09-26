/**
 * Build the labelled corpus the 43-language matrix measures against.
 *
 *   node test/e2e/build-lang-corpus.mjs            # write src/content/langCorpus.ts
 *   node test/e2e/build-lang-corpus.mjs --dry      # print counts, write nothing
 *   node test/e2e/build-lang-corpus.mjs --per 60   # lines per length band
 *
 * Why the corpus is downloaded and not written. Every detection rule in this
 * repo was measured against lines somebody here wrote, and the honesty of those
 * numbers rests entirely on the discipline of not adjusting the rule to the
 * corpus. That holds for one language. It does not scale to forty-three, and it
 * cannot hold at all for the protective side, where the whole point is lines
 * nobody here has ever looked at. Tatoeba sentences are labelled by humans who
 * never heard of this extension, which is the only property that matters here.
 *
 * Source: Tatoeba per-language exports, CC-BY 2.0 FR. Attribution is carried in
 * the generated file. https://tatoeba.org
 *
 * Known bias, recorded rather than hidden: an export is ordered by sentence id,
 * so its head is the oldest sentences on the site, not a random draw. The
 * sampler spreads its picks evenly across everything it decoded rather than
 * taking the first N, which widens the draw without pretending it is random.
 *
 * Register: these are complete written sentences, not chat. That is a real gap
 * and it is handled downstream rather than here: the matrix bands the same
 * lines by length, and the short band is the regime a chat actually lives in.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Product code -> Tatoeba ISO-639-3. Latvian is 'lvs', NOT 'lav': 'lav' is a
// macrolanguage code and the export 404s on it.
const TATOEBA = {
  en: 'eng', fr: 'fra', es: 'spa', pt: 'por', de: 'deu', it: 'ita', nl: 'nld', pl: 'pol',
  sv: 'swe', cs: 'ces', sk: 'slk', ro: 'ron', ru: 'rus', uk: 'ukr', tr: 'tur', ar: 'ara',
  he: 'heb', ja: 'jpn', ko: 'kor', zh: 'cmn', yue: 'yue', th: 'tha', vi: 'vie', id: 'ind',
  hi: 'hin', fi: 'fin', no: 'nob', da: 'dan', el: 'ell', hu: 'hun', bg: 'bul', ca: 'cat',
  sl: 'slv', et: 'est', lt: 'lit', lv: 'lvs', fa: 'pes', bn: 'ben', ta: 'tam', ms: 'zsm',
  tl: 'tgl',
};

// Characters simplified and traditional Chinese do not share. Used ONLY to split
// the single `cmn` export into the two the product offers, because Tatoeba has no
// separate traditional corpus.
//
// This split is tautological and saying so is the point: the difference between
// zh and zh-tw IS a character set, so a corpus sorted by character set and a rule
// that reads character sets are the same statement twice. What it is good for is
// the other direction, showing that traditional lines are currently answered as
// simplified, and later that a zh-tw rule does not also fire on Japanese kanji.
const TRAD_ONLY = /[這們說來個為對時會後過樣麼開關點學實發機應經見覺語讀車東馬長門風飛頭題體萬與樂區醫]/u;
const SIMP_ONLY = /[这们说来个为对时会后过样么开关点学实发机应经见觉语读车东马长门风飞头题体万与乐区医]/u;

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const PER_BAND = Number(args[args.indexOf('--per') + 1]) || 40;
// 400 KB of a bz2 export decodes to a few thousand lines, which is far more than
// the sampler needs and keeps the whole build under a minute on a home line.
const RANGE_BYTES = 400_000;

const BANDS = [
  ['short', (n) => n <= 20],
  ['medium', (n) => n > 20 && n <= 40],
  ['long', (n) => n > 40],
];

const tmp = mkdtempSync(join(tmpdir(), 'langcorpus-'));

async function fetchLines(iso) {
  const url = `https://downloads.tatoeba.org/exports/per_language/${iso}/${iso}_sentences.tsv.bz2`;
  const res = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES}` } });
  if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = join(tmp, `${iso}.bz2`);
  writeFileSync(file, buf);
  let out = '';
  try {
    // A truncated bz2 decodes its complete blocks and then exits non-zero. That
    // exit code is expected, and the bytes before it are good.
    out = execFileSync('bzip2', ['-dc', file], { maxBuffer: 1 << 28 }).toString('utf8');
  } catch (err) {
    out = (err.stdout ?? Buffer.alloc(0)).toString('utf8');
  }
  rmSync(file, { force: true });
  return out.split('\n');
}

/** A line worth measuring: real prose, no markup, no leaked metadata. */
function usable(text) {
  if (!text) return false;
  if (text.length < 4 || text.length > 120) return false;
  if (/https?:\/\/|www\./i.test(text)) return false;
  if (/[<>{}|\\]/.test(text)) return false;
  // Mostly digits or punctuation carries no language.
  const letters = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
  return letters.length >= 3;
}

/** Spread the picks across the whole pool instead of taking its head. */
function sampleEvenly(pool, n) {
  if (pool.length <= n) return pool.slice();
  const step = pool.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool[Math.floor(i * step)]);
  return out;
}

const corpus = {};
const report = [];

/** Pick PER_BAND lines from each length band of a pool. */
function bandSample(texts) {
  const picked = [];
  const counts = {};
  for (const [band, fits] of BANDS) {
    const take = sampleEvenly(texts.filter((t) => fits(t.length)), PER_BAND);
    counts[band] = take.length;
    picked.push(...take);
  }
  return { picked, counts };
}

for (const [code, iso] of Object.entries(TATOEBA)) {
  let lines;
  try {
    lines = await fetchLines(iso);
  } catch (err) {
    report.push({ code, iso, error: String(err.message) });
    continue;
  }
  const seen = new Set();
  const texts = [];
  for (const line of lines) {
    const text = line.split('\t')[2]?.trim();
    if (!usable(text) || seen.has(text)) continue;
    seen.add(text);
    texts.push(text);
  }

  // zh-tw has no export of its own, so it is carved out of cmn by character
  // set. The split runs on the whole decoded pool and each side is banded
  // separately: splitting after sampling starved the traditional side down to
  // 32 lines, which is too few to read a false-positive rate off.
  if (code === 'zh') {
    const simp = texts.filter((t) => SIMP_ONLY.test(t) && !TRAD_ONLY.test(t));
    const trad = texts.filter((t) => TRAD_ONLY.test(t) && !SIMP_ONLY.test(t));
    const s = bandSample(simp);
    const t = bandSample(trad);
    corpus.zh = s.picked;
    corpus['zh-tw'] = t.picked;
    report.push({ code: 'zh', iso: 'cmn simpl.', decoded: simp.length, ...s.counts, total: s.picked.length });
    report.push({ code: 'zh-tw', iso: 'cmn trad.', decoded: trad.length, ...t.counts, total: t.picked.length });
    continue;
  }

  const { picked, counts } = bandSample(texts);
  corpus[code] = picked;
  report.push({ code, iso, decoded: texts.length, ...counts, total: picked.length });
}

rmSync(tmp, { recursive: true, force: true });

console.table(report);
const totalLines = Object.values(corpus).reduce((s, v) => s + v.length, 0);
console.log(`\n${Object.keys(corpus).length} languages, ${totalLines} lines`);
console.log('pt-br: no corpus. Tatoeba has one Portuguese export and the BR/PT split is not marked in it.');

if (DRY) {
  console.log('\n--dry: nothing written');
  process.exit(0);
}

const out = `/**
 * Labelled sentences for the cross-language detection matrix. GENERATED, do not
 * hand-edit: rebuild with \`node test/e2e/build-lang-corpus.mjs\`.
 *
 * Source: Tatoeba per-language exports, CC-BY 2.0 FR, https://tatoeba.org
 * Contributors: the Tatoeba community. These sentences are redistributed under
 * the same licence.
 *
 * Why downloaded rather than written: the protective side of a detection bench
 * is only worth what its independence is worth, and lines written in this repo
 * by the same pass that writes the rule are not independent. Nobody involved in
 * this extension has seen these.
 *
 * Two caveats that belong next to the numbers this produces:
 *
 * 1. Register. These are complete written sentences, not chat. The matrix bands
 *    them by length and reports each band separately, because the short band is
 *    the regime a chat lives in and the one where detection is measured worst.
 * 2. zh and zh-tw are one Tatoeba export (cmn) split by character set. That
 *    split is the definition of the distinction rather than a measurement of
 *    it. Read those two rows as consistency, not as capability.
 *
 * pt-br is absent: Tatoeba publishes one Portuguese export and does not mark
 * the Brazilian/European split.
 *
 * Bias: an export is ordered by sentence id, so its head is the site's oldest
 * sentences. Picks are spread evenly across everything decoded rather than
 * taken from the front, which widens the draw without making it random.
 */

export const LANG_CORPUS: Readonly<Record<string, readonly string[]>> = {
${Object.entries(corpus)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, lines]) => `  ${/^[a-z]+$/.test(code) ? code : `'${code}'`}: [\n${lines.map((l) => `    ${JSON.stringify(l)},`).join('\n')}\n  ],`)
  .join('\n')}
};
`;

const dest = new URL('../../src/content/langCorpus.ts', import.meta.url);
writeFileSync(dest, out, 'utf8');
console.log(`\nwrote ${dest.pathname.replace(/^\//, '')} (${(out.length / 1024).toFixed(0)} KB)`);
