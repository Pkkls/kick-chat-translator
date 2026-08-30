/**
 * Le produit fait une seule chose : un message arrive dans le chat, sa
 * traduction apparait dessous. Rien hors ligne ne le verifiait.
 *
 * Ce que les autres portes couvrent. `chat-live` appelle `inject()` a la main et
 * mesure le rendu ; les 620 tests unitaires bouchonnent aux frontieres de
 * module. Le chemin reel, du noeud ajoute au DOM jusqu'au texte traduit affiche,
 * en passant par l'observateur, le pipeline, le message vers le service worker
 * et le moteur, n'etait exerce que par des harnais live qui ouvrent le vrai
 * kick.com et demandent le reseau.
 *
 * Comment celui-ci s'en passe. Comme `extension-load` : `content_scripts` filtre
 * sur l'URL et pas sur ce qui repond, donc kick.com est servi localement. Le
 * moteur de traduction est intercepte de la meme facon et rend une reponse
 * fabriquee, ce qui rend l'assertion exacte : on sait quel texte doit apparaitre.
 *
 * Ce qu'elle attrape, mesure et pas suppose. Casser `font-normal` dans
 * `selectors.ts` la fait rougir : la chaine complete repond a une regression
 * reelle du produit. Mais les tests unitaires attrapent deja celle-la, quatre
 * d'entre eux. La valeur propre de cette porte est le cablage lui-meme, ce que
 * personne d'autre n'execute : Chrome charge l'extension, le script de contenu
 * arrive, l'observateur s'accroche au bon conteneur, le pipeline parle au
 * service worker, l'adaptateur du moteur lit la reponse, et le rendu se pose
 * sous le bon message. Aucun de ces sauts n'est franchi ailleurs hors ligne.
 *
 * Ce qu'elle n'attrape pas, mesure aussi. Retirer
 * `https://translate.googleapis.com/*` des `host_permissions` ne la fait pas
 * rougir : l'interception repond avant que la permission compte. Elle ne dit
 * donc rien sur les permissions declarees, et il ne faut pas lui faire dire.
 *
 *   node scratchpad/harness/translate-offline.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}

/** Le texte que le faux moteur rend. Choisi pour ne ressembler a rien d'autre
    dans la page, afin qu'une assertion qui le trouve ne puisse pas le trouver
    ailleurs par accident. */
const TRADUIT = 'ZZTRADUCTIONZZ';
const SOURCE = 'hola amigo que tal';

// Le chat de Kick reduit a son contrat, repris de `observer.test.ts` qui est
// ce que le produit dit savoir lire : `#channel-chatroom .no-scrollbar`, un
// leurre vide en premier comme sur le vrai site, puis des `div[data-index]`
// avec le pseudo dans un `button.font-bold` et le texte dans un
// `span.font-normal`.
const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title></head>
<body>
  <div id="channel-chatroom">
    <div class="no-scrollbar" data-which="decoy"></div>
    <div class="no-scrollbar" data-which="messages" style="height:600px;overflow:auto">
      <div data-index="0"><button class="font-bold" style="color: rgb(1,2,3)">autre</button><span class="font-normal">buenos dias a todos</span></div>
    </div>
  </div>
</body></html>`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-tr-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1200, height: 800 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--window-position=-2400,-2400',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const vuParLeMoteur = [];

// Le glob de Playwright ne fait pas matcher `*.kick.com` sur `kick.com` : `*`
// veut au moins un caractere avant le point, donc le document partait sur le
// vrai site pendant que les sous-ressources, elles, etaient bien interceptees.
// Une expression reguliere prend les deux formes.
const KICK = /^https?:\/\/(www\.)?kick\.com\//;

await ctx.route('**://translate.googleapis.com/**', async (route) => {
  vuParLeMoteur.push(route.request().url());
  // La forme que `src/background/translator/google.ts` sait lire :
  // data[0] = segments, chaque segment [traduit, original, ...], data[2] = langue source.
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([[[TRADUIT, SOURCE, null, null, 10]], null, 'es']),
  });
});

await ctx.route(KICK, async (route) => {
  const req = route.request();
  if (req.resourceType() === 'document') {
    await route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
    return;
  }
  if (req.url().includes('/api/')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: 'es' } }),
    });
    return;
  }
  await route.fulfill({ status: 204, body: '' });
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
const console_ = [];
page.on('console', (m) => console_.push(`${m.type()}: ${m.text().slice(0, 160)}`));

await page.goto('https://kick.com/kt-fixture-channel', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const barreMontee = await page.evaluate(() => !!document.getElementById('kt-inject-style'));

// Un message arrive, exactement comme Kick en ajoute un.
await page.evaluate((texte) => {
  const liste = document.querySelector('#channel-chatroom [data-which="messages"]');
  const ligne = document.createElement('div');
  ligne.setAttribute('data-index', '0');
  ligne.innerHTML =
    '<button class="font-bold" style="color: rgb(1,2,3)">quelquun</button>' +
    `<span class="font-normal">${texte}</span>`;
  liste.appendChild(ligne);
}, SOURCE);

let traductionVue = null;
try {
  await page.waitForSelector('.kt-translation, .kt-translation-inline, .kt-translation-replace', {
    timeout: 15000,
  });
  traductionVue = await page.evaluate(
    () =>
      document.querySelector('.kt-translation, .kt-translation-inline, .kt-translation-replace')
        ?.textContent ?? null,
  );
} catch {
  traductionVue = null;
}

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

console.log(`content script   ${barreMontee ? 'injecte' : 'ABSENT'}`);
console.log(`moteur appele    ${vuParLeMoteur.length} fois`);
console.log(`traduction       ${traductionVue === null ? '(aucune)' : JSON.stringify(traductionVue)}`);
if (!traductionVue && console_.length) {
  console.log('console de la page :');
  for (const l of console_.slice(-8)) console.log('  ' + l);
}

const fails = [];
if (!barreMontee) fails.push('le script de contenu ne s est pas execute');
if (vuParLeMoteur.length === 0)
  fails.push('le moteur de traduction n a jamais ete appele : rien n a traduit');
if (traductionVue === null) fails.push('aucune traduction affichee sous le message');
else if (!traductionVue.includes(TRADUIT))
  fails.push(`la traduction affichee ne vient pas du moteur : ${JSON.stringify(traductionVue)}`);

if (fails.length) {
  console.error('FAIL: ' + fails.join(' ; '));
  process.exit(1);
}
console.log('translate-offline: OK');
