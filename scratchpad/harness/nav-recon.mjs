/**
 * Ce que le routeur de Kick fait VRAIMENT au DOM quand on change de chaine.
 *
 * La sonde `nav-monde.mjs` simule deux formes de navigation et le produit survit
 * aux deux. kil, lui, doit recharger. Il reste donc une troisieme forme que la
 * fixture ne reproduit pas, et la seule facon de la connaitre est de regarder le
 * vrai site.
 *
 * Read-only : on ouvre kick.com, on suit un lien de chaine depuis la page
 * d'accueil, et on ENREGISTRE. Rien n'est poste, rien n'est connecte, aucun nom
 * de chaine n'est ecrit dans ce fichier ni dans sa sortie : les liens sont
 * suivis, pas choisis, et seule leur FORME est rapportee.
 *
 * Ce qui est mesure, et c'est la liste des hypotheses que la fixture ne couvre
 * peut-etre pas :
 *   - le document est-il vraiment garde, ou le routeur fait-il un chargement ?
 *   - `#channel-chatroom` : meme noeud, remplace, ou absent un moment ?
 *   - combien de temps entre la navigation et le retour d'un conteneur ?
 *   - `history.pushState` est-il seulement l'API utilisee ?
 *
 *   node scratchpad/harness/nav-recon.mjs
 *
 * Sortie 2 si le site ne se laisse pas lire : c'est un prerequis absent, pas un
 * defaut du produit.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-recon-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
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
const journal = [];
page.on('framenavigated', (f) => {
  if (f === page.mainFrame()) journal.push({ t: Date.now(), quoi: 'framenavigated', url: f.url() });
});

function fin(code, message) {
  console.log(message);
  return ctx
    .close()
    .catch(() => {})
    .then(() => {
      fs.rmSync(profile, { recursive: true, force: true });
      process.exit(code);
    });
}

try {
  await page.goto('https://kick.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
} catch (e) {
  await fin(2, `PREREQUIS: kick.com injoignable (${String(e.message).slice(0, 80)}).`);
}
await page.waitForTimeout(6000);

// Les liens de chaine, reconnus par leur FORME et jamais par un nom : un seul
// segment de chemin, et pas une route reservee du site.
const liens = await page.evaluate(() => {
  const reserve = new Set([
    'browse', 'categories', 'category', 'following', 'subscriptions', 'help', 'about',
    'tos', 'privacy', 'search', 'clips', 'videos', 'wallet', 'dashboard', 'settings',
  ]);
  const vus = new Set();
  for (const a of document.querySelectorAll('a[href^="/"]')) {
    const parts = a.getAttribute('href').split('/').filter(Boolean);
    if (parts.length !== 1) continue;
    if (reserve.has(parts[0].toLowerCase())) continue;
    vus.add('/' + parts[0]);
    if (vus.size >= 4) break;
  }
  return [...vus];
});

console.log(`page d accueil : ${liens.length} lien(s) de chaine trouve(s) par leur forme`);
if (liens.length < 2) {
  await fin(
    2,
    'PREREQUIS: moins de deux liens de chaine sur la page. Kick sert probablement une page\n' +
      "d'authentification au contexte automatise, ce que le PLAN note deja pour le selecteur\n" +
      "d'emotes. Ce chemin demande le navigateur de kil.",
  );
}

/** L'identite du conteneur, suivie a travers la navigation. */
async function empreinte() {
  return page.evaluate(() => {
    const salon = document.querySelector('#channel-chatroom');
    if (!salon) return { present: false };
    if (!window.__ktRecon) window.__ktRecon = new WeakMap();
    let id = window.__ktRecon.get(salon);
    if (id === undefined) {
      id = (window.__ktReconN = (window.__ktReconN ?? 0) + 1);
      window.__ktRecon.set(salon, id);
    }
    return {
      present: true,
      noeud: id,
      rangees: salon.querySelectorAll('[data-index]').length,
      barre: !!document.querySelector('#kt-floating-bar'),
      // Le chemin est MASQUE : ce depot est public et la regle est qu'aucun nom de
      // chaine n'y apparaisse. Ce qui compte est qu'il ait change, pas lequel.
      // Une premiere version les imprimait tous les deux en clair.
      chemin: location.pathname.replace(/[^/]/g, '.'),
    };
  });
}

await page.goto('https://kick.com' + liens[0], { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(9000);
const avant = await empreinte();
console.log(`\nchaine 1 : ${JSON.stringify({ ...avant, chemin: undefined })}`);
if (!avant.present) {
  await fin(
    2,
    'PREREQUIS: pas de #channel-chatroom sur une page de chaine. Le contexte automatise ne\n' +
      'recoit pas le chat ; ce chemin demande le navigateur de kil.',
  );
}

// La navigation telle qu'un lecteur la fait DEPUIS une page de chaine : un lien
// de la barre laterale. C'est le chemin que kil emprunte, et c'est celui qui a
// des chances d'etre une route d'application plutot qu'un chargement.
//
// Premiere version : le lien etait cherche par son href releve sur l'ACCUEIL, et
// il n'existait plus sur la page de chaine. Le clic ne partait pas, et la
// navigation de frame observee ensuite venait d'autre chose. Le lien se cherche
// donc dans la page ou l'on se trouve.
journal.length = 0;
const cible = await page.evaluate(() => {
  const reserve = new Set([
    'browse', 'categories', 'category', 'following', 'subscriptions', 'help', 'about',
    'tos', 'privacy', 'search', 'clips', 'videos', 'wallet', 'dashboard', 'settings',
  ]);
  const ici = location.pathname.split('/').filter(Boolean)[0];
  for (const a of document.querySelectorAll('a[href^="/"]')) {
    const parts = a.getAttribute('href').split('/').filter(Boolean);
    if (parts.length !== 1) continue;
    const slug = parts[0].toLowerCase();
    if (reserve.has(slug) || slug === ici) continue;
    return a.getAttribute('href');
  }
  return null;
});
console.log(`  lien de chaine sur la page de chaine : ${cible ? 'trouve' : 'AUCUN'}`);
const depart = Date.now();
const clique = cible
  ? await page.evaluate((href) => {
      const a = document.querySelector(`a[href="${href}"]`);
      if (!a) return false;
      // Un clic de confiance autant que possible : les routeurs interceptent le
      // click, donc c'est bien la route d'application qui doit partir.
      a.scrollIntoView();
      a.click();
      return true;
    }, cible)
  : false;
if (!clique) console.log('  (aucun lien de chaine cliquable depuis la page de chaine)');

const etapes = [];
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(1000);
  etapes.push({ s: Math.round((Date.now() - depart) / 1000), ...(await empreinte()) });
}

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

console.log(`\n## Ce que le routeur a fait, seconde par seconde\n`);
let precedent = null;
for (const e of etapes) {
  const change =
    precedent === null
      ? 'depart'
      : e.present !== precedent.present
        ? e.present ? 'CONTENEUR REVENU' : 'CONTENEUR DISPARU'
        : e.present && precedent.present && e.noeud !== precedent.noeud
          ? 'NOEUD REMPLACE'
          : '';
  console.log(
    `  ${String(e.s).padStart(2)}s  ${e.present ? `noeud ${e.noeud}, ${e.rangees} rangees, barre ${e.barre ? 'oui' : 'NON'}` : 'pas de conteneur'}  ${e.chemin ?? ''}  ${change}`,
  );
  precedent = e;
}

const rechargements = journal.filter((j) => j.quoi === 'framenavigated');
console.log(`\n## Le document a-t-il ete recharge ?\n`);
console.log(`  ${rechargements.length} navigation(s) de frame principale pendant le changement`);
for (const r of rechargements) console.log(`    ${new URL(r.url).pathname.replace(/[^/]/g, '.')}`);
console.log(
  rechargements.length
    ? '\n  Une navigation de frame veut dire un CHARGEMENT COMPLET : le script de contenu est\n' +
        "  reinjecte, et le probleme de kil n'est alors pas le re-attachement de route."
    : '\n  Aucune : c est bien une navigation d application, le script de contenu survit et\n' +
        '  doit se raccrocher seul.',
);
