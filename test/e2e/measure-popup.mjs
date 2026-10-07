/**
 * Popup height, measured by rendering the built popup in every interface
 * language.
 *
 * Why a script and not a vitest case: the constraint is "does it fit without a
 * scrollbar", which only a layout engine can answer. A unit test on string
 * length would be a proxy, and a bad one — CJK characters are twice as wide as
 * Latin ones, so the same length behaves differently in ja and in es.
 *
 * The failure this exists for: Spanish rendered at 606px against a 600px
 * budget, because "mantener original" and "insignia de idioma" both wrapped to
 * a second line. Nine other languages fitted, so anything short of measuring
 * all ten would have missed it.
 *
 * Usage, after `npm run build`:
 *   node test/e2e/measure-popup.mjs
 * Exits non-zero if any language overflows.
 *
 * Needs playwright, which lives with the UX kit rather than in this repo:
 *   node --experimental-default-type=module ... or run from the kit directory.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './playwright.mjs';

/**
 * playwright is not a dependency of this extension — it belongs to the UX kit
 * that runs the design gates. Resolve it from there rather than adding a
 * 300MB devDependency for one script.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist');
const BUDGET = 600;
const LOCALES = ['en', 'es', 'fr', 'pt', 'tr', 'ru', 'ar', 'ja', 'ko', 'zh'];

const TYPES = {
  '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};

// file:// resolves the built absolute asset paths against the drive root, so
// the page loads nothing. A throwaway server is the shortest way past that.
const srv = http.createServer((q, r) => {
  const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    r.end(d);
  });
});
await new Promise((r) => srv.listen(0, r));
const port = srv.address().port;

/** A settings object that exercises the tallest popup a real install produces. */
function shim([locale, paused]) {
  const noop = { addListener() {}, removeListener() {} };
  const settings = {
    enabled: true, targetLang: 'auto', displayStyle: 'below', showOriginal: true,
    showSourceBadge: true, showProviderBadge: false, showFloatingBar: true,
    showComposerChip: true, composeEnabled: true, composeTargetLang: 'auto',
    composeInsertMode: 'insert', popupShowsStats: true, uiLang: locale,
    providerOrder: ['google', 'mymemory', 'lingva'], favoriteLangs: [],
    deeplApiKey: '', deeplPlan: 'free',
    pausedChannels: paused ? ['kt-pause'] : [],
  };
  const reply = (m) => {
    switch (m?.type) {
      case 'settings.get': return { type: 'settings', payload: settings };
      case 'providers.status': return { type: 'providers', payload: [
        { id: 'google', ok: true }, { id: 'mymemory', ok: true }, { id: 'lingva', ok: true }] };
      case 'stats.get': return { type: 'stats', payload: {
        totalRequests: 1124, totalCacheHits: 214, totalErrors: 0,
        byLang: { ko: 80 }, byProvider: {}, byChannel: {}, charsSent: 0,
        todayKey: 'today', history: [] } };
      case 'deepl.usage': return { type: 'deepl', payload: { configured: false, count: 0, limit: 0 } };
      default: return { type: 'ok' };
    }
  };
  globalThis.chrome = {
    runtime: { getManifest: () => ({ version: '0.0.0' }), openOptionsPage() {},
      lastError: undefined, onMessage: noop,
      sendMessage: (m, cb) => { const r = reply(m); if (typeof cb === 'function') { cb(r); return; } return Promise.resolve(r); } },
    storage: { sync: { get: async () => ({}), set: async () => {} },
      local: { get: async () => ({}), set: async () => {} }, onChanged: noop },
    i18n: { getUILanguage: () => locale, getMessage: () => '' },
    // L'onglet actif est une chaine Kick : en pause, le popup ajoute sa ligne
    // de reprise, qui doit tenir dans le meme plafond.
    tabs: { query: async () => [{ url: 'https://kick.com/kt-pause' }] },
  };
}

const browser = await chromium.launch();
const over = [];
const muettes = [];
console.log(`popup height per interface language (budget ${BUDGET}px)`);
for (const [locale, paused] of LOCALES.flatMap((l) => [[l, false], [l, true]])) {
  const page = await browser.newPage({ viewport: { width: 360, height: 1200 }, colorScheme: 'dark' });
  await page.addInitScript(shim, [locale, paused]);
  await page.goto(`http://localhost:${port}/src/popup/index.html`);
  await page.waitForTimeout(1300);
  const h = await page.evaluate(() => document.body.scrollHeight);
  // Une sonde qui n'a pas vu la ligne de pause ne mesure pas l'etat en pause.
  const vuePause = await page.evaluate(() => !!document.querySelector('section')?.querySelector('button'));
  if (paused && !vuePause) muettes.push(locale);
  const nom = `${locale}${paused ? ' paused' : ''}`;
  if (h > BUDGET) over.push(`${nom} ${h}px`);
  console.log(`  ${nom.padEnd(10)} ${String(h).padStart(4)}px  ${h <= BUDGET ? 'ok' : 'OVERFLOWS'}`);
  await page.close();
}
await browser.close();
srv.close();

if (muettes.length) {
  console.error(`
SONDE MUETTE: pas de ligne de pause en ${muettes.join(', ')}, l'etat en pause n'a pas ete mesure.`);
  process.exit(2);
}
if (over.length) {
  console.error(`\nFAIL — ${over.length} language(s) overflow: ${over.join(', ')}`);
  process.exit(1);
}
console.log('\nOK — every interface language fits without a scrollbar.');
