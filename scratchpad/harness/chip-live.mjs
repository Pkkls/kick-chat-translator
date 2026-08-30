/**
 * Renders the language chip in a real browser, against a real Kick-shaped DOM.
 *
 * The happy-dom harness could not test the one thing that matters most here:
 * where the chip lands. `findComposerRow` decides by measuring, and happy-dom
 * returns zeros for every rect, so `isSideBySide` was always false and the chip
 * fell back to the top of the panel in every snapshot. A harness that cannot
 * fail the anchoring is not evidence about the anchoring.
 *
 * So: bundle the real module with esbuild, load it in Chrome, and let layout
 * happen. Writes chip-live.html (open menu included) and asserts the chip's
 * anchor rather than trusting the picture.
 *
 *   node scratchpad/harness/chip-live.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BUNDLE = path.join(HERE, 'chip-bundle.js');

const esbuild = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href);
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/content/langChip.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'Chip',
  define: { __KT_METRICS__: 'false' },
  alias: { '~': path.join(ROOT, 'src') },
  outfile: BUNDLE,
});

const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');
const js = readFileSync(BUNDLE, 'utf8');

/**
 * Kick's composer, copied from the live DOM rather than imagined.
 *
 * Measured on a channel on 2026-08-27: the action bar is `DIV.flex.shrink-0`
 * sitting below the composer's block as a sibling of its grandparent, and it
 * holds a left group and an `ml-auto` group carrying the gear and Chat.
 *
 * The left group renders at HEIGHT ZERO on a followers-only channel, and that
 * is the whole point of copying it. The previous harness gave the bar two
 * visible children, so it agreed with an anchor test that asked for two, and
 * the gate stayed green while the chip landed above the message box on the real
 * site. A harness only contains what its author thought the page contained.
 */
const STAGE = `
<div class="panel">
  <div class="chatlog">
    <div class="line"><b>viewer_23:</b> hola a todos</div>
    <div class="line"><b>another_one:</b> good morning</div>
  </div>
  <div class="col">
    <div class="grow">
      <div class="wfull">
        <div class="badge"></div>
        <div class="relwrap">
          <div class="composer editor-input" contenteditable="true">Send a message</div>
          <div class="placeholder"></div>
        </div>
        <button type="button" class="fake emoji">emote</button>
      </div>
    </div>
    <div class="bar">
      <div class="leftgroup"></div>
      <div class="right">
        <button type="button" class="fake">settings</button>
        <button type="button" class="fake">Chat</button>
      </div>
    </div>
  </div>
</div>`;

const PAGE = (scheme, dir) => `<!doctype html>
<html lang="en" dir="${dir}" data-kt-scheme="${scheme}">
<head><meta charset="utf-8"><title>lang chip, live</title>
<style>${css}</style>
<style>
  :root { --ground: ${scheme === 'light' ? '#ffffff' : '#0b0b0c'};
          --surface: ${scheme === 'light' ? '#f4f4f5' : '#171a1c'};
          --raised: ${scheme === 'light' ? '#e4e4e7' : '#42474d'};
          --ink: ${scheme === 'light' ? '#0b0b0c' : '#ffffff'}; }
  body { margin:0; padding:20px; background:var(--ground); color:var(--ink);
         font:14px/1.45 system-ui, sans-serif; }
  .panel { inline-size:340px; background:var(--surface); border-radius:8px; padding:10px; }
  .chatlog { min-block-size:90px; margin-bottom:10px; font-size:13px; }
  .line { padding:3px 0; }
  .col { display:flex; flex-direction:column; }
  .grow { display:flex; flex-grow:1; }
  .wfull { display:flex; inline-size:100%; }
  .badge { inline-size:29px; }
  .relwrap { position:relative; inline-size:100%; }
  .composer { min-block-size:38px; padding:9px 10px; border-radius:4px;
              background:var(--ground); opacity:.85; }
  .placeholder { position:absolute; pointer-events:none; inset-inline-start:10px; top:9px; }
  /* The bar, and its left group collapsed to nothing, as Kick renders it on a
     followers-only channel. */
  .bar { display:flex; margin-top:8px; }
  .leftgroup { display:flex; gap:4px; block-size:0; }
  .right { display:flex; gap:6px; margin-inline-start:auto; align-items:center; }
  .fake { min-block-size:24px; padding:2px 10px; border:0; border-radius:4px;
          background:var(--raised); color:var(--ink); font:inherit; }
</style></head>
<body>${STAGE}<script>${js}</script></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const report = [];

for (const [scheme, dir] of [
  ['dark', 'ltr'],
  ['light', 'ltr'],
  ['dark', 'rtl'],
]) {
  const name = `chip-live-${scheme}${dir === 'rtl' ? '-rtl' : ''}`;
  const page = await browser.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 2 });
  await page.setContent(PAGE(scheme, dir));
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

  await page.evaluate(() => {
    window.Chip.mountLangChip(
      document.querySelector('.composer'),
      { mode: 'pinned', code: 'ja', favorites: ['ja', 'es', 'pt'] },
      { onPick: () => undefined, onAuto: () => undefined },
    );
  });

  // Where did it actually land? This is the assertion the old harness could
  // not make: the chip must sit inside the action bar's right-hand cluster,
  // ahead of the gear, not floating above the message box.
  const anchor = await page.evaluate(() => {
    const chip = document.querySelector('.kt-chip');
    // .kt-chip-host, pas .kt-chip-wrap : cette classe n existe nulle part dans
    // le produit, et le repli sur parentElement faisait le travail en silence.
    // Un selecteur mort derriere un ?? est un selecteur que personne ne verra
    // mourir.
    const wrap = chip.closest('.kt-chip-host') ?? chip.parentElement;
    const composer = document.querySelector('.composer');
    const right = document.querySelector('.right');
    const cr = chip.getBoundingClientRect();
    const mr = composer.getBoundingClientRect();
    return {
      dansLeClusterDroit: right.contains(chip),
      premierDuCluster: right.firstElementChild === wrap,
      voisinSuivant: (wrap.nextElementSibling?.textContent ?? '').trim(),
      ecartVerticalAvecSaisie: +(cr.top - mr.bottom).toFixed(1),
      taille: `${cr.width.toFixed(0)}x${cr.height.toFixed(0)}`,
    };
  });

  await page.mouse.move(2000, 2000);
  await page.screenshot({ path: path.join(HERE, `${name}.png`) });

  // The caret, which no longer splits the button.
  //
  // This asserted the opposite until the split was removed: a click on the code
  // had to toggle the language and leave the list shut, and only a click on the
  // caret opened it. That caret measured 10x6 on a 45x24 chip, where WCAG 2.5.8
  // asks 24x24 of a target, and missing it did something else entirely. One
  // click opens the list now, wherever on the chip it lands, so the two clicks
  // below are the same control opening and then closing.
  //
  // The caret stays measured because it is still the sign that a list exists.
  // It is a stroke, so the contrast script that walks text elements never sees
  // it, and WCAG 1.4.11 asks 3:1 of a control's own graphics. The dark grey it
  // inherits is a dark-ground colour; dropped onto the light chip unchanged it
  // would land near 2:1.
  const caret = await page.evaluate(() => {
    const c = document.querySelector('.kt-chip-caret');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const rgb = (v) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = ([r0, g0, b0]) => {
      const f = (n) => {
        const s = n / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r0) + 0.7152 * f(g0) + 0.0722 * f(b0);
    };
    const stroke = rgb(getComputedStyle(c.querySelector('svg')).stroke || getComputedStyle(c).color);
    const chip = rgb(getComputedStyle(document.querySelector('.kt-chip')).backgroundColor);
    const [a, b] = [lum(stroke), lum(chip)].sort((x, y) => y - x);
    return {
      largeur: +r.width.toFixed(1),
      hauteur: +r.height.toFixed(1),
      contraste: +((a + 0.05) / (b + 0.05)).toFixed(2),
    };
  });
  const tagBox = await page.locator('.kt-chip-tag').boundingBox();
  await page.mouse.click(tagBox.x + tagBox.width / 2, tagBox.y + tagBox.height / 2);
  await page.waitForTimeout(80);
  const apresClicCode = await page.evaluate(() =>
    document.querySelector('.kt-chip').getAttribute('aria-expanded'),
  );
  const caretBox = await page.locator('.kt-chip-caret').boundingBox();
  await page.mouse.click(caretBox.x + caretBox.width / 2, caretBox.y + caretBox.height / 2);
  await page.waitForTimeout(80);
  const apresClicCaret = await page.evaluate(() =>
    document.querySelector('.kt-chip').getAttribute('aria-expanded'),
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  await page.mouse.move(2000, 2000);

  // Open the menu and check it stays inside the viewport.
  //
  // A plain click will not do it: a short click toggles the language and the
  // list opens on a hold (HOLD_MS = 400) or on ArrowDown. Clicking and then
  // reporting "the menu never opens" is a broken probe, not a bug.
  const box = await page.locator('.kt-chip').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(550);
  await page.mouse.up();
  await page.waitForTimeout(150);
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.kt-chip-menu');
    const r = m.getBoundingClientRect();
    return {
      ouvert: document.querySelector('.kt-chip').getAttribute('aria-expanded'),
      hauteur: +r.height.toFixed(0),
      deborde: r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight,
      options: m.querySelectorAll('[role=option]').length,
      listbox: m.querySelector('[role=listbox]') !== null,
      champRecherche: m.querySelector('.kt-chip-search') !== null,
      focusDansLeMenu: m.contains(document.activeElement),
      // La frontiere du menu. Son aplat #171a1c contre le sol du chat #0b0b0c
      // ne donne que 1.13:1, donc c est ce filet qui separe, seul, et WCAG
      // 1.4.11 lui demande 3:1.
      filet: (() => {
        const cs = getComputedStyle(m);
        const px = (v) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lin = (c) => {
          const x = c / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        };
        const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const a = L(px(cs.outlineColor));
        const b = L(px(cs.backgroundColor));
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
      })(),
      hauteursDistinctes: [
        ...new Set(
          [...m.querySelectorAll('.kt-chip-row')].map((r) =>
            Math.round(r.getBoundingClientRect().height),
          ),
        ),
      ],
    };
  });
  await page.screenshot({ path: path.join(HERE, `${name}-open.png`) });
  // Serialised so the UX kit's contrast and target-size scripts audit the chip
  // as this module actually renders it. The lang-chip*.html files beside this
  // one were written by a hand-typed harness and describe a chip that no longer
  // exists; auditing those is auditing a memory.
  writeFileSync(path.join(HERE, `${name}.html`), await page.content(), 'utf8');
  // Le clavier, dans un navigateur ou les ecouteurs existent.
  //
  // La porte clavier du kit lit le dump HTML de ce harnais et rapporte que les
  // fleches ne bougent jamais le focus. C'est vrai du fichier et faux du
  // produit : le dump porte le DOM rendu, pas les ecouteurs, parce que le
  // montage se fait par page.evaluate et n'est pas dans la page sauvegardee.
  // La mesure qui tranche se prend ici, la page vivante.
  const clavier = await page.evaluate(async () => {
    const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
    const chip = document.querySelector('.kt-chip');
    if (!chip) return { erreur: 'pas de puce' };
    if (document.querySelector('.kt-chip-menu')?.hidden !== false) chip.click();
    await attendre(200);
    const menu = document.querySelector('.kt-chip-menu');
    if (!menu || menu.hidden) return { erreur: 'le menu ne s ouvre pas' };
    const rangees = [...menu.querySelectorAll('.kt-chip-row:not([hidden])')];
    if (rangees.length < 10) return { erreur: `seulement ${rangees.length} rangees` };
    const index = () => rangees.indexOf(document.activeElement);
    const touche = (key) =>
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    rangees[6].focus();
    const depart = index();
    touche('ArrowDown');
    const bas = index();
    touche('ArrowRight');
    const droite = index();
    touche('ArrowUp');
    const haut = index();
    return {
      depart,
      sautBas: bas - depart,
      sautDroite: droite - bas,
      sautHaut: haut - droite,
      colonnes: getComputedStyle(menu.querySelector('.kt-chip-list')).getPropertyValue('--kt-chip-cols').trim(),
    };
  });
  console.log(`${name} clavier`, JSON.stringify(clavier));

  await page.close();

  report.push({ name, anchor, caret, apresClicCode, apresClicCaret, menu, clavier });
}

await browser.close();
writeFileSync(path.join(HERE, 'chip-live.json'), JSON.stringify(report, null, 1), 'utf8');
for (const r of report) {
  console.log(
    r.name,
    JSON.stringify(r.anchor),
    JSON.stringify({ caret: r.caret, clicCode: r.apresClicCode, clicCaret: r.apresClicCaret }),
    JSON.stringify(r.menu),
  );
}

// A script that prints numbers and always exits 0 is a report, not a gate.
// These are the four things that were actually wrong at some point: the chip
// floating above the message box, the menu running off the top of the window,
// the list never opening, and rows of uneven height because a hyphenated ISO
// code wrapped.
const failures = [];
for (const { name, anchor, caret, apresClicCode, apresClicCaret, menu, clavier } of report) {
  if (!caret) failures.push(`${name}: pas de caret, la liste reste invisible a la souris`);
  else if (caret.largeur < 8) failures.push(`${name}: caret de ${caret.largeur}px, trop fin pour se voir`);
  else if (caret.contraste < 3) failures.push(`${name}: caret a ${caret.contraste}:1, WCAG 1.4.11 en veut 3`);
  // Un clic, ou qu il tombe, ouvre la liste ; le suivant la referme. Le
  // controle est un seul bouton qui bascule, pas deux moities aux roles
  // differents. Les deux assertions restent, retournees : une seule des deux
  // laisserait passer une puce qui ouvre au premier clic et ne referme jamais.
  // Le clavier de la grille, asserte et pas seulement imprime.
  //
  // La porte clavier du kit lit le dump HTML de ce harnais et rapporte que les
  // fleches ne bougent jamais le focus. Vrai du fichier, faux du produit : le
  // dump porte le DOM rendu et pas les ecouteurs, puisque le montage passe par
  // page.evaluate. Ces trois nombres se prennent dans la page vivante, ou les
  // ecouteurs existent, et ils sont ce que la porte du kit ne peut pas voir.
  if (clavier.erreur) failures.push(`${name}: clavier non mesure, ${clavier.erreur}`);
  else {
    if (clavier.colonnes !== '3') failures.push(`${name}: la grille annonce ${clavier.colonnes} colonnes`);
    if (clavier.sautBas !== 3) failures.push(`${name}: Bas saute de ${clavier.sautBas} au lieu d une rangee de 3`);
    if (clavier.sautDroite !== 1) failures.push(`${name}: Droite saute de ${clavier.sautDroite} au lieu de 1`);
    if (clavier.sautHaut !== -3) failures.push(`${name}: Haut saute de ${clavier.sautHaut} au lieu de -3`);
  }
  if (apresClicCode !== 'true') failures.push(`${name}: un clic sur le code n ouvre pas la liste`);
  if (apresClicCaret !== 'false') failures.push(`${name}: un second clic ne referme pas la liste`);
  if (!anchor.dansLeClusterDroit) failures.push(`${name}: la puce n est pas dans le cluster droit`);
  if (!anchor.premierDuCluster) failures.push(`${name}: la puce n ouvre pas le cluster`);
  if (anchor.voisinSuivant !== 'settings') failures.push(`${name}: voisin ${anchor.voisinSuivant}, attendu settings`);
  if (menu.ouvert !== 'true') failures.push(`${name}: le menu ne s ouvre pas sur appui long`);
  if (menu.deborde) failures.push(`${name}: le menu sort du viewport`);
  if (!menu.listbox) failures.push(`${name}: pas de listbox`);
  if (menu.options < 40) failures.push(`${name}: ${menu.options} options, attendu au moins 40`);
  if (menu.filet < 3) failures.push(`${name}: filet du menu a ${menu.filet}:1, WCAG 1.4.11 en veut 3`);
  if (menu.hauteursDistinctes && menu.hauteursDistinctes.length > 1) {
    failures.push(`${name}: rangees de hauteurs ${menu.hauteursDistinctes.join('/')}`);
  }
}
if (failures.length) {
  console.error();
  console.error('chip-live: ' + failures.length + ' echec(s)');
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(
  'chip-live: OK - ancrage, un clic ouvre et le suivant referme, caret visible, bornage viewport, rangees regulieres.',
);
