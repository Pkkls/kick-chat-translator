/**
 * The popup and the options page, rendered both ways round.
 *
 * `rtl-live.mjs` does this for the chat. Nothing did it for these two, and
 * Arabic is a shipped interface language. Nine physical utilities were sitting
 * in their markup: the master switch pushed with `ml-auto`, its knob positioned
 * with `left-[18px]`, the debug table's `text-left` and `pr-3`, the language
 * grid's scrollbar gutter.
 *
 * Every edge is read LOGICALLY - distance from the container's inline start -
 * and has to give the same number in both directions. A layout that only looks
 * right in one of them gives two.
 *
 * Run after `node snapshot.mjs`:
 *   node scratchpad/harness/rtl-surfaces.mjs
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SURFACES = [
  ['popup', path.join(HERE, 'popup.html')],
  ...readdirSync(path.join(HERE, 'options'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [`options/${f.replace('.html', '')}`, path.join(HERE, 'options', f)]),
];

/**
 * Elements whose placement carries meaning, not decoration.
 *
 * Named structurally, never by the class under test. `header .ms-auto` looked
 * fine and was not: reverting that very class to `ml-auto` made the landmark
 * vanish from both passes instead of disagreeing between them, and the gate
 * went quiet on the defect it exists for.
 */
const WATCHED = [
  'header > div:last-child',
  '[role=tablist]',
  '[role=tab]',
  'input[type=checkbox] + span > span',
  'table td',
  'table th',
  '.kt-select',
  '.kt-input',
  '.kt-btn',
  '.kt-btn-ghost',
];

const browser = await chromium.launch();
const failures = [];
let compared = 0;

for (const [name, file] of SURFACES) {
  const read = async (dir) => {
    const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, colorScheme: 'dark' });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate((d) => document.documentElement.setAttribute('dir', d), dir);
    await page.waitForTimeout(250);
    const out = await page.evaluate((watched) => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      // Distance from the container's inline start, whichever side that is.
      const startOf = (el, host) => {
        const a = el.getBoundingClientRect();
        const b = host.getBoundingClientRect();
        return +(rtl ? b.right - a.right : a.left - b.left).toFixed(1);
      };
      const rows = [];
      for (const sel of watched) {
        const found = [...document.querySelectorAll(sel)].slice(0, 6);
        found.forEach((el, i) => {
          const host = el.offsetParent ?? document.body;
          rows.push({
            key: `${sel}#${i}`,
            start: startOf(el, host),
            width: +el.getBoundingClientRect().width.toFixed(1),
            align: getComputedStyle(el).textAlign,
          });
        });
      }
      const doc = document.documentElement;
      return { rows, overflow: doc.scrollWidth - doc.clientWidth };
    }, WATCHED);
    await page.close();
    return out;
  };

  const ltr = await read('ltr');
  const rtl = await read('rtl');

  if (rtl.overflow > 0) failures.push(`${name}: la page deborde de ${rtl.overflow}px en RTL`);
  if (ltr.overflow > 0) failures.push(`${name}: la page deborde de ${ltr.overflow}px en LTR`);

  const byKey = Object.fromEntries(rtl.rows.map((r) => [r.key, r]));
  for (const a of ltr.rows) {
    const b = byKey[a.key];
    if (!b) {
      failures.push(`${name}: ${a.key} present en LTR, absent en RTL`);
      continue;
    }
    compared += 1;
    if (Math.abs(a.start - b.start) > 1) {
      failures.push(`${name}: ${a.key} demarre a ${a.start}px en LTR et ${b.start}px en RTL`);
    }
    if (Math.abs(a.width - b.width) > 1) {
      failures.push(`${name}: ${a.key} large de ${a.width}px en LTR et ${b.width}px en RTL`);
    }
    // `left`/`right` survive a mirror unchanged; `start`/`end` swap with it.
    const physical = (v) => v === 'left' || v === 'right';
    if (physical(a.align) && a.align === b.align && a.align === 'left') {
      failures.push(`${name}: ${a.key} aligne a gauche dans les deux sens`);
    }
  }
  console.log(`${name.padEnd(20)} ${ltr.rows.length} reperes compares`);
}

await browser.close();

if (compared < 30) {
  console.error(`rtl-surfaces: seulement ${compared} reperes compares, la sonde ne mesure rien`);
  process.exit(1);
}
if (failures.length) {
  console.error();
  console.error('rtl-surfaces: ' + failures.length + ' echec(s)');
  for (const f of failures.slice(0, 20)) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(`rtl-surfaces: OK - ${compared} reperes, memes chiffres en logique dans les deux sens.`);
