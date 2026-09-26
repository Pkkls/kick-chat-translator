/**
 * Are the drawn flags actually drawn where a slot paints its own background?
 *
 * The line badge and the compose badge shipped as grey boxes: the flag classes
 * were stacked on the slot, and the slot's `background` shorthand came later
 * in the sheet than the drawings, so it won at equal specificity. Nothing
 * asserted it. chat-live screenshots those lines and measures their density,
 * and a grey box has the same density as a flag.
 *
 * Built by the real inject() and setComposeTargetLang() against the real sheet,
 * for the 43 languages that have a flag, in both schemes. A language without
 * one must still show its two letters on the pill.
 *
 *   node scratchpad/harness/flag-surfaces.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './playwright.mjs';
import { feuille } from './feuille.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const esbuild = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href);
// In memory: a bundle written next to the other gates is read by nobody else,
// and a shared output file is how two gates once raced on the same run.
const built = await esbuild.build({
  stdin: {
    contents:
      "export { inject } from './src/content/injector';\n" +
      "export { mountComposePreview, updateComposePreview, setComposeTargetLang } from './src/content/composeUi';\n" +
      "export { setContentLocale } from './src/content/msg';\n",
    resolveDir: ROOT,
    sourcefile: 'flag-surfaces-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  globalName: 'Surfaces',
  define: { __KT_METRICS__: 'false' },
  alias: { '~': path.join(ROOT, 'src') },
  // A path is required to place the imported sheet; with write: false nothing lands there.
  outfile: path.join(HERE, 'flag-surfaces-bundle.js'),
  write: false,
});
const js = built.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = feuille();
const LANGS = [
  ...readFileSync(path.join(ROOT, 'src/shared/flags.ts'), 'utf8').matchAll(/^\s+'?([a-z-]+)'?: '[a-z]{2}',/gm),
].map((m) => m[1]);
const SANS_DRAPEAU = 'xx';

const browser = await chromium.launch();
const failures = [];
for (const scheme of ['dark', 'light']) {
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html lang="en" data-kt-scheme="${scheme}"><head><meta charset="utf-8">` +
      `<style>${css}</style></head><body><div id="chat"></div><div class="composer"></div></body></html>`,
  );
  await page.addScriptTag({ content: js });
  const res = await page.evaluate(
    ({ langs, sans }) => {
      const { inject, mountComposePreview, updateComposePreview, setComposeTargetLang, setContentLocale } =
        window.Surfaces;
      setContentLocale('en');
      const transparent = (el) => {
        const s = getComputedStyle(el);
        return s.backgroundImage === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor);
      };
      // Drawn: a child flag with a painted image and a size, and nothing painted behind it.
      const verdict = (slot) => {
        const f = slot.querySelector(':scope > .kt-flag');
        if (!f) return `pas d enfant .kt-flag (texte "${slot.textContent}")`;
        const r = f.getBoundingClientRect();
        if (getComputedStyle(f).backgroundImage === 'none') return 'drapeau sans dessin';
        if (r.width < 1 || r.height < 1) return `drapeau de ${r.width}x${r.height}`;
        if (!transparent(slot)) return 'le creneau peint un fond derriere le drapeau';
        return null;
      };
      const pill = (slot, want) =>
        slot.querySelector('.kt-flag')
          ? 'un drapeau pour une langue qui n en a pas'
          : slot.textContent !== want
            ? `texte "${slot.textContent}" au lieu de "${want}"`
            : transparent(slot)
              ? 'repli texte sans pastille'
              : null;

      const chat = document.getElementById('chat');
      const line = (code) => {
        const row = document.createElement('div');
        chat.appendChild(row);
        inject(
          row,
          { messageId: code, translatedText: 'x', detectedLang: code, provider: 'google', cached: false },
          { displayStyle: 'below', showOriginal: true, showSourceBadge: true, showProviderBadge: false },
        );
        return row.querySelector('.kt-src-flag');
      };
      mountComposePreview(document.querySelector('.composer'), 'en', { onInsert: () => undefined });
      updateComposePreview({ kind: 'ready', text: 'x', provider: 'deepl' });
      const target = document.querySelector('.kt-compose-target');
      const compose = (code) => (setComposeTargetLang(code), target);

      const out = { ligne: [], redaction: [] };
      for (const code of langs) {
        const l = verdict(line(code));
        if (l) out.ligne.push(`${code}: ${l}`);
        const c = verdict(compose(code));
        if (c) out.redaction.push(`${code}: ${c}`);
      }
      const lr = pill(line(sans), sans.toUpperCase());
      if (lr) out.ligne.push(`${sans}: ${lr}`);
      const cr = pill(compose(sans), sans.toUpperCase());
      if (cr) out.redaction.push(`${sans}: ${cr}`);
      return out;
    },
    { langs: LANGS, sans: SANS_DRAPEAU },
  );
  for (const [surface, errs] of Object.entries(res)) {
    console.log(`${scheme.padEnd(5)} ${surface.padEnd(9)} ${LANGS.length + 1 - errs.length}/${LANGS.length + 1}`);
    for (const e of errs) failures.push(`${scheme} ${surface} ${e}`);
  }
  await page.close();
}
await browser.close();

if (LANGS.length !== 43) failures.push(`${LANGS.length} langues lues dans flags.ts, 43 attendues`);
if (failures.length) {
  console.error();
  console.error('flag-surfaces: ' + failures.length + ' echec(s)');
  for (const f of failures.slice(0, 20)) console.error('  x ' + f);
  process.exit(1);
}
