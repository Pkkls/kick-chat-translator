/**
 * Builds what the AMO pages receive, from the two files that hold it, and
 * refuses to build it when a text would embarrass the listing.
 *
 *   node .claude/skills/publish-stores/payloads.mjs <outdir>
 *
 * Reads store-listing.md (summaries, descriptions, reviewer notes) and
 * release/NOUVEAUTES.md (release notes, one `## <lang>` section each, the text
 * inside the first fenced block). Writes <outdir>/amo-notes.json
 * {notes: {locale: text}, rev} and <outdir>/amo-listing.json
 * {summary: {locale: text}, description: {locale: text}}.
 *
 * Fails on: an em or en dash, a Latin-script text with no diacritics at all
 * (NOUVEAUTES.md for 2.12.1 came out ASCII-stripped: "decidait", "Tamano"),
 * an AMO summary over 250 characters, a language with no text.
 */
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
if (!out) {
  console.error('usage: payloads.mjs <outdir>');
  process.exit(2);
}
fs.mkdirSync(out, { recursive: true });

const sections = (file) => {
  const r = {};
  let cur = null;
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = l.match(/^## (.+)$/);
    if (m) r[(cur = m[1].trim())] = [];
    else if (cur) r[cur].push(l);
  }
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.join('\n').trim()]));
};

// Chinese and Japanese lines join without a space; Korean separates words.
const CJK = /[　-ヿ㐀-鿿＀-￯]/;
const unwrap = (s) => {
  const lines = [];
  for (const raw of s.split('\n')) {
    const l = raw.trim();
    const prev = lines[lines.length - 1];
    if (!l) lines.push('');
    else if (prev && !/^- /.test(l)) lines[lines.length - 1] = prev + (CJK.test(prev.slice(-1)) && CJK.test(l[0]) ? '' : ' ') + l;
    else lines.push(l);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

// Listing language in store-listing.md to the AMO locales it fills. AMO has no
// Arabic locale. The add-on's default locale is fr, and a visitor whose
// locale has no text sees the default, so every variant of a language gets it.
const LISTING = {
  EN: ['en-us', 'en-gb', 'en-ca'], FR: ['fr'], TR: ['tr'], JA: ['ja'],
  ES: ['es-es', 'es-mx', 'es-ar', 'es-cl'], 'PT-BR': ['pt-br', 'pt-pt'], RU: ['ru'],
  ZH: ['zh-cn'], KO: ['ko'], CS: ['cs'],
};
// NOUVEAUTES.md section to AMO locales. `pt` there is European Portuguese.
const NOTES = {
  en: ['en-us', 'en-gb', 'en-ca'], fr: ['fr'], es: ['es-es', 'es-mx', 'es-ar', 'es-cl'],
  pt: ['pt-pt'], 'pt-br': ['pt-br'], de: ['de'], ru: ['ru'], tr: ['tr'], ja: ['ja'], ko: ['ko'], zh: ['zh-cn'],
};
const LATIN_WITH_DIACRITICS = new Set(['fr', 'es', 'pt', 'pt-br', 'de', 'tr', 'cs', 'FR', 'ES', 'PT-BR', 'TR', 'CS']);

const fails = [];
// Built from code points so this file never carries the characters it hunts.
const DASH = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const DIACRITIC = new RegExp(`[${String.fromCharCode(0xc0)}-${String.fromCharCode(0x17f)}]`);
const check = (label, lang, text) => {
  if (!text) fails.push(`${label}: vide`);
  if (DASH.test(text)) fails.push(`${label}: tiret cadratin ou demi-cadratin`);
  if (LATIN_WITH_DIACRITICS.has(lang) && !DIACRITIC.test(text)) fails.push(`${label}: aucun accent, texte ASCII`);
};

const listing = sections('store-listing.md');
const summary = {};
const description = {};
for (const [lang, locales] of Object.entries(LISTING)) {
  const s = listing[lang === 'EN' ? 'AMO summary (EN, 250 char limit)' : `AMO summary (${lang})`];
  const d = listing[`AMO description (${lang})`];
  check(`resume ${lang}`, lang, s);
  check(`description ${lang}`, lang, d);
  if (s && [...s].length > 250) fails.push(`resume ${lang}: ${[...s].length} caracteres, 250 max`);
  for (const loc of locales) (summary[loc] = s), (description[loc] = d);
}

const nouveautes = sections('release/NOUVEAUTES.md');
const notes = {};
for (const [lang, locales] of Object.entries(NOTES)) {
  const key = Object.keys(nouveautes).find((k) => k.split(' ')[0] === lang);
  if (!key) {
    if (lang !== 'pt-br') fails.push(`note ${lang}: section absente de NOUVEAUTES.md`);
    continue;
  }
  const body = nouveautes[key];
  const text = unwrap(body.match(/```[a-z]*\n([\s\S]*?)\n```/)?.[1] ?? body);
  check(`note ${lang}`, lang, text);
  for (const loc of locales) notes[loc] = text;
}
// Without a Brazilian section, Brazil reads the European text rather than the French default.
notes['pt-br'] ??= notes['pt-pt'];

// Chrome Web Store descriptions. Each section opens with notes for whoever
// pastes it ("Paste into the Turkish listing...", "Short summary: ...") and the
// text to publish starts at the version header, "NEW IN 2.12.2" or its
// translation, the first line that names the package version.
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const cws = {};
for (const lang of ['EN', 'FR', 'TR', 'AR', 'JA', 'ES', 'PT-BR', 'RU', 'ZH', 'KO', 'CS']) {
  const lines = (listing[`Description (${lang})`] ?? '').split('\n');
  const start = lines.findIndex((l) => l.includes(version) && !/paste|summary/i.test(l));
  if (start < 0) {
    fails.push(`description Chrome ${lang}: aucune ligne ne cite ${version}`);
    continue;
  }
  cws[lang] = lines.slice(start).join('\n').trim();
  check(`description Chrome ${lang}`, lang, cws[lang]);
  if (/\bpaste into\b/i.test(cws[lang])) fails.push(`description Chrome ${lang}: consigne de collage restee dans le texte`);
}

const rawRev = listing['AMO reviewer notes (source code and build)'] ?? '';
const rev = rawRev.slice(rawRev.indexOf('Source:')).trim();
check('notes relecteurs', 'EN', rev);

if (fails.length) {
  console.error(fails.length + ' probleme(s), rien ecrit :');
  for (const f of fails) console.error('  x ' + f);
  process.exit(1);
}
fs.writeFileSync(path.join(out, 'amo-notes.json'), JSON.stringify({ notes, rev }));
fs.writeFileSync(path.join(out, 'amo-listing.json'), JSON.stringify({ summary, description }));
fs.writeFileSync(path.join(out, 'cws-listing.json'), JSON.stringify(cws));
for (const [lang, text] of Object.entries(cws)) fs.writeFileSync(path.join(out, `cws-description-${lang}.txt`), text + '\n');
console.log(`notes ${Object.keys(notes).length} locales | fiche AMO ${Object.keys(summary).length} locales | fiche Chrome ${Object.keys(cws).length} langues | relecteurs ${rev.length} car.`);
console.log(`-> ${out}`);
