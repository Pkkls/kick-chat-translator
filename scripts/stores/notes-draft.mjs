// Draft store/notes/<lang>.txt for every listing language from store/notes/en.txt.
//
//   node scripts/stores/notes-draft.mjs            all languages but en
//   node scripts/stores/notes-draft.mjs fr de      only these
//
// Machine translation through the free Google endpoint the extension uses, one
// request per language with one paragraph per `q`, so paragraphs stay apart.
// Prints one line per language, never the texts. Review before a release:
// `npm run stores:payloads` refuses dashes, unaccented Latin paragraphs and
// Cyrillic letters in Latin text, which catches the usual MT slips.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dir = join(root, 'store/notes');
const only = process.argv.slice(2);
const langs = (only.length ? only : readdirSync(dir).map((f) => f.replace(/\.txt$/, ''))).filter((l) => l !== 'en');
const GOOGLE = { 'pt-BR': 'pt', 'pt-PT': 'pt-PT', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', he: 'iw', fil: 'tl' };
const paragraphs = readFileSync(join(dir, 'en.txt'), 'utf8').trim().split(/\n\s*\n/);

for (const lang of langs) {
  const url = new URL('https://translate.googleapis.com/translate_a/t');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', GOOGLE[lang] ?? lang);
  const body = new URLSearchParams();
  for (const p of paragraphs) body.append('q', p);
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) {
    console.log(`${lang}: HTTP ${res.status}, left as it was`);
    continue;
  }
  const data = await res.json();
  const out = (paragraphs.length === 1 && !Array.isArray(data[0]) ? [data[0]] : data.map((e) => (Array.isArray(e) ? e[0] : e)))
    // Store texts never carry an em or en dash (house rule, checked by payloads.mjs).
    .map((t) => t.replace(/\s*[—–]\s*/g, ', '));
  writeFileSync(join(dir, `${lang}.txt`), out.join('\n\n') + '\n');
  console.log(`${lang}: ${out.length} paragraphs`);
  await new Promise((r) => setTimeout(r, 200));
}
