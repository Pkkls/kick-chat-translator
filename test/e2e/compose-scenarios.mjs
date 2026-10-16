/**
 * The compose scenarios, played on live Kick by a machine instead of by hand.
 *
 * The 3.3.0 Tab and emote work was checked by replaying S1, S2, T1..T12 one
 * keystroke at a time through a remote browser after every rebuild: some 220
 * round trips for one feature. This plays the same matrix in one command and
 * prints N/N.
 *
 * It can never post. The profile is thrown away and signed out, and the run
 * stops if any Kick auth cookie shows up: Kick lets a signed-out visitor type
 * and only asks for an account on send (session-check.mjs). On top of that,
 * Enter is refused by the keyboard wrapper below, Shift+Enter aside.
 *
 * Phrases are drawn fresh each run (the translation cache fakes a repeat), and
 * results are judged on structure (emote kept, text changed, preview closed),
 * never on exact wording, which the engine is free to change.
 *
 *   npm run build && node test/e2e/compose-scenarios.mjs [--only T2,S1] [--headless] [--compte scratchpad/kick-cookies.json]
 *
 * Exit 0 = all green, 1 = a scenario failed, 2 = the page or the extension
 * never came up (environment, not a verdict on the code).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const argv = process.argv.slice(2);
const only = argv.includes('--only') ? new Set(argv[argv.indexOf('--only') + 1].split(',')) : null;

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error(`compose-scenarios: pas de build dans ${EXT}. Lance npm run build.`);
  process.exit(2);
}

// French into an English chat, so the pipeline has work. One phrase per use:
// a repeat would come back from the cache and hide a broken request path.
const SUJETS = ['le streamer', 'mon chat', 'ce jeu', 'la musique', 'mon frere', 'cette partie', 'le chat ici', 'ma soeur'];
const VERBES = ['est vraiment', 'me semble', 'devient', 'reste toujours', 'parait'];
const FINS = ['incroyable ce soir', 'trop drole aujourd hui', 'tres calme maintenant', 'genial depuis le debut', 'bizarre cette semaine'];
const pris = new Set();
function phrase() {
  for (;;) {
    const p = [SUJETS, VERBES, FINS].map((l) => l[Math.floor(Math.random() * l.length)]).join(' ');
    if (!pris.has(p)) return pris.add(p), p;
  }
}

const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-scenarios-'));
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: argv.includes('--headless'),
  viewport: { width: 1500, height: 950 },
  // --mute-audio: every run lands on a live stream, and kil hears it otherwise.
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--mute-audio', '--no-first-run', '--no-default-browser-check'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

// ponytail: Enter is the one key that can post, so it does not exist here.
const press = page.keyboard.press.bind(page.keyboard);
page.keyboard.press = (key, o) => {
  if (/(^|\+)(Enter|NumpadEnter)$/.test(key) && !/^Shift\+Enter$/.test(key)) throw new Error(`touche refusee : ${key}`);
  return press(key, o);
};

async function fin(code, msg) {
  if (msg) console.error(msg);
  await ctx.close().catch(() => {});
  fs.rmSync(PROFILE, { recursive: true, force: true });
  process.exit(code);
}

// --compte <cookies.json> : kil's own session, exported from the browser and
// kept in scratchpad/ (git-ignored). Signed in, a stray Enter would post, so
// the Enter guard above is then the only thing between a test and the chat.
const compte = argv.includes('--compte') ? argv[argv.indexOf('--compte') + 1] : null;
if (compte) {
  const SAME = { no_restriction: 'None', lax: 'Lax', strict: 'Strict' };
  await ctx.addCookies(
    JSON.parse(fs.readFileSync(compte, 'utf8')).map((c) => ({
      name: c.name, value: c.value, domain: c.domain, path: c.path ?? '/', secure: !!c.secure, httpOnly: !!c.httpOnly,
      sameSite: SAME[c.sameSite] ?? 'Lax', ...(c.expirationDate ? { expires: Math.floor(c.expirationDate) } : {}),
    })),
  );
}

await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);
// Kick's own pages share the /<word> shape with channels (/events broke the
// first pick), so candidates are tried until one has a chat composer.
const candidats = await page.evaluate(() => {
  const skip = new Set(['browse', 'following', 'categories', 'category', 'search', 'login', 'signup', 'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions', 'events']);
  const vus = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
    if (m && !skip.has(m[1].toLowerCase())) vus.add(m[1]);
  }
  return [...vus].slice(0, 5);
});
const composer = page.locator('[data-testid="chat-input"], .editor-input[role="textbox"]').first();
let slug = null;
for (const c of candidats) {
  await page.goto(`https://kick.com/${c}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (await composer.waitFor({ timeout: 20000 }).then(() => true, () => false)) {
    slug = c;
    break;
  }
}
if (!slug) await fin(2, `ENV: aucun composer sur ${candidats.join(', ') || '(aucune chaine sur /browse)'}.`);

const auth = (await ctx.cookies()).filter((c) => /kick/i.test(c.domain) && /session|token|auth|remember/i.test(c.name));
if (auth.length && !compte) await fin(2, `ENV: cookie d auth Kick present (${auth.map((c) => c.name).join(', ')}) sans --compte, arret.`);
if (compte && !auth.length) await fin(2, 'ENV: --compte donne mais aucune session Kick n a suivi.');
const monte = await page.waitForFunction(() => document.getElementById('kt-compose-bar') !== null, null, { timeout: 30000 }).then(() => true, () => false);
if (!monte) await fin(2, 'ENV: le content script n a jamais cree #kt-compose-bar.');
await page.waitForTimeout(3000);

// ---- reading the page ------------------------------------------------------

/** The composer as Lexical holds it: emotes as [e:name], mentions as [m:name]. */
const lire = () =>
  page.evaluate(() => {
    const el = document.querySelector('[data-lexical-editor="true"]');
    const ed = el?.__lexicalEditor;
    if (!ed) return el?.innerText ?? '';
    const out = [];
    const walk = (n) => {
      if (n.type === 'text' || n.type === 'zeroWidth') out.push(n.text ?? '');
      else if (n.type === 'linebreak') out.push('\n');
      else if (n.type === 'custom-emote') out.push(`[e:${n.emote?.name ?? n.name ?? n.text ?? '?'}]`);
      else if (n.type === 'custom-mention') out.push(`[m:${n.text ?? n.username ?? '?'}]`);
      if (n.children) {
        n.children.forEach(walk);
        if (n.type === 'paragraph') out.push('\n');
      }
    };
    walk(ed.getEditorState().toJSON().root);
    return out.join('').replace(/\u200b/g, '').replace(/\n+$/, '');
  });
const etat = () => page.evaluate(() => document.getElementById('kt-compose-bar')?.dataset.state ?? 'absent');
const pret = (ms = 20000) =>
  page.waitForFunction(() => document.getElementById('kt-compose-bar')?.dataset.state === 'ready', null, { timeout: ms }).then(() => true, () => false);
const ferme = (ms = 4000) =>
  page.waitForFunction(() => (document.getElementById('kt-compose-bar')?.dataset.state ?? 'hidden') === 'hidden', null, { timeout: ms }).then(() => true, () => false);
const suggestion = (ms = 4000) =>
  page
    .waitForFunction(
      () => ['chat-emote-suggestion-panel', 'chat-mention-panel'].some((id) => (document.getElementById(id)?.getBoundingClientRect().height ?? 0) > 0),
      null,
      { timeout: ms },
    )
    .then(() => true, () => false);

async function vider() {
  await composer.click();
  await press('Control+a');
  await press('Backspace');
  await ferme(3000);
}
const taper = (t) => page.keyboard.type(t, { delay: 25 });

/** Kick's own `:emote` completion, the thing several scenarios stand on. */
async function emote() {
  await taper(' :pe');
  if (!(await suggestion())) throw new Env('le panneau d emotes de Kick ne s ouvre pas sur :pe');
  await press('Tab');
  await page.waitForTimeout(300);
  await taper(' ');
}

class Env extends Error {}
const check = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
const nb = (s, re) => (s.match(re) ?? []).length;

// ---- the matrix ------------------------------------------------------------

const MENTION = slug.slice(0, 3);
const SCENARIOS = [
  ['S1', 'emote :pe + Tab : Kick complete, on ne traduit rien', async () => {
    await taper('salut');
    await emote();
    const t = await lire();
    check(nb(t, /\[e:/g) === 1 && t.startsWith('salut'), `attendu "salut [e:..]", lu ${JSON.stringify(t)}`);
  }],
  ['S2', `@${MENTION} + Tab : Kick complete la mention`, async () => {
    await taper(`@${MENTION}`);
    if (!(await suggestion())) throw new Env(`pas de panneau de mention pour @${MENTION}`);
    await press('Tab');
    await page.waitForTimeout(300);
    const t = await lire();
    check(t.length > MENTION.length + 1 && t.toLowerCase().includes(MENTION.toLowerCase()), `mention non completee : ${JSON.stringify(t)}`);
  }],
  ['T1', 'phrase + Tab : remplacee par la traduction', async () => {
    const p = phrase();
    await taper(p);
    check(await pret(), `apercu jamais pret (etat ${await etat()})`);
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    const t = await lire();
    check(t && t !== p, `texte non remplace : ${JSON.stringify(t)}`);
  }],
  ['T2', 'emote + phrase + Tab : emote gardee', async () => {
    await emote();
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    const t = await lire();
    check(nb(t, /\[e:/g) === 1, `emote perdue : ${JSON.stringify(t)}`);
    check(!t.includes(p), `phrase non traduite : ${JSON.stringify(t)}`);
  }],
  ['T3', 'texte + emote + texte + Tab : emote du milieu gardee', async () => {
    const a = phrase(), b = phrase();
    await taper(a);
    await emote();
    await taper(b);
    check(await pret(), 'apercu jamais pret');
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    // Where the emote lands is the engine's call (composeLogic: it reorders
    // words), so only its survival is checked, not its place.
    const t = await lire();
    check(nb(t, /\[e:/g) === 1, `emote perdue : ${JSON.stringify(t)}`);
    check(!t.includes(a) && !t.includes(b), `un morceau non traduit : ${JSON.stringify(t)}`);
  }],
  ['T4', 'effacer puis retaper : l apercu suit le nouveau texte', async () => {
    await taper(phrase());
    check(await pret(), 'premier apercu jamais pret');
    const avant = await page.evaluate(() => document.querySelector('#kt-compose-bar .kt-compose-text')?.textContent);
    await vider();
    await taper(phrase());
    check(await pret(), 'second apercu jamais pret');
    await page.waitForTimeout(600);
    const apres = await page.evaluate(() => document.querySelector('#kt-compose-bar .kt-compose-text')?.textContent);
    check(apres && apres !== avant, `apercu perime : ${JSON.stringify(apres)}`);
  }],
  ['T5', 'retour arriere jusqu au vide : apercu ferme', async () => {
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    for (let i = 0; i < p.length + 2; i++) await press('Backspace');
    check((await lire()) === '', 'composer pas vide');
    check(await ferme(), `apercu reste ouvert sur un composer vide (etat ${await etat()})`);
  }],
  ['T6', 'Echap : apercu ferme, texte intact', async () => {
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    await press('Escape');
    check(await ferme(), 'apercu reste ouvert apres Echap');
    check((await lire()) === p, `texte modifie par Echap : ${JSON.stringify(await lire())}`);
  }],
  ['T7', 'Tab sans apercu (anglais vers anglais) : rien ne change', async () => {
    const p = 'this stream is really fun tonight';
    await taper(p);
    await page.waitForTimeout(2500);
    await press('Tab');
    await page.waitForTimeout(500);
    check((await lire()) === p, `texte modifie : ${JSON.stringify(await lire())}`);
  }],
  ['T8', 'Ctrl+Z apres Tab : texte d origine rendu', async () => {
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    check((await lire()) !== p, 'Tab n a rien remplace');
    await press('Control+z');
    await page.waitForTimeout(500);
    check((await lire()) === p, `Ctrl+Z rend ${JSON.stringify(await lire())}`);
  }],
  ['T9', 'Shift+Tab : jamais d insertion', async () => {
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    await press('Shift+Tab');
    await page.waitForTimeout(500);
    check((await lire()) === p, `Shift+Tab a modifie le texte : ${JSON.stringify(await lire())}`);
  }],
  ['T10', `@${MENTION} + emote + phrase + Tab : mention et emote gardees`, async () => {
    await taper(`@${MENTION}`);
    if (!(await suggestion())) throw new Env(`pas de panneau de mention pour @${MENTION}`);
    await press('Tab');
    await page.waitForTimeout(300);
    const nom = (await lire()).trim().replace(/^\[m:|\]$/g, '').replace(/^@/, '');
    await emote();
    const p = phrase();
    await taper(p);
    check(await pret(), 'apercu jamais pret');
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    const t = await lire();
    check(nb(t, /\[e:/g) === 1, `emote perdue : ${JSON.stringify(t)}`);
    check(t.toLowerCase().split(nom.toLowerCase()).length === 2, `mention perdue ou doublee (${nom}) : ${JSON.stringify(t)}`);
  }],
  ['T11', 'deux lignes + Tab : un seul saut de ligne', async () => {
    await taper(phrase());
    await press('Shift+Enter');
    await taper(phrase());
    check(await pret(), 'apercu jamais pret');
    await press('Tab');
    check(await ferme(), 'apercu reste ouvert apres Tab');
    const t = await lire();
    check(nb(t, /\n/g) === 1, `attendu 1 saut de ligne, lu ${JSON.stringify(t)}`);
  }],
];

// ---- run -------------------------------------------------------------------

const res = { ok: 0, ko: 0, env: 0 };
const t0 = Date.now();
for (const [id, nom, fn] of SCENARIOS) {
  if (only && !only.has(id)) continue;
  const t = Date.now();
  let verdict = 'ok ';
  let detail = '';
  try {
    await vider();
    await fn();
    // Kick's markup typed out as words is never right, whatever the scenario.
    const fuite = (await lire()).match(/\[emote:\d+:[^\]]*\]/);
    check(!fuite, `balise emote en texte brut : ${fuite?.[0]}`);
    res.ok++;
  } catch (e) {
    verdict = e instanceof Env ? 'ENV' : 'KO ';
    detail = `\n       ${e.message}`;
    e instanceof Env ? res.env++ : res.ko++;
  }
  console.log(`${verdict}  ${id.padEnd(4)} ${nom}  ${((Date.now() - t) / 1000).toFixed(1)}s${detail}`);
}
await vider().catch(() => {});
const total = res.ok + res.ko + res.env;
console.log(`\n${res.ok}/${total} scenarios verts | ${res.ko} KO | ${res.env} ENV | chaine ${slug} | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await fin(res.ko ? 1 : res.env ? 2 : 0);
