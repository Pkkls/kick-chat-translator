/**
 * The language panel, opened from the real floating bar in a real browser.
 *
 * The unit suite proves the wiring in jsdom, where nothing has a size. This is
 * the part jsdom cannot answer: whether the panel opens where it should, how
 * much of the chat it covers, and whether it stays inside the window. The bar
 * used to open a native <select> whose list covered 845 of the chat panel's
 * 890 pixels; the number that replaces it has to be measured, not assumed.
 *
 * Its own bundle. bar-live.mjs owns bar-bundle.js, and two harnesses writing
 * one file is how a test ends up reading another test's code.
 *
 *   node scratchpad/harness/bar-panel-live.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
import { auditerDump } from './a11y.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BUNDLE = path.join(HERE, 'bar-panel-bundle.js');

const esbuild = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href);
await esbuild.build({
  stdin: {
    contents:
      "export * from './src/content/injector';\n" +
      "export { setContentLocale } from './src/content/msg';\n" +
      "export { defaultSettings } from './src/shared/settings';\n",
    resolveDir: ROOT,
    sourcefile: 'bar-panel-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  globalName: 'Injector',
  define: { __KT_METRICS__: 'false' },
  alias: { '~': path.join(ROOT, 'src') },
  outfile: BUNDLE,
});

const js = readFileSync(BUNDLE, 'utf8');
// esbuild does not know Vite's `?inline`, so the import that carries the
// stylesheet in production resolves to nothing here. Read it off disk, the way
// bar-live.mjs already does, or the panel renders unstyled and every
// measurement below is about the wrong thing.
const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');

// Kick's chat column, at the size measured on a live channel.
const PAGE = `<!doctype html><html lang="en" data-kt-scheme="dark"><head><meta charset="utf-8">
<title>bar panel stage</title><style>
${css}
  html, body { margin: 0; background: #0b0b0c; }
  #panel { width: 340px; height: 890px; background: #101012; overflow: hidden;
           display: flex; flex-direction: column; }
  #filler { flex: 1; }
</style></head><body>
  <div id="panel"><div id="filler"></div></div>
  <script>${js}</script>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.setContent(PAGE);

const picked = [];
await page.exposeFunction('kt_pick', (code) => void picked.push(code));

await page.evaluate(() => {
  const I = window.Injector;
  I.ensureStyles();
  I.mountFloatingBar(document.getElementById('panel'), {
    ...I.defaultSettings(),
    enabled: true,
    targetLang: 'ru',
    favoriteLangs: ['ja', 'tr', 'fr', 'ru'],
  }, {
    onToggle: () => {},
    onTargetLang: (c) => window.kt_pick(c),
    onOpenOptions: () => {},
    onEnableLocal: () => {},
  });
});

const btn = page.locator('.kt-float-lang');
const panel = page.locator('.kt-lang-panel');

const shut = await panel.evaluate((el) => el.hidden);
await btn.click();
const open = await panel.evaluate((el) => el.hidden);

const diagnostic = await page.evaluate(() => {
  const el = document.querySelector('.kt-lang-panel');
  const r = el.getBoundingClientRect();
  return {
    classes: el.className,
    styleEnLigne: el.getAttribute('style') || '(aucun)',
    position: getComputedStyle(el).position,
    gauche: Math.round(r.left),
    largeur: Math.round(r.width),
    parentPositionne: (() => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        if (getComputedStyle(n).position !== 'static') {
          const b = n.getBoundingClientRect();
          return n.className.slice(0, 40) + ' @' + Math.round(b.left) + ' w' + Math.round(b.width);
        }
      }
      return '(aucun, donc le viewport)';
    })(),
  };
});
console.log('diagnostic', JSON.stringify(diagnostic));

const m = await page.evaluate(() => {
  const box = (s) => document.querySelector(s).getBoundingClientRect();
  const chat = box('#panel');
  const p = box('.kt-lang-panel');
  const rows = [...document.querySelectorAll('.kt-lang-row')];
  const heights = [...new Set(rows.map((r) => Math.round(r.getBoundingClientRect().height)))];
  return {
    chatH: Math.round(chat.height),
    panelH: Math.round(p.height),
    part: Math.round((p.height / chat.height) * 100),
    // Les quatre bords, pas un booleen. Un "ca deborde" ne dit ni de combien ni
    // de quel cote, et une tolerance d'un pixel evite de signaler un arrondi
    // sous-pixel comme un defaut : c'est arrive sur ce panneau, 0.2px rapportes
    // comme hors ecran.
    bords: {
      haut: Math.round(p.top),
      gauche: Math.round(p.left),
      droite: +(innerWidth - p.right).toFixed(1),
      bas: +(innerHeight - p.bottom).toFixed(1),
    },
    escapesWindow: p.top < -1 || p.left < -1 || p.right > innerWidth + 1 || p.bottom > innerHeight + 1,
    // Par le code, plus par le texte visible : la tuile imprimait son code sous
    // le drapeau a 9px, ce que personne ne lisait et qui repetait son nom
    // accessible. Le drapeau a pris la place, donc l'identite se lit dans
    // dataset.code et le nom dans aria-label.
    tiles: [...document.querySelectorAll('.kt-lang-fav')].map((t) => t.dataset.code ?? ''),
    tilesNommees: [...document.querySelectorAll('.kt-lang-fav')].every(
      (t) => (t.getAttribute('aria-label') ?? '').length > 1,
    ),
    rowHeights: heights,
    // The auto row carries a globe, not a flag, and that is the point: no
    // country speaks "the channel's language". Every other row must draw one.
    flagsDrawn: rows.filter((r) => {
      const f = r.querySelector('.kt-flag');
      if (!f) return false;
      const s = getComputedStyle(f);
      return s.backgroundImage !== 'none' || s.backgroundColor !== 'rgba(0, 0, 0, 0)';
    }).length,
    globes: rows.filter((r) => r.querySelector('.kt-lang-globe svg')).length,
    rows: rows.length,
  };
});

// Filtering has to actually hide rows: an element set to display:flex ignores
// the hidden attribute unless a rule says otherwise, and that rule was missing
// once already.
await page.locator('.kt-lang-input').fill('por');
const afterFilter = await page.evaluate(
  () => [...document.querySelectorAll('.kt-lang-row')].filter((r) => r.offsetParent !== null).length,
);

await page.screenshot({ path: path.join(HERE, 'bar-panel-live.png'), clip: { x: 0, y: 0, width: 380, height: 420 } });

// Picking closes the panel and reports the code.
await page.locator('.kt-lang-input').fill('');
// Le panneau entier, filtre vide, pour les portes d accessibilite.
const rangeesVisiblesAuDump = await page.evaluate(
  () => [...document.querySelectorAll('.kt-lang-row')].filter((r) => r.offsetParent !== null).length,
);
writeFileSync(path.join(HERE, 'bar-panel-live.html'), await page.content(), 'utf8');
// Ce que le dump porte reellement, mesure dans la page et pas dans le fichier.
// Les portes d accessibilite ci-dessous passent aussi bien sur deux rangees que
// sur quarante : la taille de cible ne compte pas les cibles, elle mesure celles
// qu elle trouve. Un dump pris le filtre encore rempli en a livre 2 sur 43 et la
// porte est restee verte. Compter dans le HTML ne marche pas non plus : la
// feuille de style y est inlinee, donc `hidden` et les selecteurs de rangee y
// apparaissent en texte et polluent le compte.
await page.locator('.kt-lang-fav').first().click();
const shutAgain = await panel.evaluate((el) => el.hidden);

await browser.close();

const fails = [];
if (rangeesVisiblesAuDump !== m.rows)
  fails.push(`le dump audite montre ${rangeesVisiblesAuDump} rangees sur ${m.rows} : il a ete pris dans un etat filtre`);
fails.push(...(await auditerDump(path.join(HERE, 'bar-panel-live.html'), 'bar-panel')));
if (!shut) fails.push('the panel was already open before the button was clicked');
if (open) fails.push('the button did not open the panel');
if (m.escapesWindow) fails.push(`the panel leaves the window: ${JSON.stringify(m.bords)}`);
// Le panneau a grandi en hauteur exprès : la liste montrait 6 rangees sur 40,
// elle en montre 25. Le seuil de 45% datait d'avant et mordait a 46. Ce que
// cette assertion protege est l'ecart avec la liste native de Kick, qui couvre
// 95% ; a 60 elle le protege toujours et laisse vivre le choix fait depuis.
if (m.part > 60) fails.push(`covers ${m.part}% of the chat, the native list covered 95%`);
if (m.rowHeights.length !== 1) fails.push(`uneven rows: ${m.rowHeights.join(', ')}px`);
if (m.tiles.join(',') !== 'ja,tr,fr,ru') fails.push(`favourite tiles are ${m.tiles.join(',') || '(vides)'}`);
if (!m.tilesNommees) fails.push('une tuile de favori sans nom accessible : le drapeau seul ne se lit pas au lecteur d ecran');
if (m.globes !== 1) fails.push(`${m.globes} rows carry a globe, expected exactly the auto row`);
if (m.flagsDrawn !== m.rows - 1)
  fails.push(`${m.rows - 1 - m.flagsDrawn} of ${m.rows - 1} language rows draw no flag`);
if (afterFilter >= m.rows) fails.push(`filtering hid nothing: ${afterFilter}/${m.rows}`);
if (!shutAgain) fails.push('picking left the panel open');
if (picked[0] !== 'ja') fails.push(`picking reported ${picked[0] ?? 'nothing'}`);

console.log(`panel      ${m.panelH}px of ${m.chatH}px, ${m.part}% (native list: 95%)`);
console.log(`rows       ${m.rowHeights.join(', ')}px, ${m.rows} of them, ${m.flagsDrawn} flags + ${m.globes} globe`);
console.log(`favourites ${m.tiles.join(' ')}`);
console.log(`filter     "por" leaves ${afterFilter} rows`);
console.log(`picking    reported ${picked.join(',') || 'nothing'}, panel shut: ${shutAgain}`);
if (fails.length) {
  console.error('FAIL: ' + fails.join(' ; '));
  process.exit(1);
}
console.log('bar-panel-live: OK');
