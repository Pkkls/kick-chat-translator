/**
 * Ce que le panneau coute vraiment, en pixels et en arrets de tabulation.
 * Chiffres avant jugement : sans eux, une correction n'est qu'une preference.
 *
 * Assertions, chacune capable de rougir :
 *  - le panneau ne deborde pas du panneau de chat ;
 *  - il en couvre nettement moins que le deroulant natif, qui en prend 95% ;
 *  - toutes les rangees ont la meme hauteur, PT-BR et ZH-TW compris ;
 *  - filtrer cache vraiment des rangees.
 *
 *   node scratchpad/harness/lang-panel-measure.mjs
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await page.goto(pathToFileURL(path.join(HERE, 'lang-panel.html')).href);

const m = await page.evaluate(() => {
  const box = (el) => el.getBoundingClientRect();
  const chat = box(document.querySelector('.chat'));
  const panel = box(document.querySelector('.anchored .kt-lang-panel'));
  const repos = document.querySelector('#list-repos').parentElement;
  const rows = [...repos.querySelectorAll('.kt-lang-row')].map((r) => Math.round(box(r).height));
  const favs = [...repos.querySelectorAll('.kt-lang-fav')].map((f) => Math.round(box(f).width));
  const list = box(repos.querySelector('.kt-lang-list'));
  const filtre = document.querySelector('#list-filtre');
  const total = filtre.querySelectorAll('.kt-lang-row').length;
  const visibles = [...filtre.querySelectorAll('.kt-lang-row')].filter(
    (r) => r.offsetParent !== null
  ).length;
  return {
    chatH: Math.round(chat.height),
    panelH: Math.round(panel.height),
    part: Math.round((panel.height / chat.height) * 100),
    deborde: panel.top < chat.top || panel.bottom > chat.bottom,
    hauteursRangees: [...new Set(rows)],
    largeursPastilles: [...new Set(favs)],
    rangeesVisibles: Math.round(list.height / (rows[0] || 30)),
    filtre: { total, visibles },
    // Panneau ferme, ce que la barre coute en tabulation : la puce seule.
    arretsBarre: document.querySelectorAll('.chat-foot [tabindex="0"], .chat-foot button').length,
  };
});
await browser.close();

const echecs = [];
if (m.deborde) echecs.push('le panneau deborde du panneau de chat');
if (m.part > 45) echecs.push(`couvre ${m.part}% du chat, le natif en couvre 95%`);
if (m.hauteursRangees.length !== 1)
  echecs.push(`rangees inegales : ${m.hauteursRangees.join(', ')}px`);
if (m.largeursPastilles.length !== 1)
  echecs.push(`pastilles inegales : ${m.largeursPastilles.join(', ')}px`);
if (m.filtre.visibles >= m.filtre.total)
  echecs.push(`filtrer ne cache rien : ${m.filtre.visibles}/${m.filtre.total} visibles`);

console.log(`panneau      ${m.panelH}px sur ${m.chatH}px, soit ${m.part}% (natif : 95%)`);
console.log(`rangees      ${m.hauteursRangees.join(', ')}px, ${m.rangeesVisibles} visibles avant defilement`);
console.log(`pastilles    ${m.largeursPastilles.join(', ')}px chacune, 4 sur une rangee`);
console.log(`filtre "por" ${m.filtre.visibles} rangees visibles sur ${m.filtre.total}`);
if (echecs.length) {
  console.error('ECHEC : ' + echecs.join(' ; '));
  process.exit(1);
}
console.log('OK');
