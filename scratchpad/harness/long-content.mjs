/**
 * Nothing this extension puts in a chat line may push that line sideways.
 *
 * Kick's chat column is about 340px and it does not scroll horizontally. A
 * single unbreakable token - a spam run, a long URL, a wall of CJK - used to
 * take our translation past that: measured at 530px inside a 356px column, the
 * page scrolled 121px in `inline` and 186px in `replace`. `below` never had the
 * problem, it has carried a break rule from the start; the other two had none
 * at all.
 *
 * Attribution matters here and the harness is written for it. Kick wraps its
 * own message text, so the fake original carries `overflow-wrap: break-word`
 * too: without that the harness manufactures an overflow that is not ours and
 * then blames our stylesheet for it.
 *
 *   node scratchpad/harness/long-content.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');
const js = readFileSync(path.join(HERE, 'chat-bundle.js'), 'utf8');

/** A username at the length Kick allows, so the line starts already long. */
const LONG_USER = 'xX_un_pseudo_vraiment_tres_long_Xx';

const CASES = [
  ['jeton insecable', 'a'.repeat(72)],
  ['url longue', 'https://example.com/a/very/long/path/that/never/breaks/anywhere?a=1&b=2'],
  ['mur de CJK', 'あ'.repeat(90)],
  ['long puis court puis long', `${'x'.repeat(40)} court ${'y'.repeat(40)}`],
  ['message de 500', 'a b '.repeat(125).trim()],
];

const PAGE = `<!doctype html><html data-kt-scheme="dark"><head><style>${css}</style>
<style>
  body { margin:0; padding:14px; background:#0b0b0c; color:#fff; font:14px/1.45 system-ui }
  .col { inline-size:340px; background:#171a1c; padding:8px }
  .row { padding:3px 4px }
  .font-bold { font-weight:700; color:#53fc18 }
  /* Kick wraps its own text. Without this the harness blames us for Kick's job. */
  .font-normal { overflow-wrap: break-word }
</style></head><body><div class="col" id="c"></div><script>${js}</script></body></html>`;

const browser = await chromium.launch();
const failures = [];
let measured = 0;

for (const style of ['below', 'inline', 'replace']) {
  for (const hidden of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    await page.setContent(PAGE);
    const seen = await page.evaluate(
      ({ style, hidden, cases, user }) => {
        const { inject, applyShowOriginal } = window.Injector;
        applyShowOriginal(!hidden);
        const col = document.getElementById('c');
        for (const [id, text] of cases) {
          const row = document.createElement('div');
          row.className = 'row';
          const name = document.createElement('span');
          name.className = 'font-bold';
          name.textContent = `${user}: `;
          const said = document.createElement('span');
          said.className = 'font-normal';
          said.textContent = text;
          row.append(name, said);
          col.appendChild(row);
          inject(
            row,
            {
              messageId: id + style,
              translatedText: text,
              detectedLang: 'es',
              provider: 'google',
              cached: false,
            },
            { displayStyle: style, showOriginal: !hidden, showSourceBadge: true, showProviderBadge: false },
            () => undefined,
          );
        }
        const doc = document.documentElement;
        // Proof the pass rendered something: an empty column overflows nothing.
        const ours = col.querySelectorAll(
          '.kt-translation, .kt-translation-inline, .kt-translation-replace',
        ).length;
        return {
          col: col.scrollWidth - col.clientWidth,
          page: doc.scrollWidth - doc.clientWidth,
          ours,
        };
      },
      { style, hidden, cases: CASES, user: LONG_USER },
    );
    await page.close();

    const label = `${style}/${hidden ? 'original masque' : 'original visible'}`;
    if (seen.ours < CASES.length) {
      failures.push(`${label}: ${seen.ours} traductions rendues sur ${CASES.length}, la sonde ne mesure rien`);
    }
    if (seen.col > 0) failures.push(`${label}: la colonne deborde de ${seen.col}px`);
    if (seen.page > 0) failures.push(`${label}: la page deborde de ${seen.page}px`);
    measured += seen.ours;
    console.log(
      `${label.padEnd(30)} colonne ${seen.col > 0 ? '+' + seen.col : 'ok'} | page ${seen.page > 0 ? '+' + seen.page : 'ok'}`,
    );
  }
}

await browser.close();

if (failures.length) {
  console.error();
  console.error('long-content: ' + failures.length + ' echec(s)');
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(`long-content: OK - ${measured} traductions, aucune ne pousse le chat de cote.`);
