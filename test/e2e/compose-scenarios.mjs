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
 *   npm run build && node test/e2e/compose-scenarios.mjs [--compte scratchpad/kick-cookies.json] [--only T2,S1] [--chaine <slug>]
 *
 * --compte : a signed-in session (cookie export, kept git-ignored); without
 * it the emote and mention scenarios come out ENV, Kick only opens those
 * panels for an account. Headed only: headless, Kick serves no /browse.
 *
 * Exit 0 = all green (INSTABLE allowed, listed), 1 = a scenario failed twice,
 * 2 = ENV: the page, the extension or a Kick panel never came up (a verdict on
 * the environment, not on the code).
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
// type() presses Enter for a newline: same rule.
const type = page.keyboard.type.bind(page.keyboard);
page.keyboard.type = (t, o) => {
  if (/[\r\n]/.test(t)) throw new Error('saut de ligne refuse dans type(), utiliser Shift+Enter');
  return type(t, o);
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
if (compte && !fs.existsSync(compte)) await fin(2, `ENV: fichier de cookies introuvable : ${compte}`);
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
// A channel only counts if French typed there gets a preview: the scenarios
// assume a target that is not French (and T7 one that is English). A channel
// that fails this is the environment, not a regression.
const chaine = argv.includes('--chaine') ? [argv[argv.indexOf('--chaine') + 1]] : null;
let slug = null;
for (const c of chaine ?? candidats) {
  await page.goto(`https://kick.com/${c}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!(await composer.waitFor({ timeout: 20000 }).then(() => true, () => false))) continue;
  if (!(await page.waitForFunction(() => document.getElementById('kt-compose-bar') !== null, null, { timeout: 20000 }).then(() => true, () => false))) continue;
  await page.waitForTimeout(2000);
  await composer.click();
  await page.keyboard.type(phrase(), { delay: 20 });
  const ok = await page
    .waitForFunction(() => document.getElementById('kt-compose-bar')?.dataset.state === 'ready', null, { timeout: 20000 })
    .then(() => true, () => false);
  await press('Control+a');
  await press('Backspace');
  if (ok) {
    slug = c;
    break;
  }
}
if (!slug) await fin(2, `ENV: aucune chaine utilisable (composer + apercu) parmi ${(chaine ?? candidats).join(', ') || '(aucune sur /browse)'}.`);

// kick_session is Laravel's and anonymous visitors get one too (measured):
// only session_token, "<user id>|<token>", says someone is signed in.
const auth = (await ctx.cookies()).filter((c) => /kick/i.test(c.domain) && c.name === 'session_token' && /^\d+%7C|^\d+\|/.test(c.value));
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

// Kick suggests only people who chatted lately, the streamer included or not
// ("No mention results" for a slug prefix, measured): the prefix is read off
// the panel that a bare "@" opens, once per run.
let MENTION = null;
async function mention() {
  if (!MENTION) {
    await taper('@');
    await page.waitForTimeout(1500);
    const lignes = await page.evaluate(() => document.getElementById('chat-mention-panel')?.innerText.split('\n') ?? []);
    MENTION = lignes.map((l) => l.trim()).find((l) => /^[A-Za-z0-9_]{3,25}$/.test(l))?.slice(0, 3) ?? null;
    await press('Backspace');
    if (!MENTION) throw new Env(`aucun nom propose par le panneau de mentions (${JSON.stringify(lignes.slice(0, 3))})`);
  }
  await taper(`@${MENTION}`);
  if (!(await suggestion())) throw new Env(`pas de panneau de mention pour @${MENTION}`);
  const vide = await page.evaluate(() => /no mention results/i.test(document.getElementById('chat-mention-panel')?.innerText ?? ''));
  if (vide) throw new Env(`aucun resultat pour @${MENTION}`);
  await press('Tab');
  await page.waitForTimeout(300);
}
const SCENARIOS = [
  ['S1', 'emote :pe + Tab : Kick complete, on ne traduit rien', async () => {
    await taper('salut');
    await emote();
    const t = await lire();
    check(nb(t, /\[e:/g) === 1 && t.startsWith('salut'), `attendu "salut [e:..]", lu ${JSON.stringify(t)}`);
  }],
  ['S2', '@abc + Tab : Kick complete la mention', async () => {
    await mention();
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
    if ((await etat()) === 'ready') throw new Env('la cible n est pas l anglais sur cette chaine, T7 ne s applique pas');
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
  ['T10', '@abc + emote + phrase + Tab : mention et emote gardees', async () => {
    await mention();
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

async function jouer(fn) {
  await vider();
  await fn();
  // Kick's markup typed out as words is never right, whatever the scenario.
  const fuite = (await lire()).match(/\[emote:\d+:[^\]]*\]/);
  check(!fuite, `balise emote en texte brut : ${fuite?.[0]}`);
}

// A KO is played once more before it counts: live Kick and a free translation
// endpoint fail now and then (measured: T8 and T10 red then green on the next
// run). Red twice = KO, red then green = INSTABLE, shown but not failing, so a
// real intermittent bug stays visible without every run crying wolf.
const res = { ok: 0, ko: 0, env: 0, instable: 0 };
const t0 = Date.now();
for (const [id, nom, fn] of SCENARIOS) {
  if (only && !only.has(id)) continue;
  const t = Date.now();
  let verdict = 'ok ';
  let detail = '';
  try {
    await jouer(fn);
    res.ok++;
  } catch (e) {
    detail = `\n       ${e.message}`;
    if (e instanceof Env) {
      verdict = 'ENV';
      res.env++;
    } else {
      try {
        await jouer(fn);
        verdict = 'INS';
        res.instable++;
      } catch (e2) {
        verdict = 'KO ';
        detail += e2.message === e.message ? ' (x2)' : `\n       puis : ${e2.message}`;
        res.ko++;
      }
    }
  }
  console.log(`${verdict}  ${id.padEnd(4)} ${nom}  ${((Date.now() - t) / 1000).toFixed(1)}s${detail}`);
}
await vider().catch(() => {});
const total = res.ok + res.ko + res.env + res.instable;
console.log(
  `\n${res.ok}/${total} scenarios verts | ${res.ko} KO | ${res.instable} INSTABLE | ${res.env} ENV | chaine ${slug} | ${((Date.now() - t0) / 1000).toFixed(0)}s`,
);
await fin(res.ko ? 1 : res.env ? 2 : 0);
