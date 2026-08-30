/**
 * The compose panel, on Kick, in the real chat column.
 *
 * compose-live.mjs renders the panel module against a page this repo wrote: a
 * 340px div called #channel-chatroom holding one div called .composer. Every
 * number it reports is taken against that. Two of its inputs are now known to
 * be wrong -- the ground behind the panel is rgb(11,11,12) and not #171a1c,
 * and Kick's composer is 219px wide and not 340 -- and the ones nobody has
 * looked at at all are the ones that broke the language chip: what Kick's own
 * layout does to a floating element, and what covers it.
 *
 * No Kick session is needed and none is used. Measured with a virgin profile
 * as a control (session-check.mjs): Kick renders an editable composer signed
 * out and only asks for an account on send. Typing is all this needs.
 *
 *   node scratchpad/harness/compose-kick-live.mjs
 *
 * The channel is never written down: the first live tile on /browse is taken.
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');

if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error(`compose-kick-live: pas de build dans ${EXT}. Lance npm run build.`);
  process.exit(1);
}

// A throwaway profile, so a run can never depend on state someone typed by
// hand and can never write to it either. Chrome 137+ ignores --load-extension,
// hence Playwright's own Chromium and no channel: 'chrome'.
// --profil-live reuses the hand-signed-in profile, read-only, for anything that
// needs an account. Note what it does NOT explain: the emote button is missing
// from #channel-chatroom signed in and signed out alike (39 buttons, none
// carrying emote/emoji in aria-label, data-testid, title or class), so "Kick
// hides it from anonymous visitors" was a wrong guess and the button is simply
// not where this harness looked.
const utiliseLive = process.argv.includes('--profil-live');
const JETABLE = utiliseLive ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'kt-compose-live-'));
const PROFILE = utiliseLive ? path.join(HERE, 'profile-live') : JETABLE;
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1500, height: 950 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));

await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

const slug = await page.evaluate(() => {
  const skip = new Set(['browse', 'following', 'categories', 'category', 'search', 'login', 'signup', 'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions']);
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
    if (m && !skip.has(m[1].toLowerCase())) return m[1];
  }
  return null;
});
if (!slug) {
  console.error('compose-kick-live: aucune chaine live sur /browse.');
  await ctx.close();
  process.exit(1);
}

await page.goto(`https://kick.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(14000);

// Assert what the run is, rather than trusting the flag. --profil-live is only
// worth anything if the session actually came along: a persistent profile that
// reads as signed in headed read as signed out headless, so "I passed the flag"
// is not evidence. Names only, never a value.
const authCookies = (await ctx.cookies())
  .filter((c) => /kick/i.test(c.domain) && /session|token|auth|remember|xsrf|csrf/i.test(c.name))
  .map((c) => c.name);
console.log('profil            :', utiliseLive ? 'profile-live' : 'jetable', '| cookies auth :', authCookies.length ? authCookies.join(', ') : 'aucun');
if (utiliseLive && authCookies.length === 0) {
  console.error('compose-kick-live: --profil-live demande mais la session n a pas suivi.');
  await ctx.close();
  process.exit(1);
}

// Mount witness. The panel is created hidden as soon as the content script
// finds the composer, so its absence here means the extension never attached
// -- which is the whole failure the language chip taught, and it must not be
// mistaken later for "the panel did not show because the text was skipped".
const monte = await page
  .waitForFunction(() => document.getElementById('kt-compose-bar') !== null, null, { timeout: 30000 })
  .then(() => true)
  .catch(() => false);

const composer = page.locator('[data-testid="chat-input"], .editor-input[role="textbox"]').first();
const composerVu = (await composer.count()) > 0;

// French into a channel whose chat is English, so the pipeline has something to
// do. Typing English at an English target returns "skip-same-lang", the panel
// stays hidden, and a run that asserted only "no error" would call that a pass.
const PHRASE = 'bonjour tout le monde, comment allez vous aujourd hui';

let sortie = { etat: 'non atteint' };
if (monte && composerVu) {
  await composer.click();
  await composer.type(PHRASE, { delay: 28 });
  // Debounce is 320ms, then a network round trip.
  await page
    .waitForFunction(
      () => document.getElementById('kt-compose-bar')?.dataset.state === 'ready',
      null,
      { timeout: 25000 },
    )
    .catch(() => undefined);

  // The panel enters on `transform: translateY(5px) -> 0` over 0.15s. Measuring
  // on the `ready` flag alone reads the box mid-flight and reports a top 5px
  // low: the first run of this harness put the panel 1px above the composer
  // where COMPOSE_PANEL_GAP asks 6, and that gap was the transition, not the
  // geometry. Wait for the transform to settle before reading anything.
  await page
    .waitForFunction(
      () => {
        const t = getComputedStyle(document.getElementById('kt-compose-bar')).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
      },
      null,
      { timeout: 5000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(250);

  // Witness pass: paint a shadow and an all-but-invisible border onto the panel
  // and check the assertions below actually fire. A harness that reports green
  // has to be shown going red on the same run, or green only means it looked.
  if (process.argv.includes('--temoin')) {
    await page.addStyleTag({
      content: '#kt-compose-bar{box-shadow:0 4px 12px rgba(0,0,0,.6)!important;border-color:#131315!important;border-radius:11px!important}',
    });
    await page.waitForTimeout(300);
  }

  sortie = await page.evaluate((tape) => {
    const panel = document.getElementById('kt-compose-bar');
    if (!panel) return { etat: 'panneau absent' };
    const cs = getComputedStyle(panel);
    const r = panel.getBoundingClientRect();
    const input = document.querySelector('[data-testid="chat-input"], .editor-input[role="textbox"]');
    const ir = input.getBoundingClientRect();
    const zone = document.getElementById('channel-chatroom');
    const zr = zone?.getBoundingClientRect();

    const px = (v) => +parseFloat(v).toFixed(2);
    const rgba = (v) => (v.match(/[\d.]+/g) ?? []).map(Number);
    const over = (fg, bg) => {
      const a = fg[3] === undefined ? 1 : fg[3];
      return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
    };
    const lum = ([r0, g0, b0]) => {
      const f = (n) => {
        const s = n / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r0) + 0.7152 * f(g0) + 0.0722 * f(b0);
    };
    const ratio = (x, y) => {
      const [hi, lo] = [lum(x), lum(y)].sort((a, b) => b - a);
      return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
    };

    // What Kick actually paints behind the panel, read through the stack at the
    // panel's own corners with the panel itself skipped. Not a colour this
    // harness chose.
    const fondDerriere = (x, y) => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (el === panel || panel.contains(el)) continue;
        const c = rgba(getComputedStyle(el).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) return c;
      }
      return null;
    };
    const coin = fondDerriere(Math.round(r.left + 3), Math.round(r.top + 3));
    const centre = fondDerriere(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));

    const fill = over(rgba(cs.backgroundColor), coin ?? [0, 0, 0]);
    const edge = over(rgba(cs.borderTopColor), fill);

    const texteEl = panel.querySelector('.kt-compose-text');
    const badgeEl = panel.querySelector('.kt-compose-target');
    const flecheEl = panel.querySelector('.kt-compose-insert');
    const contrasteTexte = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const own = rgba(s.color);
      own[3] = (own[3] === undefined ? 1 : own[3]) * Number(s.opacity || 1);
      let bg = fill;
      for (let n = el; n && n !== panel.parentElement; n = n.parentElement) {
        const c = rgba(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) {
          bg = over(c, bg);
          break;
        }
      }
      return ratio(over(own, bg), bg);
    };

    // Who is painted on top at the panel's centre. If this is not the panel or
    // one of its children, something in Kick's UI covers it and z-index 9999
    // did not win.
    const dessus = document.elementFromPoint(
      Math.round(r.left + r.width / 2),
      Math.round(r.top + r.height / 2),
    );
    const nomme = (el) =>
      el
        ? el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (typeof el.className === 'string' && el.className
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '')
        : 'rien';

    return {
      etat: panel.dataset.state,
      texte: (texteEl?.textContent ?? '').slice(0, 90),
      texteTraduit: (texteEl?.textContent ?? '').trim().toLowerCase() !== tape.trim().toLowerCase(),
      texteVide: (texteEl?.textContent ?? '').trim().length === 0,
      panneau: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      composer: { x: Math.round(ir.left), y: Math.round(ir.top), w: Math.round(ir.width), h: Math.round(ir.height) },
      colonne: zr ? { x: Math.round(zr.left), w: Math.round(zr.width) } : null,
      largeurSuitComposer: Math.abs(Math.round(r.width) - Math.round(ir.width)) <= 1,
      debordeFenetre: r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight,
      debordeColonne: zr ? r.left < zr.left - 1 || r.right > zr.right + 1 : null,
      chevaucheComposer: r.bottom > ir.top + 1,
      fondCoin: coin ? `rgb(${coin.slice(0, 3).map(Math.round).join(', ')})` : null,
      fondCentre: centre ? `rgb(${centre.slice(0, 3).map(Math.round).join(', ')})` : null,
      contrasteBordure: coin ? ratio(edge, coin) : null,
      contrasteTexteV: contrasteTexte(texteEl),
      contrasteBadge: contrasteTexte(badgeEl),
      contrasteFleche: contrasteTexte(flecheEl),
      dessus: nomme(dessus),
      couvert: !(dessus === panel || panel.contains(dessus)),
      ombre: cs.boxShadow === 'none' ? 'aucune' : cs.boxShadow,
      rayon: cs.borderRadius,
      duree: cs.transitionDuration,
      zIndex: cs.zIndex,
      taillePanneau: px(cs.fontSize),
      tailleTexte: texteEl ? px(getComputedStyle(texteEl).fontSize) : null,
      tailleBadge: badgeEl ? px(getComputedStyle(badgeEl).fontSize) : null,
      rayonBadge: badgeEl ? getComputedStyle(badgeEl).borderRadius : null,
    };
  }, PHRASE);

  await page.screenshot({ path: path.join(HERE, 'compose-kick-live.png') });

  // The dodge. findOverlayTopAbove picks overlays out of Kick's DOM with
  // guessed selectors ([data-testid*="emote"], [role="dialog"], ...) and nobody
  // has ever opened Kick's real picker in front of it. If the picker opens over
  // the composer and the panel does not climb above it, the panel is buried
  // under the picker every time someone reaches for an emote.
  // Kick's emote button carries no aria-label, no data-testid, no title and no
  // class that says what it is: enumerated live, the only thing identifying it
  // is the icon it draws, <svg data-ds-icon="Smile">. Searching for the word
  // "emote" finds nothing and that silence was nearly read as "Kick hides the
  // button when signed out", which is false -- it is missing from the labelled
  // search signed in too.
  const bouton = await page.evaluateHandle(() => {
    // Scoped to the chat's own action bar. Taking the first Smile in the whole
    // document picked one somewhere else on the page, and clicking it opened
    // Kick's sign-in modal -- which the panel dodged correctly, so the run went
    // green having never opened the emote picker once. The one that matters is
    // the icon nearest the composer, on its row.
    const input = document.querySelector('[data-testid="chat-input"], .editor-input[role="textbox"]');
    if (!input) return null;
    const ir = input.getBoundingClientRect();
    let meilleur = null;
    for (const icone of document.querySelectorAll('svg[data-ds-icon="Smile" i]')) {
      const b = icone.closest('button,[role="button"]');
      if (!b) continue;
      const r = b.getBoundingClientRect();
      if (r.top < ir.top - 40 || r.top > ir.bottom + 60) continue;
      const d = Math.abs(r.left - ir.right);
      if (!meilleur || d < meilleur.d) meilleur = { b, d };
    }
    return meilleur?.b ?? null;
  });

  const el = bouton.asElement();
  if (el) {
    // Mark what is on screen now, so the picker can be found by "this is new
    // and big", not by the selector list the product itself uses. Detecting it
    // with the product's own selectors would make a product miss look like a
    // harness miss, and the two have to stay separable.
    await page.evaluate(() => {
      for (const e of document.querySelectorAll('div,section,aside,ul')) e.setAttribute('data-kt-avant', '1');
    });
    await el.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(2000);

    sortie.esquive = await page.evaluate(() => {
      const panel = document.getElementById('kt-compose-bar');
      const input = document.querySelector('[data-testid="chat-input"], .editor-input[role="textbox"]');
      const ir = input.getBoundingClientRect();

      // 1. The picker, by geometry alone: new since the click, big, above the
      //    composer.
      let picker = null;
      for (const e of document.querySelectorAll('div,section,aside,ul')) {
        if (e.hasAttribute('data-kt-avant')) continue;
        if (e === panel || panel?.contains(e)) continue;
        const b = e.getBoundingClientRect();
        if (b.width < 120 || b.height < 120) continue;
        if (b.top >= ir.top) continue;
        // Kick mounts the picker inside a full-viewport portal
        // (div.fixed.inset-0.z-dialog, 1500x950). That box is not the picker:
        // it starts at y=0, so it satisfies "above the composer" trivially and
        // makes any panel position look like an overlap. Take the painted
        // panel, not the portal it hangs in.
        if (b.width > innerWidth * 0.9 || b.height > innerHeight * 0.9) continue;
        if (!picker || b.height > picker.h) {
          picker = {
            top: Math.round(b.top),
            bas: Math.round(b.bottom),
            w: Math.round(b.width),
            h: Math.round(b.height),
            sel:
              e.tagName.toLowerCase() +
              (e.id ? '#' + e.id : '') +
              (e.getAttribute('data-testid') ? '[testid=' + e.getAttribute('data-testid') + ']' : '') +
              (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
            role: e.getAttribute('role'),
          };
          picker.el = e;
        }
      }

      // 2. Would the product have seen it? Same list as composeUi's
      //    OVERLAY_SELECTORS, asked separately.
      const SELS = ['[data-testid*="emote" i]', '[data-testid*="emoji" i]', '[class*="emote-picker" i]', '[class*="emoji-picker" i]', '[role="dialog"]', '[role="listbox"]'];
      let vuParLeProduit = false;
      let selQuiMatch = null;
      if (picker) {
        for (const sel of SELS) {
          for (const e of document.querySelectorAll(sel)) {
            if (e === panel || panel?.contains(e)) continue;
            const b = e.getBoundingClientRect();
            if (b.width < 40 || b.height < 40) continue;
            if (b.top < ir.top && b.bottom <= ir.top + 8) {
              vuParLeProduit = true;
              selQuiMatch = sel;
            }
          }
        }
      }

      const r = panel.getBoundingClientRect();
      const out = {
        pickerOuvert: Boolean(picker),
        picker: picker ? { top: picker.top, bas: picker.bas, w: picker.w, h: picker.h, sel: picker.sel, role: picker.role } : null,
        vuParLeProduit,
        selQuiMatch,
        panneauBas: Math.round(r.bottom),
        panneauHaut: Math.round(r.top),
        recouvreLePicker: picker ? Math.round(r.top) < picker.bas && Math.round(r.bottom) > picker.top : null,
        auDessusDuPicker: picker ? Math.round(r.bottom) <= picker.top + 1 : null,
      };
      for (const e of document.querySelectorAll('[data-kt-avant]')) e.removeAttribute('data-kt-avant');
      return out;
    });
  } else {
    // Say what IS around the composer rather than repeating that a guess
    // missed. Anything within a band above the input is a candidate, named by
    // whatever it actually carries -- including nothing.
    const voisins = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="chat-input"], .editor-input[role="textbox"]');
      const ir = input.getBoundingClientRect();
      const out = [];
      for (const b of document.querySelectorAll('button,[role="button"],[type="button"]')) {
        const r = b.getBoundingClientRect();
        if (r.width < 14 || r.height < 14 || r.width > 120) continue;
        if (r.left < ir.left - 80 || r.right > ir.right + 220) continue;
        if (r.bottom < ir.top - 70 || r.top > ir.bottom + 70) continue;
        out.push({
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.left),
          y: Math.round(r.top),
          aria: b.getAttribute('aria-label'),
          testid: b.getAttribute('data-testid'),
          cls: typeof b.className === 'string' ? b.className.trim().split(/\s+/).slice(0, 3).join('.') : null,
          html: b.innerHTML.replace(/\s+/g, ' ').slice(0, 110),
        });
      }
      return out;
    });
    sortie.esquive = {
      pickerOuvert: false,
      picker: null,
      note: `bouton emote introuvable par aria/testid/title/classe ; ${voisins.length} controles autour du composer`,
      voisins,
    };
  }
}

fs.writeFileSync(
  path.join(HERE, 'compose-kick-live.json'),
  JSON.stringify({ chaine: slug, monte, composerVu, erreurs, ...sortie }, null, 2),
  'utf8',
);
await ctx.close();
// Only ever delete the throwaway. The hand-signed-in profile is never written
// to by this harness and never removed by it.
if (JETABLE) fs.rmSync(JETABLE, { recursive: true, force: true });

console.log('chaine            :', slug);
console.log('panneau monte     :', monte, '| composer trouve :', composerVu);
if (erreurs.length) console.log('erreurs de page   :', erreurs.length, erreurs[0]);
for (const [k, v] of Object.entries(sortie)) console.log(k.padEnd(18), ':', JSON.stringify(v));

// Nothing here may pass by having measured nothing.
const ech = [];
if (!monte) ech.push('le content script n a jamais cree #kt-compose-bar sur la vraie page');
if (!composerVu) ech.push('composer de Kick introuvable : selecteur perime');
if (sortie.etat !== 'ready') ech.push(`panneau a l etat "${sortie.etat}", jamais ready : rien de mesure`);
if (sortie.texteVide) ech.push('panneau ready mais texte vide : la traduction n a pas abouti');
if (sortie.texteTraduit === false) ech.push('le panneau rend le texte tape tel quel : aucune traduction');
if (sortie.etat === 'ready') {
  if (sortie.couvert) ech.push(`panneau couvert par ${sortie.dessus} malgre z-index ${sortie.zIndex}`);
  if (sortie.debordeFenetre) ech.push('panneau hors fenetre');
  if (sortie.debordeColonne) ech.push('panneau deborde la colonne de chat');
  if (sortie.chevaucheComposer) ech.push('panneau recouvre le composer');
  if (!sortie.largeurSuitComposer)
    ech.push(`largeur ${sortie.panneau.w} pour un composer de ${sortie.composer.w}`);
  if (sortie.ombre !== 'aucune') ech.push(`ombre portee -> ${sortie.ombre}`);
  if (sortie.contrasteBordure !== null && sortie.contrasteBordure < 3)
    ech.push(`bordure a ${sortie.contrasteBordure}:1 sur le vrai fond ${sortie.fondCoin}, WCAG 1.4.11 en veut 3`);
  for (const [q, v] of [
    ['texte', sortie.contrasteTexteV],
    ['badge', sortie.contrasteBadge],
    ['fleche', sortie.contrasteFleche],
  ]) {
    if (v !== null && v !== undefined && v < 4.5) ech.push(`${q} a ${v}:1 sur le vrai fond, WCAG 1.4.3 en veut 4.5`);
  }
  for (const [q, v] of [['panneau', sortie.rayon], ['badge', sortie.rayonBadge]]) {
    for (const t of String(v).split(' ')) if (!['0px', '4px', '8px'].includes(t)) ech.push(`rayon ${q} ${t}`);
  }
  for (const t of String(sortie.duree).split(', ')) if (t !== '0.15s') ech.push(`duree ${t}`);

  // "The picker never opened" is not the dodge working, it is the dodge not
  // having been tested. It fails here rather than passing quietly.
  if (!sortie.esquive?.pickerOuvert) {
    ech.push(
      `esquive du selecteur d emotes NON TESTEE : ${sortie.esquive?.note ?? 'aucun overlay au-dessus du composer apres le clic'}`,
    );
  } else if (/auth-modal/i.test(sortie.esquive.picker?.sel ?? '')) {
    // Clicking the emote button opened Kick's sign-in modal, so this run is not
    // authenticated for chat actions whatever the cookie jar says. The panel
    // did dodge that dialog correctly, and the assertions below would have
    // passed on it -- which is the whole danger: a green here would mean the
    // emote picker was never once opened.
    ech.push(
      `l esquive a ete mesuree contre auth-modal, pas contre le selecteur d emotes : kick_session present mais Kick redemande une connexion. Dodge TOUJOURS non teste.`,
    );
  } else {
    const e = sortie.esquive;
    if (!e.vuParLeProduit) {
      ech.push(
        `picker ouvert (${e.picker.sel} ${e.picker.w}x${e.picker.h}) mais AUCUN selecteur de findOverlayTopAbove ne le matche : l esquive ne peut pas se declencher`,
      );
    }
    if (e.recouvreLePicker) {
      ech.push(`panneau (${e.panneauHaut}-${e.panneauBas}) chevauche le picker (${e.picker.top}-${e.picker.bas})`);
    }
  }
}

if (ech.length) {
  console.error();
  console.error('compose-kick-live: ' + ech.length + ' echec(s)');
  for (const e of [...new Set(ech)]) console.error('  x ' + e);
  process.exit(1);
}
console.log();
console.log('compose-kick-live: OK sur la vraie page.');
