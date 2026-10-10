/**
 * Ce que l'extension coute a une page Kick pendant un chat rapide.
 *
 * Les autres portes disent si une ligne est traduite. Aucune ne disait a quel
 * prix pour la page : temps de script, recalculs de style, mises en page
 * forcees, tas JavaScript. Ce harnais rejoue un chat soutenu sur la fixture
 * hors ligne, deux fois, sans puis avec l'extension, et lit les compteurs du
 * moteur de rendu par CDP (`Performance.getMetrics`). Le script de contenu vit
 * dans le meme processus de rendu que la page, donc la difference entre les
 * deux passes est ce que l'extension ajoute.
 *
 * Le chat imite ce que fait le virtualiseur de Kick : une rangee
 * `div[data-index]` ajoutee par message, les plus anciennes retirees au-dela
 * d'une fenetre, et un compteur hors du chat mis a jour quatre fois par seconde
 * comme le reste d'une page vivante (lecteur video, spectateurs).
 *
 *   node test/e2e/charge-chat.mjs [--debit 20] [--duree 30] [--page 1000]
 *                                 [--echantillon 60] [--sans-temoin] [--json]
 *
 * Ce n'est pas une porte : les chiffres dependent de la machine. Il sert a
 * comparer deux builds sur la meme machine.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');
const arg = (nom, def) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const DEBIT = arg('--debit', 20);
const DUREE = arg('--duree', 30);
const JSON_SEUL = process.argv.includes('--json');
const SANS_TEMOIN = process.argv.includes('--sans-temoin');
/** `--echantillon 60` : une ligne par minute, pour voir si le cout derive sur un long stream. */
const ECHANTILLON = arg('--echantillon', 0);
/** `--page 1000` : autant de blocs hors du chat, pour approcher la taille d'une vraie page Kick. */
const PAGE = arg('--page', 0);

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title>
<style>body{background:#0b0e0f;color:#fff;margin:0} [data-index]{padding:2px 8px}</style></head>
<body>
  <div id="player"><span id="viewers">0</span> watching</div>
  <div id="channel-chatroom">
    <div class="no-scrollbar" data-which="decoy"></div>
    <div class="no-scrollbar" data-which="messages" style="height:600px;overflow:auto"></div>
    <div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input"
         style="min-height:40px;border:1px solid #333"></div>
  </div>
<script>
  const LIGNES = [
    'hola amigo que tal', 'que buen stream hoy', 'bonjour tout le monde', 'trop fort le mec',
    'wie geht es dir heute', 'das war ein krasser move', 'ciao a tutti ragazzi', 'che giocata incredibile',
    'olá pessoal tudo bem', 'que jogada absurda mano', 'привет всем как дела', 'это было очень круто',
    'merhaba arkadaşlar nasılsınız', 'bu oyun çok iyi', 'こんにちは皆さん', '今のプレイすごい',
    'lol', 'KEKW', 'gg', 'W', 'hello chat how are we doing', 'this stream is fire',
  ];
  const FENETRE = 80;
  let n = 0;
  function ajouter() {
    const cible = document.querySelector('[data-which="messages"]');
    const i = n++;
    const base = LIGNES[i % LIGNES.length];
    // Un message sur trois est unique, le reste revient : un chat repete beaucoup.
    const texte = i % 3 === 0 ? base + ' ' + i : base;
    const ligne = document.createElement('div');
    ligne.setAttribute('data-index', String(i));
    ligne.innerHTML =
      '<div class="w-full min-w-0 shrink-0">' +
      '<button class="font-bold" style="color: rgb(1,2,3)">user' + (i % 50) + '</button>' +
      '<span class="font-bold">: </span><span class="font-normal">' + texte + '</span></div>';
    cible.appendChild(ligne);
    while (cible.children.length > FENETRE) cible.firstElementChild.remove();
    cible.scrollTop = cible.scrollHeight;
  }
  // Le reste d'une page Kick : barre laterale, lecteur, recommandations. Des
  // milliers de noeuds hors du chat, que des regles CSS trop larges paient aussi.
  window.__remplir = (n) => {
    const hote = document.createElement('div');
    hote.id = 'remplissage';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = '<div><span>chaine ' + i + '</span><div><span>titre</span></div></div>';
      hote.appendChild(d);
    }
    document.body.prepend(hote);
  };
  window.__lancer = (debit, duree) => new Promise((fin) => {
    const t = setInterval(ajouter, 1000 / debit);
    const v = setInterval(() => { document.getElementById('viewers').textContent = String(Math.random()).slice(2, 7); }, 250);
    setTimeout(() => { clearInterval(t); clearInterval(v); fin(n); }, duree * 1000);
  });
</script>
</body></html>`;

const KICK = /^https?:\/\/(www\.)?kick\.com\//;
const CLES = [
  'ScriptDuration',
  'TaskDuration',
  'RecalcStyleCount',
  'RecalcStyleDuration',
  'LayoutCount',
  'LayoutDuration',
  'JSHeapUsedSize',
  'Nodes',
  'JSEventListeners',
];

async function passe(avecExtension) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-charge-'));
  const args = ['--no-first-run', '--no-default-browser-check', '--window-position=-2400,-2400'];
  if (avecExtension) args.push(`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`);
  const ctx = await chromium.launchPersistentContext(profile, {
    headless: false,
    viewport: { width: 1200, height: 800 },
    args,
  });
  let appels = 0;
  await ctx.route('**://translate.googleapis.com/**', async (route) => {
    appels++;
    const q = new URL(route.request().url()).searchParams.get('q') ?? '';
    const lignes = q.split('\n');
    const segments = lignes.map((l, k) => [`TR:${l}` + (k < lignes.length - 1 ? '\n' : ''), l, null, null, 10]);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([segments, null, 'es']) });
  });
  await ctx.route('**://api.github.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"tag_name":"v0.0.1"}' }),
  );
  await ctx.route(KICK, async (route) => {
    const req = route.request();
    if (req.resourceType() === 'document')
      return route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
    if (req.url().includes('/api/'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: 'es' } }),
      });
    return route.fulfill({ status: 204, body: '' });
  });

  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto('https://kick.com/kt-charge', { waitUntil: 'domcontentloaded' });
  if (avecExtension) {
    await page.waitForSelector('#kt-inject-style', { state: 'attached', timeout: 15000 });
  }
  if (PAGE) await page.evaluate((n) => window.__remplir(n), PAGE);
  // Une rangee pour que l'observateur s'accroche, puis le calme.
  await page.evaluate(() => window.__lancer(10, 0.5));
  await page.waitForTimeout(2500);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.collectGarbage');
  const avant = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const tranches = [];
  const lancer = page.evaluate(([d, s]) => window.__lancer(d, s), [DEBIT, DUREE]);
  if (ECHANTILLON) {
    let prec = avant;
    for (let t = ECHANTILLON; t <= DUREE; t += ECHANTILLON) {
      await page.waitForTimeout(ECHANTILLON * 1000);
      await cdp.send('HeapProfiler.collectGarbage');
      const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
      tranches.push({
        t,
        scriptMsParS: Math.round(((m.ScriptDuration - prec.ScriptDuration) * 1000) / ECHANTILLON),
        tacheMsParS: Math.round(((m.TaskDuration - prec.TaskDuration) * 1000) / ECHANTILLON),
        layoutsParS: Math.round((m.LayoutCount - prec.LayoutCount) / ECHANTILLON),
        tasMB: +(m.JSHeapUsedSize / 1048576).toFixed(2),
        noeuds: m.Nodes,
        ecouteurs: m.JSEventListeners,
      });
      if (!JSON_SEUL) console.log(JSON.stringify(tranches.at(-1)));
      prec = m;
    }
  }
  const messages = await lancer;
  await page.waitForTimeout(1500);
  await cdp.send('HeapProfiler.collectGarbage');
  const apres = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const traduites = await page.evaluate(() => document.querySelectorAll('.kt-translation, .kt-translation-inline, .kt-translation-replace').length);
  await ctx.close();
  fs.rmSync(profile, { recursive: true, force: true });

  const delta = {};
  for (const k of CLES) delta[k] = k === 'JSHeapUsedSize' || k === 'Nodes' || k === 'JSEventListeners' ? apres[k] : apres[k] - avant[k];
  return { messages, appels, traduites, ...delta, tranches };
}

const temoin = SANS_TEMOIN ? null : await passe(false);
const ext = await passe(true);

const fmt = (k, v) =>
  k.endsWith('Duration') ? `${(v * 1000).toFixed(0)} ms` : k === 'JSHeapUsedSize' ? `${(v / 1048576).toFixed(2)} MB` : String(Math.round(v));
if (JSON_SEUL) {
  console.log(JSON.stringify({ debit: DEBIT, duree: DUREE, temoin, ext }));
} else {
  console.log(`chat ${DEBIT} msg/s pendant ${DUREE} s, ${ext.messages} messages, ${ext.traduites} traductions visibles, ${ext.appels} appels moteur`);
  console.log(`${'compteur'.padEnd(22)}${'sans ext'.padStart(12)}${'avec ext'.padStart(12)}${'surcout'.padStart(12)}`);
  for (const k of CLES) {
    const a = temoin?.[k] ?? 0;
    const b = ext[k];
    console.log(`${k.padEnd(22)}${(temoin ? fmt(k, a) : '-').padStart(12)}${fmt(k, b).padStart(12)}${(temoin ? fmt(k, b - a) : '-').padStart(12)}`);
  }
}
