/**
 * What Kick's chat column actually contains, read off a live channel.
 *
 * compose-live.mjs renders the panel against a DOM it wrote itself: a 340px
 * `#channel-chatroom` filled with `--surface: #171a1c`. Every number that
 * harness reports about separation is measured against that invented colour.
 * The panel is `position: fixed` over Kick's real chat, so the only fill that
 * matters is Kick's.
 *
 * This pass needs no session: the chat column and its colours render logged
 * out. It answers three things and asserts on all three, so a page that gave
 * up nothing cannot read as a pass:
 *   1. is `#channel-chatroom` (compose.ts:53) still the container's id
 *   2. what colour is really painted behind a fixed panel at the composer
 *   3. what sits in the composer area, and how tall it is
 *
 *   node scratchpad/harness/kick-dom-recon.mjs
 *
 * No channel name is written down anywhere: the first live tile on /browse is
 * followed, whichever it happens to be.
 */
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Headless by default so this never opens a second window next to the one
// live-profile.mjs holds for a hand-typed login. Kick fronts Kasada, so a
// headless run may be served a challenge instead of the page: that case exits
// non-zero with the served HTML dumped, it never reads as "no chat container".
// Pass --headed to retry in a real window.
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });

// Control for the page errors seen with the extension loaded: this run carries
// no extension, so anything thrown here is Kick's own.
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e).slice(0, 140)));

await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

// Follow the first live tile rather than naming a channel.
const slug = await page.evaluate(() => {
  const skip = new Set([
    'browse', 'following', 'categories', 'category', 'search', 'login', 'signup',
    'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions',
  ]);
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
    if (m && !skip.has(m[1].toLowerCase())) return m[1];
  }
  return null;
});

if (!slug) {
  console.error('recon: aucune tuile de chaine sur /browse. Page servie = challenge ou refonte.');
  writeFileSync(path.join(HERE, 'kick-dom-recon.html'), await page.content(), 'utf8');
  await page.screenshot({ path: path.join(HERE, 'kick-dom-recon-browse.png'), fullPage: false });
  await browser.close();
  process.exit(1);
}

await page.goto(`https://kick.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
// The chat mounts well after DOMContentLoaded and streams messages in.
await page.waitForTimeout(12000);

const facts = await page.evaluate(() => {
  const rgba = (v) => (v.match(/[\d.]+/g) ?? []).map(Number);
  const opaque = (v) => {
    const c = rgba(v);
    return c.length >= 3 && (c[3] === undefined || c[3] > 0);
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const tag = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? '#' + el.id : '') +
    (el.getAttribute('data-testid') ? '[testid=' + el.getAttribute('data-testid') + ']' : '') +
    (typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '');

  // 1. The id compose.ts hangs everything on.
  const byId = document.getElementById('channel-chatroom');

  // 2. Whatever really holds the chat, found by shape rather than by name: a
  //    tall narrow column on the right that contains many short text rows.
  const candidates = [];
  for (const el of document.querySelectorAll('div,section,aside,main')) {
    const r = el.getBoundingClientRect();
    if (r.width < 240 || r.width > 520) continue;
    if (r.height < 400) continue;
    if (r.right < innerWidth * 0.55) continue;
    candidates.push({
      sel: tag(el),
      ...box(el),
      fond: getComputedStyle(el).backgroundColor,
      enfants: el.children.length,
    });
  }
  candidates.sort((a, b) => b.h - a.h);

  // 3. The composer area. Logged out this is a sign-in prompt; the point is
  //    where it sits and what is painted behind it, not what it says.
  const editable = [...document.querySelectorAll('[contenteditable="true"],textarea,input[type=text]')]
    .map((el) => ({ sel: tag(el), ...box(el), role: el.getAttribute('role') }))
    .filter((e) => e.w > 60);

  // The first opaque fill walking up from a point just above the bottom of the
  // chat column: exactly what a fixed panel there would be measured against.
  const probeStack = (x, y) => {
    const stack = [];
    for (let el = document.elementFromPoint(x, y); el; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      stack.push({ sel: tag(el), fond: bg, opaque: opaque(bg) });
      if (opaque(bg) && stack.length > 1) break;
      if (stack.length > 8) break;
    }
    return stack;
  };

  // Every control in the chat column, named the way it really is. The compose
  // panel dodges an overlay it finds with guessed selectors; before deciding
  // whether the dodge works, the picker's own button has to be found by
  // something other than a guess.
  const zone = document.getElementById('channel-chatroom');
  const boutons = zone
    ? [...zone.querySelectorAll('button,[role="button"]')].map((b) => ({
        aria: b.getAttribute('aria-label'),
        testid: b.getAttribute('data-testid'),
        titre: b.getAttribute('title'),
        texte: (b.textContent || '').trim().slice(0, 20) || null,
        cls: typeof b.className === 'string' ? b.className.trim().split(/\s+/).slice(0, 2).join('.') : null,
        ...box(b),
      }))
    : [];

  const col = candidates[0];
  const point = col
    ? { x: col.x + Math.round(col.w / 2), y: col.y + col.h - 90 }
    : { x: Math.round(innerWidth * 0.85), y: innerHeight - 140 };

  return {
    url: location.pathname,
    viewport: { w: innerWidth, h: innerHeight },
    channelChatroomExiste: Boolean(byId),
    channelChatroom: byId ? { sel: tag(byId), ...box(byId), fond: getComputedStyle(byId).backgroundColor } : null,
    colonnes: candidates.slice(0, 5),
    editables: editable.slice(0, 5),
    pointSonde: point,
    pileDerriere: probeStack(point.x, point.y),
    boutons,
    racineFond: getComputedStyle(document.body).backgroundColor,
    themeAttr: document.documentElement.className.slice(0, 120),
  };
});

writeFileSync(path.join(HERE, 'kick-dom-recon.json'), JSON.stringify(facts, null, 2), 'utf8');
await page.screenshot({ path: path.join(HERE, 'kick-dom-recon.png') });
await browser.close();

console.log('chaine        :', facts.url, '| viewport', facts.viewport.w + 'x' + facts.viewport.h);
console.log('erreurs de page SANS extension :', erreurs.length, erreurs[0] ?? '');
console.log('#channel-chatroom present :', facts.channelChatroomExiste);
if (facts.channelChatroom) console.log('   ', JSON.stringify(facts.channelChatroom));
console.log('colonnes candidates :');
for (const c of facts.colonnes) console.log('   ', c.w + 'x' + c.h, c.fond.padEnd(24), c.sel.slice(0, 90));
console.log('editables :');
for (const e of facts.editables) console.log('   ', e.w + 'x' + e.h, 'role=' + e.role, e.sel.slice(0, 90));
console.log('pile derriere le panneau, a', JSON.stringify(facts.pointSonde), ':');
for (const s of facts.pileDerriere) console.log('   ', s.opaque ? 'OPAQUE' : '      ', s.fond.padEnd(24), s.sel.slice(0, 90));

// A probe that saw nothing must not read as good news.
const echecs = [];
if (facts.colonnes.length === 0) echecs.push('aucune colonne de chat de la bonne forme : page servie douteuse');
if (!facts.pileDerriere.some((s) => s.opaque)) echecs.push('aucun fond opaque derriere le point sonde : couleur non mesuree');
if (facts.editables.length === 0 && facts.channelChatroomExiste === false) {
  echecs.push('ni composer ni #channel-chatroom : rien de mesurable sur cette page');
}
if (echecs.length) {
  console.error();
  console.error('recon: ' + echecs.length + ' echec(s)');
  for (const e of echecs) console.error('  x ' + e);
  process.exit(1);
}
console.log();
console.log('recon: colonne trouvee, fond opaque mesure.');
