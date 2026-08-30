/**
 * Est-ce qu'un drapeau de pays se dessine, sur cette machine ?
 *
 * Remplacer la colonne ISO (`FR`, `EN`, `TR`) par des drapeaux ne vaut que si
 * les drapeaux se dessinent. Un emoji de drapeau est une paire d'indicateurs
 * regionaux : quand la police manque, le systeme rend les DEUX LETTRES au lieu
 * du drapeau, ce qui redonne exactement ce qu'on voulait remplacer.
 *
 * Mesure plutot qu'affirmation : on compare la largeur rendue du drapeau a
 * celle des deux lettres dans la meme police. Si le systeme retombe sur les
 * lettres, les deux largeurs se ressemblent ; s'il dessine un drapeau, la
 * largeur est celle d'un glyphe unique, nettement differente.
 *
 *   node scratchpad/harness/flag-render.mjs
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));

// Un echantillon qui couvre les cas qui posent probleme, pas seulement les
// faciles : une langue sans pays evident, une variante regionale, une langue
// parlee dans vingt pays.
const CASES = [
  ['fr', 'FR', '\u{1F1EB}\u{1F1F7}'],
  ['en', 'EN', '\u{1F1EC}\u{1F1E7}'],
  ['tr', 'TR', '\u{1F1F9}\u{1F1F7}'],
  ['ar', 'AR', '\u{1F1F8}\u{1F1E6}'],
  ['zh-tw', 'ZH-TW', '\u{1F1F9}\u{1F1FC}'],
  ['pt-br', 'PT-BR', '\u{1F1E7}\u{1F1F7}'],
];

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; padding:16px; background:#171a1c; color:#fff;
         font:14px/1.4 system-ui, sans-serif; }
  .row { display:flex; align-items:center; gap:14px; padding:4px 0; }
  /* La meme pile que .kt-chip-iso, sinon on mesure une autre police. */
  .iso, .flag { font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size:10px; font-weight:700; letter-spacing:.07em; white-space:nowrap; }
  .big { font-size:22px; }
</style></head><body><div id="stage"></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 420 }, deviceScaleFactor: 2 });
await page.setContent(PAGE);

const measured = await page.evaluate((cases) => {
  const stage = document.getElementById('stage');
  const out = [];
  for (const [code, iso, flag] of cases) {
    const row = document.createElement('div');
    row.className = 'row';
    const a = document.createElement('span');
    a.className = 'iso';
    a.textContent = iso;
    const b = document.createElement('span');
    b.className = 'flag';
    b.textContent = flag;
    const c = document.createElement('span');
    c.className = 'flag big';
    c.textContent = flag;
    const label = document.createElement('span');
    label.textContent = code;
    row.append(a, b, c, label);
    stage.appendChild(row);
    out.push({
      code,
      iso,
      largeurIso: +a.getBoundingClientRect().width.toFixed(1),
      largeurDrapeau: +b.getBoundingClientRect().width.toFixed(1),
      // Un drapeau reellement dessine occupe une seule cellule ; deux lettres
      // de repli en occupent deux.
      caracteres: [...flag].length,
    });
  }
  return out;
}, CASES);

await page.screenshot({ path: path.join(HERE, 'flag-render.png') });
await browser.close();

console.log('code    ISO      largeur ISO   largeur drapeau   verdict');
let fallbacks = 0;
for (const m of measured) {
  // Le repli dessine les deux lettres de l'indicateur regional : la largeur
  // colle a celle du texte ISO a deux caracteres. Un vrai drapeau est un glyphe
  // unique, plus large qu'une lettre et sans rapport avec la longueur du code.
  const deuxLettres = m.largeurDrapeau > m.largeurIso * 0.7 && m.largeurDrapeau < m.largeurIso * 2.2;
  const verdict = deuxLettres ? 'LETTRES (repli)' : 'drapeau dessine';
  if (deuxLettres) fallbacks += 1;
  console.log(
    `${m.code.padEnd(7)} ${m.iso.padEnd(8)} ${String(m.largeurIso).padStart(8)}  ${String(m.largeurDrapeau).padStart(14)}   ${verdict}`,
  );
}

console.log();
console.log(`${fallbacks}/${measured.length} rendus en lettres au lieu d un drapeau.`);
console.log(`capture : ${path.join(HERE, 'flag-render.png')}`);
// Pas de verdict d'echec : ce script repond a une question, il ne garde rien.
