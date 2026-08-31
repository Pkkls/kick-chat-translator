/**
 * Where Playwright comes from, with nobody's home directory written into it.
 *
 * Every harness used to open with the same two lines:
 *
 *   const KIT = process.env.UX_KIT ?? '<an absolute path into somebody home directory>';
 *   const { chromium } = await import(pathToFileURL(path.join(KIT, 'node_modules/playwright/index.mjs')).href);
 *
 * Thirty-three files, thirty-three copies of one absolute path on one machine.
 * That was invisible while the gates were gitignored and everything ran in one
 * place. It stops being invisible the moment they are tracked in a public
 * repository, where the path is both private and useless.
 *
 * Playwright is deliberately NOT a dependency of this project. The CI installs
 * with `npm ci` on two jobs and never runs these gates; adding it would pull
 * browser binaries into both for nothing. So it is looked for, in order:
 *
 *   1. $UX_KIT/node_modules/playwright
 *   2. this repository's own node_modules, if someone chose to install it
 *
 * and when neither is there the run stops with exit 2 and says how to fix it.
 * Two rather than one on purpose: a missing prerequisite is not a failed gate,
 * and a runner that cannot tell them apart reports a machine without Playwright
 * as a product defect.
 */
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

/**
 * A one-line file holding the kit's path, for the machine that has one.
 *
 * It sits under scratchpad/ and only *.mjs and audit_*.py are un-ignored there,
 * so this stays out of git: the private path lives on the machine it describes
 * and the repository never learns it. Without this the gates would need
 * UX_KIT exported into every shell, which is the kind of setup people forget
 * once and then debug for ten minutes.
 */
const FICHIER_KIT = path.join(ROOT, 'scratchpad/uxkit.path');
const kitLocal = existsSync(FICHIER_KIT) ? readFileSync(FICHIER_KIT, 'utf8').trim() : null;

const candidats = [
  process.env.UX_KIT ? path.join(process.env.UX_KIT, 'node_modules/playwright/index.mjs') : null,
  kitLocal ? path.join(kitLocal, 'node_modules/playwright/index.mjs') : null,
  path.join(ROOT, 'node_modules/playwright/index.mjs'),
].filter((p) => p !== null);

const trouve = candidats.find((p) => existsSync(p));

if (!trouve) {
  console.error('Playwright introuvable, et ces portes en ont besoin.');
  console.error('');
  console.error("Il n'est pas liste en dependance du projet : le CI installe avec");
  console.error('npm ci sur deux jobs et ne lance jamais ces portes, donc l ajouter');
  console.error('tirerait des binaires de navigateur dans les deux pour rien.');
  console.error('');
  console.error('Trois facons de le fournir :');
  console.error('  echo <dossier contenant node_modules/playwright> > scratchpad/uxkit.path   (persistant, gitignore)');
  console.error('  UX_KIT=<le meme dossier>  node scratchpad/harness/run-gates.mjs           (ponctuel)');
  console.error('  npm i -D playwright                                                       (dans le depot)');
  console.error('');
  console.error('Cherche a :');
  for (const c of candidats) console.error('  ' + c);
  process.exit(2);
}

const pw = await import(pathToFileURL(trouve).href);

/**
 * Sans fenetre, et la nuance qui a fait croire pendant des mois que c'etait
 * impossible.
 *
 * Ce que ce depot tenait pour acquis : une extension MV3 ne se charge pas en
 * headless, donc les portes ouvrent une vraie fenetre et la poussent a
 * -2400,-2400. C'est vrai du `headless: true` de Playwright, qui utilise encore
 * son propre mode, et c'est faux du mode headless de Chromium lui-meme.
 *
 * Mesure, meme build et meme page, trois modes :
 *
 *   headed hors ecran     content script INJECTE   worker demarre
 *   --headless=new        content script INJECTE   worker demarre
 *   headless: true        content script absent    worker absent
 *
 * Donc `KT_HEADLESS=1` garde `headless: false` cote Playwright et passe le
 * drapeau a Chromium. Ce qui change pour la machine de kil : plus de fenetre qui
 * apparait et vole le focus a chaque porte, et une CI sans serveur d'affichage
 * devient possible.
 *
 * Deux exceptions, et elles sont dans la regle plutot que dans une liste :
 * une option `channel` veut le Chrome de la machine, donc `live-kick` et
 * `compose-kick-live`, qui ouvrent le vrai kick.com ou la detection de robot
 * fait partie de ce qui est mesure ; et un appelant qui a deja demande un mode
 * headless n'est pas contredit.
 */
const sansFenetre = process.env.KT_HEADLESS === '1';

function avecHeadless(options = {}) {
  if (!sansFenetre) return options;
  if (options.channel) return options;
  if (options.headless === true) return options;
  const args = options.args ?? [];
  if (args.some((a) => String(a).startsWith('--headless'))) return options;
  return {
    ...options,
    headless: false,
    // La position hors ecran ne veut plus rien dire sans fenetre, et la garder
    // ferait porter au journal une option qui ne s'applique a rien.
    args: [...args.filter((a) => !String(a).startsWith('--window-position')), '--headless=new'],
  };
}

// Un Proxy plutot qu'une copie : `pw.chromium` est une instance dont les
// methodes vivent sur le prototype et dont l'etat interne est prive, donc un
// spread la casse en silence. Tout est renvoye lie a l'objet reel, et seules les
// deux methodes de lancement sont interceptees.
const chromiumBrut = pw.chromium;
export const chromium = new Proxy(chromiumBrut, {
  get(cible, prop) {
    if (prop === 'launch') return (o) => cible.launch(avecHeadless(o));
    if (prop === 'launchPersistentContext') return (dir, o) => cible.launchPersistentContext(dir, avecHeadless(o));
    const v = Reflect.get(cible, prop, cible);
    return typeof v === 'function' ? v.bind(cible) : v;
  },
});

export const { firefox, webkit, devices } = pw;
export const provenance = trouve;
/** Vrai quand ce processus a demande a Chromium de tourner sans fenetre. */
export const headless = sansFenetre;

/**
 * Le navigateur des portes hors-ligne est le Chromium embarque avec Playwright,
 * jamais le Chrome de la machine.
 *
 * Dix-sept portes et trois tireurs demandaient `channel: 'chrome'`, ce qui fait
 * du navigateur une propriete de la machine : un clone sans Google Chrome
 * installe ne pouvait pas les lancer, alors que ce depot vient justement de
 * rendre son appareil de mesure suivi pour qu'un clone puisse le lancer.
 *
 * Le Chrome de la machine est plus rapide, mesure sur une porte, trois lancements
 * chacun : 914 a 1443 ms contre 1474 a 2256 ms, soit une demi-seconde de plus par
 * porte. Ce n'est pas la vitesse qui tranche. Un appareil de mesure qui peut
 * s'executer sur deux navigateurs selon la machine produit deux jeux de nombres,
 * et ces portes assertent des pixels. Les deux etaient d'accord le jour du
 * changement, 151.0.7922.34 embarque contre 151.0.7922.174 systeme, et ce sont
 * deux flux de versions qui n'ont aucune raison de le rester.
 *
 * Deux harnais gardent le Chrome de la machine, `live-kick` et
 * `compose-kick-live` : ils ouvrent le vrai kick.com, ou le profil et la
 * detection de robot du site font partie de ce qui est mesure.
 */
