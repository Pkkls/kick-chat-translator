/**
 * How much spare width does Kick's action bar actually have?
 *
 * Asked before adding anything to it. The chip is 32x24 today; a second target
 * beside it costs at least 24px more under WCAG 2.5.8, and the panel is 340px.
 * Guessing which of those wins is how a control ends up pushing the send button
 * onto its own line on someone else's screen.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const css = readFileSync(path.join(ROOT, 'src/content/inject.css'), 'utf8');
const js = readFileSync(path.join(HERE, 'chip-bundle.js'), 'utf8');

const STAGE = `
<div class="panel">
  <div class="composer" contenteditable="true">Send a message</div>
  <div class="bar">
    <div class="left"><button type="button" class="fake">emote</button></div>
    <div class="right"><button type="button" class="fake">settings</button><button type="button" class="fake">Chat</button></div>
  </div>
</div>`;

const PAGE = (panel) => `<!doctype html>
<html lang="en" data-kt-scheme="dark"><head><meta charset="utf-8">
<style>${css}</style>
<style>
  body { margin:0; padding:20px; background:#0b0b0c; color:#fff; font:14px/1.45 system-ui, sans-serif; }
  .panel { inline-size:${panel}px; background:#171a1c; border-radius:8px; padding:10px; }
  .composer { min-block-size:38px; padding:9px 10px; border-radius:4px; background:#0b0b0c; }
  .bar { display:flex; align-items:center; gap:6px; margin-top:8px; }
  .left { display:flex; gap:6px; }
  .right { display:flex; gap:6px; margin-inline-start:auto; }
  .bar .fake { min-block-size:24px; padding:2px 10px; border:0; border-radius:4px; background:#42474d; color:#fff; font:inherit; }
</style></head>
<body>${STAGE}<script>${js}</script></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
// 340 is the harness panel; 300 and 260 stand for a narrowed window and the
// mobile layout, which is where a row runs out of room first.
for (const panel of [340, 300, 260]) {
  const page = await browser.newPage({ viewport: { width: 460, height: 400 } });
  await page.setContent(PAGE(panel));
  await page.evaluate(() => {
    window.Chip.mountLangChip(
      document.querySelector('.composer'),
      { mode: 'pinned', code: 'ja', favorites: ['ja', 'es', 'pt'] },
      { onPick: () => undefined, onAuto: () => undefined },
    );
  });
  const m = await page.evaluate(() => {
    const bar = document.querySelector('.bar');
    const kids = [...bar.children];
    const used = kids.reduce((a, k) => a + k.getBoundingClientRect().width, 0);
    const gaps = (kids.length - 1) * 6;
    const chip = document.querySelector('.kt-chip').getBoundingClientRect();
    const host = document.querySelector('.kt-chip-host').getBoundingClientRect();
    return {
      barre: +bar.getBoundingClientRect().width.toFixed(1),
      occupe: +(used + gaps).toFixed(1),
      libre: +(bar.getBoundingClientRect().width - used - gaps).toFixed(1),
      puce: `${chip.width.toFixed(0)}x${chip.height.toFixed(0)}`,
      hote: +host.width.toFixed(1),
      enroule: kids.some(
        (k) => Math.abs(k.getBoundingClientRect().top - kids[0].getBoundingClientRect().top) > 2,
      ),
    };
  });
  console.log('panneau', panel, JSON.stringify(m));
  await page.close();
}
await browser.close();
