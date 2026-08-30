/**
 * Snapshots the built popup and every options tab into standalone HTML the kit
 * gates can load from disk.
 *
 * The gates take a file, not a live extension page, and a snapshot taken by
 * hand once goes stale the moment the CSS changes — which is how a contrast
 * run once reported forty failures against a white page background the real
 * page never had. So: serve dist, mount with a stubbed chrome, inline the
 * stylesheet, and carry the computed page background across explicitly.
 *
 *   node snapshot.mjs [--out DIR]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Playwright lives with the UX kit, not in this project, and ESM resolves bare
// imports from the importing file upward — never from the working directory.
import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '../../dist');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : HERE;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const srv = http.createServer((q, r) => {
  const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
    r.end(d);
  });
});
await new Promise((r) => srv.listen(8873, r));

// Read from the build, never typed here: the stub said 2.7.0 while the page
// under test read the manifest, so the snapshot went on showing the old version
// after the header was fixed to stop hardcoding one.
const MANIFEST = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));

const SETTINGS = {
  __version: MANIFEST.version,
  enabled: true, targetLang: 'auto', displayStyle: 'below', showOriginal: true,
  showSourceBadge: true, showProviderBadge: false, showFloatingBar: true,
  showComposerChip: true, composeEnabled: true, composeTargetLang: 'auto',
  composeInsertMode: 'insert', popupShowsStats: true, uiLang: 'en',
  providerOrder: ['google', 'lingva', 'mymemory'], favoriteLangs: ['ja', 'es'],
  deeplApiKey: '', deeplPlan: 'free', engineMode: 'local-first', localEnabled: true,
  minTextLength: 3, ignoreEnglish: true, ignoreBots: true, blacklistUsers: [],
  blacklistChannels: [], whitelistChannels: [], sourceLangAllowlist: [], glossary: [],
  cacheMaxEntries: 15000, cacheTtlHours: 72, concurrency: 4, perChannelBudgetPerMin: 200,
  connectionMode: 'auto', pauseWhenHidden: true, debug: false, lingvaInstance: '',
  myMemoryEmail: '', deeplBudgetPct: 0, deeplSmartRouting: true,
};

const browser = await chromium.launch({ channel: 'chrome' });

async function open(url, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'dark' });
  await page.addInitScript((settings) => {
    const noop = { addListener() {}, removeListener() {} };
    const reply = (m) => {
      const t = m?.type;
      // `available`, not `ok` — a stub with the wrong key paints every provider
      // pill red and invents failures that are not in the page.
      if (t === 'settings.get' || t === 'settings.set') return { type: 'settings', payload: settings };
      if (t === 'providers.status') return { type: 'providers', payload: [
        { id: 'google', available: true }, { id: 'lingva', available: true }, { id: 'mymemory', available: false },
      ] };
      if (t === 'stats.get') return { type: 'stats', payload: {
        totalRequests: 1284, totalCacheHits: 733, totalErrors: 9,
        byLang: { ja: 620, es: 310, pt: 180 }, byProvider: { google: 900, lingva: 384 },
        byChannel: {}, charsSent: 48210, todayKey: '2026-08-27',
        history: [['2026-08-21', 120], ['2026-08-22', 210], ['2026-08-23', 180],
                  ['2026-08-24', 260], ['2026-08-25', 150], ['2026-08-26', 220], ['2026-08-27', 144]],
      } };
      if (t === 'deepl.usage') return { type: 'deepl', payload: { configured: false, count: 0, limit: 0 } };
      return { type: 'ok' };
    };
    globalThis.chrome = {
      runtime: { getManifest: () => ({ version: settings.__version }), openOptionsPage() {}, lastError: undefined,
        onMessage: noop, getURL: (p) => p,
        sendMessage: (m, cb) => { const r = reply(m); if (typeof cb === 'function') { cb(r); return; } return Promise.resolve(r); } },
      storage: { sync: { get: async () => ({}), set: async () => {} }, local: { get: async () => ({}), set: async () => {} }, onChanged: noop },
      i18n: { getUILanguage: () => 'en', getMessage: () => '' },
    };
  }, SETTINGS);
  await page.goto(url);
  await page.waitForTimeout(1400);
  return page;
}

/** Inlines the stylesheet and pins the real page ground onto the snapshot. */
async function freeze(page, file) {
  const html = await page.evaluate(async () => {
    // Read the ground BEFORE the stylesheet goes. An unstyled body computes
    // transparent, which composites down to white — that is what once made a
    // contrast run report forty failures the page never had.
    const opaque = (v) => v && v !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)$/.test(v);
    let bg = '';
    for (const n of [document.body, document.documentElement,
                     ...document.body.querySelectorAll(':scope > *')]) {
      const v = getComputedStyle(n).backgroundColor;
      if (opaque(v)) { bg = v; break; }
    }
    if (!bg) throw new Error('no opaque background: the snapshot would measure against white');
    const fg = getComputedStyle(document.body).color;

    // Form state lives in properties, not attributes, so outerHTML drops it:
    // every number field came back empty and every checkbox unticked in the
    // frozen page, which is a lie about what the live one shows. Reflect them
    // before serialising.
    for (const el of document.querySelectorAll('input, textarea, select')) {
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        el.toggleAttribute('checked', el.checked);
        if (el.indeterminate) el.setAttribute('data-indeterminate', 'true');
      } else if (el instanceof HTMLSelectElement) {
        for (const opt of el.options) opt.toggleAttribute('selected', opt.selected);
      } else if (el instanceof HTMLTextAreaElement) {
        el.textContent = el.value;
      } else if (el instanceof HTMLInputElement) {
        el.setAttribute('value', el.value);
      }
    }

    const sheets = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href);
    const css = (await Promise.all(sheets.map((h) => fetch(h).then((r) => r.text())))).join(String.fromCharCode(10));
    document.querySelectorAll('link[rel=stylesheet],script').forEach((n) => n.remove());
    const style = document.createElement('style');
    style.textContent = css + String.fromCharCode(10) + `html,body{background:${bg} !important;color:${fg} !important}`;
    document.head.appendChild(style);
    return '<!doctype html>' + String.fromCharCode(10) + document.documentElement.outerHTML;
  });
  fs.writeFileSync(file, html, 'utf8');
  return html.length;
}

fs.mkdirSync(OUT, { recursive: true });
const popup = await open('http://localhost:8873/src/popup/index.html', 380, 700);
console.log('popup.html', await freeze(popup, path.join(OUT, 'popup.html')));
await popup.close();

const TABS = ['providers', 'display', 'filters', 'advanced', 'debug', 'about'];
fs.mkdirSync(path.join(OUT, 'options'), { recursive: true });
for (const id of TABS) {
  const page = await open('http://localhost:8873/src/options/index.html', 900, 1200);
  const tab = page.locator(`#tab-${id}`);
  if (await tab.count()) { await tab.click(); await page.waitForTimeout(500); }
  console.log(`options/${id}.html`, await freeze(page, path.join(OUT, 'options', `${id}.html`)));
  await page.close();
}

await browser.close();
srv.close();
