/**
 * The injected chat, mirrored.
 *
 * Arabic is one of the ten interface languages and one of the languages people
 * actually chat in, and inject.css already argues the point at .kt-chip-menu:
 * "Logical, not physical: in an Arabic interface the message box mirrors, and a
 * menu pinned to the physical right would hang off the wrong edge."
 *
 * Everything written after that follows it. The chat lines came before, and
 * nothing had ever rendered them mirrored: the chip harness runs an RTL pass,
 * the chat harness never has.
 *
 * Asserted on the LOGICAL edges, which is the contract itself: the green bar
 * marking a translation belongs on the side the text starts from, whichever
 * side that is.
 *
 *   node scratchpad/harness/rtl-live.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BUNDLE = path.join(HERE, 'rtl-bundle.js');

const esbuild = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href);
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/content/injector.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'Injector',
  define: { __KT_METRICS__: 'false' },
  alias: { '~': path.join(ROOT, 'src') },
  outfile: BUNDLE,
});

const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');
const js = readFileSync(BUNDLE, 'utf8');

/** Real Arabic traffic, translated into French, which is what an Arabic
    interface reading an Arabic chat in French looks like. */
const LINES = [
  ['viewer_23', 'صباح الخير للجميع', 'ar', 'bonjour a tous'],
  ['another_one', 'هذا البث ممتع جدا', 'ar', 'ce stream est vraiment sympa'],
  ['third_user', 'من هذا الرجل', 'ar', 'c est qui ce type'],
];

const PAGE = (dir) => `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}" data-kt-scheme="dark">
<head><meta charset="utf-8"><title>chat ${dir}</title>
<style>${css}</style>
<style>
  body { margin:0; padding:16px; background:#0b0b0c; color:#fff;
         font:14px/1.45 system-ui, sans-serif; }
  .chat { inline-size:340px; background:#171a1c; border-radius:8px; padding:8px; }
  .row { padding:3px 4px; }
  .font-bold { font-weight:700; color:#53fc18; }
</style></head>
<body><div class="chat"></div><script>${js}</script></body></html>`;

const STYLES = ['below', 'inline', 'replace'];

const browser = await chromium.launch({ channel: 'chrome' });
const report = [];

for (const dir of ['ltr', 'rtl']) {
  for (const style of STYLES) {
    const page = await browser.newPage({ viewport: { width: 400, height: 340 }, deviceScaleFactor: 2 });
    await page.setContent(PAGE(dir));

    const measured = await page.evaluate(
      ({ lines, style }) => {
        const { inject } = window.Injector;
        const chat = document.querySelector('.chat');
        chat.textContent = '';
        for (const [who, said, lang, meaning] of lines) {
          const row = document.createElement('div');
          row.className = 'row';
          const name = document.createElement('span');
          name.className = 'font-bold';
          name.textContent = who + ': ';
          const text = document.createElement('span');
          text.className = 'font-normal';
          text.textContent = said;
          row.append(name, text);
          chat.appendChild(row);
          inject(
            row,
            {
              messageId: style + who,
              translatedText: meaning,
              detectedLang: lang,
              provider: 'deepl',
              cached: false,
            },
            { displayStyle: style, showOriginal: true, showSourceBadge: true, showProviderBadge: true },
            () => undefined,
          );
        }

        const cls = { below: 'kt-translation', inline: 'kt-translation-inline', replace: 'kt-translation-replace' }[style];
        const el = document.querySelector('.' + cls);
        const cs = getComputedStyle(el);
        const px = (v) => (v || '0px').trim();
        const flag = document.querySelector('.kt-flag');
        const provider = document.querySelector('.kt-provider');
        const retry = document.querySelector('.kt-retry');
        const logical = (node, prop) => (node ? px(getComputedStyle(node)[prop]) : null);
        return {
          bordDebut: px(cs.borderInlineStartWidth),
          bordFin: px(cs.borderInlineEndWidth),
          margeDebut: px(cs.marginInlineStart),
          margeFin: px(cs.marginInlineEnd),
          padDebut: px(cs.paddingInlineStart),
          padFin: px(cs.paddingInlineEnd),
          // The LOGICAL corners. Reading the `border-radius` shorthand reports
          // "0 4px 4px 0" against "4px 0 0 4px", which is not a fault: it is
          // exactly what correct mirroring looks like from the physical side.
          rayonDebutHaut: px(cs.borderStartStartRadius),
          rayonFinHaut: px(cs.borderStartEndRadius),
          drapeauFin: logical(flag, 'marginInlineEnd'),
          drapeauDebut: logical(flag, 'marginInlineStart'),
          fournisseurDebut: logical(provider, 'marginInlineStart'),
          reessaiDebut: logical(retry, 'marginInlineStart'),
        };
      },
      { lines: LINES, style },
    );

    const name = `rtl-${dir}-${style}`;
    await page.screenshot({ path: path.join(HERE, `${name}.png`) });
    writeFileSync(path.join(HERE, `${name}.html`), await page.content(), 'utf8');
    await page.close();
    report.push({ dir, style, ...measured });
  }
}
await browser.close();

for (const r of report) {
  console.log(
    `${r.dir} ${r.style.padEnd(8)} bord ${r.bordDebut}/${r.bordFin}  marge ${r.margeDebut}/${r.margeFin}` +
      `  pad ${r.padDebut}/${r.padFin}  rayon ${r.rayonDebutHaut}/${r.rayonFinHaut}  drapeau ${r.drapeauDebut}/${r.drapeauFin}` +
      `  fournisseur ${r.fournisseurDebut}  reessai ${r.reessaiDebut}`,
  );
}

// The contract: every one of these is a LOGICAL edge, so its value must be the
// same whichever way the line runs. A number that changes between the two
// directions is a physical property wearing a logical name.
const failures = [];
const byKey = new Map();
for (const r of report) {
  for (const [k, v] of Object.entries(r)) {
    if (k === 'dir' || k === 'style' || v === null) continue;
    const key = `${r.style}.${k}`;
    if (!byKey.has(key)) byKey.set(key, {});
    byKey.get(key)[r.dir] = v;
  }
}
for (const [key, sides] of byKey) {
  if (sides.ltr !== sides.rtl) {
    failures.push(`${key}: ${sides.ltr} en ltr contre ${sides.rtl} en rtl`);
  }
}
// And the bar itself: the green rule marks the start of the translation, so it
// belongs on the side the text starts from and nowhere else.
for (const r of report) {
  if (r.style === 'replace') continue; // replace paints no bar, it IS the message
  if (r.bordDebut !== '2px' || r.bordFin !== '0px') {
    failures.push(`${r.dir}/${r.style}: filet a ${r.bordDebut} au debut et ${r.bordFin} a la fin`);
  }
}

if (failures.length) {
  console.error();
  console.error('rtl-live: ' + failures.length + ' echec(s)');
  for (const f of [...new Set(failures)]) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log('rtl-live: OK - toutes les aretes sont logiques, le filet suit le sens de lecture.');
