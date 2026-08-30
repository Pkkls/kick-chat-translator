/**
 * Ou part le temps, entre l'arrivee d'un message et sa traduction affichee.
 *
 * L'instrumentation existait deja : `e2e.local` et `e2e.cloud` separement, les
 * jambes (`leg.coalesce.wait`, `leg.cache.lookup`, `leg.roundtrip`,
 * `leg.inject`), les caches, `provider.<id>.batch|item`, la profondeur de
 * chaine. `summarize()` sortait deja p50 et p95. Et `readAllMetrics()` etait
 * exporte sans un seul appelant : tout etait collecte, rien n'etait lu.
 *
 * Ce script est le lecteur. Il ne mesure rien lui-meme, il fait tourner du vrai
 * trafic sous le build metriques et rend la distribution.
 *
 *   npm run build:metrics
 *   node scratchpad/harness/latency.mjs [secondes]
 *
 * Il refuse de rendre un verdict vert s'il n'a rien mesure. C'est le piege le
 * plus paye sur ce projet : une passe qui rapporte 0 traduction et 0 erreur
 * ressemble a un succes.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const PROFILE = path.join(HERE, 'profile-latency');
const WATCH_S = Number(process.argv[2] ?? 90);
/** Cible forcee, differente de la langue des chaines de l'annuaire. */
const TARGET = process.argv[3] ?? 'fr';

// Le build metriques, ou rien a lire. check-strip.ts fait echouer un build de
// release qui garderait le module, donc un dist/ normal ne contient aucun
// compteur et ce script rendrait un vide qui ressemble a du calme.
const marker = path.join(EXT, 'assets');
const hasMetrics = fs
  .readdirSync(marker)
  .some((f) => f.endsWith('.js') && fs.readFileSync(path.join(marker, f), 'utf8').includes('kt.metrics.v1'));
if (!hasMetrics) {
  console.error('dist/ ne porte pas les metriques. Lancer `npm run build:metrics` avant.');
  process.exit(2);
}

// Profil NEUF a chaque passage, et c'est le point le plus important de ce
// fichier.
//
// Chrome garde l'enregistrement du service worker dans le profil. Reutiliser le
// profil apres un rebuild fait tourner l'ANCIEN service worker contre le
// nouveau dist : deux mesures d'affilee ont ainsi rapporte que la correction du
// coalescer n'avait rien change, alors qu'elle divisait la mediane par deux.
// C'est le pire genre de sonde, celle qui n'echoue pas et rend un chiffre faux.
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(PROFILE, { recursive: true });

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());

// Le service worker MV3 est paresseux : il faut une page kick.com avant que son
// id existe.
await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);

// Ceinture et bretelles : le profil est deja neuf, mais un blob survivant
// rendrait des percentiles credibles sans avoir traduit une ligne ce coup-ci.
{
  const swBoot = ctx.serviceWorkers()[0];
  const bootId = swBoot ? swBoot.url().split('/')[2] : null;
  if (!bootId) {
    console.error('id de l extension introuvable au demarrage : service worker endormi.');
    await ctx.close();
    process.exit(2);
  }
  const reset = await ctx.newPage();
  await reset.goto(`chrome-extension://${bootId}/src/options/index.html`);
  await reset.waitForTimeout(1200);
  const applied = await reset.evaluate(async (target) => {
    chrome.storage.local.remove(['kt.metrics.v1.sw', 'kt.metrics.v1.content']);
    // La langue cible est forcee, et c'est la difference entre mesurer et se
    // raconter une histoire.
    //
    // Les chaines de l'annuaire sont anglophones et la cible par defaut suit le
    // navigateur, donc anglais vers anglais : le fournisseur rend le texte
    // inchange et le pipeline le jette en `skipSame` ou `skipDetected`. Un
    // passage a rapporte 59 aller-retours pour 4 traductions gardees, et le
    // cache memoire a 4 ecritures a l'air casse alors qu'il n'a rien a retenir.
    const key = 'kt.settings.v2';
    const cur = (await chrome.storage.sync.get(key))[key] ?? {};
    await chrome.storage.sync.set({ [key]: { ...cur, targetLang: target, ignoreEnglish: false } });
    // Relu, parce qu'une ecriture dans la mauvaise cle ne dit rien et laisse la
    // mesure tourner sur les reglages par defaut.
    const back = (await chrome.storage.sync.get(key))[key];
    return { targetLang: back?.targetLang, ignoreEnglish: back?.ignoreEnglish };
  }, TARGET);
  if (applied.targetLang !== TARGET) {
    console.error(
      `la langue cible n a pas ete appliquee : lue ${JSON.stringify(applied.targetLang)}, voulue ${TARGET}`,
    );
    await ctx.close();
    process.exit(2);
  }
  await reset.close();
}

// Une chaine vivante, decouverte dans l'annuaire et jamais nommee ici : coder
// un pseudo en dur, c'est se lier a quelqu'un qui peut arreter de streamer.
const candidates = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="/"]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && /^\/[a-z0-9_-]+$/i.test(h) && !/^\/(browse|categories|following|search)$/i.test(h))
    .slice(0, 12),
);

let live = null;
for (const c of candidates) {
  await page.goto('https://kick.com' + c, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const lines = await page.evaluate(
    () => document.querySelectorAll('#channel-chatroom [data-index]').length,
  );
  if (lines >= 8) {
    live = { channel: c, lines };
    break;
  }
}
if (!live) {
  console.error('aucune chaine avec du chat trouvee dans l annuaire.');
  await ctx.close();
  process.exit(2);
}

console.log(
  `chaine ${live.channel}, ${live.lines} lignes au depart, cible ${TARGET}. Observation ${WATCH_S}s...`,
);
await page.waitForTimeout(WATCH_S * 1000);

const sw = ctx.serviceWorkers()[0];
const id = sw ? sw.url().split('/')[2] : null;
if (!id) {
  console.error('id de l extension introuvable : le service worker ne s est pas reveille.');
  await ctx.close();
  process.exit(2);
}

// Lu depuis une page de l'extension, seule a voir chrome.storage.local.
const opts = await ctx.newPage();
await opts.goto(`chrome-extension://${id}/src/options/index.html`);
await opts.waitForTimeout(1500);
// Le blob brut, lu tel quel. Passer par readAllMetrics() cachait ou une cle se
// perdait : entre le module, mon resume et mon affichage, une cle absente peut
// venir de trois endroits, et « absent » se lit alors comme « la ligne ne s'est
// jamais executee ».
const raw = await opts.evaluate(async () => {
  const stored = await chrome.storage.local.get(['kt.metrics.v1.sw', 'kt.metrics.v1.content']);
  return Object.fromEntries(
    Object.entries(stored).map(([k, v]) => [
      k,
      {
        scope: v?.scope,
        since: v?.since,
        timingKeys: Object.fromEntries(
          Object.entries(v?.samples ?? {}).map(([kk, vv]) => [kk, vv.length]),
        ),
        countKeys: Object.keys(v?.counts ?? {}).length,
      },
    ]),
  );
});
console.log('blob brut :');
for (const [k, v] of Object.entries(raw)) {
  console.log(' ', k, 'scope=' + v.scope, 'counts=' + v.countKeys);
  for (const [kk, n] of Object.entries(v.timingKeys)) console.log('     ', kk, 'n=' + n);
}

const snapshots = await opts.evaluate(async () => {
  const keys = ['kt.metrics.v1.sw', 'kt.metrics.v1.content'];
  const stored = await chrome.storage.local.get(keys);
  const summarize = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    const n = s.length;
    if (!n) return { n: 0, p50: 0, p95: 0, max: 0 };
    const at = (q) => s[Math.min(n - 1, Math.floor(q * n))];
    return { n, p50: at(0.5), p95: at(0.95), max: s[n - 1] };
  };
  return keys
    .map((k) => stored[k])
    .filter((v) => v && v.samples)
    .map((s) => ({
      scope: s.scope,
      counts: s.counts,
      timings: Object.fromEntries(Object.entries(s.samples).map(([k, v]) => [k, summarize(v)])),
    }));
});
await ctx.close();

const counts = {};
const timings = {};
for (const s of snapshots) {
  for (const [k, v] of Object.entries(s.counts ?? {})) counts[k] = (counts[k] ?? 0) + v;
  for (const [k, v] of Object.entries(s.timings ?? {})) if (v.n) timings[k] = v;
}

// Les cles reellement recues, avant toute mise en forme. Une cle attendue et
// absente se lit sinon comme « la mesure vaut zero » au lieu de « la ligne n'a
// jamais ete executee ».
console.log('scopes  :', snapshots.map((s) => s.scope).join(', ') || 'aucun');
console.log('timings :', Object.keys(timings).sort().join(' ') || 'aucun');
console.log('counts  :', Object.keys(counts).sort().join(' ') || 'aucun');

const ms = (t) => `${String(t.p50).padStart(6)} / ${String(t.p95).padStart(6)} ms  n=${t.n}`;
const show = (label, key) => {
  const t = timings[key];
  console.log(`  ${label.padEnd(26)} ${t ? ms(t) : '        absent'}`);
};

console.log();
console.log('bout en bout                p50 /    p95');
show('local (sur l appareil)', 'e2e.local');
show('cloud', 'e2e.cloud');
console.log('fenetre de lot');
show('choisie', 'coalesce.window');
show('debit vu (msgs/10s)', 'coalesce.rate10s');
console.log('jambes');
for (const k of Object.keys(timings).filter((k) => k.startsWith('leg.')).sort()) show('  ' + k.slice(4), k);
console.log('fournisseurs');
for (const k of Object.keys(timings).filter((k) => k.startsWith('provider.')).sort()) show('  ' + k.slice(9), k);

const pair = Object.entries(counts).filter(([k]) => k.startsWith('local.pair.'));
console.log();
console.log('paires sur l appareil :', pair.length ? pair.map(([k, v]) => `${k.slice(11)}=${v}`).join('  ') : 'aucune sondee');
const cache = ['cache.mem.hit', 'cache.mem.miss', 'cache.sw.hit', 'cache.sw.miss'];
console.log('cache                 :', cache.map((k) => `${k.split('.').slice(1).join('.')}=${counts[k] ?? 0}`).join('  '));
console.log(
  'cache memoire         :',
  `ecritures=${counts['cache.mem.store'] ?? 0}`,
  `taille p50=${timings['cache.mem.size']?.p50 ?? 0}`,
  `max=${timings['cache.mem.size']?.max ?? 0}`,
  `| jetees recyclees=${counts['drop.recycled.unrescued'] ?? 0}`,
);
console.log('repli google          :', counts['google.batch.fallback'] ?? 0, 'declenchement(s)');
const chain = Object.entries(counts).filter(([k]) => k.startsWith('chain.'));
if (chain.length) console.log('chaine                :', chain.map(([k, v]) => `${k.slice(6)}=${v}`).join('  '));

// L'assertion que ce script doit a tout le monde. Une passe qui n'a rien
// traduit rend zero traduction et zero erreur, et ca se lit comme du calme.
const translated = (timings['e2e.local']?.n ?? 0) + (timings['e2e.cloud']?.n ?? 0);
const failures = [];
if (!snapshots.length) failures.push('aucun blob de metriques : le build ne porte pas les compteurs, ou rien ne s est execute');
if (translated === 0) failures.push('zero traduction mesuree : rien a dire sur la latence de rien');
const stored = counts['cache.mem.store'] ?? 0;
if (stored < translated * 0.2) {
  failures.push(
    `${stored} traduction(s) gardee(s) sur ${translated} : le chat parle deja la langue cible, ` +
      'cette passe ne mesure pas une traduction',
  );
}
if (!Object.keys(counts).length) failures.push('aucun compteur : la lecture a rendu un objet vide');

console.log();
if (failures.length) {
  console.error(`latency: ${failures.length} echec(s)`);
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log(`latency: OK - ${translated} traductions mesurees sur ${live.channel}, ${WATCH_S}s.`);
