/**
 * The live gates: the ones that open a browser onto kick.com.
 *
 * They had no runner at all. Eighteen offline gates were pooled and reported
 * while thirteen live harnesses sat on disk, run by hand or not at all, and the
 * three that cover the language UI reworked this week were among them. A
 * harness nothing runs protects nothing.
 *
 *   node scratchpad/harness/run-live.mjs               the anonymous ones
 *   node scratchpad/harness/run-live.mjs --avec-session   those too
 *   node scratchpad/harness/run-live.mjs --only lang-menu-live,bar-panel-mesure
 *   node scratchpad/harness/run-live.mjs --jobs 1
 *
 * Serial by default, unlike the offline runner. These open real pages on a real
 * site: six at once is six browsers competing for the network and a burst of
 * requests at one host. Two is the default because it halves the wall clock
 * without turning a measurement into a load test.
 *
 * Exit code is the gates': non-zero if any failed. Nothing is piped anywhere
 * and nothing is chained behind &&, which is how a script that threw once
 * reported green.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

/**
 * Every live gate, and whether it needs a signed-in profile.
 *
 * The three that do are excluded unless asked for: they read
 * scratchpad/harness/profile-live, which only exists on a machine where someone
 * signed in by hand, and a run that fails because nobody did is noise rather
 * than a finding. store-shots is not a gate at all, it produces the listing
 * screenshots, so it is not here.
 */
const GATES = [
  ['kick-dom-recon', false],
  ['lang-menu-live', false],
  ['bar-panel-mesure', false],
  ['live-kick', false],
  ['live-nav', false],
  ['live-recycle', false],
  ['live-fallback', false],
  ['latency', false],
  ['compose-kick-live', true],
  ['session-check', true],
];

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const avecSession = argv.includes('--avec-session');
const jobs = Math.max(1, Number(flag('--jobs', '2')) || 2);
const only = flag('--only', null);

let liste = GATES.filter(([, session]) => avecSession || !session);
if (only) {
  const voulus = new Set(only.split(',').map((s) => s.trim()));
  liste = liste.filter(([nom]) => voulus.has(nom));
}

if (liste.length === 0) {
  console.error('run-live: aucune porte selectionnee.');
  process.exit(1);
}

const exclus = GATES.filter(([, s]) => s && !avecSession).map(([n]) => n);
if (exclus.length) {
  console.log(`ecartees, profil connecte requis : ${exclus.join(', ')}  (--avec-session pour les inclure)`);
}

/** First non-empty line of an output, which is where a prerequisite says why. */
function premiereLigne(sortie) {
  const l = sortie.trim().split(/\r?\n/).find((x) => x.trim());
  return (l ?? '').slice(0, 70);
}

function lancer(nom) {
  return new Promise((resolve) => {
    const debut = Date.now();
    const p = spawn('node', [`scratchpad/harness/${nom}.mjs`], { cwd: ROOT, encoding: 'utf8' });
    let sortie = '';
    p.stdout.on('data', (d) => (sortie += d));
    p.stderr.on('data', (d) => (sortie += d));
    p.on('close', (code) => {
      resolve({ nom, code: code ?? 1, secondes: (Date.now() - debut) / 1000, sortie });
    });
  });
}

const file = [...liste.map(([n]) => n)];
const resultats = [];
const horloge = Date.now();

async function worker() {
  for (;;) {
    const nom = file.shift();
    if (!nom) return;
    const r = await lancer(nom);
    resultats.push(r);
    // Exit 2 means "I could not run", never "the product is wrong". Two
    // harnesses use it for two different reasons and both are prerequisites:
    // the shared resolver when Playwright is nowhere, and latency when dist/
    // was not built with metrics. Labelling it ABSENT was a guess that named
    // only the first; the reason is printed instead of assumed.
    const etat = r.code === 0 ? 'ok    ' : r.code === 2 ? 'PREREQ' : 'ECHEC ';
    const raison = r.code === 2 ? '  <- ' + premiereLigne(r.sortie) : '';
    console.log(`${etat} ${r.nom.padEnd(20)} ${r.secondes.toFixed(1)}s${raison}`);
  }
}

await Promise.all(Array.from({ length: Math.min(jobs, file.length) }, worker));

const echecs = resultats.filter((r) => r.code !== 0 && r.code !== 2);
const absents = resultats.filter((r) => r.code === 2);
const cumul = resultats.reduce((s, r) => s + r.secondes, 0);
const mur = (Date.now() - horloge) / 1000;

for (const r of echecs) {
  console.error(`\n=== ${r.nom} (code ${r.code}) ===`);
  console.error(r.sortie.trim().split('\n').slice(-14).join('\n'));
}

console.log();
if (absents.length) {
  console.log(`${absents.length} porte(s) n ont pas pu tourner : ${absents.map((r) => r.nom).join(', ')}`);
}
console.log(
  `${resultats.length - echecs.length - absents.length}/${resultats.length - absents.length} portes live vertes | ` +
    `${jobs} en parallele | horloge ${mur.toFixed(1)}s | cumul ${cumul.toFixed(1)}s`,
);

process.exit(echecs.length ? 1 : 0);
