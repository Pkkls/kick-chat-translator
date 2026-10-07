/**
 * Un onglet Kick ouvert pendant une mise a jour de l'extension.
 *
 * Chrome coupe l'ancien script de contenu a chaque mise a jour : il reste dans
 * la page, mais tout appel a `chrome.runtime` y leve "Extension context
 * invalidated". Et le nouveau script n'est injecte que dans les pages chargees
 * ensuite. Avec des milliers d'installations, chaque version publiee casse donc
 * tous les onglets Kick ouverts a ce moment, jusqu'a un rechargement que rien
 * ne demande.
 *
 * La sonde simule la mise a jour par `chrome.runtime.reload()` depuis le
 * service worker, ce que Chrome fait aussi pour une mise a jour, puis pose un
 * message dans le chat et regarde s'il est traduit, et combien de bandeaux la
 * page porte.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}

const TRADUIT = 'ZZTRADUCTIONZZ';
const KICK = /^https?:\/\/(www\.)?kick\.com\//;

const rangee = (texte, i) =>
  `<div data-index="${i}"><div class="w-full min-w-0 shrink-0">` +
  `<button class="font-bold" style="color: rgb(1,2,3)">pseudo${i}</button>` +
  `<span class="font-normal">${texte}</span></div></div>`;

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title></head>
<body><div id="channel-chatroom">
  <div class="no-scrollbar" data-which="decoy"></div>
  <div class="no-scrollbar" data-which="messages" style="height:600px;overflow:auto">${rangee('hola amigo que tal', 0)}</div>
  <div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input" style="min-height:38px"></div>
</div></body></html>`;

// `KT_EXT_AVANT` pointe sur un paquet deja publie, decompresse. La sonde le
// charge, puis met le build courant a sa place avant de recharger : c'est une
// vraie mise a jour depuis la version que les utilisateurs ont. Sans lui, la
// meme version est rechargee sur elle-meme.
const AVANT = process.env.KT_EXT_AVANT;
const EXTDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-ext-'));
fs.cpSync(AVANT ?? EXT, EXTDIR, { recursive: true });
const versionAvant = JSON.parse(fs.readFileSync(path.join(EXTDIR, 'manifest.json'), 'utf8')).version;
console.log(`depuis la version ${versionAvant}`);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-maj-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1200, height: 800 },
  args: [
    `--disable-extensions-except=${EXTDIR}`,
    `--load-extension=${EXTDIR}`,
    '--headless=new',
    // Sans ce drapeau, Chromium desactive au rechargement une extension chargee
    // en ligne de commande (disableReasons.unsupportedDeveloperExtension), et la
    // sonde mesurait une extension eteinte au lieu d'une mise a jour.
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

await ctx.route('**://translate.googleapis.com/**', async (route) => {
  const q = new URL(route.request().url()).searchParams.get('q') ?? '';
  const SAUT = String.fromCharCode(10);
  const lignes = q.split(SAUT);
  const segments = lignes.map((l, k) => [`${TRADUIT}:${l}` + (k < lignes.length - 1 ? SAUT : ''), l, null, null, 10]);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([segments, null, 'es']) });
});
await ctx.route(KICK, async (route) => {
  const r = route.request();
  if (r.resourceType() === 'document') {
    await route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
    return;
  }
  if (r.url().includes('/api/')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: 'es' } }),
    });
    return;
  }
  await route.fulfill({ status: 204, body: '' });
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/kt-un', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const SEL_TR = '.kt-translation, .kt-translation-inline, .kt-translation-replace';

async function etat(texte) {
  return page.evaluate(
    ({ sel, texte }) => {
      const rangees = [...document.querySelectorAll('#channel-chatroom div[data-index]')];
      const cible = rangees.find((r) => (r.querySelector('.font-normal')?.textContent ?? '') === texte);
      return {
        traduite: !!cible?.querySelector(sel),
        bandeaux: document.querySelectorAll('#kt-floating-bar').length,
        // Les autres pieces que le script pose : un predecesseur qui laisse les
        // siennes en double donne une pastille morte a cote de la vivante.
        pastilles: document.querySelectorAll('[id="kt-lang-chip"]').length,
        menus: document.querySelectorAll('[id="kt-lang-menu"]').length,
        composes: document.querySelectorAll('[id="kt-compose-bar"]').length,
      };
    },
    { sel: SEL_TR, texte },
  );
}

async function poser(texte, index) {
  await page.evaluate(
    ({ html }) =>
      document.querySelector('#channel-chatroom [data-which="messages"]').insertAdjacentHTML('beforeend', html),
    { html: rangee(texte, index) },
  );
  await page.waitForTimeout(8000);
  return etat(texte);
}

const avant = await etat('hola amigo que tal');

/**
 * La zone de saisie, avant et apres. L'orphelin 3.0.1 garde son ecouteur de
 * clavier : il ne doit ni bloquer Entree, qui envoie le message, ni avaler Tab,
 * qui insere la traduction. Le releve d'avant est le controle positif : s'il ne
 * voit pas d'insertion, la sonde ne mesure rien.
 */
async function ecrire(texte) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="chat-input"]');
    el.textContent = '';
    el.focus();
  });
  await page.keyboard.type(texte, { delay: 25 });
  // Le meme delai que la porte translate-compose : l'apercu attend la frappe
  // finie puis un aller-retour au moteur.
  await page.waitForTimeout(9000);
  const apercu = await page.evaluate(() => {
    const p = document.querySelector('.kt-compose');
    return p ? !p.hasAttribute('hidden') && (p.textContent ?? '').length > 0 : false;
  });
  const entreeBloquee = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="chat-input"]');
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  return {
    apercu,
    entreeBloquee,
    panneaux: await page.evaluate(() => document.querySelectorAll('[id="kt-compose-bar"]').length),
  };
}
const saisieAvant = await ecrire('hello my friends');
const consoleLignes = [];
page.on('console', (m) => consoleLignes.push(`page ${m.type()}: ${m.text()}`.slice(0, 200)));
await page.evaluate(() => document.querySelector('#kt-floating-bar')?.setAttribute('data-sonde', 'ancien'));

let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
// `chrome.runtime.reload()` sur une extension chargee en ligne de commande la
// laisse eteinte sous Playwright : aucun worker ne revient, ce qui mesure une
// extension desactivee et pas une mise a jour. La page des extensions recharge
// comme le bouton du meme nom, et Chrome deroule alors onInstalled 'update'.
const extId = new URL(sw.url()).host;
if (AVANT) {
  fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true });
}
const nouveauWorker = ctx.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null);
const admin = await ctx.newPage();
await admin.goto(`chrome://extensions/?id=${extId}`);
await admin.waitForTimeout(1000);
// Une extension non empaquetee rechargee hors mode developpeur est desactivee
// (disableReasons.unsupportedDeveloperExtension) : la sonde mesurait alors une
// extension eteinte et pas une mise a jour.
await admin.evaluate(() => new Promise((ok) => chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true }, ok)));
const recharge = await admin
  .evaluate((id) => new Promise((ok) => chrome.developerPrivate.reload(id, { failQuietly: true }, () => ok('ok'))), extId)
  .catch((e) => String(e).slice(0, 160));
console.log('rechargement :', recharge);
await admin.waitForTimeout(4000);
const info = await admin
  .evaluate((id) => new Promise((ok) => chrome.developerPrivate.getExtensionInfo(id, (i) => ok({
    state: i.state, raisons: i.disableReasons, location: i.location, vues: (i.views ?? []).map((v) => v.type + ' ' + v.url.slice(-30)),
    erreurs: (i.runtimeErrors ?? []).map((e) => e.message.slice(0, 160)),
    manifestErreurs: (i.manifestErrors ?? []).map((e) => e.message.slice(0, 160)),
  }))), extId)
  .catch((e) => String(e).slice(0, 160));
console.log('INFO', JSON.stringify(info));
await admin.close();
await page.bringToFront();
const swNeuf = await nouveauWorker;
console.log('nouveau worker :', swNeuf ? swNeuf.url() : 'AUCUN en 15s');
// Le nouveau service worker demarre, et onInstalled avec lui.
await page.waitForTimeout(5000);
const sw2 = ctx.serviceWorkers().at(-1);
const diag = {
  workers: ctx.serviceWorkers().length,
  bandeauAncien: await page.evaluate(() => !!document.querySelector('#kt-floating-bar[data-sonde]')),
  onglets: sw2 ? await sw2.evaluate(() => chrome.tabs.query({ url: ['https://kick.com/*'] }).then((t) => t.map((x) => x.url))).catch((e) => String(e)) : null,
};
console.log('DIAG', JSON.stringify(diag));

// En direct sur Brave, un rechargement a donne deux "Content script ready" a la
// meme seconde. `KT_DOUBLE` rejoue une seconde injection apres la mise a jour :
// mesure, l'onglet traduit toujours, avec une seule piece de chaque. Les 0 sur
// 38 vus ce jour-la venaient de l'onglet pas encore affiche, ou rien n'est
// traduit par choix (pauseWhenHidden), pas de deux copies qui se battent.
if (process.env.KT_DOUBLE) {
  const ouvert = ctx.serviceWorkers().at(-1);
  const r = await ouvert.evaluate(async () => {
    const [cs] = chrome.runtime.getManifest().content_scripts;
    const [tab] = await chrome.tabs.query({ url: cs.matches });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: cs.js });
    return 'injecte';
  }).catch((e) => String(e).slice(0, 120));
  console.log('seconde injection :', r);
  await page.waitForTimeout(3000);
}
const apres = await poser('seguimos aqui despues de actualizar', 1);
const saisieApres = await ecrire('see you all tomorrow');
console.log('SAISIE', JSON.stringify({ avant: saisieAvant, apres: saisieApres }));

console.log(consoleLignes.slice(0, 15).join(String.fromCharCode(10)));
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });
fs.rmSync(EXTDIR, { recursive: true, force: true });

if (!avant.traduite) {
  console.error('SONDE MUETTE: rien n etait traduit avant la mise a jour, la sonde ne mesure rien.');
  process.exit(2);
}

const ligne = (nom, e) =>
  `  ${nom.padEnd(28)} traduite ${e.traduite ? 'OUI' : 'NON'}   bandeaux ${e.bandeaux}   pastilles ${e.pastilles}   menus ${e.menus}   composes ${e.composes}`;
console.log(`\n## Un onglet Kick ouvert pendant une mise a jour\n`);
console.log(ligne('avant la mise a jour', avant));
console.log(ligne('message apres la mise a jour', apres));

// Le controle positif est l'apercu, pas l'insertion : sur cette fixture, Tab ne
// remplace pas le texte meme avant toute mise a jour, et aucune porte ne mesure
// l'insertion hors de kick.com. Elle reste a observer sur le vrai site.
if (!saisieAvant.apercu) {
  console.error('SONDE MUETTE: avant la mise a jour, aucun apercu de composition, la saisie ne mesure rien.');
  process.exit(2);
}
const fails = [];
if (saisieApres.entreeBloquee) fails.push('apres une mise a jour, Entree est bloquee dans la zone de saisie : plus moyen d envoyer');
if (!saisieApres.apercu) fails.push('apres une mise a jour, l apercu de composition ne s affiche plus');
if (saisieApres.panneaux !== 1) fails.push(`apres une mise a jour, ${saisieApres.panneaux} panneaux de composition`);
if (!apres.traduite) fails.push('apres une mise a jour, un onglet deja ouvert ne traduit plus rien');
for (const k of ['bandeaux', 'pastilles', 'menus', 'composes'])
  if (apres[k] > avant[k]) fails.push(`apres une mise a jour, ${k} : ${avant[k]} avant, ${apres[k]} apres, un predecesseur a laisse le sien`);
if (apres.bandeaux !== 1) fails.push(`apres une mise a jour, la page porte ${apres.bandeaux} bandeaux au lieu d un`);

console.log('');
if (fails.length) {
  console.error('DEFAUTS MESURES :');
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log('Rien a signaler : l onglet ouvert continue apres la mise a jour.');
