/**
 * La barre flottante, a dix largeurs de fenetre.
 *
 * Ce que les autres portes ne regardaient pas. Les audits d'accessibilite
 * tournent sur les dumps du menu de la puce et du panneau de langues, ou la
 * barre elle-meme n'apparait pas, et `bar-live` mesure son placement sans
 * mesurer ses boutons. Resultat : la pause faisait 26 par 18 et l'engrenage 25
 * par 19 dans le build livre, a toutes les largeurs, alors que WCAG 2.5.8
 * demande 24 par 24. C'est le meme defaut que le chevron de la puce de langue,
 * un 10 par 6 dans un 45 par 24, corrige il y a deux jours sur signalement.
 *
 * Trois choses a chaque largeur : la barre existe, rien de ce qu'elle contient
 * ne sort de son cadre, et aucune cible visible ne passe sous 24 par 24. Une
 * cible de taille nulle est ignoree : la puce sur appareil est absente quand
 * aucun modele ne s'applique, et compter une absence comme un defaut ferait
 * rougir la porte pour toujours.
 *
 *   node scratchpad/harness/bar-widths.mjs
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './playwright.mjs';

const EXT = process.env.KT_EXT ?? path.resolve('dist');
const LARGEURS = [1500, 1280, 1024, 900, 760, 600, 480, 420, 375, 340];

const MSGS = [
  ['pixel_raton', 'buenas noches a todos que tal va la cosa'],
  ['nubecita77', 'esa jugada ha sido increible de verdad'],
  ['tortuga_veloz', 'alguien sabe a que hora empieza el torneo'],
];
const rangee = (i, [u, t]) =>
  `<div data-index="${i}"><div class="w-full min-w-0 shrink-0">` +
  `<button class="font-bold" style="color:#53FC18">${u}</button>` +
  `<span class="font-normal">${t}</span></div></div>`;

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>c</title>
<style>*{box-sizing:border-box}html,body{margin:0;background:#0b0b0c;color:#eee;font:14px system-ui}
#page{display:flex;height:100vh}#video{flex:1;min-width:0;background:#14181b}
#channel-chatroom{width:340px;flex:0 0 340px;display:flex;flex-direction:column;background:#101013}
[data-which=decoy]{flex:0 0 0;height:0;overflow:hidden}
[data-which=messages]{flex:1;overflow:auto}
#compose{border-top:1px solid #222;padding:8px}
[contenteditable]{min-height:36px;border:1px solid #2a2f33;border-radius:4px;padding:8px}
</style></head><body><div id="page"><div id="video"></div>
<div id="channel-chatroom">
<div class="no-scrollbar" data-which="decoy"></div>
<div class="no-scrollbar" data-which="messages">${MSGS.map((m, i) => rangee(i, m)).join('')}</div>
<div id="compose"><div contenteditable="true" role="textbox" data-testid="chat-input" class="editor-input"></div></div>
</div></div></body></html>`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kct-larg-'));
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false, viewport: { width: 1500, height: 860 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--window-position=-2400,-2400', '--no-first-run'],
});
await ctx.route(/^https?:\/\/(www\.)?kick\.com\//, async (r) => {
  if (r.request().resourceType() === 'document') await r.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
  else await r.fulfill({ status: 204, body: '' });
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://kick.com/x', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const echecs = [];
for (const w of LARGEURS) {
  await page.setViewportSize({ width: w, height: 860 });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const bar = document.querySelector('#kt-floating-bar');
    if (!bar) return { barre: false };
    const r = bar.getBoundingClientRect();
    const enfants = [...bar.querySelectorAll('*')].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    });
    const dehors = enfants.filter((e) => {
      const b = e.getBoundingClientRect();
      return b.right > r.right + 1 || b.left < r.left - 1;
    });
    const cibles = [...bar.querySelectorAll('button,[role=button]')].map((b) => {
      const bb = b.getBoundingClientRect();
      return { c: (b.className || '').split(' ').find((x) => x.startsWith('kt-')) ?? 'btn', l: Math.round(bb.width), h: Math.round(bb.height) };
    });
    return {
      barre: true,
      l: Math.round(r.width), h: Math.round(r.height),
      deborde: bar.scrollWidth - bar.clientWidth,
      dehors: dehors.length,
      nomsDehors: dehors.slice(0, 3).map((e) => (e.className || e.tagName).toString().slice(0, 24)),
      cibles,
      // Une cible cachee n'est pas une cible : la puce sur appareil est
      // absente quand aucun modele ne s'applique.
      petites: cibles.filter((c) => (c.l > 0 || c.h > 0) && (c.l < 24 || c.h < 24)),
    };
  });
  console.log(String(w).padStart(5) + 'px', JSON.stringify(m));
  if (!m.barre) echecs.push(`${w}px : pas de barre`);
  else {
    if (m.deborde > 1) echecs.push(`${w}px : la barre deborde de ${m.deborde}px`);
    if (m.dehors > 0) echecs.push(`${w}px : ${m.dehors} element(s) hors du cadre de la barre`);
    if (m.petites.length) echecs.push(`${w}px : ${m.petites.length} cible(s) sous 24x24 : ${JSON.stringify(m.petites)}`);
  }
}
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });
console.log(echecs.length ? 'ECHECS:\n  ' + echecs.join('\n  ') : 'aucune largeur ne casse la barre');
process.exit(echecs.length ? 1 : 0);
