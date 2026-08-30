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

export const { chromium, firefox, webkit, devices } = pw;
export const provenance = trouve;
