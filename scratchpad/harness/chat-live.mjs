/**
 * Renders real translated chat lines in a real browser, in every display style
 * and both themes.
 *
 * The hand-written chat harness had the same disease as the chip one: it was a
 * copy of the stylesheet and the markup as they stood on the day it was typed,
 * so it kept describing an inject() that had since changed. Nothing is retyped
 * here — the CSS is read from disk and every line is built by inject() itself.
 *
 * Reports measured density, which is the number that mattered: the chat was
 * showing eight messages in the space that now holds fourteen.
 *
 *   node scratchpad/harness/chat-live.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BUNDLE = path.join(HERE, 'chat-bundle.js');

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

/** Real-shaped chat traffic: short, long, emoji-ish, CJK, RTL. */
const LINES = [
  ['viewer_23', 'hola a todos, alguien sabe cuando empieza', 'es', 'hi everyone, does anyone know when it starts'],
  ['another_one', 'que jogada incrivel', 'pt', 'what an incredible play'],
  ['third_user', 'この配信めっちゃおもしろい', 'ja', 'this stream is really fun'],
  ['fourth', 'kann jemand den ton lauter machen bitte', 'de', 'can someone turn the sound up please'],
  ['fifth_one', 'gg', 'en', 'gg'],
  ['sixth', 'صباح الخير للجميع', 'ar', 'good morning everyone'],
  ['seventh', 'je comprends rien a ce qui se passe la franchement', 'fr', "I don't understand what's going on here at all"],
  ['eighth', '진짜 대박이다', 'ko', 'this is seriously amazing'],
];

const PAGE = (scheme) => `<!doctype html>
<html lang="en" data-kt-scheme="${scheme}">
<head><meta charset="utf-8"><title>chat, live</title>
<style>${css}</style>
<style>
  :root { --ground: ${scheme === 'light' ? '#ffffff' : '#0b0b0c'};
          --surface: ${scheme === 'light' ? '#f4f4f5' : '#171a1c'};
          --ink: ${scheme === 'light' ? '#0b0b0c' : '#ffffff'};
          --dim: ${scheme === 'light' ? '#5e5e5f' : '#9fa6ad'};
          --pseudo: ${scheme === 'light' ? '#1d6b0a' : '#53fc18'}; }
  body { margin:0; padding:16px; background:var(--ground); color:var(--ink);
         font:14px/1.45 system-ui, sans-serif; display:flex; gap:16px; align-items:flex-start; }
  /* flex:none, or the columns shrink as soon as there are enough of them to
     overflow the viewport, and every measurement below moves for a reason that
     has nothing to do with the product. Adding two columns once dropped the
     replace column from 12 messages to 9 and it looked exactly like a
     regression. */
  .col { flex:none; inline-size:340px; background:var(--surface); border-radius:8px; padding:8px; }
  .col > h2 { margin:0 0 8px; font-size:11px; letter-spacing:.06em; text-transform:uppercase;
              color:var(--dim); font-weight:600; }
  .chat { block-size:420px; overflow:hidden; }
  .row { padding:3px 4px; }
  .font-bold { font-weight:700; color:var(--pseudo); }
</style></head>
<body><div id="cols"></div><script>${js}</script></body></html>`;

// `brut` is a row with nothing added to it: the control the hover style is held
// against. Hover translates on demand, so until you point at a line it must cost
// exactly what an untouched line costs. It did not: the placeholder was a block
// element under every message, which doubled the height of a chat where nothing
// had been translated yet.
const STYLES = ['brut', 'below', 'inline', 'replace', 'hover', 'erreur'];

const browser = await chromium.launch();
const report = [];

for (const scheme of ['dark', 'light']) {
  for (const showOriginal of [true, false]) {
    const page = await browser.newPage({
      viewport: { width: 1840, height: 560 },
      deviceScaleFactor: 2,
    });
    await page.setContent(PAGE(scheme));
    await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

    const measured = await page.evaluate(
      ({ lines, styles, showOriginal }) => {
        const { inject, applyShowOriginal, armHoverTranslate, showError } = window.Injector;
        applyShowOriginal(showOriginal);
        const host = document.body;
        host.textContent = '';
        const out = {};
        for (const style of styles) {
          const col = document.createElement('div');
          col.className = 'col';
          const h = document.createElement('h2');
          h.textContent = style + (showOriginal ? '' : ' - original hidden');
          const chat = document.createElement('div');
          chat.className = 'chat';
          col.append(h, chat);
          host.appendChild(col);

          // Repeat the traffic so the visible window is genuinely full.
          for (let n = 0; n < 4; n++) {
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
              if (style === 'brut') continue;
              if (style === 'erreur') {
                showError(row, 'Translation unavailable', () => undefined);
                continue;
              }
              if (style === 'hover') {
                armHoverTranslate(row, () => undefined);
                continue;
              }
              inject(
                row,
                {
                  messageId: `${style}-${n}-${who}`,
                  translatedText: meaning,
                  detectedLang: lang,
                  provider: 'google',
                  cached: false,
                },
                {
                  displayStyle: style,
                  showOriginal,
                  showSourceBadge: true,
                  showProviderBadge: false,
                },
                () => undefined,
              );
            }
          }
          const rows = [...chat.querySelectorAll('.row')];
          const box = chat.getBoundingClientRect();
          const visible = rows.filter((r) => r.getBoundingClientRect().bottom <= box.bottom).length;
          const heights = rows.slice(0, 8).map((r) => +r.getBoundingClientRect().height.toFixed(1));
          out[style] = {
            visibles: visible,
            hauteurMoyenne: +(heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1),
          };
        }
        return out;
      },
      { lines: LINES, styles: STYLES, showOriginal },
    );

    const name = `chat-live-${scheme}${showOriginal ? '' : '-hidden'}`;
    await page.screenshot({ path: path.join(HERE, `${name}.png`) });
    writeFileSync(path.join(HERE, `${name}.html`), await page.content(), 'utf8');
    await page.close();
    report.push({ name, measured });
  }
}

await browser.close();
for (const r of report) console.log(r.name, JSON.stringify(r.measured));

// The density claim, asserted rather than narrated: hiding the original must
// pack more messages into the same window, not fewer. A fix that made rows
// taller while sounding like a compaction is exactly what happened once.
//
// `replace` is held to a different contract, because it now hides the original
// itself. Two things have to be true of it, and both were false when it was
// compact-inline under another name: it must not move when `showOriginal` does
// (it does not read that setting any more), and with the setting ON — the state
// nearly everyone is in — it must show strictly more messages than `inline`,
// which is the whole difference between replacing the message and sitting next
// to it. Measured before the change: replace and inline both showed 9 at 44.1px,
// down to the tenth of a pixel.
const byName = Object.fromEntries(report.map((r) => [r.name, r.measured]));
const failures = [];
for (const scheme of ['dark', 'light']) {
  for (const style of ['below', 'inline']) {
    const shown = byName[`chat-live-${scheme}`][style].visibles;
    const hidden = byName[`chat-live-${scheme}-hidden`][style].visibles;
    if (hidden <= shown) {
      failures.push(`${scheme}/${style}: masquer l original montre ${hidden} messages contre ${shown}`);
    }
  }
  // `hover` has not translated anything yet, so it must cost what an untouched
  // row costs, to the pixel. It charged +61% instead: a green line under every
  // message, on a style whose whole purpose is to spend less.
  const brut = byName[`chat-live-${scheme}`].brut;
  const hover = byName[`chat-live-${scheme}`].hover;
  if (hover.hauteurMoyenne !== brut.hauteurMoyenne) {
    failures.push(
      `${scheme}/hover: ${hover.hauteurMoyenne}px par ligne contre ${brut.hauteurMoyenne} pour une ligne nue`,
    );
  }
  if (hover.visibles !== brut.visibles) {
    failures.push(
      `${scheme}/hover: ${hover.visibles} messages visibles contre ${brut.visibles} pour une ligne nue`,
    );
  }

  const rShown = byName[`chat-live-${scheme}`].replace.visibles;
  const rHidden = byName[`chat-live-${scheme}-hidden`].replace.visibles;
  const inlineShown = byName[`chat-live-${scheme}`].inline.visibles;
  if (rShown !== rHidden) {
    failures.push(`${scheme}/replace: suit encore showOriginal, ${rShown} contre ${rHidden}`);
  }
  if (rShown <= inlineShown) {
    failures.push(
      `${scheme}/replace: ne remplace rien, ${rShown} messages contre ${inlineShown} pour inline`,
    );
  }
}

// An error must sit on the line it belongs to, not on one of its own. It never
// arrives alone: when a provider is down every line in the chat gets one, so a
// block error is a chat that halves. Measured in a 420px column: a bare row is
// 31.4px, a block error made it 47.6 (x1.52, 13 messages down to 8), inline
// gives 36.5 (x1.16, 11 messages). The threshold sits between the two - an
// inline error wrapping a few long rows is fine, one costing a row every time
// is not.
for (const scheme of ['dark', 'light']) {
  const bare = byName[`chat-live-${scheme}`].brut.hauteurMoyenne;
  const err = byName[`chat-live-${scheme}`].erreur.hauteurMoyenne;
  if (err > bare * 1.25) {
    failures.push(
      `${scheme}/erreur: rangee a ${err}px contre ${bare}px nue, x${(err / bare).toFixed(2)}`,
    );
  }
}

if (failures.length) {
  console.error();
  console.error('chat-live: ' + failures.length + ' echec(s)');
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log();
console.log(
  'chat-live: OK - densite, replace, survol et erreur, dans les deux themes.',
);
