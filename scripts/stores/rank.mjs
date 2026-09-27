/**
 * Where the listing ranks for the queries in store/keywords.json, and how many
 * people use it, on both stores.
 *
 *   node scripts/stores/rank.mjs
 *
 * Chrome: the public search page, in the query's language; it serves its first
 * ten results as HTML, so a position past ten reads "-". AMO: the public search
 * API, fifty results deep. Users: the Chrome detail page and AMO's
 * average_daily_users. No key needed. Always exits 0: this measures, it does
 * not gate. Under GitHub Actions the table also goes to the job summary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ITEM = 'nkkjmbkmacbdkboijmnhjnblcaiclhni';
const SLUG = 'kick-chat-translator';
const KEYWORDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'store/keywords.json'), 'utf8'));
const HL = { zh: 'zh-CN' };
const AMO_LANG = { en: 'en-US', es: 'es-ES', zh: 'zh-CN' };
const UA = { 'User-Agent': 'Mozilla/5.0' };

const text = async (url, hl) => (await fetch(url, { headers: { ...UA, 'Accept-Language': hl } })).text();

async function chromeRank(q, hl) {
  const html = await text(`https://chromewebstore.google.com/search/${encodeURIComponent(q)}?hl=${hl}`, hl);
  const ids = [...new Set([...html.matchAll(/\/detail\/[^/"]+\/([a-p]{32})/g)].map((m) => m[1]))];
  return ids.indexOf(ITEM) + 1 || '-';
}

async function amoRank(q, lang) {
  const url = `https://addons.mozilla.org/api/v5/addons/search/?q=${encodeURIComponent(q)}&app=firefox&type=extension&lang=${lang}&page_size=50`;
  const { results = [] } = await (await fetch(url)).json();
  return results.findIndex((a) => a.slug === SLUG) + 1 || '-';
}

const rows = [];
for (const [lang, queries] of Object.entries(KEYWORDS)) {
  for (const q of queries) {
    const [c, a] = await Promise.all([chromeRank(q, HL[lang] ?? lang), amoRank(q, AMO_LANG[lang] ?? lang)]);
    rows.push(`| ${lang} | ${q} | ${c} | ${a} |`);
  }
}

const page = await text(`https://chromewebstore.google.com/detail/${SLUG}/${ITEM}?hl=en`, 'en');
const chromeUsers = page.match(/([\d,]+) users/)?.[1] ?? '?';
const amo = await (await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${SLUG}/`)).json();

const table = [
  `Chrome: ${chromeUsers} users. Firefox: ${amo.average_daily_users} daily users, ${amo.weekly_downloads} downloads this week.`,
  '',
  '| lang | query | Chrome (top 10) | AMO (top 50) |',
  '|---|---|---|---|',
  ...rows,
].join('\n');
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Store ranking\n\n${table}\n`);
