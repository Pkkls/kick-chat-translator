/**
 * The float bar's language panel, measured on Kick.
 *
 * Opened by the AUTO button on the bar above the chat. Not the chip's menu:
 * that one lives in the chat action bar and was already reworked. This is the
 * other list, built by langMenu.ts and styled as .kt-lang-panel.
 *
 *   node scratchpad/harness/bar-panel-mesure.mjs [1500x950]
 *
 * Reports the anatomy of a row and of a favourite tile, the panel's box, what
 * is painted over it, and the contrast of every text it draws. Asserts on the
 * things that would make the measurement meaningless.
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '../../dist');
const vpArg = process.argv.find((a) => /^\d+x\d+$/.test(a)) ?? '1500x950';
const [VPW, VPH] = vpArg.split('x').map(Number);

const JETABLE = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-barpanel-'));
const ctx = await chromium.launchPersistentContext(JETABLE, {
  headless: false,
  viewport: { width: VPW, height: VPH },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-first-run', '--no-default-browser-check'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

await page.goto('https://kick.com/browse', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

// Three favourites in store, so the pinned strip is populated: an empty strip
// is a different component and would hide whatever is wrong with the full one.
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 20000 }).catch(() => null));
const extId = sw ? sw.url().split('/')[2] : null;
if (extId) {
  const cfg = await ctx.newPage();
  await cfg.goto(`chrome-extension://${extId}/src/options/index.html`);
  await cfg.waitForTimeout(2000);
  await cfg.evaluate(async () => {
    const KEY = 'kt.settings.v2';
    const cur = (await chrome.storage.sync.get(KEY))[KEY] ?? {};
    await chrome.storage.sync.set({ [KEY]: { ...cur, favoriteLangs: ['fi', 'zh-tw', 'ru'] } });
  });
  await cfg.close();
}

const slug = await page.evaluate(() => {
  const skip = new Set(['browse', 'following', 'categories', 'category', 'search', 'login', 'signup', 'about', 'help', 'privacy', 'terms', 'dashboard', 'clips', 'subscriptions']);
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.getAttribute('href')?.match(/^\/([A-Za-z0-9_-]{3,25})$/);
    if (m && !skip.has(m[1].toLowerCase())) return m[1];
  }
  return null;
});
await page.goto(`https://kick.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(16000);

const bouton = page.locator('.kt-float-lang').first();
const boutonVu = (await bouton.count()) > 0;
if (boutonVu) {
  await bouton.click({ force: true }).catch(() => undefined);
  await page.waitForTimeout(1200);
  await page.mouse.move(10, 10);
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
  const contraste = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const c = rgba(s.color);
    c[3] = (c[3] === undefined ? 1 : c[3]) * Number(s.opacity || 1);
    const bg = fondDe(el.parentElement ?? el);
    return ratio(over(c, bg), bg);
  };
  const boite = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };

  // Combien y en a-t-il. Le panneau pend du body depuis qu'un backdrop-filter
  // sur la barre lui volait son bloc conteneur ; un remontage par la SPA de
  // Kick peut donc en laisser plusieurs, et querySelector rendrait le premier,
  // cache, en faisant croire que rien ne s'ouvre.
  const tous = [...document.querySelectorAll('.kt-lang-panel')];
  const panel = tous.find((p) => !p.hidden) ?? tous[0];
  if (!panel || panel.hidden) {
    return { ouvert: false, panneauxDansLeDom: tous.length, tousCaches: tous.every((p) => p.hidden) };
  }
  const pr = panel.getBoundingClientRect();
  const rows = [...panel.querySelectorAll('.kt-lang-row')];
  const favs = [...panel.querySelectorAll('.kt-lang-fav')];
  const liste = panel.querySelector('.kt-lang-list') ?? panel;

  const echRow = rows.slice(0, 3).map((r) => ({
    code: r.dataset.code ?? null,
    rangee: boite(r),
    drapeau: boite(r.querySelector('.kt-lang-flag')),
    iso: r.querySelector('.kt-lang-iso')?.textContent ?? null,
    boiteIso: boite(r.querySelector('.kt-lang-iso')),
    tailleIso: r.querySelector('.kt-lang-iso') ? +parseFloat(getComputedStyle(r.querySelector('.kt-lang-iso')).fontSize).toFixed(1) : null,
    nom: r.querySelector('.kt-lang-name')?.textContent?.slice(0, 22) ?? null,
    tailleNom: r.querySelector('.kt-lang-name') ? +parseFloat(getComputedStyle(r.querySelector('.kt-lang-name')).fontSize).toFixed(1) : null,
    contrasteIso: contraste(r.querySelector('.kt-lang-iso')),
    contrasteNom: contraste(r.querySelector('.kt-lang-name')),
    nomTronque: (() => {
      const n = r.querySelector('.kt-lang-name');
      return n ? n.scrollWidth > Math.ceil(n.getBoundingClientRect().width) + 1 : null;
    })(),
  }));

  const echFav = favs.map((f) => ({
    tuile: boite(f),
    drapeau: boite(f.querySelector('.kt-flag')),
    tag: f.querySelector('.kt-lang-tag')?.textContent ?? null,
    tailleTag: f.querySelector('.kt-lang-tag') ? +parseFloat(getComputedStyle(f.querySelector('.kt-lang-tag')).fontSize).toFixed(1) : null,
    tagTronque: (() => {
      const t = f.querySelector('.kt-lang-tag');
      return t ? t.scrollWidth > Math.ceil(t.getBoundingClientRect().width) + 1 : null;
    })(),
    contrasteTag: contraste(f.querySelector('.kt-lang-tag')),
  }));

  // Ce qui est peint par-dessus, aux neuf points du panneau.
  const couverture = [];
  for (const fx of [0.04, 0.5, 0.96]) {
    for (const fy of [0.03, 0.5, 0.97]) {
      const x = Math.round(pr.left + pr.width * fx);
      const y = Math.round(pr.top + pr.height * fy);
      const el = document.elementFromPoint(x, y);
      if (!(el === panel || panel.contains(el))) {
        couverture.push({
          point: `${Math.round(fx * 100)}%,${Math.round(fy * 100)}%`,
          parQui: el ? el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') : 'rien',
        });
      }
    }
  }

  const cs = getComputedStyle(panel);
  const lr = liste.getBoundingClientRect();
  // Ce que placeLangMenu a decide, et avec quoi il l'a decide. Un panneau qui
  // sort de la fenetre ne dit pas si le clamp n'a pas tourne ou s'il a mal
  // calcule ; ces champs le disent.
  const ancre = document.querySelector('.kt-float-lang');
  const ar = ancre?.getBoundingClientRect();
  const placement = {
    classes: panel.className,
    styleEnLigne: panel.getAttribute('style') || '(aucun)',
    position: cs.position,
    ancre: ar ? { haut: Math.round(ar.top), bas: Math.round(ar.bottom) } : null,
    placeAuDessus: ar ? Math.round(ar.top - pr.bottom) : null,
    scrollHeight: panel.scrollHeight,
    placeAvantMesure: Math.round(pr.top),
    // Qui vole le bloc conteneur d'un position:fixed. transform, filter,
    // perspective, backdrop-filter, contain et will-change le font tous, et
    // alors `top` cesse d'etre relatif a la fenetre.
    volDeBlocConteneur: (() => {
      const coupables = [];
      for (let n = panel.parentElement; n; n = n.parentElement) {
        const s2 = getComputedStyle(n);
        const causes = [];
        if (s2.transform !== 'none') causes.push('transform:' + s2.transform.slice(0, 30));
        if (s2.filter !== 'none') causes.push('filter:' + s2.filter.slice(0, 20));
        if (s2.perspective !== 'none') causes.push('perspective');
        if (s2.backdropFilter && s2.backdropFilter !== 'none') causes.push('backdrop-filter');
        if (/paint|layout|strict|content/.test(s2.contain)) causes.push('contain:' + s2.contain);
        if (/transform|filter|perspective/.test(s2.willChange)) causes.push('will-change:' + s2.willChange);
        if (causes.length) {
          const b = n.getBoundingClientRect();
          coupables.push({
            el: n.tagName.toLowerCase() + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
            haut: Math.round(b.top),
            gauche: Math.round(b.left),
            causes,
          });
        }
      }
      return coupables;
    })(),
  };
  return {
    ouvert: true,
    panneauxDansLeDom: tous.length,
    panneau: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
    // Une tolerance d'un pixel : le panneau est aligne sur la colonne de chat,
    // qui finit elle-meme au bord de la fenetre, et le rect rend 0.2px de trop
    // par arrondi sous-pixel. Sans tolerance, la sonde signalait un defaut
    // qui n'existe pas a l'ecran.
    debordeEcran: pr.top < -1 || pr.bottom > innerHeight + 1 || pr.left < -1 || pr.right > innerWidth + 1,
    // Les bords exacts, parce que "deborde" ne dit pas de combien ni ou.
    bords: {
      gauche: Math.round(pr.left),
      droite: +(innerWidth - pr.right).toFixed(1),
      haut: Math.round(pr.top),
      bas: +(innerHeight - pr.bottom).toFixed(1),
      fenetre: `${innerWidth}x${innerHeight}`,
    },
    // La troncature sur TOUTES les rangees, pas sur l'echantillon : les noms
    // longs sont justement ceux qui ne sont pas en tete de liste.
    nomsTronques: rows
      .map((r) => {
        const n = r.querySelector('.kt-lang-name');
        if (!n) return null;
        return n.scrollWidth > Math.ceil(n.getBoundingClientRect().width) + 1
          ? `${r.dataset.code}:${(n.textContent ?? '').slice(0, 24)}`
          : null;
      })
      .filter(Boolean),
    rayon: cs.borderRadius,
    ombre: cs.boxShadow === 'none' ? 'aucune' : cs.boxShadow,
    duree: cs.transitionDuration,
    rangeesTotal: rows.length,
    rangeesVisiblesSansDefiler: rows.filter((r) => {
      const b = r.getBoundingClientRect();
      return b.top >= lr.top - 1 && b.bottom <= lr.bottom + 1;
    }).length,
    listeDefile: liste.scrollHeight > liste.clientHeight + 1,
    hauteurTotaleListe: liste.scrollHeight,
    echRow,
    favs: echFav,
    couverture,
    placement,
  };
});

// Le clavier, observe et pas suppose.
//
// Premiere version de cette sonde : elle exigeait que Bas depuis le champ
// atterrisse sur une .kt-lang-row, n'y arrivait jamais, et rapportait un
// clavier casse. Le focus partait en fait sur une .kt-lang-fav : la bande des
// favoris est au-dessus de la liste et Bas y entre d'abord, ce qui est le bon
// comportement. L'assertion etait fausse, pas le produit.
//
// Ce qui se mesure ici est le pas dans la GRILLE, donc le depart est une
// rangee de la liste, pas le champ.
let clavier = null;
if (vu.ouvert) {
  const etat = () =>
    page.evaluate(() => {
      const a = document.activeElement;
      const vis = [...document.querySelectorAll('.kt-lang-panel')].find((x) => !x.hidden);
      const rows = vis ? [...vis.querySelectorAll('.kt-lang-row')] : [];
      return {
        classe: a?.className ?? null,
        estRangee: Boolean(a?.classList?.contains('kt-lang-row')),
        estFavori: Boolean(a?.classList?.contains('kt-lang-fav')),
        index: a ? rows.indexOf(a) : -1,
        code: a?.dataset?.code ?? null,
      };
    });

  // Depuis le champ, pour verifier que l'entree au clavier existe.
  const entree = await page.evaluate(() => {
    // Le panneau visible, pas le premier venu. Depuis qu'il pend du body, un
    // remontage de la SPA peut en laisser un cache dans le document, et
    // querySelector rendait celui-la : la sonde plantait sur un null au lieu
    // de mesurer, et un plantage de sonde se lit comme une porte rouge.
    const p = [...document.querySelectorAll('.kt-lang-panel')].find((x) => !x.hidden);
    const inp = p?.querySelector('input');
    if (!inp) return { classe: null, entre: false, note: 'aucun panneau visible avec un champ' };
    inp.focus();
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    const a = document.activeElement;
    return { classe: a?.className ?? null, entre: Boolean(a?.classList?.contains('kt-lang-fav') || a?.classList?.contains('kt-lang-row')) };
  });

  // Puis depuis une rangee du milieu de la grille, la ou un pas se mesure.
  await page.evaluate(() => {
    const vis = [...document.querySelectorAll('.kt-lang-panel')].find((x) => !x.hidden);
    (vis ? [...vis.querySelectorAll('.kt-lang-row')] : [])[6]?.focus();
  });
  const a0 = await etat();
  await page.keyboard.press('ArrowDown');
  const a1 = await etat();
  await page.keyboard.press('ArrowRight');
  const a2 = await etat();
  await page.keyboard.press('ArrowUp');
  const a3 = await etat();

  clavier = {
    entreeDepuisLeChamp: entree,
    depart: a0,
    sautBas: a0.index >= 0 && a1.index >= 0 ? a1.index - a0.index : null,
    sautDroite: a1.index >= 0 && a2.index >= 0 ? a2.index - a1.index : null,
    sautHaut: a2.index >= 0 && a3.index >= 0 ? a3.index - a2.index : null,
  };
  console.log('clavier                  :', JSON.stringify(clavier));
}

if (vu.ouvert) {
  const b = vu.panneau;
  await page.screenshot({
    path: path.join(HERE, 'bar-panel-mesure.png'),
    clip: { x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 8), width: Math.min(b.w + 16, VPW - b.x + 8), height: Math.min(b.h + 16, VPH - b.y + 8) },
  });
}
fs.writeFileSync(path.join(HERE, 'bar-panel-mesure.json'), JSON.stringify({ slug, boutonVu, ...vu }, null, 2), 'utf8');
await ctx.close();
fs.rmSync(JETABLE, { recursive: true, force: true });

console.log('chaine :', slug, '| bouton AUTO trouve :', boutonVu);
for (const [k, v] of Object.entries(vu)) {
  if (k === 'echRow' || k === 'favs') {
    console.log(k, ':');
    for (const e of v) console.log('   ', JSON.stringify(e));
  } else console.log(k.padEnd(24), ':', JSON.stringify(v));
}

const ech = [];
if (!boutonVu) ech.push('bouton .kt-float-lang absent : rien a ouvrir');
if (!vu.ouvert) ech.push('le panneau ne s est pas ouvert : rien de mesure');
if (vu.ouvert) {
  if (vu.rangeesTotal === 0) ech.push('panneau ouvert, 0 rangee : rien de mesure');
  if (vu.favs.length === 0) ech.push('aucune tuile de favori alors que trois sont en stock');
  if (vu.couverture.length) ech.push(`panneau recouvert sur ${vu.couverture.length}/9 points`);
  if (vu.debordeEcran) ech.push('panneau hors ecran');
  if (!clavier) ech.push('clavier non teste');
  else {
    if (!clavier.entreeDepuisLeChamp.entre) ech.push('Bas depuis le champ n entre nulle part');
    if (!clavier.depart.estRangee) ech.push('le depart du test clavier n est pas une rangee : rien de mesure');
    // Le saut vertical doit valoir une rangee de grille. Un saut de 1 voudrait
    // dire que la fleche suit l ordre du DOM et pas ce qui est a l ecran.
    if (clavier.sautBas !== 3) ech.push(`Bas saute de ${clavier.sautBas} au lieu de 3 (une rangee de grille)`);
    if (clavier.sautDroite !== 1) ech.push(`Droite saute de ${clavier.sautDroite} au lieu de 1`);
    if (clavier.sautHaut !== -3) ech.push(`Haut saute de ${clavier.sautHaut} au lieu de -3`);
  }
  for (const r of vu.echRow) {
    if (r.contrasteIso !== null && r.contrasteIso < 4.5) ech.push(`code de ${r.code} a ${r.contrasteIso}:1`);
    if (r.contrasteNom !== null && r.contrasteNom < 4.5) ech.push(`nom de ${r.code} a ${r.contrasteNom}:1`);
    if (r.nomTronque) ech.push(`nom de ${r.code} tronque`);
  }
  for (const f of vu.favs) {
    if (f.contrasteTag !== null && f.contrasteTag < 4.5) ech.push(`tag ${f.tag} a ${f.contrasteTag}:1`);
    if (f.tagTronque) ech.push(`tag ${f.tag} tronque dans sa tuile`);
  }
}
if (ech.length) {
  console.error();
  console.error('bar-panel: ' + ech.length + ' constat(s)');
  for (const e of [...new Set(ech)]) console.error('  x ' + e);
  process.exit(1);
}
console.log('\nbar-panel: rien a signaler sur les criteres testes.');
