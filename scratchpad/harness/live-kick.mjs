/**
 * The extension, loaded into a real browser, on a real kick.com channel.
 *
 * Every other gate here mounts the real modules against a Kick-SHAPED DOM. That
 * is strong evidence and it is not the same thing, and the difference cost a
 * real defect: the chip anchored above the message box on the live site while
 * chip-live stayed green, because Kick collapses the action bar's left group to
 * height zero on a followers-only channel and the harness had given it two
 * visible children.
 *
 * Notes that took a while to learn:
 *
 *   - `--load-extension` is ignored by Chrome 137 and later. Playwright's
 *     bundled Chromium still honours it, so no `channel: 'chrome'` here.
 *   - The MV3 service worker is lazy. It starts when the content script first
 *     messages it, so a kick.com page has to be opened BEFORE the extension id
 *     can be read, or the id comes back null.
 *   - The channel is discovered from the directory, never named here.
 *
 *   node scratchpad/harness/live-kick.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-live-'));

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
          !/^\/(browse|following|categories|search|about|help|login|signup|clips|home|subscriptions)$/.test(
            h,
          ),
      ),
  ),
]);

let live = null;
for (const c of channels.slice(0, 6)) {
  await page.goto('https://kick.com' + c, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(10000);
  const n = await page.evaluate(() => document.querySelectorAll('#channel-chatroom [data-index]').length);
  if (n > 5) {
    live = c;
    break;
  }
}
if (!live) {
  console.error('live-kick: aucune chaine avec du chat rendu, la sonde ne mesure rien');
  await ctx.close();
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(1);
}
await page.waitForTimeout(8000);

const chat = await page.evaluate(() => {
  const chip = document.getElementById('kt-lang-chip');
  const host = chip?.closest('.kt-chip-host');
  const field = document.querySelector('#channel-chatroom [contenteditable="true"]');
  const bar = document.getElementById('kt-floating-bar');
  const doc = document.documentElement;
  return {
    channel: location.pathname,
    stamp: doc.getAttribute('data-kt-scheme'),
    bar: bar?.querySelector('.kt-float-label')?.textContent?.trim() ?? null,
    barHeight: bar ? +bar.getBoundingClientRect().height.toFixed(0) : null,
    chipBelowField:
      chip && field
        ? chip.getBoundingClientRect().top >= field.getBoundingClientRect().bottom - 1
        : null,
    chipHeadsCluster: host ? host.parentElement?.firstElementChild === host : null,
    caret: Boolean(chip?.querySelector('.kt-chip-caret')),
    lines: document.querySelectorAll('#channel-chatroom [data-index]').length,
    hoverLabels: document.querySelectorAll('.kt-hover-placeholder').length,
    overflows: doc.scrollWidth > doc.clientWidth,
  };
});
console.log('chat :', JSON.stringify(chat));

if (chat.stamp !== 'dark') failures.push(`tampon de theme ${chat.stamp}, attendu dark`);
if (chat.bar !== 'Translating') failures.push(`barre "${chat.bar}", attendu "Translating"`);
if (chat.barHeight > 44) failures.push(`barre sur plusieurs lignes, ${chat.barHeight}px`);
if (chat.chipBelowField !== true) failures.push('la puce n est pas sous le champ de saisie');
if (chat.chipHeadsCluster !== true) failures.push('la puce n ouvre pas le cluster d action');
if (!chat.caret) failures.push('la puce n a pas de chevron');
if (chat.hoverLabels > 0) failures.push(`${chat.hoverLabels} libelle(s) de survol sous les messages`);
if (chat.overflows) failures.push('la page kick deborde horizontalement');

/**
 * Force a target the chat is not written in, so the pipeline actually runs.
 *
 * A pass on an English chat translating to English reports zero translations
 * and zero errors, which reads like success and proves nothing: every line was
 * correctly skipped.
 */
const translated = await page.evaluate(async () => {
  const select = document.querySelector('#kt-floating-bar .kt-float-lang');
  if (!select) return { error: 'pas de selecteur dans la barre' };
  select.value = 'fr';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20000));
  const nodes = [...document.querySelectorAll('.kt-translation, .kt-translation-inline, .kt-translation-replace')];
  return {
    target: select.value,
    count: nodes.length,
    errors: document.querySelectorAll('.kt-error').length,
    sample: nodes.slice(0, 3).map((n) => n.textContent.trim().slice(0, 48)),
  };
});
console.log('traduction :', JSON.stringify(translated));
if (translated.error) failures.push(translated.error);
else if (translated.count === 0) {
  failures.push('aucune traduction rendue apres passage de la cible en francais');
}

await page.locator('#channel-chatroom').screenshot({ path: path.join(HERE, 'live-chat.png') }).catch(() => {});

// The options page, in the real extension rather than a snapshot. The worker is
// awake by now, which is the only reason its id can be read.
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null));
const id = sw ? sw.url().split('/')[2] : null;
if (!id) failures.push('service worker jamais demarre');
else {
  const o = await ctx.newPage();
  await o.goto(`chrome-extension://${id}/src/options/index.html`);
  await o.waitForTimeout(2200);
  const opts = await o.evaluate(async () => {
    const tabs = [...document.querySelectorAll('[role=tab]')];
    tabs.find((x) => x.textContent.trim() === 'Display')?.click();
    await new Promise((r) => setTimeout(r, 800));
    const cards = [...document.querySelectorAll('main button')].filter(
      (b) => b.querySelector('div') && /Below|Inline|Replace|hover/i.test(b.textContent),
    );
    return {
      header: document.querySelector('header p')?.textContent?.trim(),
      tabs: tabs.length,
      cards: cards.length,
    };
  });
  console.log('options :', JSON.stringify(opts));
  const version = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8')).version;
  if (!opts.header?.includes(version)) failures.push(`en-tete "${opts.header}", attendu ${version}`);
  if (opts.tabs !== 6) failures.push(`${opts.tabs} onglets, attendu 6`);
  if (opts.cards !== 4) failures.push(`${opts.cards} cartes de style, attendu 4`);
  await o.screenshot({ path: path.join(HERE, 'live-options.png') });
  await o.close();
}

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

if (failures.length) {
  console.error();
  console.error(`live-kick: ${failures.length} echec(s) sur ${chat.channel}`);
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(`live-kick: OK - verifie sur ${chat.channel}, extension chargee dans un vrai Chromium.`);
