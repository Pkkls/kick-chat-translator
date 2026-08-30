/**
 * Ce que le selecteur de langue de la barre coute aujourd'hui, sur une vraie
 * page Kick.
 *
 * Etape 1 du prompt : mesurer avant de dessiner. Trois choses, et une quatrieme
 * qui ne se mesure pas et qu'il faut dire au lieu de l'inventer.
 *
 *   - la hauteur du panneau de chat, qui est le budget dans lequel une liste
 *     doit tenir ;
 *   - la boite du `<select>` replie, et le nombre d'options qu'il porte ;
 *   - le cout clavier : combien d'arrets de tabulation pour traverser la barre,
 *     ce qu'une liste maison devra racheter ;
 *   - la hauteur du menu deroulant OUVERT est **impossible** a lire depuis la
 *     page : un menu natif est dessine par le systeme, hors du document. C'est
 *     l'argument, pas une mesure, et ce script ne pretend pas le mesurer.
 *
 * Compare au `.kt-chip-menu`, qui lui se mesure, et dont chip-live.json dit 296px.
 *
 *   node scratchpad/harness/bar-select.mjs
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const PROFILE = path.join(HERE, 'profile-barselect');

// Profil neuf : Chrome sert le service worker enregistre dans le profil, pas
// celui du dist qu'on vient de reconstruire.
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(PROFILE, { recursive: true });

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
await page.waitForTimeout(5000);

const candidates = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="/"]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && /^\/[a-z0-9_-]+$/i.test(h) && !/^\/(browse|categories|following|search)$/i.test(h))
    .slice(0, 12),
);

let live = null;
for (const c of candidates) {
  await page.goto('https://kick.com' + c, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(7000);
  const ready = await page.evaluate(
    () =>
      document.querySelectorAll('#channel-chatroom [data-index]').length >= 8 &&
      document.querySelector('.kt-float-lang') !== null,
  );
  if (ready) {
    live = c;
    break;
  }
}
if (!live) {
  console.error('aucune chaine avec du chat ET la barre montee.');
  await ctx.close();
  process.exit(2);
}

const m = await page.evaluate(() => {
  const panel = document.querySelector('#channel-chatroom');
  const bar = document.querySelector('.kt-float');
  const sel = document.querySelector('.kt-float-lang');
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  // Les arrets de tabulation de la barre, dans l'ordre du document.
  const focusables = [...bar.querySelectorAll('a[href], button, select, input, [tabindex]')].filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1',
  );
  return {
    panneau: box(panel),
    barre: box(bar),
    selectReplie: box(sel),
    options: sel.options.length,
    arretsBarre: focusables.length,
    ordreBarre: focusables.map((el) => el.className.split(' ')[0] || el.tagName.toLowerCase()),
  };
});

await page.locator('#channel-chatroom').screenshot({ path: path.join(HERE, 'bar-select.png') }).catch(() => {});
await ctx.close();

const rows = m.options;
const ROW = 30; // hauteur d'une rangee du .kt-chip-menu, mesuree par chip-live
console.log(`chaine ${live}`);
console.log(`panneau de chat        ${m.panneau.w} x ${m.panneau.h}`);
console.log(`barre                  ${m.barre.w} x ${m.barre.h}`);
console.log(`select replie          ${m.selectReplie.w} x ${m.selectReplie.h}`);
console.log(`options                ${rows}`);
console.log(`arrets de tabulation   ${m.arretsBarre}  (${m.ordreBarre.join(', ')})`);
console.log();
console.log('ce qu une liste maison coute, a 30px la rangee :');
for (const n of [5, 8, 10]) {
  const h = n * ROW + 38; // + le champ de filtre
  console.log(
    `  ${n} rangees  ${String(h).padStart(4)}px  soit ${((h / m.panneau.h) * 100).toFixed(0)}% du panneau`,
  );
}
console.log();
console.log(
  `pour memoire : .kt-chip-menu est borne a min(320px, 60vh) et chip-live.json le mesure a 296px, ` +
    `soit ${((296 / m.panneau.h) * 100).toFixed(0)}% de ce panneau.`,
);
console.log(
  'la hauteur du deroulant natif OUVERT n est pas lisible depuis la page : il est dessine par le systeme.',
);
