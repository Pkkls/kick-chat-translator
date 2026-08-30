/**
 * Post-build step: re-bundle the content script as a single self-contained
 * **classic IIFE** and point the manifest directly at it.
 *
 * Why this exists
 * ---------------
 * @crxjs emits content scripts as an ESM *loader* stub whose whole body is
 *   import(chrome.runtime.getURL('assets/index.ts-<hash>.js'))
 * i.e. the real code is fetched at runtime via a dynamic import of a
 * web-accessible resource. That dynamic import races the service worker /
 * browser resource gating and can **silently reject** — most visibly on Brave.
 * When it loses the race the content script never runs, no error reaches the
 * page console, and the user sees "the extension didn't launch, I have to press
 * F5 a few times until it does". (Reproduced: 6/6 cold reloads on Brave never
 * injected, while a classic content script — 7TV — loaded every time.)
 *
 * A self-contained IIFE injected directly by the manifest has no dynamic
 * import and runs deterministically at document_idle, exactly like a classic
 * content script. We reuse Vite's lib mode so Vite-only syntax the content
 * tree relies on (e.g. `import css from './inject.css?inline'`) keeps working.
 */
import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const ASSETS_DIR = resolve(root, 'dist/assets');
const MANIFEST = resolve(root, 'dist/manifest.json');
const OUT_NAME = 'content.js';
const MANIFEST_REF = `assets/${OUT_NAME}`;

async function bundleContent(): Promise<void> {
  await build({
    configFile: false,
    root,
    // This pass outputs into dist/assets, so the default publicDir copy would
    // put a second copy of everything in public/ under assets/ and ship it. That
    // was a few duplicated icons before; with _locales/ in there it is now
    // duplicated store metadata inside the package.
    publicDir: false,
    resolve: { alias: { '~': resolve(root, 'src') } },
    define: {
      'process.env.NODE_ENV': '"production"',
      // `configFile: false` above means vite.config.ts is never read, so the
      // constant that strips shared/metrics.ts does not exist in this pass and
      // has to be repeated. Without it the ternary never folds and the live sink
      // ships inside content.js, which is what check-strip caught the first time
      // this ran. Keep the two definitions in step.
      __KT_METRICS__: JSON.stringify(process.env.KT_METRICS === '1'),
    },
    logLevel: 'warn',
    build: {
      outDir: ASSETS_DIR,
      emptyOutDir: false, // keep the rest of the crxjs build
      target: 'es2022',
      minify: 'esbuild',
      cssCodeSplit: false,
      lib: {
        entry: resolve(root, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'KickChatTranslator',
        fileName: () => OUT_NAME,
      },
      // Force everything into one file — no code-split, no dynamic import.
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}

function patchManifest(): void {
  const mf = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    content_scripts?: Array<{ js?: string[] }>;
    web_accessible_resources?: unknown[];
  };
  const cs = mf.content_scripts?.[0];
  if (!cs) throw new Error('[bundle-content] manifest has no content_scripts to patch');
  cs.js = [MANIFEST_REF];
  // @crxjs exposes the ESM chunks its loader would have fetched at runtime.
  // Repointing content_scripts at the self-contained bundle above is exactly
  // what stops them being fetched, so what is left is four chunk URLs any
  // script on a kick.com page can request to confirm the extension is
  // installed. The source manifest declares nothing web-accessible either.
  delete mf.web_accessible_resources;
  writeFileSync(MANIFEST, `${JSON.stringify(mf, null, 2)}\n`);
}

function assertClassic(file: string): void {
  const src = readFileSync(file, 'utf8');
  // An IIFE bundle must not contain a runtime dynamic import of the real chunk.
  if (/\bimport\s*\(/.test(src)) {
    throw new Error('[bundle-content] output still contains a dynamic import() — not classic');
  }
}

await bundleContent();
const out = resolve(ASSETS_DIR, OUT_NAME);
if (!existsSync(out)) throw new Error('[bundle-content] content bundle was not emitted');
assertClassic(out);
patchManifest();
const kb = (statSync(out).size / 1024).toFixed(1);
console.info(`[bundle-content] ${MANIFEST_REF} (${kb} KB, classic IIFE) — manifest repointed`);
