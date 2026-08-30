/**
 * The compose preview, rendered by its own module in a real browser.
 *
 * It had no harness at all, which is how it kept a visual language the rest of
 * the extension abandoned. inject.css writes the direction down at the chip's
 * section head, measured off Kick's own pages: no drop shadows anywhere, 4 and
 * 8px radii, a single 0.15s duration. This panel predates that measurement and
 * carries two drop shadows, an 11px radius, a 5px one, 0.16s, and type in half
 * pixels. It floats over the chat every time you type.
 *
 *   node scratchpad/harness/compose-live.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BUNDLE = path.join(HERE, 'compose-bundle.js');

const esbuild = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href);
await esbuild.build({
  stdin: {
    contents:
      "export * from './src/content/composeUi';\nexport { setContentLocale } from './src/content/msg';\n",
    resolveDir: ROOT,
    sourcefile: 'compose-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  globalName: 'Compose',
  define: { __KT_METRICS__: 'false' },
  alias: { '~': path.join(ROOT, 'src') },
  outfile: BUNDLE,
});

const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');
const js = readFileSync(BUNDLE, 'utf8');

const PAGE = (scheme) => `<!doctype html>
<html lang="en" data-kt-scheme="${scheme}"><head><meta charset="utf-8"><title>compose, live</title>
<style>${css}</style>
<style>
  /* The dark ground is measured, not chosen: kick-dom-recon.mjs read
     rgb(11,11,12) off #channel-chatroom and off the first opaque ancestor
     behind the composer, on a live channel. This harness used to paint
     #171a1c there, which is the panel's own fill, not Kick's -- so every
     separation figure it reported was taken against a colour Kick does not
     paint. The light row keeps a placeholder on purpose: applyChatScheme
     reads Kick's ground and Kick paints no light one, so that row guards the
     OS fallback for a Kick that changes, not a surface anyone can measure
     today. */
  :root { --ground: ${scheme === 'light' ? '#ffffff' : '#0b0b0c'};
          --surface: ${scheme === 'light' ? '#f4f4f5' : '#0b0b0c'};
          --ink: ${scheme === 'light' ? '#0b0b0c' : '#ffffff'}; }
  body { margin:0; padding:16px; background:var(--ground); color:var(--ink);
         font:14px/1.45 system-ui, sans-serif; }
  #channel-chatroom { inline-size:340px; background:var(--surface); border-radius:8px; padding:10px; }
  .log { block-size:150px; font-size:13px; opacity:.9; }
  .log div { padding:3px 0; }
  .composer { min-block-size:38px; padding:9px 10px; border-radius:4px;
              background:var(--ground); opacity:.9; }
</style></head>
<body><div id="channel-chatroom">
  <div class="log"><div>viewer_23: hola a todos</div><div>another_one: good morning</div></div>
  <div class="composer" contenteditable="true">tu vois ce que je veux dire</div>
</div><script>${js}</script></body></html>`;

const LONG =
  'je pense que ce que tu viens de dire merite une reponse un peu plus longue que la moyenne';

const browser = await chromium.launch({ channel: 'chrome' });
const report = [];

for (const scheme of ['dark', 'light']) {
  for (const [name, text] of [
    ['court', 'you see what I mean'],
    ['long', LONG],
  ]) {
    const page = await browser.newPage({ viewport: { width: 420, height: 420 }, deviceScaleFactor: 2 });
    await page.setContent(PAGE(scheme));

    const measured = await page.evaluate(
      ({ text }) => {
        const { mountComposePreview, updateComposePreview, setContentLocale } = window.Compose;
        setContentLocale('en');
        const composer = document.querySelector('.composer');
        mountComposePreview(composer, 'en', { onInsert: () => undefined });
        // The state is a discriminated union on `kind`, and the panel's id is
        // kt-compose-bar. A first version guessed both and measured an empty
        // box 74.3px wide for a short message and a long one alike, then
        // reported that the panel does not show.
        updateComposePreview({ kind: 'ready', text, provider: 'deepl' });

        const panel = document.getElementById('kt-compose-bar');
        const cs = getComputedStyle(panel);
        const r = panel.getBoundingClientRect();
        const badge = panel.querySelector('.kt-compose-target');
        const body = panel.querySelector('.kt-compose-text');
        const px = (v) => +parseFloat(v).toFixed(2);

        // What separates this panel from the chat behind it, once the drop
        // shadow goes. WCAG 1.4.11 asks 3:1 of a control's own boundary, and a
        // border painted at 0.18 alpha may well have been carrying none of the
        // separation while the shadow did all of it.
        const rgba = (v) => (v.match(/[\d.]+/g) ?? []).map(Number);
        const over = (fg, bg) => {
          const a = fg[3] === undefined ? 1 : fg[3];
          return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
        };
        const lum = ([r0, g0, b0]) => {
          const f = (n) => {
            const s = n / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r0) + 0.7152 * f(g0) + 0.0722 * f(b0);
        };
        const ratio = (x, y) => {
          const [hi, lo] = [lum(x), lum(y)].sort((a, b) => b - a);
          return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
        };
        const behind = rgba(getComputedStyle(document.getElementById('channel-chatroom')).backgroundColor);
        // The background paints under the border, so the border's real colour is
        // its own alpha over the panel's fill over whatever is behind.
        const fill = over(rgba(cs.backgroundColor), behind);
        const edge = over(rgba(cs.borderTopColor), fill);

        // Text contrast, with the element's own opacity composited in. The kit's
        // contrast script drops it, and both of these elements dim themselves at
        // rest, so the number it reports for them is better than the one on
        // screen.
        const textRatio = (el) => {
          if (!el) return null;
          const s = getComputedStyle(el);
          const own = rgba(s.color);
          own[3] = (own[3] === undefined ? 1 : own[3]) * Number(s.opacity || 1);
          let bg = fill;
          for (let n = el; n; n = n.parentElement) {
            const c = rgba(getComputedStyle(n).backgroundColor);
            if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) {
              bg = over(c, bg);
              break;
            }
          }
          return ratio(over(own, bg), bg);
        };

        return {
          contrasteBordure: ratio(edge, behind),
          contrasteBadge: textRatio(badge),
          contrasteFleche: textRatio(panel.querySelector('.kt-compose-insert')),
          contrasteTexte: textRatio(body),
          visible: cs.visibility === 'visible' && cs.opacity !== '0',
          largeur: +r.width.toFixed(1),
          hauteur: +r.height.toFixed(1),
          deborde: r.left < 0 || r.right > innerWidth,
          ombre: cs.boxShadow === 'none' ? 'aucune' : cs.boxShadow,
          rayon: cs.borderRadius,
          duree: cs.transitionDuration,
          taillePanneau: px(cs.fontSize),
          tailleBadge: badge ? px(getComputedStyle(badge).fontSize) : null,
          rayonBadge: badge ? getComputedStyle(badge).borderRadius : null,
          tailleTexte: body ? px(getComputedStyle(body).fontSize) : null,
        };
      },
      { text },
    );

    const file = `compose-${scheme}-${name}`;
    await page.screenshot({ path: path.join(HERE, `${file}.png`) });
    writeFileSync(path.join(HERE, `${file}.html`), await page.content(), 'utf8');
    await page.close();
    report.push({ scheme, cas: name, ...measured });
  }
}
await browser.close();

for (const r of report) {
  console.log(
    `${r.scheme.padEnd(5)} ${r.cas.padEnd(5)} ${String(r.largeur).padStart(6)}x${String(r.hauteur).padEnd(5)} ` +
      `rayon ${String(r.rayon).padEnd(6)} duree ${String(r.duree).padEnd(6)} ` +
      `type ${r.taillePanneau}/${r.tailleTexte}/${r.tailleBadge} bordure ${r.contrasteBordure}:1 texte ${r.contrasteTexte} badge ${r.contrasteBadge} fleche ${r.contrasteFleche} ombre ${r.ombre}`,
  );
}

// The direction inject.css writes down at the chip's section head, measured off
// Kick's own pages: no drop shadows anywhere, 4/8px radii, one 0.15s duration,
// and type in whole pixels. This panel floats over the chat every time someone
// types, so it is the last place that can afford to look like something else.
const failures = [];
const whole = (v) => v !== null && Number.isInteger(v);
for (const r of report) {
  const tag = `${r.scheme}/${r.cas}`;
  if (!r.visible) failures.push(`${tag}: le panneau ne s affiche pas`);
  if (r.deborde) failures.push(`${tag}: le panneau sort de la fenetre`);
  if (r.ombre !== 'aucune') failures.push(`${tag}: ombre portee -> ${r.ombre}`);
  // The shadow was the only thing separating this panel from the chat: the
  // green hairline measured 1.46:1 dark and 1.31 light. Taking the shadow away
  // without this assertion swaps a direction fault for an accessibility one.
  if (r.contrasteBordure < 3) {
    failures.push(`${tag}: bordure a ${r.contrasteBordure}:1, WCAG 1.4.11 en veut 3`);
  }
  // Text, with its own opacity composited in. Both of these dim themselves at
  // rest, and the kit's contrast script does not see that: it read the arrow
  // at 1.37:1 on the light ground while the rendered value was lower still.
  for (const [what, value] of [
    ['texte', r.contrasteTexte],
    ['badge', r.contrasteBadge],
    ['fleche', r.contrasteFleche],
  ]) {
    if (value !== null && value < 4.5) {
      failures.push(`${tag}: ${what} a ${value}:1, WCAG 1.4.3 en veut 4.5`);
    }
  }
  for (const [what, value] of [
    ['panneau', r.rayon],
    ['badge', r.rayonBadge],
  ]) {
    for (const token of String(value).split(' ')) {
      if (!['0px', '4px', '8px'].includes(token)) {
        failures.push(`${tag}: rayon ${what} ${token}, attendu 4 ou 8`);
      }
    }
  }
  for (const token of r.duree.split(', ')) {
    if (token !== '0.15s') failures.push(`${tag}: duree ${token}, attendue 0.15s`);
  }
  for (const [what, value] of [
    ['panneau', r.taillePanneau],
    ['texte', r.tailleTexte],
    ['badge', r.tailleBadge],
  ]) {
    if (!whole(value)) failures.push(`${tag}: type ${what} a ${value}px, pas un pixel entier`);
  }
}

if (failures.length) {
  console.error();
  console.error('compose-live: ' + failures.length + ' echec(s)');
  for (const f of [...new Set(failures)]) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log('compose-live: OK - pas d ombre, rayons 4/8, 0.15s, type en pixels entiers.');
