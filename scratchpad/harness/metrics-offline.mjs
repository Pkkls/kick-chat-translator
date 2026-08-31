/**
 * Les trente compteurs, lus sans reseau.
 *
 * L'instrumentation existe depuis longtemps : trente compteurs et distributions
 * sous `__KT_METRICS__`, `summarize()` qui sort deja p50 et p95, et
 * `readAllMetrics()` exporte. `latency.mjs` est le lecteur qui a ete ecrit pour
 * s'en servir, et il demande du trafic reel sur kick.com, donc il ne tourne
 * jamais. Tout etait collecte, rien n'etait lu.
 *
 * Ce harnais fait passer du trafic dans la vraie extension sur une page servie
 * localement, comme `translate-offline`, et relit les compteurs a la source :
 * `chrome.storage.local`, cles `kt.metrics.v1.sw` et `kt.metrics.v1.content`.
 * Les reservoirs y sont bruts, donc les centiles se calculent ici, une fois.
 *
 * Le corpus est choisi pour repondre a une question que `pipeline.ts` pose sur
 * lui-meme : son journal de decisions dit "pourquoi CETTE ligne" et jamais
 * "quelle part du chat n'atteint jamais un moteur", et il ajoute que les
 * defauts de `ignoreEnglish` et `minTextLength` ont ete choisis sans ce chiffre.
 * Il y a donc du vrai chat de plusieurs langues, de l'emoji seul, de l'argot, du
 * tres court, du tres long, du duplique et de l'anglais.
 *
 *   npm run build:metrics
 *   node scratchpad/harness/metrics-offline.mjs [--json]
 *
 * Il refuse le vert s'il n'a rien mesure : un lecteur qui ne lit rien et sort 0
 * est le piege que toute cette instrumentation merite le moins.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');
const JSON_SEUL = process.argv.includes('--json');
/**
 * `--lent` fait arriver les messages un par un, espaces, comme un chat ordinaire
 * plutot que par paquets. C'est le regime ou le groupage ne collecte rien et ou
 * la fenetre d'attente est du delai pur, ce que le commentaire de
 * `adaptiveWindowMs` dit lui-meme de la branche qu'il choisit alors.
 */
const LENT = process.argv.includes('--lent');

const manifeste = path.join(EXT, 'manifest.json');
if (!fs.existsSync(manifeste)) {
  console.error('dist/manifest.json absent. Lancer `npm run build:metrics` avant.');
  process.exit(2);
}

// Sans le build metriques, chaque `metrics.count` est elimine a la compilation
// et ce harnais lirait un stockage vide en croyant avoir mesure zero. C'est un
// prerequis manquant, pas une porte qui echoue, donc code 2.
const bundle = fs.readFileSync(path.join(EXT, 'assets/content.js'), 'utf8');
if (!bundle.includes('kt.metrics.v1')) {
  console.error('dist/ ne porte pas les metriques. Lancer `npm run build:metrics` avant.');
  process.exit(2);
}

/**
 * Le corpus. Chaque ligne porte ce qu'elle est censee provoquer, pour qu'un
 * chiffre de sortie se relise sans deviner.
 */
const CORPUS = [
  ['es', 'traduit', 'hola amigos como estan todos hoy'],
  ['es', 'traduit', 'esa jugada ha sido increible de verdad'],
  ['es', 'traduit', 'alguien sabe a que hora empieza el torneo'],
  ['es', 'traduit', 'me gusta mucho este mapa es mi favorito'],
  ['pt', 'traduit', 'boa noite pessoal tudo bem com voces'],
  ['pt', 'traduit', 'essa jogada foi muito boa mesmo cara'],
  ['tr', 'traduit', 'herkese iyi aksamlar nasilsiniz bugun'],
  ['tr', 'traduit', 'bu harita gercekten cok guzel olmus'],
  ['fr', 'traduit', 'salut tout le monde comment ca va ce soir'],
  ['fr', 'traduit', 'cette partie etait vraiment tres serree'],
  ['de', 'traduit', 'guten abend zusammen wie geht es euch'],
  ['ru', 'traduit', 'привет всем как дела сегодня вечером'],
  ['ja', 'traduit', 'みなさんこんばんは今日はどうですか'],
  ['ar', 'traduit', 'مساء الخير للجميع كيف حالكم اليوم'],
  // Deux langues proposees par le produit que rien ne detectait : franc emet
  // `zlm` pour le malais, absent de la table, et ne couvre pas l'hebreu du tout.
  ['ms', 'traduit', 'selamat petang semua apa khabar hari ini di siaran ini'],
  ['he', 'traduit', 'ערב טוב לכולם מה שלומכם היום בשידור החי הזה'],
  // Ce que le produit est cense ecarter, et pourquoi.
  ['en', 'anglais', 'good evening everyone how is everybody doing'],
  ['en', 'anglais', 'that play was genuinely incredible to watch'],
  ['xx', 'bruit', 'kkkkkkkkkk'],
  ['xx', 'bruit', 'xdxdxdxd'],
  ['xx', 'bruit', '😂😂😂😂😂'],
  ['xx', 'bruit', '!!!!!!'],
  ['xx', 'argot', 'poggers'],
  ['xx', 'argot', 'kekw'],
  ['xx', 'argot', 'copium'],
  ['xx', 'court', 'si'],
  ['xx', 'court', 'ok'],
  ['xx', 'court', 'jaja'],
  ['es', 'duplique', 'esa jugada ha sido increible de verdad'],
  ['es', 'duplique', 'esa jugada ha sido increible de verdad'],
];

const rangee = (i, pseudo, texte) =>
  `<div data-index="${i}"><div class="w-full min-w-0 shrink-0">` +
  `<button class="font-bold" style="color:#53FC18">${pseudo}</button>` +
  `<span class="font-normal">${texte}</span></div></div>`;

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>c</title>
<style>*{box-sizing:border-box}html,body{margin:0;background:#0b0b0c;color:#eee;font:14px system-ui}
#page{display:flex;height:100vh}#video{flex:1;min-width:0;background:#14181b}
#channel-chatroom{width:340px;flex:0 0 340px;display:flex;flex-direction:column}
[data-which=decoy]{flex:0 0 0;height:0;overflow:hidden}[data-which=messages]{flex:1;overflow:auto}
#compose{border-top:1px solid #222;padding:8px}
[contenteditable]{min-height:36px;border:1px solid #2a2f33;border-radius:4px;padding:8px}
</style></head><body><div id="page"><div id="video"></div><div id="channel-chatroom">
<div class="no-scrollbar" data-which="decoy"></div>
<div class="no-scrollbar" data-which="messages">${rangee(0, 'amorce', 'buenos dias a todos')}</div>
<div id="compose"><div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input"></div></div>
</div></div></body></html>`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-met-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1280, height: 860 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--window-position=-2400,-2400',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

let appelsMoteur = 0;
/** La langue source annoncee au moteur, requete par requete. */
const slVus = [];
const KICK = /^https?:\/\/(www\.)?kick\.com\//;
const SAUT = String.fromCharCode(10);

await ctx.route('**://translate.googleapis.com/**', async (route) => {
  appelsMoteur += 1;
  {
    const u = new URL(route.request().url());
    const sl = u.searchParams.get('sl') ?? '?';
    const q = (u.searchParams.get('q') ?? '').slice(0, 26);
    slVus.push(sl + ' <- ' + JSON.stringify(q));
  }
  const q = new URL(route.request().url()).searchParams.get('q') ?? '';
  const lignes = q.split(SAUT);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      lignes.map((l, k) => [`EN:${l}` + (k < lignes.length - 1 ? SAUT : ''), l, null, null, 10]),
      null,
      'es',
    ]),
  });
});

await ctx.route(KICK, async (route) => {
  const r = route.request();
  if (r.resourceType() === 'document') {
    await route.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
  } else if (r.url().includes('/api/')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: 'es' } }),
    });
  } else {
    await route.fulfill({ status: 204, body: '' });
  }
});

/** Les compteurs des deux scopes, agreges, a l'instant ou on appelle. */
async function lireCompteurs() {
  const w = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }));
  const brut = await w.evaluate(async (marqueur) => {
    const cles = [`${marqueur}.sw`, `${marqueur}.content`];
    const o = await chrome.storage.local.get(cles);
    return cles.map((c) => o[c] ?? null);
  }, 'kt.metrics.v1');
  const out = {};
  for (const sc of brut.filter(Boolean)) {
    for (const [k, v] of Object.entries(sc.counts ?? {})) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/kt-mesure', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

// Les messages arrivent comme sur un chat : par petits paquets, espaces, pas
// tous dans le meme tick. Un seul tick mesurerait un lot et rien d'autre.
let index = 1;
const PAS = LENT ? 1 : 3;
const ATTENTE = LENT ? 1200 : 900;
for (let i = 0; i < CORPUS.length; i += PAS) {
  const paquet = CORPUS.slice(i, i + PAS);
  await page.evaluate(
    ({ lignes, depart }) => {
      const cible = document.querySelector('#channel-chatroom [data-which="messages"]');
      for (const [k, [, , texte]] of lignes.entries()) {
        const d = document.createElement('div');
        d.setAttribute('data-index', String(depart + k));
        d.innerHTML =
          '<div class="w-full min-w-0 shrink-0">' +
          `<button class="font-bold" style="color:#53FC18">pseudo${depart + k}</button>` +
          `<span class="font-normal">${texte}</span></div>`;
        cible.appendChild(d);
      }
    },
    { lignes: paquet, depart: index },
  );
  index += paquet.length;
  await page.waitForTimeout(ATTENTE);
}

// Le meme texte, reenvoye par quelqu'un d'autre : c'est ce qui doit toucher le
// cache plutot que le moteur.
await page.evaluate(
  ({ textes, depart }) => {
    const cible = document.querySelector('#channel-chatroom [data-which="messages"]');
    for (const [k, texte] of textes.entries()) {
      const d = document.createElement('div');
      d.setAttribute('data-index', String(depart + k));
      d.innerHTML =
        '<div class="w-full min-w-0 shrink-0">' +
        `<button class="font-bold" style="color:#53FC18">autre${depart + k}</button>` +
        `<span class="font-normal">${texte}</span></div>`;
      cible.appendChild(d);
    }
  },
  { textes: CORPUS.filter((c) => c[1] === 'traduit').slice(0, 8).map((c) => c[2]), depart: index },
);

// Ce que chaque ligne est devenue, lue sur la ligne elle-meme, et lue AVANT le
// rechargement plus bas : celui-ci vide le chat, et prendre l'attribution
// apres ne mesurait plus que les huit lignes reposees pour le cache. Les compteurs
// donnent des totaux par raison ; ils ne disent pas QUELLE ligne a ete ecartee,
// et c'est exactement la question que `pipeline.ts` dit ne pas savoir repondre.
// Le produit laisse sa raison dans le `title` de la cible d'injection.
await page.waitForTimeout(3000);
const sort = await page.evaluate(() => {
  const c = document.querySelector('#channel-chatroom [data-which="messages"]');
  return [...c.querySelectorAll('div[data-index]')].map((r) => ({
    texte: (r.querySelector('.font-normal')?.textContent ?? '').slice(0, 44),
    traduit: !!r.querySelector('.kt-translation, .kt-translation-inline, .kt-translation-replace'),
    raison: [...r.querySelectorAll('[title]')]
      .map((e) => e.getAttribute('title'))
      .find((t) => t && t.startsWith('Not translated')) ?? null,
  }));
});

// Le second etage de cache ne peut pas gagner tant que le premier repond.
//
// `stats.ts` compte un seul totalCacheHits pour les deux etages, donc rien ne
// dit si la carte en memoire de l'onglet paie sa taille ou si celle du service
// worker fait tout le travail. Dans une meme page la question ne se pose meme
// pas : la memoire est interrogee en premier, donc elle repond toujours et
// l'autre etage ne voit que des defauts. Le seul moment ou le service worker
// peut gagner est celui ou la memoire disparait et pas lui : un rechargement.
const avantRechargement = { ...(await lireCompteurs()) };
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const repetes = CORPUS.filter((c) => c[1] === 'traduit').slice(0, 8).map((c) => c[2]);
await page.evaluate(
  ({ textes }) => {
    const cible = document.querySelector('#channel-chatroom [data-which="messages"]');
    for (const [k, texte] of textes.entries()) {
      const d = document.createElement('div');
      d.setAttribute('data-index', String(500 + k));
      d.innerHTML =
        '<div class="w-full min-w-0 shrink-0">' +
        `<button class="font-bold" style="color:#53FC18">apres${k}</button>` +
        `<span class="font-normal">${texte}</span></div>`;
      cible.appendChild(d);
    }
  },
  { textes: repetes },
);
const moteurAvantRechargement = appelsMoteur;
await page.waitForTimeout(7000);
const apresRechargement = { ...(await lireCompteurs()) };
const moteurApresRechargement = appelsMoteur;

// `FLUSH_DEBOUNCE_MS` vaut 2000 : lire plus tot lirait un stockage encore vide.
await page.waitForTimeout(6000);

const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }));
const brut = await sw.evaluate(async (marqueur) => {
  const cles = [`${marqueur}.sw`, `${marqueur}.content`];
  const o = await chrome.storage.local.get(cles);
  return cles.map((c) => o[c] ?? null);
}, 'kt.metrics.v1');

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

/** Les centiles, calcules ici parce que le stockage garde les reservoirs bruts. */
function resume(echantillons) {
  const s = [...echantillons].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return null;
  const a = (q) => s[Math.min(n - 1, Math.floor(q * n))];
  return { n, min: s[0], p50: a(0.5), p95: a(0.95), max: s[n - 1] };
}

const scopes = brut.filter(Boolean);
const compteurs = {};
const durees = {};
for (const s of scopes) {
  for (const [k, v] of Object.entries(s.counts ?? {})) compteurs[k] = (compteurs[k] ?? 0) + v;
  for (const [k, v] of Object.entries(s.samples ?? {})) durees[k] = (durees[k] ?? []).concat(v);
}

// Attendu contre observe, ligne par ligne. Un message de vrai chat ecarte est
// un lecteur qui ne lit pas sa traduction ; un bruit traduit est du quota brule.
const parTexte = new Map(CORPUS.map(([, genre, texte]) => [texte.slice(0, 44), genre]));
const desaccords = [];
let comptes = { traduit: 0, ecarte: 0, sansAvis: 0 };
for (const l of sort) {
  const genre = parTexte.get(l.texte);
  if (!genre) continue;
  if (l.traduit) comptes.traduit += 1;
  else if (l.raison) comptes.ecarte += 1;
  else comptes.sansAvis += 1;
  const attenduTraduit = genre === 'traduit' || genre === 'duplique';
  if (attenduTraduit !== l.traduit) {
    desaccords.push({ genre, texte: l.texte, traduit: l.traduit, raison: l.raison });
  }
}

// Ce que le rechargement a change : la memoire est repartie de zero, le service
// worker non. Les touches qu'il prend ici sont exactement ce qu'il rapporte.
const delta = (k) => (apresRechargement[k] ?? 0) - (avantRechargement[k] ?? 0);
const etages = {
  memoireTouches: delta('cache.mem.hit'),
  memoireDefauts: delta('cache.mem.miss'),
  swTouches: delta('cache.sw.hit'),
  swDefauts: delta('cache.sw.miss'),
  messagesRepetes: repetes.length,
  appelsMoteurApresRechargement: moteurApresRechargement - moteurAvantRechargement,
};

const sortie = {
  scopes: scopes.map((s) => s.scope),
  messagesPoses: CORPUS.length,
  appelsMoteur,
  parLigne: comptes,
  etagesDeCache: etages,
  desaccords,
  compteurs,
  durees: Object.fromEntries(
    Object.entries(durees)
      .map(([k, v]) => [k, resume(v)])
      .filter(([, v]) => v),
  ),
};

if (JSON_SEUL) {
  console.log(JSON.stringify(sortie, null, 1));
} else {
  console.log(`scopes lus       ${sortie.scopes.join(', ') || '(aucun)'}`);
  console.log(`messages poses   ${sortie.messagesPoses}, appels moteur ${appelsMoteur}`);
  console.log(
    `par ligne        ${comptes.traduit} traduites, ${comptes.ecarte} ecartees avec raison, ` +
      `${comptes.sansAvis} sans avis`,
  );
  if (desaccords.length) {
    console.log(`desaccords avec le corpus (${desaccords.length}) :`);
    for (const d of desaccords) {
      console.log(
        `  [${d.genre}] ${JSON.stringify(d.texte)} -> ${d.traduit ? 'traduit' : d.raison ?? 'rien'}`,
      );
    }
  }
  console.log(
    `cache, apres rechargement  ${etages.messagesRepetes} messages deja vus : ` +
      `memoire ${etages.memoireTouches} touches / ${etages.memoireDefauts} defauts, ` +
      `service worker ${etages.swTouches} touches / ${etages.swDefauts} defauts, ` +
      `${etages.appelsMoteurApresRechargement} appel(s) moteur`,
  );
  console.log('sl annonce au moteur :');
  for (const l of slVus) console.log('  ' + l);
  console.log('compteurs :');
  for (const [k, v] of Object.entries(compteurs).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(34)} ${v}`);
  }
  console.log('durees (ms) :');
  for (const [k, v] of Object.entries(sortie.durees).sort()) {
    console.log(
      `  ${k.padEnd(34)} n=${String(v.n).padStart(3)}  p50 ${String(v.p50).padStart(5)}  ` +
        `p95 ${String(v.p95).padStart(5)}  max ${String(v.max).padStart(5)}`,
    );
  }
}

const fails = [];
if (scopes.length === 0) fails.push('aucun scope de metriques dans le stockage : rien n a ete lu');
if (Object.keys(compteurs).length === 0) fails.push('aucun compteur : la lecture a rendu un vide');
// Un lecteur qui rend zero partout a l'air d'un produit parfait. Il faut qu'au
// moins le chemin nominal ait laisse une trace, sinon le vert ne vaut rien.
if (!compteurs['dom.row.seen']) fails.push('dom.row.seen absent : aucune rangee n a ete vue');

if (fails.length) {
  console.error('FAIL: ' + fails.join(' ; '));
  process.exit(1);
}
// En mode JSON le verdict part sur stderr : melanger les deux rendait la sortie
// illisible a un analyseur JSON, ce qui est tout l'interet du mode.
(JSON_SEUL ? console.error : console.log)('metrics-offline: OK');
