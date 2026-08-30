/**
 * Les cinq captures des stores, prises sans personne dedans.
 *
 * Pourquoi ce fichier existe a cote de `store-shots.mjs`. Celui-la suit la
 * premiere chaine en direct de /browse : les images montrent alors la marque de
 * quelqu'un, son flux, et les pseudos de vraies personnes qui n'ont rien demande.
 * C'est ce qui laissait les captures en attente d'une decision. Ici la page est
 * fabriquee, les pseudos sont inventes, et le moteur de traduction est repondu
 * localement, donc rien de tiers n'apparait et rien ne sort de la machine.
 *
 * Ce que les images montrent reste vrai : c'est le build de `dist/` qui tourne,
 * l'extension lit ce chat comme elle lirait n'importe quel autre, et les
 * traductions affichees sont celles que l'extension a demandees et posees. Ce
 * qui est fabrique, c'est le salon, pas le produit.
 *
 * Les traductions rendues sont plausibles et pas des marqueurs : une capture
 * ne sert a rien si elle montre ZZTRADUCTIONZZ.
 *
 *   node scratchpad/harness/store-shots-fixture.mjs
 *
 * Ecrit dans scratchpad/harness/store-fixture/ en 01..05, au 1280x800 que le
 * store demande, et verifie que chaque image montre bien son sujet avant de la
 * compter.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const OUT = path.join(HERE, 'store-fixture');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

/**
 * Le salon. Espagnol vers anglais, parce que c'est la paire ou un lecteur
 * anglophone voit tout de suite ce que l'extension apporte.
 *
 * Les pseudos sont inventes et volontairement quelconques. Aucun ne doit
 * ressembler a un vrai diffuseur : ces images partent sur une page publique.
 */
const CONVERSATION = [
  ['pixel_raton', 'buenas noches a todos que tal va la cosa'],
  ['nubecita77', 'esa jugada ha sido increible de verdad'],
  ['tortuga_veloz', 'alguien sabe a que hora empieza el torneo'],
  ['pixel_raton', 'yo creo que en media hora mas o menos'],
  ['calcetin_azul', 'me encanta este mapa es mi favorito'],
  ['nubecita77', 'no me lo puedo creer otra vez lo mismo'],
  ['ventana_rota', 'la ultima ronda ha estado muy reninda'],
  ['calcetin_azul', 'me tengo que ir pero vuelvo luego'],
  ['pixel_raton', 'suerte con el torneo de esta noche'],
  ['tortuga_veloz', 'que configuracion usas para el raton'],
  ['ventana_rota', 'buena partida, nos vemos manana'],
  ['nubecita77', 'gracias por el stream de hoy'],
];

/** Ce que le faux moteur rend, phrase par phrase. */
const TRADUCTIONS = new Map([
  ['la ultima ronda ha estado muy reninda', 'that last round was really close'],
  ['me tengo que ir pero vuelvo luego', 'I have to go, but I will be back later'],
  ['suerte con el torneo de esta noche', 'good luck with tonight is tournament'],
  ['que configuracion usas para el raton', 'what settings do you use for your mouse'],
  ['buenas noches a todos que tal va la cosa', 'good evening everyone, how is it going'],
  ['esa jugada ha sido increible de verdad', 'that play was genuinely incredible'],
  ['alguien sabe a que hora empieza el torneo', 'does anyone know when the tournament starts'],
  ['yo creo que en media hora mas o menos', 'in about half an hour, I think'],
  ['me encanta este mapa es mi favorito', 'I love this map, it is my favourite'],
  ['no me lo puedo creer otra vez lo mismo', 'I cannot believe it, the same thing again'],
  ['buena partida, nos vemos manana', 'good game, see you tomorrow'],
  ['gracias por el stream de hoy', 'thanks for the stream today'],
]);

const rangee = (i, [pseudo, texte]) =>
  `<div data-index="${i}" class="px-3 py-1">` +
  '<div class="w-full min-w-0 shrink-0">' +
  `<button class="font-bold" style="color:#53FC18">${pseudo}</button>` +
  '<span style="opacity:.5">: </span>' +
  `<span class="font-normal">${texte}</span>` +
  '</div></div>';

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; background: #0b0b0c; color: #e8e8e8;
               font: 14px/1.5 Inter, ui-sans-serif, system-ui, sans-serif; }
  #page { display: flex; height: 100vh; }
  /* La zone du lecteur. Volontairement abstraite : une capture de store ne doit
     pas fabriquer le flux de quelqu'un ni une marque qui n'existe pas. Un aplat
     travaille et une barre de lecture generique suffisent a situer la page. */
  #video { flex: 1; position: relative; overflow: hidden;
           background:
             radial-gradient(120% 90% at 25% 20%, #1b2228 0%, transparent 60%),
             radial-gradient(100% 80% at 80% 75%, #16201a 0%, transparent 55%),
             linear-gradient(160deg, #14181b, #0b0d0f); }
  #video::before { content: ''; position: absolute; inset: 0;
                   background-image: linear-gradient(#ffffff08 1px, transparent 1px),
                                     linear-gradient(90deg, #ffffff08 1px, transparent 1px);
                   background-size: 48px 48px; }
  #player { position: absolute; left: 24px; right: 24px; bottom: 22px; height: 4px;
            border-radius: 2px; background: #ffffff1f; }
  #player i { display: block; height: 100%; width: 62%; border-radius: 2px;
              background: #53FC18; }
  #live { position: absolute; left: 24px; top: 22px; display: flex; align-items: center;
          gap: 8px; font-size: 12px; letter-spacing: .04em; color: #cfd4d8; }
  #live b { width: 8px; height: 8px; border-radius: 50%; background: #ff4d4d; }
  #channel-chatroom { width: 360px; border-left: 1px solid #1f2326; display: flex;
                      flex-direction: column; background: #101013; }
  /* Le leurre existe pour que l'observateur choisisse le bon conteneur entre
     deux qui repondent au meme selecteur, comme sur le vrai site. Il ne doit pas
     prendre de place : avec "flex: 1" sur les deux, il mangeait la moitie haute
     de la colonne et les captures montraient un chat a moitie vide. */
  [data-which='decoy'] { flex: 0 0 0; height: 0; overflow: hidden; }
  [data-which='messages'] { flex: 1; overflow: auto; display: flex;
                            flex-direction: column; justify-content: flex-end; }
  [data-which="messages"] > div { padding: 3px 10px; }
  #compose { border-top: 1px solid #1f2326; padding: 10px; }
  [contenteditable] { min-height: 38px; border: 1px solid #2a2f33; border-radius: 4px;
                      padding: 8px; outline: none; }
</style></head>
<body>
  <div id="page">
    <div id="video">
      <div id="live"><b></b>LIVE</div>
      <div id="player"><i></i></div>
    </div>
    <div id="channel-chatroom">
      <div class="no-scrollbar" data-which="decoy"></div>
      <div class="no-scrollbar" data-which="messages">
        ${CONVERSATION.map((c, i) => rangee(i, c)).join('\n')}
      </div>
      <div id="compose">
        <div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input"></div>
      </div>
    </div>
  </div>
</body></html>`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-shots-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--window-position=-2400,-2400',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const KICK = /^https?:\/\/(www\.)?kick\.com\//;

await ctx.route('**://translate.googleapis.com/**', async (route) => {
  const q = new URL(route.request().url()).searchParams.get('q') ?? '';
  const SAUT = String.fromCharCode(10);
  const lignes = q.split(SAUT);
  const segments = lignes.map((l, k) => [
    (TRADUCTIONS.get(l.trim()) ?? l) + (k < lignes.length - 1 ? SAUT : ''),
    l,
    null,
    null,
    10,
  ]);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([segments, null, 'es']),
  });
});

await ctx.route(KICK, async (route) => {
  const req = route.request();
  if (req.resourceType() === 'document') {
    await route.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
  } else if (req.url().includes('/api/')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: 'es' } }),
    });
  } else {
    await route.fulfill({ status: 204, body: '' });
  }
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/demo-channel', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

// Le chat se lit par le bas, comme un vrai salon.
await page.evaluate(() => {
  const l = document.querySelector('#channel-chatroom [data-which="messages"]');
  if (l) l.scrollTop = l.scrollHeight;
});
await page.waitForTimeout(600);

const notes = [];

/** Prend une image et verifie qu'elle montre son sujet, sinon elle ne compte pas. */
async function prendre(nom, sujet, cible = page) {
  const montre = await cible.evaluate(sujet);
  await cible.screenshot({ path: path.join(OUT, `${nom}.png`) });
  notes.push({ nom, montre: !!montre });
}

// 01 : le chat qui fait son travail. Verifie en comptant les traductions
// reellement posees, pas en supposant qu'elles sont la.
await prendre(
  '01-chat-traduit',
  () => document.querySelectorAll('.kt-translation, .kt-translation-inline, .kt-translation-replace').length >= 6,
);

// 02 : la grille de langues, ce que la fiche actuelle ne montre pas du tout.
// Le bouton exact, repris de `kick-actions.mjs` : la barre est
// `#kt-floating-bar` et son controle de langue `.kt-float-lang`. Un premier
// essai cliquait `#kt-float button`, qui n'existe pas, et l'image sortait sur
// un panneau ferme.
await page.evaluate(() => document.querySelector('#kt-floating-bar .kt-float-lang')?.click());
await page.waitForTimeout(900);
await prendre('02-langues', () => {
  const l = document.querySelector('.kt-lang-panel, .kt-chip-menu');
  return !!l && l.querySelectorAll('.kt-lang-row, .kt-chip-row').length > 10;
});
await page.keyboard.press('Escape').catch(() => undefined);
await page.waitForTimeout(400);

// 03 : l'apercu de composition, au-dessus de la boite de saisie.
const saisie = page.locator('#channel-chatroom [contenteditable="true"]');
await saisie.click();
await saisie.type('thanks for the stream, see you tomorrow', { delay: 20 });
await page.waitForTimeout(7000);
await prendre('03-composition', () => {
  const p = document.querySelector('.kt-compose');
  return !!p && !p.hasAttribute('hidden') && (p.textContent ?? '').trim().length > 3;
});

// 04 et 05 : des pages de l'extension, aucun salon en jeu.
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }));
const extId = await sw.evaluate(() => chrome.runtime.id);

const opt = await ctx.newPage();
await opt.setViewportSize({ width: 1280, height: 800 });
await opt.goto(`chrome-extension://${extId}/src/options/index.html`);
await opt.waitForTimeout(3000);
await prendre('04-reglages', () => document.querySelectorAll('select, input, button').length > 5, opt);
await opt.close();

// Le popup fait environ 360px de large : le tirer dans un cadre 1280x800 sans
// mise en scene donnerait une image aux trois quarts vide.
const pop = await ctx.newPage();
await pop.setViewportSize({ width: 420, height: 640 });
await pop.goto(`chrome-extension://${extId}/src/popup/index.html`);
await pop.waitForTimeout(2500);
const popOk = await pop.evaluate(() => document.querySelectorAll('select, button').length > 2);
const brut = await pop.screenshot();
await pop.close();

const cadre = await ctx.newPage();
await cadre.setViewportSize({ width: 1280, height: 800 });
await cadre.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><title>popup</title><style>
    html,body{margin:0;height:100%;background:linear-gradient(160deg,#0f1214,#0b0b0c);
              display:flex;align-items:center;justify-content:center}
    img{border-radius:8px;border:1px solid #1f2326;max-height:88%}
  </style></head><body><img src="data:image/png;base64,${brut.toString('base64')}"></body></html>`,
);
await cadre.waitForTimeout(400);
await cadre.screenshot({ path: path.join(OUT, '05-popup.png') });
notes.push({ nom: '05-popup', montre: popOk });
await cadre.close();

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

const fails = [];
for (const n of notes) {
  const f = path.join(OUT, `${n.nom}.png`);
  const octets = fs.existsSync(f) ? fs.statSync(f).size : 0;
  console.log(
    `${n.nom.padEnd(18)} ${String(Math.round(octets / 1024)).padStart(4)}Ko  sujet visible: ${n.montre}`,
  );
  if (octets < 8000) fails.push(`${n.nom} pese ${octets} octets : l image est vide ou n a pas ete ecrite`);
  if (!n.montre) fails.push(`${n.nom} ne montre pas son sujet`);
}
if (notes.length !== 5) fails.push(`${notes.length} images sur 5`);

console.log(`\n${OUT}`);
if (fails.length) {
  console.error('FAIL: ' + fails.join(' ; '));
  process.exit(1);
}
console.log('store-shots-fixture: OK');
