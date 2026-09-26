/**
 * What the public sees, compared with the repository: the version each store
 * serves, and every listing text in every language.
 *
 *   node scripts/stores/verify.mjs
 *
 * Chrome: the public detail page, fetched once per language, carries the
 * version, the short description (the manifest's extDescription) and the whole
 * detailed description. AMO: the public API. No key needed for either.
 *
 * Exits 1 on any difference. Between a submission and its approval that is the
 * expected answer: the stores still serve the previous release.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const ITEM = 'nkkjmbkmacbdkboijmnhjnblcaiclhni';
const SLUG = 'kick-chat-translator';
const store = (rel) => fs.readFileSync(path.join(ROOT, 'store', rel), 'utf8').trim();
const locale = (dir) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/_locales', dir, 'messages.json'), 'utf8')).extDescription.message;

const plain = (s) =>
  (s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\\n/g, '\n').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&').replace(/\\"/g, '"');
const squash = (s) => plain(s).replace(/\s+/g, ' ').trim();

let differences = 0;
const row = (ok, what, detail = '') => {
  if (!ok) differences++;
  console.log(`${ok ? 'ok  ' : 'DIFF'} ${what}${detail ? ' | ' + detail : ''}`);
};

// Chrome: store language -> page hl, _locales directory.
const CHROME = { en: ['en', 'en'], fr: ['fr', 'fr'], es: ['es', 'es'], 'pt-BR': ['pt-BR', 'pt_BR'], tr: ['tr', 'tr'], ru: ['ru', 'ru'],
  ar: ['ar', 'ar'], ja: ['ja', 'ja'], ko: ['ko', 'ko'], zh: ['zh-CN', 'zh_CN'], cs: ['cs', 'cs'] };
for (const [lang, [hl, dir]] of Object.entries(CHROME)) {
  const url = `https://chromewebstore.google.com/detail/${SLUG}/${ITEM}?hl=${hl}`;
  const r = await fetch(url, { headers: { 'Accept-Language': hl, 'User-Agent': 'Mozilla/5.0' } });
  const html = await r.text();
  const page = squash(html);
  const served = [...new Set([...html.matchAll(/"(\d+\.\d+\.\d+)"/g)].map((m) => m[1]))][0] ?? '?';
  const blurb = squash(html.match(/<meta name="description" content="([^"]*)"/)?.[1]);
  const paras = store(`chrome/description/${lang}.txt`).split(/\n\s*\n/).map(squash).filter((p) => p.length >= 30);
  const found = paras.filter((p) => page.includes(p)).length;
  row(served === VERSION, `chrome ${lang.padEnd(5)} version`, `servie ${served}, depot ${VERSION}`);
  row(blurb === squash(locale(dir)), `chrome ${lang.padEnd(5)} resume`, blurb === squash(locale(dir)) ? '' : `servi "${blurb.slice(0, 50)}"`);
  row(found === paras.length, `chrome ${lang.padEnd(5)} description`, `${found}/${paras.length} paragraphes`);
}

// AMO: the public API returns every translation when no lang is asked for.
const AMO = { en: 'en-US', fr: 'fr', tr: 'tr', ja: 'ja', es: 'es-ES', 'pt-BR': 'pt-BR', ru: 'ru', zh: 'zh-CN', ko: 'ko', cs: 'cs' };
const a = await (await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${SLUG}/`)).json();
row(a.current_version?.version === VERSION, 'amo   version', `servie ${a.current_version?.version}, depot ${VERSION}`);
for (const [lang, loc] of Object.entries(AMO)) {
  row(squash(a.summary?.[loc]) === squash(store(`amo/summary/${lang}.txt`)), `amo   ${lang.padEnd(5)} resume`);
  row(squash(a.description?.[loc]) === squash(store(`amo/description/${lang}.txt`)), `amo   ${lang.padEnd(5)} description`);
}

console.log(differences ? `\n${differences} difference(s) entre les stores et le depot` : '\nles stores servent exactement le depot');
process.exit(differences ? 1 : 0);
