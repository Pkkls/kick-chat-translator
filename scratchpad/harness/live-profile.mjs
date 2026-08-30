/**
 * Opens a PERSISTENT Chromium profile with the extension loaded, and waits.
 *
 * Two things need credentials that must not pass through a script: a Kick
 * login, and the DeepL key. Both are typed once, by hand, into this window.
 * Everything after that reuses the profile and never reads either.
 *
 * Usage:
 *
 *   node scratchpad/harness/live-profile.mjs
 *       Opens the window and holds it open. Sign in to Kick if you want the
 *       composer tests, paste the DeepL key into the extension's options if you
 *       want the DeepL tests, then close the window.
 *
 *   node scratchpad/harness/live-profile.mjs --check
 *       Reports what the profile now carries, WITHOUT printing any secret: the
 *       presence of a Kick session, and whether a DeepL key is set and how it
 *       reads back from DeepL's own usage endpoint.
 *
 * The profile lives beside the harness and is gitignored with the rest of
 * scratchpad. Delete the directory to reset it.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
export const PROFILE = path.join(HERE, 'profile-live');
fs.mkdirSync(PROFILE, { recursive: true });

const check = process.argv.includes('--check');

/**
 * Whether the jar carries a Kick sign-in, read through the browser context.
 *
 * The previous version of this asked `document.cookie` and looked for an
 * `a[href*="/login"]`. A session cookie worth the name is HttpOnly, so
 * `document.cookie` cannot see it whether or not you are signed in: that probe
 * answered "not signed in" to a signed-in profile and a blind one alike, and
 * exited 0 in both cases. Measured against a throwaway profile
 * (session-check.mjs): signed out, kick.com sets 10 cookies, none of them auth.
 *
 * Names and flags only. A cookie value is never read or printed.
 */
async function lireSession(context) {
  const jar = await context.cookies();
  const kick = jar.filter((c) => /kick/i.test(c.domain));
  const auth = kick.filter((c) => /session|token|auth|remember|xsrf|csrf/i.test(c.name));
  return {
    cookiesKick: kick.length,
    noms: kick.map((c) => c.name).sort(),
    cookiesAuth: auth.map((c) => c.name),
    connecte: auth.length > 0,
  };
}

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1500, height: 950 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

const sw =
  ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null));
const id = sw ? sw.url().split('/')[2] : null;

if (!check) {
  if (id) {
    const opts = await ctx.newPage();
    await opts.goto(`chrome-extension://${id}/src/options/index.html`);
  }
  console.log('Fenetre ouverte. A faire a la main, puis fermer la fenetre :');
  console.log('  - se connecter a Kick, si tu veux les tests du panneau de composition');
  console.log("  - coller la cle DeepL dans l'onglet Providers, si tu veux les tests DeepL");
  console.log(`  profil : ${PROFILE}`);

  // The jar cannot be read once the context is gone, and "I closed the window"
  // used to be the only evidence the sign-in took. Poll while it is open and
  // say out loud, in the terminal, the moment an auth cookie appears -- so the
  // window is never closed on a login that silently did not complete.
  let dernier = { cookiesKick: 0, noms: [], cookiesAuth: [], connecte: false };
  let annonce = false;
  const ferme = new Promise((resolve) => ctx.on('close', resolve));
  const sonde = setInterval(async () => {
    try {
      dernier = await lireSession(ctx);
      if (dernier.connecte && !annonce) {
        annonce = true;
        console.log(`  -> connexion detectee (${dernier.cookiesAuth.join(', ')}). Tu peux fermer la fenetre.`);
      }
    } catch {
      // Context on its way out; the last good snapshot is the one that counts.
    }
  }, 4000);

  await ferme;
  clearInterval(sonde);
  console.log('Fenetre fermee, profil enregistre.');
  console.log('kick   :', JSON.stringify(dernier));
  if (!dernier.connecte) {
    console.error();
    console.error('ATTENTION : aucun cookie d authentification Kick dans le profil.');
    console.error(`  ${dernier.cookiesKick} cookies kick.com, tous anonymes : ${dernier.noms.join(', ')}`);
    console.error('  Le profil est utilisable pour tout ce qui ne demande pas de compte,');
    console.error('  pas pour le selecteur d emotes ni une chaine abonnes-seulement.');
    process.exit(1);
  }
} else {
  const kick = await lireSession(ctx);
  console.log('kick   :', JSON.stringify(kick));

  let deepl = { configure: false };
  if (id) {
    const o = await ctx.newPage();
    await o.goto(`chrome-extension://${id}/src/options/index.html`);
    await o.waitForTimeout(2000);
    deepl = await o.evaluate(async () => {
      const stored = await chrome.storage.sync.get(null);
      const key = Object.keys(stored).find((k) => k.includes('settings'));
      const value = key ? stored[key]?.deeplApiKey : '';
      // Length and shape only, so nothing secret reaches a log.
      return {
        configure: Boolean(value),
        longueur: value ? value.length : 0,
        finitEnFx: value ? value.endsWith(':fx') : null,
        plan: key ? stored[key]?.deeplPlan : null,
      };
    });
    await o.close();
  }
  console.log('deepl  :', JSON.stringify(deepl));
  console.log(
    deepl.configure
      ? 'Pret pour les tests DeepL.'
      : "Pas de cle DeepL dans le profil. Relance sans --check et colle-la a la main.",
  );
  await ctx.close();
}
