/**
 * Does the persistent profile actually carry a Kick session?
 *
 * live-profile.mjs --check answers this with `document.cookie` and a
 * `a[href*="/login"]` lookup. A session cookie worth having is HttpOnly, so
 * `document.cookie` cannot see it whether or not you are signed in: that probe
 * returns the same "false" for a signed-in profile and a blind one, and exits 0
 * either way. It reports a negative it is incapable of distinguishing from a
 * measurement that did not happen.
 *
 * This reads the cookie jar through the browser context, which does see
 * HttpOnly, and it runs the same probe against a throwaway profile that is
 * guaranteed signed out. Without that control the answer is unfalsifiable: two
 * numbers that differ prove the probe can tell the two states apart.
 *
 * Cookie VALUES are never read, printed, or written anywhere. Names, flags and
 * counts only.
 *
 *   node scratchpad/harness/session-check.mjs
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.join(HERE, 'profile-live');

async function probe(profileDir, label) {
  const ctx = await chromium.launchPersistentContext(profileDir, {
    // A persistent profile's Kick session did not survive a headless launch of
    // the same directory that a headed launch reads fine: headless reported 12
    // anonymous cookies where headed reads 15 including kick_session. Left as a
    // switch so the difference stays measurable rather than remembered.
    headless: !process.argv.includes('--headed'),
    viewport: { width: 1500, height: 950 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto('https://kick.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  // Names and flags only. A value never leaves the jar.
  const jar = await ctx.cookies(['https://kick.com']);
  const cookies = jar
    .map((c) => ({ nom: c.name, httpOnly: c.httpOnly, secure: c.secure, session: c.expires === -1 }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  // Unfiltered, so a session cookie parked on a sibling host (id.kick.com,
  // auth.kick.com) cannot hide behind the https://kick.com URL filter and be
  // read back as "no session".
  const tous = await ctx.cookies();
  const ailleurs = tous
    .filter((c) => /kick/i.test(c.domain) && !jar.some((j) => j.name === c.name && j.domain === c.domain))
    .map((c) => `${c.name}@${c.domain}`)
    .sort();

  const dom = await page.evaluate(() => {
    const txt = (document.body.innerText || '').toLowerCase();
    const hasLoginCta = /\blog in\b|\bsign up\b|\bse connecter\b/.test(txt);
    // A signed-in Kick header carries a link to the account's own pages.
    const accountLinks = document.querySelectorAll(
      'a[href*="/dashboard"], a[href*="/settings"], a[href*="/subscriptions"], button[aria-label*="ser" i]',
    ).length;
    return {
      ctaConnexion: hasLoginCta,
      liensCompte: accountLinks,
      titre: document.title.slice(0, 60),
      longueurTexte: txt.length,
    };
  });

  // The decisive test is not the jar, it is whether this profile can type in a
  // chat. Logged out Kick swaps the composer for a sign-in prompt, so the two
  // profiles must disagree here if the login took.
  const slug = await page.evaluate(() => {
    const skip = new Set(['browse', 'following', 'categories', 'category', 'search', 'login', 'signup', 'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions']);
    for (const a of document.querySelectorAll('a[href]')) {
      const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
      if (m && !skip.has(m[1].toLowerCase())) return m[1];
    }
    return null;
  });

  let chat = { chaine: null, note: 'aucune tuile de chaine trouvee' };
  if (slug) {
    await page.goto(`https://kick.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(12000);
    chat = await page.evaluate((s) => {
      const input = document.querySelector('[data-testid="chat-input"], .editor-input[role="textbox"]');
      const r = input?.getBoundingClientRect();
      const zone = document.getElementById('channel-chatroom');
      const txt = (zone?.innerText || '').toLowerCase();
      return {
        chaine: s,
        composerPresent: Boolean(input),
        composerEditable: input ? input.getAttribute('contenteditable') === 'true' : null,
        composerLargeur: r ? Math.round(r.width) : null,
        composerHauteur: r ? Math.round(r.height) : null,
        inviteConnexion: /log in to chat|se connecter pour|sign in to chat/.test(txt),
        boutonsBarre: zone ? zone.querySelectorAll('button').length : 0,
      };
    }, slug);
  }

  await ctx.close();
  return { label, cookies, ailleurs, dom, chat };
}

const vierge = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-vierge-'));

const a = await probe(LIVE, 'profil-live');
const b = await probe(vierge, 'profil-vierge (temoin)');
fs.rmSync(vierge, { recursive: true, force: true });

for (const r of [a, b]) {
  console.log(`\n--- ${r.label} ---`);
  console.log(`cookies kick.com : ${r.cookies.length}`);
  for (const c of r.cookies) {
    console.log(
      `   ${c.nom.padEnd(34)} httpOnly=${String(c.httpOnly).padEnd(5)} secure=${String(c.secure).padEnd(5)} ${c.session ? 'session' : 'persistant'}`,
    );
  }
  console.log(`cookies kick hors filtre : ${r.ailleurs.length ? r.ailleurs.join(', ') : 'aucun'}`);
  console.log(`dom  : ${JSON.stringify(r.dom)}`);
  console.log(`chat : ${JSON.stringify(r.chat)}`);
}

// The witness. If the signed-in profile and a virgin one look identical, this
// probe has not measured a signed-out profile -- it has failed to measure.
const memesCookies =
  a.cookies.length === b.cookies.length &&
  a.cookies.every((c, i) => c.nom === b.cookies[i]?.nom);
const memeDom = a.dom.ctaConnexion === b.dom.ctaConnexion && a.dom.liensCompte === b.dom.liensCompte;
const memeChat =
  a.chat.composerPresent === b.chat.composerPresent &&
  a.chat.composerEditable === b.chat.composerEditable &&
  a.chat.inviteConnexion === b.chat.inviteConnexion;

console.log('\n--- verdict ---');
console.log(`ecart cookies : ${memesCookies ? 'AUCUN' : a.cookies.length + ' vs ' + b.cookies.length}`);
console.log(`ecart dom     : ${memeDom ? 'AUCUN' : JSON.stringify({ live: a.dom, vierge: b.dom })}`);
console.log(`ecart chat    : ${memeChat ? 'AUCUN' : JSON.stringify({ live: a.chat, vierge: b.chat })}`);
console.log(
  `\nsession utilisable pour le composer : ${!memeChat && a.chat.composerEditable === true ? 'OUI' : 'NON'}`,
);

if (memesCookies && memeDom && memeChat) {
  console.error();
  console.error('session-check: le profil est indiscernable d un profil neuf.');
  console.error('  Soit la connexion n a pas ete enregistree, soit la sonde est aveugle.');
  console.error('  Les deux cotes du temoin sont identiques, donc ce resultat ne tranche pas.');
  process.exit(1);
}
console.log('\nsession-check: le profil differe du temoin, la sonde discrimine.');
