import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { mountLangChip, unmountLangChip, type ChipMode } from './langChip';

/**
 * Writes the language chip's states harness from the real module and the real
 * stylesheet, so the Playwright gates measure what ships.
 *
 * The hand-written harness this replaces had six `prefers-color-scheme` blocks
 * frozen into it and no `data-kt-scheme` stamp at all: it was still describing
 * the stylesheet as it stood before the theme moved off the OS setting. An
 * imitation starts lying the moment the thing it imitates is touched, so
 * nothing here is retyped — the CSS is read from disk and the markup is built
 * by mountLangChip itself.
 *
 * Written under scratchpad/, which is gitignored: the harness is an input to
 * the gates, not a source file.
 */
const MODES: ChipMode[] = ['auto', 'pinned', 'off', 'loading', 'error'];
const OUT = 'scratchpad/harness';

/** A stand-in for Kick's composer and its action bar, close enough to anchor to. */
function stage(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'stage';
  const composer = document.createElement('div');
  composer.setAttribute('contenteditable', 'true');
  composer.className = 'composer';
  composer.textContent = 'Send a message';
  const bar = document.createElement('div');
  bar.className = 'actions';
  const gear = document.createElement('button');
  gear.type = 'button';
  gear.textContent = 'settings';
  const send = document.createElement('button');
  send.type = 'button';
  send.textContent = 'Chat';
  bar.append(gear, send);
  panel.append(composer, bar);
  document.body.appendChild(panel);
  return composer;
}

afterEach(() => {
  unmountLangChip();
  document.body.textContent = '';
});

function renderState(mode: ChipMode): string {
  const composer = stage();
  mountLangChip(
    composer,
    { mode, code: mode === 'off' ? '' : 'ja', favorites: ['ja', 'es', 'pt'] },
    { onPick: () => undefined, onAuto: () => undefined },
  );
  const html = document.body.innerHTML;
  unmountLangChip();
  document.body.textContent = '';
  return html;
}

function page(dir: 'ltr' | 'rtl', scheme: 'dark' | 'light'): string {
  const css = readFileSync('src/content/inject.css', 'utf8');
  const cells = MODES.map(
    (m) => `<figure class="cell"><figcaption>${m}</figcaption>${renderState(m)}</figure>`,
  ).join('\n');
  const ground = scheme === 'light' ? '#ffffff' : '#0b0b0c';
  const surface = scheme === 'light' ? '#f4f4f5' : '#171a1c';
  const ink = scheme === 'light' ? '#0b0b0c' : '#ffffff';
  return [
    '<!doctype html>',
    `<html lang="en" dir="${dir}" data-kt-scheme="${scheme}">`,
    '<head><meta charset="utf-8"><title>lang chip states</title>',
    `<style>${css}</style>`,
    '<style>',
    `  body { margin:0; padding:24px; background:${ground}; color:${ink};`,
    '        font:14px/1.4 system-ui, sans-serif; }',
    '  .cell { margin:0 0 20px; }',
    `  figcaption { font-size:11px; letter-spacing:.06em; text-transform:uppercase; opacity:.7; margin-bottom:6px; }`,
    `  .stage { background:${surface}; border-radius:8px; padding:10px; max-inline-size:340px; }`,
    `  .composer { min-block-size:38px; padding:8px 10px; border-radius:4px; background:${ground}; opacity:.75; }`,
    '  .actions { display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-top:8px; }',
    `  .actions > button { min-block-size:24px; min-inline-size:24px; padding:2px 10px; border:0;`,
    `      border-radius:4px; background:${scheme === 'light' ? '#e4e4e7' : '#42474d'}; color:${ink}; font:inherit; }`,
    '</style></head><body>',
    cells,
    '</body></html>',
  ].join('\n');
}

describe('lang chip harness', () => {
  it('renders every mode from the real module', () => {
    mkdirSync(OUT, { recursive: true });
    const files: [string, string][] = [
      ['lang-chip.html', page('ltr', 'dark')],
      ['lang-chip-light.html', page('ltr', 'light')],
      ['lang-chip-rtl.html', page('rtl', 'dark')],
    ];
    for (const [name, html] of files) writeFileSync(`${OUT}/${name}`, html, 'utf8');

    // A harness that renders nothing passes every gate downstream, so prove
    // each state actually produced a chip before writing it out.
    for (const [, html] of files) {
      for (const m of MODES) expect(html).toContain(`data-mode="${m}"`);
      expect(html).toContain('data-kt-scheme');
      // The stylesheet came from disk, not from a copy that can go stale.
      expect(html).toContain('.kt-chip');
      expect(html).not.toContain('@media (prefers-color-scheme');
    }
  });
});
