/**
 * Les 42 drapeaux, rendus a la taille reelle et agrandis, pour etre REGARDES.
 *
 * Un drapeau faux est pire qu'un code ISO. Avant de construire un panneau
 * autour d'eux, il faut les voir : a 16x12 dans la rangee, et a 4x pour
 * verifier que la composition est la bonne et pas juste plausible de loin.
 *
 *   node scratchpad/harness/flags-preview.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(HERE, 'flags.css'), 'utf8');

/** langue -> pays affiche. Convention d'affichage, pas une affirmation. */
const MAP = [
  ['en', 'gb', 'English'], ['fr', 'fr', 'Francais'], ['es', 'es', 'Espanol'],
  ['pt', 'pt', 'Portugues'], ['pt-br', 'br', 'Portugues (BR)'], ['de', 'de', 'Deutsch'],
  ['it', 'it', 'Italiano'], ['nl', 'nl', 'Nederlands'], ['pl', 'pl', 'Polski'],
  ['sv', 'se', 'Svenska'], ['cs', 'cz', 'Cestina'], ['sk', 'sk', 'Slovencina'],
  ['ro', 'ro', 'Romana'], ['ru', 'ua', 'Russkiy'], ['uk', 'ua', 'Ukrainska'],
  ['tr', 'tr', 'Turkce'], ['ar', 'sa', 'Arabiya'], ['he', 'il', 'Ivrit'],
  ['ja', 'jp', 'Nihongo'], ['ko', 'kr', 'Hangugeo'], ['zh', 'cn', 'Zhongwen'],
  ['zh-tw', 'tw', 'Zhongwen (TW)'], ['th', 'th', 'Thai'], ['vi', 'vn', 'Tieng Viet'],
  ['id', 'id', 'Indonesia'], ['hi', 'in', 'Hindi'], ['fi', 'fi', 'Suomi'],
  ['no', 'no', 'Norsk'], ['da', 'dk', 'Dansk'], ['el', 'gr', 'Ellinika'],
  ['hu', 'hu', 'Magyar'], ['bg', 'bg', 'Balgarski'], ['ca', 'ca', 'Catala'],
  ['sl', 'sl', 'Slovenscina'], ['et', 'ee', 'Eesti'], ['lt', 'lt', 'Lietuviu'],
  ['lv', 'lv', 'Latviesu'], ['fa', 'ir', 'Farsi'], ['bn', 'bd', 'Bangla'],
  ['ta', 'lk', 'Tamil'], ['ms', 'my', 'Melayu'], ['tl', 'ph', 'Filipino'],
];

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
${css}
body { margin:0; padding:18px; background:#171a1c; color:#fff;
       font:12px/1.3 'Inter', system-ui, sans-serif; }
h2 { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#9fa6ad;
     margin:0 0 10px; font-weight:600; }
.grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:10px 14px; margin-bottom:26px; }
.cell { display:flex; align-items:center; gap:8px; }
.code { font-family:ui-monospace, monospace; font-size:10px; font-weight:700;
        color:#9fa6ad; width:36px; }
.big .kt-flag { width:64px; height:48px; border-radius:4px; }
.big .cell { flex-direction:column; align-items:flex-start; gap:4px; }
</style></head><body>
<h2>a la taille de la rangee, 16x12</h2>
<div class="grid" id="small"></div>
<h2>agrandi 4x, pour verifier la composition</h2>
<div class="grid big" id="large"></div>
<script>
const MAP = ${JSON.stringify(MAP)};
for (const host of ['small','large']) {
  const g = document.getElementById(host);
  for (const [lang, cc, name] of MAP) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const f = document.createElement('span');
    f.className = 'kt-flag kt-flag-' + cc;
    const c = document.createElement('span');
    c.className = 'code';
    c.textContent = lang.toUpperCase();
    const n = document.createElement('span');
    n.textContent = name;
    cell.append(f, c, n);
    g.appendChild(cell);
  }
}
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 1500 }, deviceScaleFactor: 2 });
await page.setContent(PAGE);

// Toute classe .kt-flag-xx qui n'existe pas rend un fond transparent : ca se voit mal
// sur une capture et ca passerait pour un drapeau sombre.
// Les drapeaux dessines en SVG doivent VRAIMENT porter leur image. Se contenter
// de « fond non transparent » a laisse passer dix-huit regles invalides : les
// anciennes regles degrade repondaient a leur place et la capture etait
// identique a celle d'avant.
const EN_SVG = ['gb','kr','cz','ph','my','tr','br','vn','cn','gr','lk','sa','il','in','se','dk','no','fi','tw','sk','sl'];
const missing = await page.evaluate((attendus) => {
  const out = [];
  for (const el of document.querySelectorAll('#small .kt-flag')) {
    const cc = el.className.replace('kt-flag kt-flag-', '');
    const bg = getComputedStyle(el).backgroundImage;
    const col = getComputedStyle(el).backgroundColor;
    const vide = bg === 'none' && (col === 'rgba(0, 0, 0, 0)' || col === 'transparent');
    if (vide) out.push(cc + ' : aucune regle');
    else if (attendus.includes(cc) && !bg.includes('data:image/svg')) {
      out.push(cc + ' : regle SVG jetee, un degrade repond a sa place');
    }
  }
  return out;
}, EN_SVG);

await page.screenshot({ path: path.join(HERE, 'flags-preview.png'), fullPage: true });
await browser.close();

console.log(`${MAP.length} langues rendues.`);
if (missing.length) {
  console.error(`${missing.length} sans regle CSS : ${missing.join(' ')}`);
  process.exit(1);
}
console.log('toutes ont une regle. capture : scratchpad/harness/flags-preview.png');
