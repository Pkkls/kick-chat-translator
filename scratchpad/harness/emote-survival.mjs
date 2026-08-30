/**
 * When the original message is hidden, do the emotes go with it?
 *
 * The rule hides `span.font-normal` and `span.seventv-text-token`, and
 * selectors.ts says in its own words that Kick renders custom emotes as
 * `<img alt="emoteName">` INSIDE those spans. If that is right, then hiding the
 * original also hides every emote in the line, and the two things a viewer can
 * still read in a language they do not speak are the username and the emotes.
 *
 * Three shapes, all of them real:
 *   - a span holding only an emote image
 *   - a span mixing words and an emote image
 *   - the same under 7TV, which rewraps text in its own token span
 *
 * Emote images are 1x1 data URIs painted with a background, so nothing is
 * fetched and the box is still measurable.
 *
 *   node scratchpad/harness/emote-survival.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');

const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const PAGE = `<!doctype html>
<html lang="en" data-kt-scheme="dark"><head><meta charset="utf-8">
<style>${css}</style>
<style>
  body { margin:0; padding:16px; background:#0b0b0c; color:#fff; font:14px/1.45 system-ui, sans-serif; }
  .row { padding:4px 0; }
  .font-bold { font-weight:700; color:#53fc18; }
  .kt-emote { display:inline-block; width:24px; height:24px; vertical-align:middle;
              background:#42474d; border-radius:3px; }
  .kt-emote-em { display:inline-block; width:1.7em; height:1.7em; vertical-align:middle;
                 background:#42474d; border-radius:3px; }
</style></head><body><div id="stage"></div></body></html>`;

/**
 * One chat line, built the way Kick builds it, then translated by the real
 * inject() rules through the class the style would have applied.
 */
const build = `(pixel) => {
  const stage = document.getElementById('stage');
  stage.textContent = '';
  const cases = [
    ['emote seul', 'font-normal', 'emote'],
    ['texte + emote', 'font-normal', 'mixte'],
    ['7TV, texte + emote', 'seventv-text-token', 'mixte'],
    // Kick's emote sizing is not ours to choose. An image measured in em
    // collapses with the font-size it inherits, so it is the case that decides
    // whether zeroing the type is enough on its own.
    ['emote dimensionne en em', 'font-normal', 'em'],
  ];
  const out = [];
  for (const [nom, cls, forme] of cases) {
    for (const style of ['kt-translation', 'kt-translation-replace']) {
      const row = document.createElement('div');
      row.className = 'row';
      const who = document.createElement('span');
      who.className = 'font-bold';
      who.textContent = 'viewer_23: ';
      const text = document.createElement('span');
      text.className = cls;
      if (forme === 'mixte') text.append(document.createTextNode('bien joue '));
      const img = document.createElement('img');
      img.className = forme === 'em' ? 'kt-emote-em' : 'kt-emote';
      img.src = pixel;
      img.alt = 'emoteName';
      text.appendChild(img);
      row.append(who, text);
      const tr = document.createElement('span');
      tr.className = style;
      tr.textContent = 'well played';
      row.appendChild(tr);
      stage.appendChild(row);
      out.push({ nom, style, img });
    }
  }
  return out.map((o) => {
    const r = o.img.getBoundingClientRect();
    return {
      cas: o.nom,
      style: o.style,
      emoteVisible: r.width > 0 && r.height > 0,
      taille: Math.round(r.width) + 'x' + Math.round(r.height),
    };
  });
}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 500, height: 600 } });
await page.setContent(PAGE);

const report = [];
for (const hideOriginal of [false, true]) {
  await page.evaluate((h) => {
    document.documentElement.classList.toggle('kt-hide-original', h);
  }, hideOriginal);
  const rows = await page.evaluate(
    ([src, pixel]) => new Function('return ' + src)()(pixel),
    [build, PIXEL],
  );
  for (const r of rows) report.push({ ...r, keepOriginal: !hideOriginal });
}
await page.screenshot({ path: path.join(HERE, 'emote-survival.png') });
await browser.close();

for (const r of report) {
  console.log(
    `${r.keepOriginal ? 'garde' : 'masque'} | ${r.style.padEnd(22)} | ${r.cas.padEnd(20)} | emote ${
      r.emoteVisible ? 'visible ' + r.taille : 'DISPARUE'
    }`,
  );
}

// The contract: an emote is not text, so nothing that hides the message's words
// has any business hiding it. A viewer reading a chat in a language they do not
// speak has the username and the emotes left, and this takes one of the two.
const perdus = report.filter((r) => !r.emoteVisible);
if (perdus.length) {
  console.error();
  console.error('emote-survival: ' + perdus.length + ' cas ou l emote disparait');
  for (const p of perdus) console.error(`  x ${p.keepOriginal ? 'garde' : 'masque'} / ${p.style} / ${p.cas}`);
  process.exit(1);
}
console.log();
console.log('emote-survival: OK - les emotes survivent au masquage, dans les 3 formes.');
