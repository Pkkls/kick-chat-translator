/**
 * Kick a-t-il un routeur cote client, et peut-on le declencher SANS session ?
 *
 * Ce qui manque a tout le reste : le chemin d'un kick.com connecte, ou la barre
 * laterale fait tres probablement une route d'application au lieu d'un
 * chargement. Anonyme, le clic sur un lien de chaine donne un rechargement
 * complet, mesure deux fois.
 *
 * Mais un rechargement sur un lien ne prouve pas l'ABSENCE de routeur : il peut
 * prouver que ce lien-la est hors de sa portee. Si le site embarque un routeur,
 * on peut lui demander de naviguer directement, et on obtient la forme SPA sans
 * jamais se connecter ni entrer quoi que ce soit.
 *
 * Trois choses sont cherchees, dans cet ordre :
 *   1. les marqueurs de framework (Next, Nuxt, SvelteKit, Remix, Inertia)
 *   2. un objet routeur atteignable depuis la page
 *   3. ce que fait le DOM quand l'URL change SANS rechargement
 *
 * Le 3 est le vrai test et il ne demande aucun routeur : on pousse l'URL et on
 * regarde si l'application reagit. Si elle ne reagit pas, la page anonyme n'a pas
 * de routeur du tout, ce qui est deja une reponse.
 *
 *   node scratchpad/harness/nav-routeur.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');
const binaire = process.env.KT_BROWSER;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-rout-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  ...(binaire ? { executablePath: binaire } : {}),
  viewport: { width: 1400, height: 900 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
let rechargements = 0;
page.on('framenavigated', (f) => {
  if (f === page.mainFrame()) rechargements += 1;
});

async function fin(code, message) {
  console.log(message);
  await ctx.close().catch(() => {});
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(code);
}

try {
  await page.goto('https://kick.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
} catch (e) {
  await fin(2, `PREREQUIS: kick.com injoignable (${String(e.message).slice(0, 70)}).`);
}
await page.waitForTimeout(5000);

const liens = await page.evaluate(() => {
  const reserve = new Set(['browse', 'categories', 'category', 'following', 'subscriptions',
    'help', 'about', 'tos', 'privacy', 'search', 'clips', 'videos', 'wallet', 'dashboard', 'settings']);
  const vus = new Set();
  for (const a of document.querySelectorAll('a[href^="/"]')) {
    const p = a.getAttribute('href').split('/').filter(Boolean);
    if (p.length === 1 && !reserve.has(p[0].toLowerCase())) vus.add('/' + p[0]);
    if (vus.size >= 3) break;
  }
  return [...vus];
});
if (liens.length < 2) await fin(2, 'PREREQUIS: pas assez de liens de chaine, le site ne se laisse pas lire.');

await page.goto('https://kick.com' + liens[0], { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(9000);

// ── 1 et 2 : quel framework, quel routeur ──────────────────────────────────
const empreintes = await page.evaluate(() => {
  const w = window;
  return {
    next: !!document.getElementById('__NEXT_DATA__') || !!w.next || !!w.__NEXT_DATA__,
    nextRouter: !!w.next?.router,
    nuxt: !!w.__NUXT__ || !!w.$nuxt,
    sveltekit: !!document.querySelector('[data-sveltekit-preload-data]') || !!w.__sveltekit,
    remix: !!w.__remixContext,
    inertia: !!document.querySelector('[data-page]'),
    // La marque la plus generale : un routeur, quel qu'il soit, remplace
    // `history.pushState` par le sien dans le monde principal.
    pushStatePatche: !String(history.pushState).includes('[native code]'),
    racines: [...document.querySelectorAll('[id^="__"], #app, #root')].map((e) => e.id).slice(0, 6),
  };
});

const avant = await page.evaluate(() => ({
  present: !!document.querySelector('#channel-chatroom'),
  rangees: document.querySelectorAll('#channel-chatroom [data-index]').length,
  barre: !!document.querySelector('#kt-floating-bar'),
}));
if (!avant.present) await fin(2, 'PREREQUIS: pas de chat sur la page de chaine.');

// ── 3 : le vrai test. L'URL change sans rechargement : l'app reagit-elle ? ──
// Le routeur de Kick est celui de Next et il est atteignable. Lui demander de
// naviguer, c'est EXACTEMENT ce qu'un lien de la barre laterale fait, et ca
// n'exige aucune session. Repli sur un pushState brut s'il n'est pas la.
rechargements = 0;
const parQuoi = await page.evaluate((vers) => {
  const r = window.next?.router;
  if (r?.push) {
    r.push(vers);
    return 'next.router.push';
  }
  history.pushState({}, '', vers);
  window.dispatchEvent(new PopStateEvent('popstate'));
  return 'pushState brut';
}, liens[1]);
console.log(`
  navigation demandee par : ${parQuoi}`);

const suite = [];
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(1000);
  suite.push(
    await page.evaluate(() => ({
      rangees: document.querySelectorAll('#channel-chatroom [data-index]').length,
      present: !!document.querySelector('#channel-chatroom'),
      barre: !!document.querySelector('#kt-floating-bar'),
      chemin: location.pathname.replace(/[^/]/g, '.'),
    })),
  );
}

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

console.log('\n## Quel framework, quel routeur\n');
for (const [k, v] of Object.entries(empreintes)) console.log(`  ${k.padEnd(16)} ${JSON.stringify(v)}`);

console.log('\n## URL poussee sans rechargement : l application reagit-elle ?\n');
console.log(`  avant : ${avant.rangees} rangees, barre ${avant.barre ? 'oui' : 'non'}`);
for (const [i, e] of suite.entries()) {
  console.log(
    `  ${String(i + 1).padStart(2)}s   ${e.present ? `${e.rangees} rangees` : 'PAS DE CONTENEUR'}, barre ${e.barre ? 'oui' : 'NON'}  ${e.chemin}`,
  );
}
console.log(`\n  navigations de frame pendant l essai : ${rechargements}`);

const derniere = suite[suite.length - 1];
console.log('');
if (rechargements > 0) {
  console.log('VERDICT: pousser l URL a provoque un CHARGEMENT. Ce n est pas une route client.');
} else if (!derniere.present) {
  console.log(
    'VERDICT: routeur client actif, il a DEMONTE le chat sans le remonter dans les 10s.\n' +
      '         C est la forme que la fixture ne reproduit pas, et il faut la reproduire.',
  );
} else if (derniere.rangees !== avant.rangees) {
  console.log(
    'VERDICT: routeur client actif, le chat a ete re-rendu. La forme SPA existe donc\n' +
      '         anonymement, et le produit doit s y raccrocher.',
  );
} else {
  console.log(
    "VERDICT: l URL a change et l application n a RIEN fait. La page anonyme n a pas de\n" +
      '         routeur qui ecoute : elle est rendue au serveur. Le chemin connecte, lui,\n' +
      '         reste hors de portee sans session.',
  );
}
