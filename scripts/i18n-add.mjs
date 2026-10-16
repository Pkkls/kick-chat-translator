// Add interface strings to every catalogue without writing 42 translations by hand.
//
//   node scripts/i18n-add.mjs "Work in progress" ["Another key" ...]
//   node scripts/i18n-add.mjs --from strings.json     {"key": {"fr": "...", ...}}
//
// For each key and each catalogue in src/shared/i18n/<locale>.ts that lacks it:
// the text given in --from wins; otherwise it is drafted by the free Google
// endpoint the extension itself uses (translate_a/t, one batch per locale).
// The key goes into keys.json. Prints counts only, so running it costs nothing
// to read. Drafts are machine translations: fine for short labels, review long
// sentences, and run `node scripts/i18n-check.mjs` after.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/shared/i18n');
const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const given = fromIdx >= 0 ? JSON.parse(readFileSync(args[fromIdx + 1], 'utf8')) : {};
const positional = fromIdx >= 0 ? args.filter((_, i) => i !== fromIdx && i !== fromIdx + 1) : args;
const keys = [...new Set([...Object.keys(given), ...positional])];
if (keys.length === 0) {
  console.error('usage: node scripts/i18n-add.mjs "English key" [...] | --from strings.json');
  process.exit(1);
}

// Catalogue file name -> Google code.
const GOOGLE = { pt: 'pt', 'pt-pt': 'pt-PT', zh: 'zh-CN', 'zh-tw': 'zh-TW', yue: 'zh-TW', no: 'no', he: 'iw', tl: 'tl' };
const locales = readdirSync(dir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.slice(0, -3));

async function draft(texts, loc) {
  const url = new URL('https://translate.googleapis.com/translate_a/t');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', GOOGLE[loc] ?? loc);
  const body = new URLSearchParams();
  for (const t of texts) body.append('q', t);
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) throw new Error(`Google ${res.status} for ${loc}`);
  const data = await res.json();
  return texts.length === 1 && !Array.isArray(data[0]) ? [data[0]] : data.map((e) => (Array.isArray(e) ? e[0] : e));
}

const keysPath = join(dir, 'keys.json');
const allKeys = JSON.parse(readFileSync(keysPath, 'utf8'));
for (const k of keys) if (!allKeys.includes(k)) allKeys.push(k);
writeFileSync(keysPath, JSON.stringify(allKeys, null, 2) + '\n');

let added = 0, drafted = 0, files = 0;
for (const loc of locales) {
  const p = join(dir, `${loc}.ts`);
  const src = readFileSync(p, 'utf8');
  const missing = keys.filter((k) => !src.includes(JSON.stringify(k)) && !src.includes(`'${k.replace(/'/g, "\\'")}'`));
  if (missing.length === 0) continue;
  const toDraft = missing.filter((k) => !given[k]?.[loc]);
  const drafts = toDraft.length ? await draft(toDraft, loc) : [];
  const value = (k) => given[k]?.[loc] ?? drafts[toDraft.indexOf(k)];
  const lines = missing.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(value(k))},\n`).join('');
  const end = src.lastIndexOf('};');
  writeFileSync(p, src.slice(0, end) + lines + src.slice(end));
  added += missing.length;
  drafted += toDraft.length;
  files++;
  await new Promise((r) => setTimeout(r, 150));
}
console.log(`keys: ${keys.length}, catalogues touched: ${files}/${locales.length}, entries added: ${added} (${drafted} drafted by Google)`);
