/**
 * Runs the kit's accessibility gates on a harness's own DOM dump.
 *
 * Why here and not as a gate of its own: those gates need a rendered HTML file,
 * and the files are produced by the harnesses. `run-gates.mjs` pools its work,
 * so a separate gate could run before the harness that writes its input and
 * would report a missing file as a failure. Attaching the check to the producer
 * orders it by construction.
 *
 * What a dump can and cannot answer, learned by being wrong about it:
 *
 *   - Structure, roles, names, contrast, target size: yes. `tabindex` and every
 *     other real attribute survives serialisation, so axe and the target-size
 *     gate read the same thing a browser would.
 *   - Behaviour: no. A saved page carries no event listeners, because the
 *     component is mounted through page.evaluate and that call is not in the
 *     file. The kit's keyboard gate therefore reports that arrows never move
 *     focus, which is true of the file and false of the product. Arrow keys are
 *     measured in the live page instead, by the harness itself.
 *
 * And the dump has to be taken in the state worth auditing. Taken straight after
 * a filter test, one of these froze a panel where the query left two rows of
 * forty-three visible, and the target-size gate counted fourteen targets: it was
 * measuring a typing state, not a panel.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const KIT = process.env.UX_KIT ?? null;

function scriptsDuKit() {
  const candidats = [];
  if (KIT) candidats.push(path.join(KIT, 'scripts'));
  candidats.push('C:/Users/kil/.claude/ux-ui-agent-skills/scripts');
  return candidats.find((c) => existsSync(path.join(c, 'axe_audit.mjs'))) ?? null;
}

function lancer(script, args) {
  return new Promise((resolve) => {
    const p = spawn('node', [script, ...args], { encoding: 'utf8' });
    let sortie = '';
    p.stdout.on('data', (d) => (sortie += d));
    p.stderr.on('data', (d) => (sortie += d));
    p.on('close', (code) => resolve({ code: code ?? 1, sortie }));
  });
}

/**
 * Audit one dump. Returns a list of failure strings, empty when clean.
 *
 * Silent and empty when the kit is not installed: this is an extra pass over an
 * artefact, not a reason to fail a harness on a machine that does not have the
 * kit. The absence is printed so it is never mistaken for a pass.
 */
export async function auditerDump(fichierHtml, etiquette) {
  const dir = scriptsDuKit();
  if (!dir) {
    console.log(`${etiquette} a11y : kit UX absent, audit non lance (ni echec ni reussite)`);
    return [];
  }
  if (!existsSync(fichierHtml)) {
    return [`${etiquette}: le dump ${path.basename(fichierHtml)} n a pas ete ecrit, rien a auditer`];
  }

  const echecs = [];
  const axe = await lancer(path.join(dir, 'axe_audit.mjs'), [fichierHtml]);
  const cibles = await lancer(path.join(dir, 'verify_target_size.mjs'), [fichierHtml]);

  const resume = (s) => (s.trim().split(/\r?\n/).pop() ?? '').slice(0, 90);
  console.log(`${etiquette} a11y : axe ${axe.code === 0 ? 'ok' : 'ECHEC'} | cibles ${cibles.code === 0 ? 'ok' : 'ECHEC'}`);

  if (axe.code !== 0) {
    for (const l of axe.sortie.split(/\r?\n/).filter((x) => /SERIOUS|CRITICAL|MODERATE/.test(x))) {
      echecs.push(`${etiquette} axe: ${l.trim().slice(0, 110)}`);
    }
    if (echecs.length === 0) echecs.push(`${etiquette} axe: ${resume(axe.sortie)}`);
  }
  if (cibles.code !== 0) echecs.push(`${etiquette} taille de cible: ${resume(cibles.sortie)}`);
  return echecs;
}
