/**
 * Le changement de chaine sans rechargement : qui voit quoi, et depuis quel
 * monde.
 *
 * Ce qui a declenche cette sonde : kil rapporte que sur son Brave, changer de
 * stream demande un SECOND chargement de la page. La porte `translate-navigation`
 * est verte. L'une des deux se trompe.
 *
 * `index.ts` n'a que deux declencheurs de re-attachement, un patch de
 * `history.pushState` et un ecouteur `popstate`. `popstate` ne se declenche pas
 * sur un `pushState`, il ne sert qu'au retour arriere. Reste le patch, et un
 * script de contenu vit dans un MONDE ISOLE : son `history` est un autre objet
 * JavaScript au-dessus du meme historique.
 *
 * Et la porte est verte parce que l'observateur a un filet a lui : un
 * `containerWatcher` qui se raccroche quand le conteneur quitte le document. Il
 * rattrape les traductions entrantes, et RIEN de ce que `attachForRoute` porte
 * par-dessus. Cette sonde mesure donc les quatre choses separement, sur les deux
 * formes qu'une navigation d'application peut prendre :
 *
 *   A. le conteneur est remplace en entier   (ce que la porte simule)
 *   B. seul le contenu de la liste change    (ce qu'un composant reutilise fait)
 *
 *   node scratchpad/harness/nav-monde.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = process.env.KT_EXT ?? path.resolve(HERE, '../../dist');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('dist/manifest.json absent. Lancer `npm run build` avant.');
  process.exit(2);
}

const TRADUIT = 'ZZTRADUCTIONZZ';
const KICK = /^https?:\/\/(www\.)?kick\.com\//;

const rangee = (texte, i) =>
  `<div data-index="${i}"><div class="w-full min-w-0 shrink-0">` +
  `<button class="font-bold" style="color: rgb(1,2,3)">pseudo${i}</button>` +
  `<span class="font-normal">${texte}</span></div></div>`;

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>chat</title></head>
<body><div id="channel-chatroom">
  <div class="no-scrollbar" data-which="decoy"></div>
  <div class="no-scrollbar" data-which="messages" style="height:600px;overflow:auto">${rangee('hola amigo que tal', 0)}</div>
  <div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input" style="min-height:38px"></div>
</div></body></html>`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-nav-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1200, height: 800 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

/** Les langues de chaine que la fausse API de Kick rend, par slug. */
const LANG_PAR_SLUG = { 'kt-un': 'es', 'kt-deux': 'ja', 'kt-trois': 'de', 'kt-quatre': 'pt' };
const langesDemandees = [];

await ctx.route('**://translate.googleapis.com/**', async (route) => {
  const q = new URL(route.request().url()).searchParams.get('q') ?? '';
  const SAUT = String.fromCharCode(10);
  const lignes = q.split(SAUT);
  const segments = lignes.map((l, k) => [`${TRADUIT}:${l}` + (k < lignes.length - 1 ? SAUT : ''), l, null, null, 10]);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([segments, null, 'es']) });
});
await ctx.route(KICK, async (route) => {
  const r = route.request();
  if (r.resourceType() === 'document') {
    await route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
    return;
  }
  if (r.url().includes('/api/')) {
    const slug = r.url().match(/channels\/([^/?]+)/)?.[1] ?? '';
    langesDemandees.push(slug);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chatroom: { id: 1 }, livestream: { lang_iso: LANG_PAR_SLUG[slug] ?? 'es' } }),
    });
    return;
  }
  await route.fulfill({ status: 204, body: '' });
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/kt-un', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const SEL_TR = '.kt-translation, .kt-translation-inline, .kt-translation-replace';

/** L'etat visible par un lecteur, apres coup. */
async function etat(texteAttendu) {
  return page.evaluate(
    ({ sel, texte }) => {
      const rangees = [...document.querySelectorAll('#channel-chatroom div[data-index]')];
      const cible = rangees.find((r) => (r.querySelector('.font-normal')?.textContent ?? '') === texte);
      return {
        traduite: !!cible?.querySelector(sel),
        barre: !!document.querySelector('#kt-floating-bar'),
        chipCompose: document.querySelector('#kt-floating-bar .kt-float-lang')?.textContent?.trim() ?? null,
        url: location.pathname,
      };
    },
    { sel: SEL_TR, texte: texteAttendu },
  );
}

/** Une navigation d'application, faite depuis le monde principal comme le site. */
async function naviguer({ vers, texte, index, remplacerConteneur }) {
  await page.evaluate(
    ({ vers, html, remplacer }) => {
      history.pushState({}, '', vers);
      const salon = document.querySelector('#channel-chatroom');
      if (remplacer) {
        const neuf = salon.cloneNode(false);
        neuf.innerHTML = salon.innerHTML;
        neuf.querySelector('[data-which="messages"]').innerHTML = html;
        salon.replaceWith(neuf);
      } else {
        // Le composant est reutilise : le conteneur reste, son contenu change.
        salon.querySelector('[data-which="messages"]').innerHTML = html;
      }
    },
    { vers, html: rangee(texte, index), remplacer: remplacerConteneur },
  );
  await page.waitForTimeout(10000);
  return etat(texte);
}

const depart = await etat('hola amigo que tal');
const patch = await page.evaluate(() => String(history.pushState).includes('[native code]'));

// ── La pause AVANT toute navigation, et voici pourquoi l'ordre compte ───────
// Premiere version : la pause etait testee apres deux navigations, le clic
// n'ecrivait rien et la barre ne bougeait pas. Ce n'etait pas le produit. Le
// scenario A remplace `#channel-chatroom` par un clone dont le contenu est copie
// par `innerHTML`, ce qui recree la barre en HTML inerte : une copie sans ses
// ecouteurs. Le clic tombait sur un bouton mort. La sonde accusait, le produit
// n'avait rien fait.
async function cliquerPause() {
  const cible = await page.evaluate(() => {
    const bar = document.querySelector('#kt-floating-bar');
    return { power: !!bar?.querySelector('.kt-float-power'), avant: bar?.dataset.enabled ?? '?' };
  });
  await page.evaluate(() => document.querySelector('#kt-floating-bar .kt-float-power')?.click());
  await page.waitForTimeout(2000);
  const apres = await page.evaluate(() => document.querySelector('#kt-floating-bar')?.dataset.enabled ?? '?');
  console.log(`  clic pause : bouton ${cible.power ? 'trouve' : 'ABSENT'}, barre ${cible.avant} -> ${apres}`);
  return apres;
}

async function poser(texte, index) {
  await page.evaluate(
    ({ html }) => {
      document.querySelector('#channel-chatroom [data-which="messages"]').insertAdjacentHTML('beforeend', html);
    },
    { html: rangee(texte, index) },
  );
  await page.waitForTimeout(9000);
  return etat(texte);
}

const barreApresClic = await cliquerPause();
const enPause = await poser('que tal todo el mundo', 1);

// La chaine suivante ne doit PAS heriter de la pause.
const C = await naviguer({ vers: '/kt-deux', texte: 'buenos dias a todos', index: 2, remplacerConteneur: false });
// Et le retour sur la chaine mise en pause doit la retrouver en pause.
const D = await naviguer({ vers: '/kt-un', texte: 'sigue en pausa verdad', index: 3, remplacerConteneur: false });
// Reprise explicite, puis les deux formes de navigation sur une chaine active.
await cliquerPause();
const reprise = await poser('ya volvemos a traducir', 4);
const A = await naviguer({ vers: '/kt-trois', texte: 'adios amigos hasta luego', index: 5, remplacerConteneur: true });
const B = await naviguer({ vers: '/kt-quatre', texte: 'hola de nuevo amigos', index: 6, remplacerConteneur: false });

await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

if (!depart.traduite) {
  console.error('SONDE MUETTE: rien n etait traduit au depart, la sonde ne mesure rien.');
  process.exit(2);
}

const ligne = (nom, e) =>
  `  ${nom.padEnd(34)} traduite ${e.traduite ? 'OUI' : 'NON'}   barre ${e.barre ? 'presente' : 'ABSENTE '}   url ${e.url}`;

console.log(`\n## Le patch de pushState, vu du monde principal\n`);
console.log(`  ${patch ? 'NATIF : le patch du monde isole ne le voit pas' : 'patche'}`);

console.log(`\n## Ce qu un lecteur a sous les yeux\n`);
console.log(ligne('au chargement', depart));
console.log(ligne('A. conteneur remplace', A));
console.log(ligne('B. contenu de la liste change', B));
console.log(ligne('pause cliquee, meme chaine', enPause));
console.log(ligne('reprise cliquee, meme chaine', reprise));
console.log(ligne('C. chaine suivante apres pause', C));
console.log(ligne('D. retour sur la chaine en pause', D));

console.log(`\n## La langue de la chaine, re-demandee ou non\n`);
console.log(`  slugs demandes a l API de Kick : ${langesDemandees.join(', ') || '(aucun)'}`);
console.log(`  trois chaines visitees, ${new Set(langesDemandees).size} interrogee(s)`);

const fails = [];
if (!A.traduite) fails.push('A : les messages de la nouvelle chaine ne sont plus traduits');
if (!B.traduite) fails.push('B : les messages de la nouvelle chaine ne sont plus traduits');
if (!A.barre) fails.push('A : la barre a disparu et n est pas remontee');
if (!B.barre) fails.push('B : la barre a disparu et n est pas remontee');
if (barreApresClic !== 'false') fails.push(`le clic n a pas eteint la barre (dataset.enabled=${barreApresClic})`);
if (enPause.traduite) fails.push('la pause ne fait rien : la chaine mise en pause traduit encore');
if (!reprise.traduite) fails.push('la reprise ne repart pas : le bouton eteint mais ne rallume pas');
if (!C.traduite)
  fails.push(
    'la pause d une chaine eteint la SUIVANTE : c est le defaut, le bouton ecrit un reglage global',
  );
if (D.traduite) fails.push('revenir sur la chaine mise en pause la retrouve active : la pause ne tient pas');
if (new Set(langesDemandees).size < 3)
  fails.push(
    `la langue de la chaine n a ete demandee que pour ${new Set(langesDemandees).size} chaine(s) sur 3 : ` +
      "l apercu de composition ecrit dans la langue d'une chaine quittee",
  );

console.log('');
if (fails.length) {
  console.error('DEFAUTS MESURES :');
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log('Rien a signaler : tout repart sur les deux formes de navigation.');
