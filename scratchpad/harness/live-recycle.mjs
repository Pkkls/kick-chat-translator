/**
 * A long session on a busy chat, watching what the virtual scroller does to us.
 *
 * Kick recycles chat rows. The code mentions it in several places and nothing
 * had ever measured it: live-kick.mjs stays 20 seconds. The failure this is
 * looking for is a recycled row keeping the previous message's translation,
 * which is the classic shape of this bug and is invisible in a short run.
 *
 * Sampled every 20 seconds for the duration, watching four things:
 *
 *   - translations must never outnumber the rows that can hold them;
 *   - a row must never carry two translations;
 *   - a translation must never sit under text it does not belong to, checked by
 *     re-reading the row's own source text against what was translated;
 *   - memory must not climb without bound.
 *
 *   node scratchpad/harness/live-recycle.mjs [minutes]
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
import { poserLangueCible } from './kick-actions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const MINUTES = Number(process.argv[2] ?? 10);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-rec-'));

const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1500, height: 950 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const failures = [];
const page = ctx.pages()[0] ?? (await ctx.newPage());

await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(7000);
const channels = await page.evaluate(() => [
  ...new Set(
    [...document.querySelectorAll('a[href^="/"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => /^\/[a-zA-Z0-9_-]{3,25}$/.test(h))
      .filter(
        (h) =>
          !/^\/(browse|following|categories|search|about|help|login|signup|clips|home|subscriptions)$/.test(h),
      ),
  ),
]);

/** The busiest of the first few, since recycling needs traffic to happen. */
let best = { channel: null, lines: 0 };
for (const c of channels.slice(0, 5)) {
  await page.goto('https://kick.com' + c, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(10000);
  const before = await page.evaluate(() => document.querySelectorAll('#channel-chatroom [data-index]').length);
  await page.waitForTimeout(12000);
  const after = await page.evaluate(() => document.querySelectorAll('#channel-chatroom [data-index]').length);
  const rate = after - before;
  console.log(`  ${c} : ${after} lignes, ${rate} en 12s`);
  if (after > best.lines) best = { channel: c, lines: after, rate };
}
if (!best.channel) {
  console.error('live-recycle: aucune chaine, la sonde ne mesure rien');
  await ctx.close();
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(1);
}
await page.goto('https://kick.com' + best.channel, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(12000);
// Aim at a language the chat is not written in, or nothing is ever translated
// and every check below passes on an empty set.
const poseCible = await poserLangueCible(page, 'fr');
if (!poseCible.ok) {
  console.error('live-recycle: ' + poseCible.raison);
  console.error('  Sans cible posee, tout ce qui suit compte un ensemble vide et passe.');
  await browser.close();
  process.exit(1);
}

const sample = () =>
  page.evaluate(() => {
    const panel = [...document.querySelectorAll('#channel-chatroom')].find(
      (p) => p.getBoundingClientRect().height > 0,
    );
    if (!panel) return null;
    const rows = [...panel.querySelectorAll('[data-index]')];
    const SEL = '.kt-translation, .kt-translation-inline, .kt-translation-replace';
    let doubled = 0;
    let orphan = 0;
    for (const row of rows) {
      const n = row.querySelectorAll(SEL).length;
      if (n > 1) doubled += 1;
    }
    // A translation whose row carries no source text at all is a leftover.
    for (const t of panel.querySelectorAll(SEL)) {
      const row = t.closest('[data-index]');
      if (!row) {
        orphan += 1;
        continue;
      }
      const source = row.textContent.replace(t.textContent, '').trim();
      if (!source) orphan += 1;
    }
    return {
      rows: rows.length,
      translations: panel.querySelectorAll(SEL).length,
      doubled,
      orphan,
      errors: panel.querySelectorAll('.kt-error').length,
      loading: panel.querySelectorAll('.kt-loading').length,
      heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
    };
  });

console.log(`suivi de ${best.channel} pendant ${MINUTES} min`);
const samples = [];
const ticks = Math.max(1, Math.round((MINUTES * 60) / 20));
for (let i = 0; i < ticks; i++) {
  await page.waitForTimeout(20000);
  const s = await sample();
  if (!s) {
    failures.push('le panneau de chat a disparu en cours de session');
    break;
  }
  samples.push(s);
  if (i % 3 === 0 || s.doubled || s.orphan) {
    console.log(
      `  t+${((i + 1) * 20).toString().padStart(4)}s  lignes=${s.rows} trad=${s.translations} ` +
        `double=${s.doubled} orphelin=${s.orphan} err=${s.errors} tas=${s.heapMB}Mo`,
    );
  }
  if (s.translations > s.rows) {
    failures.push(`t+${(i + 1) * 20}s: ${s.translations} traductions pour ${s.rows} lignes`);
  }
  if (s.doubled > 0) failures.push(`t+${(i + 1) * 20}s: ${s.doubled} ligne(s) portant deux traductions`);
  if (s.orphan > 0) failures.push(`t+${(i + 1) * 20}s: ${s.orphan} traduction(s) sans texte source`);
}

// A session where nothing was ever translated proves nothing about recycling.
const peak = Math.max(0, ...samples.map((s) => s.translations));
if (peak === 0) failures.push('aucune traduction de toute la session, la sonde ne mesure rien');

const heaps = samples.map((s) => s.heapMB).filter((h) => h !== null);
if (heaps.length > 3) {
  const first = heaps[0];
  const last = heaps[heaps.length - 1];
  console.log(`tas : ${first}Mo -> ${last}Mo (max ${Math.max(...heaps)}Mo)`);
  // Kick itself grows a chat page, so this is a ceiling on runaway growth, not
  // a claim about our share of it.
  if (last > first * 3 && last - first > 150) {
    failures.push(`le tas a triple, ${first}Mo -> ${last}Mo`);
  }
}

await page.locator('#channel-chatroom').screenshot({ path: path.join(HERE, 'live-recycle.png') }).catch(() => {});
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

if (failures.length) {
  console.error();
  console.error(`live-recycle: ${failures.length} echec(s) sur ${best.channel}`);
  for (const f of [...new Set(failures)].slice(0, 10)) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(
  `live-recycle: OK - ${samples.length} releves sur ${best.channel}, pic de ${peak} traductions, aucun doublon ni orphelin.`,
);
