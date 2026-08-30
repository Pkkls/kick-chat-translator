/**
 * Under `prefers-reduced-motion: reduce`, everything this extension injects
 * must stop moving, and nothing Kick owns may be touched.
 *
 * The named-selector version of the policy covered the chip and nothing else:
 * the toast fade, the compose panel's loading pulse, the retry reveal, the
 * floating bar and its dot, and the insert button all kept moving. Seven of the
 * eleven animating rules, including both `animation`s, which are the ones the
 * query exists for.
 *
 * The second half matters as much as the first. The popup and the options page
 * use a blanket `*` rule; this stylesheet is injected into Kick's document, so
 * a blanket here would stop Kick's own motion too. The control element below
 * carries no `kt-` class and must keep its transition and its infinite
 * animation in both passes.
 *
 *   node scratchpad/harness/reduced-motion.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');

/** Every class in the stylesheet that declares a transition or an animation. */
function movingSelectors(sheet) {
  const spans = [];
  for (const m of sheet.matchAll(/@media \(prefers-reduced-motion: reduce\)/g)) {
    const open = sheet.indexOf('{', m.index);
    let depth = 0;
    for (let k = open; k < sheet.length; k++) {
      if (sheet[k] === '{') depth += 1;
      else if (sheet[k] === '}') {
        depth -= 1;
        if (depth === 0) {
          spans.push([m.index, k]);
          break;
        }
      }
    }
  }
  const inReduce = (i) => spans.some(([a, z]) => a <= i && i <= z);
  const found = new Set();
  for (const m of sheet.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (inReduce(m.index)) continue;
    const head = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (head.startsWith('@')) continue;
    if (!/\b(transition|animation)(-[a-z]+)?\s*:/.test(m[2])) continue;
    for (const sel of head.split(',')) {
      const cls = sel.match(/\.kt-[a-z-]+/g);
      if (cls) found.add(cls[cls.length - 1]);
    }
  }
  return [...found].sort();
}

const OURS = movingSelectors(css);
if (OURS.length === 0) {
  // A stylesheet that declares no motion would pass every check below without
  // proving anything.
  console.error('reduced-motion: aucune regle animee trouvee, la sonde ne mesure rien');
  process.exit(1);
}

const MARKUP =
  OURS.map((c) => `<div class="${c.slice(1)}" data-state="loading"><span class="kt-compose-text">t</span></div>`).join(
    '',
  ) + '<div class="kick-own">pas a nous</div>';

const PAGE = `<!doctype html><html data-kt-scheme="dark"><head><style>${css}</style>
<style>
  /* Kick's own motion, carrying no kt- class. It must survive both passes. */
  .kick-own { transition: opacity 300ms ease; animation: kick-pulse 2s infinite; }
  @keyframes kick-pulse { 50% { opacity: .4 } }
</style></head><body>${MARKUP}</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];

for (const mode of ['no-preference', 'reduce']) {
  const page = await browser.newPage({ viewport: { width: 420, height: 400 }, reducedMotion: mode });
  await page.setContent(PAGE);
  const seen = await page.evaluate((selectors) => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const ms = (v) => Math.max(...v.split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 1 : 1000)));
      return { transition: ms(cs.transitionDuration), animation: ms(cs.animationDuration) };
    };
    const out = {};
    for (const s of selectors) out[s] = read(s);
    out['.kick-own'] = read('.kick-own');
    return out;
  }, OURS);

  for (const sel of OURS) {
    const v = seen[sel];
    if (!v) {
      failures.push(`${mode}: ${sel} absent du montage, la sonde ne le mesure pas`);
      continue;
    }
    const still = v.transition < 1 && v.animation < 1;
    if (mode === 'reduce' && !still) {
      failures.push(`${mode}: ${sel} bouge encore (${v.transition}ms / ${v.animation}ms)`);
    }
  }

  const kick = seen['.kick-own'];
  if (!kick || kick.transition < 250 || kick.animation < 1500) {
    failures.push(
      `${mode}: l animation de Kick a ete coupee (${kick?.transition}ms / ${kick?.animation}ms), la politique deborde`,
    );
  }
  console.log(`${mode.padEnd(14)} ${OURS.length} regles a nous, Kick a ${kick?.transition}ms / ${kick?.animation}ms`);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error();
  console.error('reduced-motion: ' + failures.length + ' echec(s)');
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(`reduced-motion: OK - ${OURS.length} regles arretees, celles de Kick intactes.`);
