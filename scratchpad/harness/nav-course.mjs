/**
 * "Il faut recharger une seconde fois" est la signature d'une COURSE, pas d'un
 * declencheur manquant.
 *
 * Ce que sept sondes ont etabli : sur tous les chemins anonymes mesures, Kick
 * recharge le document quand on change de chaine, y compris par son propre
 * routeur. Le script de contenu est donc reinjecte a chaque switch, et
 * `attachForRoute` tourne au demarrage. Si malgre ca kil doit recharger une
 * seconde fois, ce n'est pas que le produit ne se raccroche jamais : c'est qu'il
 * ne s'y raccroche PAS TOUJOURS.
 *
 * Une course ne se voit pas en un essai. Celle-ci enchaine plusieurs arrivees sur
 * une page de chaine et compte, a chaque fois, si l'extension s'est accrochee.
 * Le temoin n'est pas la barre, qui se monte sans le chat : c'est
 * `data-kt-id`, la marque que l'observateur pose sur une rangee qu'il a vue.
 * Sans elle, rien ne sera jamais traduit sur cette page.
 *
 * Aucune session, aucun identifiant, aucun clic destructeur. On arrive sur des
 * pages publiques et on regarde.
 *
 *   node scratchpad/harness/nav-course.mjs
 *   KT_BROWSER=<brave.exe> node scratchpad/harness/nav-course.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');
const binaire = process.env.KT_BROWSER;
const TOURS = Number(process.env.KT_TOURS ?? 6);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-course-'));
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
    if (vus.size >= 6) break;
  }
  return [...vus];
});
if (liens.length < 2) await fin(2, 'PREREQUIS: pas assez de liens de chaine.');

/**
 * L'extension s'est-elle accrochee a CETTE page ?
 *
 * `data-kt-id` est la marque de l'observateur sur une rangee traitee. La barre
 * ne suffit pas : elle se monte meme quand le chat n'a jamais ete trouve, donc
 * une page a barre et sans marque est precisement le cas ou il faut recharger.
 */
async function accrochee() {
  return page.evaluate(() => ({
    rangees: document.querySelectorAll('#channel-chatroom [data-index]').length,
    marquees: document.querySelectorAll('#channel-chatroom [data-kt-id]').length,
    barre: !!document.querySelector('#kt-floating-bar'),
    style: !!document.getElementById('kt-inject-style'),
  }));
}

const tours = [];
for (let i = 0; i < TOURS; i++) {
  const cible = liens[i % liens.length];
  try {
    await page.goto('https://kick.com' + cible, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch {
    tours.push({ i: i + 1, erreur: true });
    continue;
  }
  // Laisser au chat le temps d'arriver ET a l'observateur celui de le voir.
  await page.waitForTimeout(12000);
  const e = await accrochee();
  // Le second chargement, celui que kil fait a la main, sur la MEME page.
  let apresRechargement = null;
  if (e.rangees > 0 && e.marquees === 0) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    apresRechargement = await accrochee();
  }
  tours.push({ i: i + 1, ...e, apresRechargement });
}

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

const utiles = tours.filter((t) => !t.erreur && t.rangees > 0);
if (utiles.length === 0) {
  await Promise.resolve();
  console.error(`SONDE MUETTE: aucune arrivee n a montre de chat (${tours.length} essais).`);
  process.exit(2);
}

console.log(`\n## ${utiles.length} arrivee(s) sur une page de chaine avec du chat\n`);
for (const t of tours) {
  if (t.erreur) {
    console.log(`  ${String(t.i).padStart(2)}  navigation echouee`);
    continue;
  }
  const verdict = t.rangees === 0 ? 'pas de chat' : t.marquees > 0 ? 'ACCROCHEE' : 'PAS ACCROCHEE';
  const suite = t.apresRechargement
    ? `  -> apres un 2e chargement : ${t.apresRechargement.marquees > 0 ? 'ACCROCHEE' : 'toujours pas'}`
    : '';
  console.log(
    `  ${String(t.i).padStart(2)}  ${String(t.rangees).padStart(3)} rangees, ${String(t.marquees).padStart(3)} marquees, ` +
      `barre ${t.barre ? 'oui' : 'NON'}, style ${t.style ? 'oui' : 'NON'}  ${verdict}${suite}`,
  );
}

const accrochees = utiles.filter((t) => t.marquees > 0).length;
const reparees = utiles.filter((t) => t.apresRechargement?.marquees > 0).length;
console.log(`\n  accrochee du premier coup : ${accrochees}/${utiles.length}`);
if (reparees) console.log(`  reparee par un second chargement : ${reparees}`);

console.log('');
if (accrochees === utiles.length) {
  console.log(
    "VERDICT: accrochee a chaque arrivee. Pas de course visible sur ce chemin, donc le\n" +
      "         symptome de kil ne se reproduit pas ici et vient d'ailleurs.",
  );
} else if (reparees) {
  console.log(
    'VERDICT: LA COURSE EXISTE. Une arrivee sur deux ne s accroche pas et un second\n' +
      '         chargement repare, ce qui est exactement le symptome rapporte.',
  );
} else {
  console.log(
    'VERDICT: des arrivees ne s accrochent pas ET un second chargement ne repare pas.\n' +
      '         Ce n est ni une course ni le declencheur de route.',
  );
}
