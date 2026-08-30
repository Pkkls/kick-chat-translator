/**
 * The five Chrome Web Store screenshots, taken from the shipping build.
 *
 * The listing currently shows the interface from before the redesign, and
 * screenshots/ holds one image dated 2026-08-16. These are captured from
 * dist/, on a live channel, at the 1280x800 the store asks for.
 *
 *   node scratchpad/harness/store-shots.mjs
 *
 * Written to scratchpad/harness/store/ as 01..05. No channel name is written
 * down: the first live tile on /browse is followed, and the shots are checked
 * for the thing they are supposed to show before they count as taken.
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const OUT = path.join(HERE, 'store');
fs.mkdirSync(OUT, { recursive: true });

// Exactly what the store accepts. deviceScaleFactor stays 1 so the PNG is
// 1280x800 pixels and not a 2x image the store will reject.
const W = 1280;
const H = 800;

const JETABLE = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-shots-'));
const ctx = await chromium.launchPersistentContext(JETABLE, {
  headless: false,
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-first-run', '--no-default-browser-check'],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

// The service worker is lazy; a kick.com page has to exist before its id can be
// read, which is what gives the options and popup URLs.
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }).catch(() => null));
const extId = sw ? sw.url().split('/')[2] : null;

// Not simply the first live tile. The first pass landed on an IRL camera
// stream whose chat, in frame, was commenting on the streamer's body -- fine
// for a geometry measurement, not something to put on a store page. Tiles are
// filtered on the category Kick prints under them: a game category means the
// picture is gameplay and the chat is about the game.
const candidats = await page.evaluate(() => {
  const eviter = /irl|just chatting|asmr|hot tub|pools|beaches|politics|slots|gambling|casino/i;
  const skip = new Set(['browse', 'following', 'categories', 'category', 'search', 'login', 'signup', 'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions']);
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
    if (!m || skip.has(m[1].toLowerCase())) continue;
    const tuile = a.closest('div,article,li') ?? a;
    if (eviter.test((tuile.textContent ?? '').slice(0, 200))) continue;
    if (!out.includes(m[1])) out.push(m[1]);
    if (out.length >= 6) break;
  }
  return out;
});
if (candidats.length === 0 || !extId) {
  console.error(`store-shots: ${candidats.length} chaine(s) candidate(s), extension=${extId}. Il faut les deux.`);
  await ctx.close();
  process.exit(1);
}

// Read into French, so an English chat actually produces visible translations.
// Left on the browser default, an English chat translated to English returns
// nothing and the screenshot shows a chat with no extension in it at all.
if (extId) {
  const cfg = await ctx.newPage();
  await cfg.goto(`chrome-extension://${extId}/src/options/index.html`);
  await cfg.waitForTimeout(2000);
  await cfg.evaluate(async () => {
    const KEY = 'kt.settings.v2';
    const cur = (await chrome.storage.sync.get(KEY))[KEY] ?? {};
    await chrome.storage.sync.set({ [KEY]: { ...cur, targetLang: 'fr', uiLang: 'en', displayStyle: 'below' } });
  });
  await cfg.close();
}

const adressesEnVue = () =>
  page.evaluate(() => {
    const vus = [];
    for (const el of document.querySelectorAll('a,p,span,div')) {
      if (el.children.length) continue;
      const t = (el.textContent ?? '').trim();
      if (!/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0) vus.push(t.slice(0, 60));
    }
    return vus;
  });

// A channel whose page puts a contact address on screen is not one to shoot: a
// store listing is not the place to republish somebody's email. Scrolling was
// tried first and did not move it -- the About block stayed in frame through
// eight passes -- so the constraint decides which channel gets used instead of
// how the frame is cropped.
let slug = null;
const rejets = [];
for (const c of candidats) {
  await page.goto(`https://kick.com/${c}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const vues = await adressesEnVue();
  if (vues.length === 0) {
    slug = c;
    break;
  }
  rejets.push(`${c} (${vues[0].slice(0, 34)})`);
}
if (!slug) {
  console.error(`store-shots: ${candidats.length} chaines essayees, toutes avec une adresse a l ecran.`);
  for (const r of rejets) console.error('  x ' + r);
  await ctx.close();
  process.exit(1);
}
if (rejets.length) console.log('chaines ecartees :', rejets.join(', '));

// Let the chat fill up before anything is measured or shot.
await page.waitForTimeout(14000);

// Nothing on this page gets clicked before the shots. Trying to collapse the
// pinned bot message matched a username instead and opened a profile card over
// the player: a click aimed at tidying the frame is a click that can put
// something else in it.
//
// The address check runs again here, not only at selection time: the page goes
// on loading after the channel is chosen.
const cadreOk = await adressesEnVue();

const notes = [];
const prendre = async (nom, verif) => {
  const ok = await page.evaluate(verif).catch(() => false);
  await page.screenshot({ path: path.join(OUT, `${nom}.png`) });
  notes.push({ nom, montre: ok });
  return ok;
};

// 01 — the chat doing its job. Verified by counting rendered translations, not
// by trusting that twenty seconds was enough: an empty chat screenshots just as
// cleanly as a working one.
await prendre('01-chat-traduit', () => document.querySelectorAll('.kt-translation, .kt-translation-inline, .kt-translation-replace').length >= 3);

// 02 — the language grid, the thing the current listing cannot show at all.
const chip = page.locator('.kt-chip').first();
if ((await chip.count()) > 0) {
  await chip.click({ force: true }).catch(() => undefined);
  await page.waitForTimeout(1200);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);
}
await prendre('02-langues', () => {
  const m = document.querySelector('.kt-chip-menu');
  return Boolean(m && !m.hidden && m.querySelectorAll('.kt-chip-row .kt-chip-iso span').length >= 30);
});
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 03 — the compose preview, above the chat box.
const composer = page.locator('[data-testid="chat-input"], .editor-input[role="textbox"]').first();
if ((await composer.count()) > 0) {
  await composer.click();
  await composer.type('bonjour tout le monde, comment allez vous', { delay: 28 });
  await page
    .waitForFunction(() => document.getElementById('kt-compose-bar')?.dataset.state === 'ready', null, { timeout: 25000 })
    .catch(() => undefined);
  await page.waitForTimeout(600);
}
await prendre('03-composition', () => {
  const p = document.getElementById('kt-compose-bar');
  return Boolean(p && p.dataset.state === 'ready' && (p.querySelector('.kt-compose-text')?.textContent ?? '').trim().length > 0);
});

// 04 — the settings, which is a full page and needs no staging.
const opt = await ctx.newPage();
await opt.setViewportSize({ width: W, height: H });
await opt.goto(`chrome-extension://${extId}/src/options/index.html`);
await opt.waitForTimeout(3000);
const optOk = await opt.evaluate(() => document.querySelectorAll('input,select,button').length > 20).catch(() => false);
await opt.screenshot({ path: path.join(OUT, '04-reglages.png') });
notes.push({ nom: '04-reglages', montre: optOk });
await opt.close();

// 05 — the popup. It is ~360px wide, so shooting it into a 1280x800 frame would
// be mostly empty background. Captured at its own size, then placed on a plain
// Kick-dark field at the store's size. No image library: the PNG goes back into
// a page as a data URI and that page is what gets shot.
const pop = await ctx.newPage();
await pop.setViewportSize({ width: 420, height: 640 });
await pop.goto(`chrome-extension://${extId}/src/popup/index.html`);
await pop.waitForTimeout(2500);
const popOk = await pop.evaluate(() => document.body.innerText.trim().length > 40).catch(() => false);
const brut = await pop.screenshot();
await pop.close();

const cadre = await ctx.newPage();
await cadre.setViewportSize({ width: W, height: H });
await cadre.setContent(
  `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;background:#0b0b0c;display:flex;align-items:center;justify-content:center">
     <img src="data:image/png;base64,${brut.toString('base64')}" style="border-radius:8px;outline:1px solid #6c6c6d">
   </body></html>`,
);
await cadre.waitForTimeout(500);
await cadre.screenshot({ path: path.join(OUT, '05-popup.png') });
notes.push({ nom: '05-popup', montre: popOk });
await cadre.close();

await ctx.close();
fs.rmSync(JETABLE, { recursive: true, force: true });

// Every file must exist AND be the size the store wants AND show its subject.
const ech = [];
for (const n of notes) {
  const f = path.join(OUT, `${n.nom}.png`);
  if (!fs.existsSync(f)) {
    ech.push(`${n.nom} : fichier absent`);
    continue;
  }
  const b = fs.readFileSync(f);
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  console.log(`${n.nom.padEnd(18)} ${w}x${h} ${String(Math.round(b.length / 1024)).padStart(4)}Ko  sujet visible: ${n.montre}`);
  if (w !== W || h !== H) ech.push(`${n.nom} : ${w}x${h}, le store veut ${W}x${H}`);
  if (!n.montre) ech.push(`${n.nom} : le sujet n est pas dans l image, capture inutilisable`);
}

if (cadreOk.length) {
  ech.push(`adresse e-mail visible dans le cadre : ${cadreOk.join(', ')}`);
}

console.log(`\nchaine : ${slug} | extension : ${extId}`);
if (ech.length) {
  console.error();
  console.error('store-shots: ' + ech.length + ' probleme(s)');
  for (const e of ech) console.error('  x ' + e);
  process.exit(1);
}
console.log('store-shots: 5/5 captures, 1280x800, sujet verifie sur chacune.');
