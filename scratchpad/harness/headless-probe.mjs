/**
 * Est-ce qu'une extension MV3 se charge en headless dans le Chromium de
 * Playwright, ou faut-il continuer a ouvrir une fenetre et la pousser hors de
 * l'ecran ?
 *
 * Ce que le prompt du depot dit aujourd'hui : "Chrome 137+ ignores
 * `--load-extension`. Use Playwright's bundled Chromium, never
 * `channel: 'chrome'`". Toutes les portes tournent donc en `headless: false`
 * avec `--window-position=-2400,-2400`, ce qui marche mais interdit une CI sans
 * serveur X et vole le focus sur la machine de kil.
 *
 * Trois modes sont essayes sur le MEME build et la MEME page, et le verdict est
 * la seule chose qui compte : le content script est-il injecte, et le service
 * worker MV3 demarre-t-il. Un mode qui ouvre le navigateur sans injecter est un
 * echec, pas un demi-succes.
 *
 *   node scratchpad/harness/headless-probe.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium, provenance } from './playwright.mjs';

// Les trois premiers modes passent par le Playwright BRUT, pas par le shim.
// Premiere version de cette sonde : lancee avec KT_HEADLESS=1, le shim
// convertissait aussi le mode "headed hors ecran" qui sert de temoin, et les
// quatre lignes disaient sans fenetre OUI. Un temoin que le dispositif teste
// modifie ne temoigne de rien.
const { chromium: chromiumBrut } = await import(pathToFileURL(provenance).href);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title></head>
<body><div id="channel-chatroom">
  <div class="no-scrollbar" data-which="decoy"></div>
  <div class="no-scrollbar" data-which="messages" style="height:600px;overflow:auto">
    <div data-index="0"><div class="w-full min-w-0 shrink-0"><button class="font-bold" style="color: rgb(1,2,3)">a</button><span class="font-normal">hola amigo que tal</span></div></div>
  </div>
  <div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input" style="min-height:40px"></div>
</div></body></html>`;

const KICK = /^https?:\/\/(www\.)?kick\.com\//;

/** Les trois facons de demander un navigateur sans fenetre visible. */
const MODES = [
  { nom: 'headed hors ecran', headless: false, args: ['--window-position=-2400,-2400'] },
  { nom: 'headless nouveau', headless: false, args: ['--headless=new'] },
  { nom: 'headless playwright', headless: true, args: [] },
].map((m) => ({ ...m, lanceur: chromiumBrut }));

// Le quatrieme mode n'est pas une variante de plus : c'est le chemin que les 39
// harnais empruntent vraiment, `KT_HEADLESS=1` lu par le shim. Le mesurer
// separement des trois ci-dessus est ce qui distingue "le mode existe" de "notre
// cablage l'utilise".
if (process.env.KT_HEADLESS === '1') {
  MODES.push({
    nom: 'via KT_HEADLESS',
    headless: false,
    args: ['--window-position=-2400,-2400'],
    lanceur: chromium,
  });
}

const resultats = [];

for (const mode of MODES) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-hl-'));
  let ctx = null;
  const r = { mode: mode.nom, lance: false, contentScript: false, worker: false, erreur: null };
  try {
    ctx = await mode.lanceur.launchPersistentContext(profile, {
      headless: mode.headless,
      viewport: { width: 1200, height: 800 },
      args: [
        `--disable-extensions-except=${EXT}`,
        `--load-extension=${EXT}`,
        '--no-first-run',
        '--no-default-browser-check',
        ...mode.args,
      ],
    });
    r.lance = true;
    await ctx.route(KICK, async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
        return;
      }
      await route.fulfill({ status: 204, body: '' });
    });
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto('https://kick.com/kt-fixture-channel', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    // Le temoin du script de contenu : la feuille qu'il injecte lui-meme.
    r.contentScript = await page.evaluate(() => !!document.getElementById('kt-inject-style'));
    // Le temoin que le mode a PRIS, et pas seulement qu'on l'a demande :
    // Chromium s'annonce HeadlessChrome quand il tourne sans fenetre.
    r.ua = await page.evaluate(() => navigator.userAgent);
    r.sansFenetre = /HeadlessChrome/.test(r.ua);
    // Le worker MV3 est paresseux : il ne demarre qu'apres une page kick.com.
    const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null));
    r.worker = !!sw;
  } catch (e) {
    r.erreur = String(e.message ?? e).split('\n')[0].slice(0, 110);
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    fs.rmSync(profile, { recursive: true, force: true });
  }
  resultats.push(r);
  console.log(
    `  ${r.mode.padEnd(22)} lance ${r.lance ? 'oui' : 'NON'}  ` +
      `content script ${r.contentScript ? 'INJECTE' : 'absent '}  ` +
      `worker ${r.worker ? 'demarre' : 'absent '}  ` +
      `sans fenetre ${r.sansFenetre ? 'OUI' : 'non'}` +
      (r.erreur ? `  ${r.erreur}` : ''),
  );
}

// Une sonde qui n'a rien mesure doit echouer.
if (!resultats.some((r) => r.lance)) {
  console.error('SONDE MUETTE: aucun mode n a seulement demarre un navigateur.');
  process.exit(2);
}

const gagnants = resultats.filter((r) => r.contentScript && r.worker);
for (const r of resultats) {
  if (r.mode === 'headed hors ecran' && r.sansFenetre) {
    console.error("ECHEC: le temoin headed tourne sans fenetre, il ne temoigne de rien : " + r.ua);
    process.exit(1);
  }
  if (r.contentScript && r.mode !== 'headed hors ecran' && !r.sansFenetre) {
    console.error(`ECHEC: ${r.mode} a charge l extension mais dans une VRAIE fenetre : ${r.ua}`);
    process.exit(1);
  }
}
console.log(`\n${gagnants.length}/${resultats.length} mode(s) chargent reellement l extension.`);
if (gagnants.length === 0) {
  console.log("Aucun mode sans fenetre ne marche : la fenetre hors ecran reste la seule voie.");
} else {
  console.log('Utilisables : ' + gagnants.map((r) => r.mode).join(', '));
}
