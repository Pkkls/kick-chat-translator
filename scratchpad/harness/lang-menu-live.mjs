/**
 * The language menu you actually open from the chat, measured on Kick.
 *
 * There are three lists of languages in this extension and they did not get the
 * same treatment. `flags.ts` and `langMenu.ts` were written and wired into the
 * floating bar (injector.ts:405, 578). `langChip.ts` -- the chip in Kick's
 * action bar, the one a user reaches for -- still builds its rows at line
 * 240-242 as `code.toUpperCase()` in a `.kt-chip-iso` span and never imports
 * flagClass. So the panel on screen shows two-letter codes while the table that
 * would replace them is complete: 42 languages, 42 entries, 0 without a CSS
 * rule (audited statically).
 *
 * This reads what is actually painted: row anatomy, sizes, contrast, and
 * whether the menu is clipped or running off screen -- "illisible" as numbers.
 *
 *   node scratchpad/harness/lang-menu-live.mjs
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const JETABLE = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-langmenu-'));

// The first pass ran at 1500x950 and reported nothing. The menu is a popup
// whose placement is computed against the window, so the window is an input:
// pass --vp 1280x720 to ask a different one.
const vpArg = process.argv.find((a) => /^\d+x\d+$/.test(a)) ?? '1500x950';
const [VPW, VPH] = vpArg.split('x').map(Number);

const ctx = await chromium.launchPersistentContext(JETABLE, {
  headless: false,
  viewport: { width: VPW, height: VPH },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-first-run', '--no-default-browser-check'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

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
// Seed a favourite before the page loads the chip. Without one the chip is in
// the state where even the old build opened the list on any click, which is the
// state every earlier pass measured and the reason none of them saw the defect.
{
  const sw2 = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }).catch(() => null));
  const id2 = sw2 ? sw2.url().split('/')[2] : null;
  if (id2) {
    const cfg = await ctx.newPage();
    await cfg.goto(`chrome-extension://${id2}/src/options/index.html`);
    await cfg.waitForTimeout(2000);
    await cfg.evaluate(async () => {
      const KEY = 'kt.settings.v2';
      const cur = (await chrome.storage.sync.get(KEY))[KEY] ?? {};
      await chrome.storage.sync.set({ [KEY]: { ...cur, favoriteLangs: ['fr'] } });
    });
    await cfg.close();
  }
}

await page.goto(`https://kick.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(14000);

// Scroll the channel page down so its own panels (the about box, the donate
// banner, the socials) are on screen. They were never in frame in the earlier
// passes, which is why those passes found nothing: the menu is a popup and what
// it has to survive is whatever Kick paints under and over it.
if (!process.argv.includes('--sans-defilement')) {
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(1500);
}

// The chip is clicked on its CODE half, and with a favourite already stored.
// Both matter. With no favourite the old build opened the list on any click, so
// every pass in a throwaway profile saw the easy path; with one, a click on the
// code toggled the language and only a caret about 12px wide opened the list.
// Clicking the chip's centre would have hidden that too.
const chipTag = page.locator('.kt-chip .kt-chip-tag').first();
const chip = page.locator('.kt-chip').first();
const chipVu = (await chip.count()) > 0;
const boites = chipVu
  ? await page.evaluate(() => {
      const c = document.querySelector('.kt-chip');
      const t = c?.querySelector('.kt-chip-tag');
      const k = c?.querySelector('.kt-chip-caret');
      const b = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      };
      return { puce: b(c), code: b(t), fleche: b(k) };
    })
  : null;
if (chipVu) {
  await chipTag.click({ force: true }).catch(() => undefined);
  await page.waitForTimeout(1200);
  // Park the pointer off the list. Left where it clicked, it sits on a tile and
  // :hover lightens that one row's ground: the first run read one sampled tile
  // at 3.81:1 and its neighbours at 7.1 for the same colour on the same menu.
  await page.mouse.move(20, 20);
  await page.waitForTimeout(300);
}

const vu = await page.evaluate(() => {
  const rgba = (v) => (v.match(/[\d.]+/g) ?? []).map(Number);
  const over = (fg, bg) => {
    const a = fg[3] === undefined ? 1 : fg[3];
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const lum = ([r, g, b]) => {
    const f = (n) => {
      const s = n / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => {
    const [hi, lo] = [lum(x), lum(y)].sort((a, b) => b - a);
    return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
  };
  const fondDe = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) return c.slice(0, 3);
    }
    return [11, 11, 12];
  };

  const menu = document.querySelector('.kt-chip-menu');
  if (!menu || menu.hidden) return { menuOuvert: false };
  const mr = menu.getBoundingClientRect();
  const rows = [...menu.querySelectorAll('.kt-chip-row')];
  const visibles = rows.filter((r) => !r.hidden);

  const echantillon = visibles.slice(0, 3).map((r) => {
    const iso = r.querySelector('.kt-chip-iso');
    const nom = r.querySelector('.kt-chip-name');
    const rr = r.getBoundingClientRect();
    const ir = iso?.getBoundingClientRect();
    const si = iso ? getComputedStyle(iso) : null;
    const fond = fondDe(r);
    const couleurAvecOpacite = (el) => {
      const s = getComputedStyle(el);
      const c = rgba(s.color);
      c[3] = (c[3] === undefined ? 1 : c[3]) * Number(s.opacity || 1);
      return c;
    };
    return {
      code: r.dataset.code,
      hauteurRangee: Math.round(rr.height),
      isoTexte: iso?.textContent ?? null,
      isoClasses: iso?.className ?? null,
      isoBoite: ir ? `${Math.round(ir.width)}x${Math.round(ir.height)}` : null,
      isoTaille: si ? +parseFloat(si.fontSize).toFixed(1) : null,
      isoOpacite: si ? si.opacity : null,
      isoImage: si ? (si.backgroundImage === 'none' ? 'aucune' : 'dessinee') : null,
      // The flag is a CHILD of the slot, so reading the slot's own background
      // says nothing about it. Checking only that the code text is gone would
      // pass an empty row just as happily as a flag.
      drapeau: (() => {
        const f = iso?.querySelector('span');
        if (!f) return null;
        const fs2 = getComputedStyle(f);
        const fr = f.getBoundingClientRect();
        return {
          classes: f.className,
          boite: `${Math.round(fr.width)}x${Math.round(fr.height)}`,
          dessine: fs2.backgroundImage !== 'none' || /gradient/.test(fs2.backgroundImage),
          opacite: +Number(fs2.opacity).toFixed(2),
          padding: fs2.padding,
        };
      })(),
      contrasteIso: iso ? ratio(over(couleurAvecOpacite(iso), fond), fond) : null,
      contrasteNom: nom ? ratio(over(couleurAvecOpacite(nom), fond), fond) : null,
    };
  });

  // The chat line's own badge. injector.ts:273 gives it a bare `kt-flag`, with
  // TEXT inside; inject.css declares .kt-flag twice, once at the top as a text
  // badge and again lower down as a drawn 16x12 flag. The second wins on the
  // properties it sets, so this span is now sized like a flag while carrying
  // letters.
  const badge = document.querySelector('.kt-flag');
  let badgeInfo = null;
  if (badge) {
    const b = badge.getBoundingClientRect();
    const s = getComputedStyle(badge);
    badgeInfo = {
      texte: (badge.textContent ?? '').slice(0, 8),
      aDuTexte: (badge.textContent ?? '').trim().length > 0,
      boite: `${Math.round(b.width)}x${Math.round(b.height)}`,
      taillePolice: +parseFloat(s.fontSize).toFixed(1),
      debordeSaBoite: badge.scrollWidth > Math.ceil(b.width) + 1 || badge.scrollHeight > Math.ceil(b.height) + 1,
      scroll: `${badge.scrollWidth}x${badge.scrollHeight}`,
      image: s.backgroundImage === 'none' ? 'aucune' : 'dessinee',
      ombreInset: s.boxShadow,
    };
  }

  // Uniform row height, on every visible tile. This is what the unit test used
  // to reach for through a CSS width: pt-br and zh-tw once wrapped and came out
  // half again as tall as their neighbours. A rendered menu can be asked
  // directly, and a grid makes the question sharper, since one tall tile now
  // stretches its whole grid row.
  const hauteurs = {};
  for (const r of visibles) {
    const h = Math.round(r.getBoundingClientRect().height);
    hauteurs[h] = (hauteurs[h] ?? 0) + 1;
  }

  // Does the menu's own painted box actually cover its rows? A tile sitting
  // outside it has Kick's page behind it rather than the menu's aplat, which is
  // what "it overlaps" looks like on screen. The menu paints background +
  // outline on .kt-chip-menu only, so anything past that edge is see-through.
  const dehors = visibles
    .map((r) => {
      const b = r.getBoundingClientRect();
      const marge = 1;
      const sorties = [];
      if (b.left < mr.left - marge) sorties.push('gauche');
      if (b.right > mr.right + marge) sorties.push('droite');
      if (b.top < mr.top - marge) sorties.push('haut');
      if (b.bottom > mr.bottom + marge) sorties.push('bas');
      return sorties.length ? { code: r.dataset.code, sorties, boite: `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}` } : null;
    })
    .filter(Boolean);

  // What the menu is painted over, and whether it is opaque there.
  const sm = getComputedStyle(menu);

  return {
    menuOuvert: true,
    hauteursRangees: hauteurs,
    fondMenu: sm.backgroundColor,
    menuOpaque: (() => {
      const c = rgba(sm.backgroundColor);
      return c.length >= 3 && (c[3] === undefined || c[3] >= 0.99);
    })(),
    // Who is painted on top. z-index: 2147483000 only ranks the menu inside its
    // own stacking context: if Kick gives the action bar a context of its own,
    // no number the menu picks can lift it above a sibling elsewhere on the
    // page. Asked at nine points, because a partial cover is the failure -- a
    // panel over one corner leaves the rest looking perfect.
    couverture: (() => {
      const pts = [];
      for (const fx of [0.04, 0.5, 0.96]) {
        for (const fy of [0.03, 0.5, 0.97]) {
          const x = Math.round(mr.left + mr.width * fx);
          const y = Math.round(mr.top + mr.height * fy);
          const el = document.elementFromPoint(x, y);
          const aNous = el === menu || menu.contains(el);
          if (!aNous) {
            pts.push({
              point: `${Math.round(fx * 100)}%,${Math.round(fy * 100)}%`,
              parQui: el
                ? el.tagName.toLowerCase() +
                  (el.id ? '#' + el.id : '') +
                  (el.getAttribute('data-testid') ? '[testid=' + el.getAttribute('data-testid') + ']' : '') +
                  (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '')
                : 'rien',
              zIndex: el ? getComputedStyle(el).zIndex : null,
            });
          }
        }
      }
      return pts;
    })(),
    listeBoite: (() => {
      const l = menu.querySelector('.kt-chip-list');
      if (!l) return null;
      const b = l.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    })(),
    rangeesDehors: dehors,
    menuBoite: { x: Math.round(mr.x), y: Math.round(mr.y), w: Math.round(mr.width), h: Math.round(mr.height) },
    sortEnHaut: Math.round(mr.top),
    sortEnBas: Math.round(mr.bottom - innerHeight),
    debordeEcran: mr.top < 0 || mr.bottom > innerHeight || mr.left < 0 || mr.right > innerWidth,
    rangees: rows.length,
    rangeesVisibles: visibles.length,
    echantillon,
    badge: badgeInfo,
  };
});

if (vu.menuOuvert) {
  const b = vu.menuBoite;
  await page.screenshot({
    path: path.join(HERE, 'lang-menu-live.png'),
    clip: { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: b.w + 12, height: b.h + 12 },
  });
}
fs.writeFileSync(path.join(HERE, 'lang-menu-live.json'), JSON.stringify({ slug, chipVu, ...vu }, null, 2), 'utf8');
await ctx.close();
fs.rmSync(JETABLE, { recursive: true, force: true });

console.log('chaine        :', slug, '| puce trouvee :', chipVu);
console.log('boites        :', JSON.stringify(boites));
console.log('clic sur      : .kt-chip-tag (moitie code), avec un favori en stock');
for (const [k, v] of Object.entries(vu)) {
  if (k === 'echantillon') {
    console.log('echantillon   :');
    for (const e of v) console.log('   ', JSON.stringify(e));
  } else console.log(k.padEnd(14), ':', JSON.stringify(v));
}

const ech = [];
if (!chipVu) ech.push('puce .kt-chip absente : rien a ouvrir, rien de mesure');
if (!vu.menuOuvert) ech.push('le menu ne s est pas ouvert : rien de mesure');
if (vu.menuOuvert) {
  if (vu.rangeesVisibles === 0) ech.push('menu ouvert mais 0 rangee visible');
  // The auto row spans the grid and may legitimately differ; more than two
  // distinct heights means a tile wrapped.
  const distinctes = Object.keys(vu.hauteursRangees ?? {});
  if (distinctes.length > 2) {
    ech.push(`rangees de hauteurs melangees : ${JSON.stringify(vu.hauteursRangees)}`);
  }
  if (vu.debordeEcran) ech.push(`menu hors ecran : haut ${vu.sortEnHaut}, depassement bas ${vu.sortEnBas}`);
  if (!vu.menuOpaque) ech.push(`fond du menu non opaque (${vu.fondMenu}) : la page transparait`);
  if (vu.couverture?.length) {
    ech.push(
      `menu recouvert sur ${vu.couverture.length}/9 points : ` +
        vu.couverture.map((p) => `${p.point} par ${p.parQui} (z=${p.zIndex})`).join(' | '),
    );
  }
  if (vu.rangeesDehors?.length) {
    ech.push(
      `${vu.rangeesDehors.length} rangee(s) hors de la boite peinte du menu, ex. ${vu.rangeesDehors[0].code} vers ${vu.rangeesDehors[0].sorties.join('+')} (${vu.rangeesDehors[0].boite}) alors que le menu est ${JSON.stringify(vu.menuBoite)}`,
    );
  }
  for (const e of vu.echantillon) {
    // A row must show SOMETHING: a drawn flag, or the ISO code as the declared
    // fallback. Neither is the failure this pass exists to catch.
    if (e.code === 'auto') {
      // Empty on purpose, and it was empty before the flags landed too.
      // flags.ts: 'auto' has no country, and undefined there is "a real answer,
      // not a failure". Asserting a flag on this row would be asserting against
      // the module's own stated contract.
      continue;
    }
    if (!e.drapeau && !e.isoTexte) {
      ech.push(`rangee ${e.code} : ni drapeau ni code, la case est vide`);
    } else if (!e.drapeau) {
      ech.push(`rangee ${e.code} : code "${e.isoTexte}" en texte, aucun drapeau dessine`);
    } else {
      if (!e.drapeau.dessine) ech.push(`rangee ${e.code} : span de drapeau sans fond dessine (${e.drapeau.classes})`);
      if (e.drapeau.boite !== '16x12') ech.push(`rangee ${e.code} : drapeau ${e.drapeau.boite}, attendu 16x12`);
      if (e.drapeau.opacite < 1) ech.push(`rangee ${e.code} : drapeau a ${e.drapeau.opacite} d opacite`);
      if (e.drapeau.padding !== '0px') ech.push(`rangee ${e.code} : drapeau avec padding ${e.drapeau.padding}`);
    }
    if (e.contrasteIso !== null && e.contrasteIso < 4.5) ech.push(`code de ${e.code} a ${e.contrasteIso}:1`);
    if (e.contrasteNom !== null && e.contrasteNom < 4.5) ech.push(`nom de ${e.code} a ${e.contrasteNom}:1`);
  }
  if (vu.badge?.aDuTexte && vu.badge.image === 'aucune' && vu.badge.debordeSaBoite) {
    ech.push(`badge .kt-flag : "${vu.badge.texte}" deborde sa boite ${vu.badge.boite} (contenu ${vu.badge.scroll})`);
  }
}
if (ech.length) {
  console.error();
  console.error('lang-menu-live: ' + ech.length + ' constat(s)');
  for (const e of [...new Set(ech)]) console.error('  x ' + e);
  process.exit(1);
}
console.log('\nlang-menu-live: rien a signaler.');
