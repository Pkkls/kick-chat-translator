/**
 * Runs the offline gates and reports what each one cost.
 *
 * They are independent: no gate reads what another writes, and the five that
 * bundle with esbuild each own their own output file. Run in series they are
 * eighteen Chromium launches waiting on each other for no reason.
 *
 *   node scratchpad/harness/run-gates.mjs              # all of them, pooled
 *   node scratchpad/harness/run-gates.mjs --jobs 1     # the serial baseline
 *   node scratchpad/harness/run-gates.mjs --only chip-live,rtl-live
 *   node scratchpad/harness/run-gates.mjs --no-build
 *
 * Exit code is the gates': non-zero if any of them failed. Nothing here pipes a
 * gate anywhere or chains it behind &&, which is how a script that threw an
 * exception once reported green.
 */
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

/** Every offline gate, with what it runs. Live gates are deliberately absent:
    they open a browser onto kick.com and are launched by hand. */
const GATES = [
  ['snapshot', 'node', ['scratchpad/harness/snapshot.mjs']],
  ['names', 'node', ['scratchpad/harness/names.mjs']],
  ['chip-live', 'node', ['scratchpad/harness/chip-live.mjs']],
  ['chat-live', 'node', ['scratchpad/harness/chat-live.mjs']],
  ['measure-popup', 'node', ['scratchpad/harness/measure-popup.mjs']],
  ['emote-survival', 'node', ['scratchpad/harness/emote-survival.mjs']],
  ['bar-live', 'node', ['scratchpad/harness/bar-live.mjs']],
  ['compose-live', 'node', ['scratchpad/harness/compose-live.mjs']],
  ['rtl-live', 'node', ['scratchpad/harness/rtl-live.mjs']],
  ['rtl-surfaces', 'node', ['scratchpad/harness/rtl-surfaces.mjs']],
  ['reduced-motion', 'node', ['scratchpad/harness/reduced-motion.mjs']],
  ['long-content', 'node', ['scratchpad/harness/long-content.mjs']],
  ['da-surfaces', 'node', ['scratchpad/harness/da-surfaces.mjs']],
  ['boundaries', 'node', ['scratchpad/harness/boundaries.mjs']],
  // Wired late. They existed and asserted and simply were not in this list, so
  // nothing ran them: bar-panel-live was reporting a panel 4px off the left of
  // the window, which turned out to be a real placement bug, for as long as it
  // sat outside. Three shooters stay out on purpose (flag-render,
  // lang-panel-shoot, probe-row-space): they draw images and print numbers for a
  // human and assert nothing, so adding them would buy runtime and no verdict.
  ['bar-panel-live', 'node', ['scratchpad/harness/bar-panel-live.mjs']],
  ['flags-preview', 'node', ['scratchpad/harness/flags-preview.mjs']],
  ['lang-panel-measure', 'node', ['scratchpad/harness/lang-panel-measure.mjs']],
  // La seule porte qui charge la vraie extension. Toutes les autres montent les
  // composants a la main et ne touchent jamais le manifeste ni le chemin par
  // lequel Chrome injecte. Elle ouvre une fenetre, parce que sans fenetre
  // l'extension n'est pas chargee du tout, et la pousse hors de l'ecran.
  ['extension-load', 'node', ['scratchpad/harness/extension-load.mjs']],
  // Le produit fait une seule chose et rien hors ligne ne la verifiait : un
  // message arrive, sa traduction apparait dessous. Meme fenetre hors ecran.
  ['translate-offline', 'node', ['scratchpad/harness/translate-offline.mjs']],
  ['audit-strings', 'python', ['scratchpad/audit_content_strings.py']],
  ['audit-da', 'python', ['scratchpad/audit_da.py']],
  ['audit-rtl', 'python', ['scratchpad/audit_rtl.py']],
  ['audit-surfaces-rtl', 'python', ['scratchpad/audit_surfaces_rtl.py']],
  // Selectors the harnesses query and the product can no longer emit. Cheap,
  // static, and it caught two assertions that had stopped being able to fail:
  // a count of a class deleted in 2.8.0, and a dead selector hidden behind a
  // `??` fallback that quietly did the work instead.
  ['audit-selecteurs', 'python', ['scratchpad/audit_selecteurs.py']],
  // The one cost every reader pays on every page. It rose 12.5% in one version
  // and nobody saw it for three days, because nothing was looking.
  ['audit-poids', 'python', ['scratchpad/audit_poids.py']],
];

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
/**
 * One worker per core, measured rather than guessed.
 *
 * On the six cores this was written on: 61.7s in series, 23.2s at three, 16.8s
 * at six, 17.7s at nine. Nine is slower than six on the clock AND burns 131.4s
 * of CPU against 87.7, so the knee sits exactly on the core count. Half the
 * cores, which is the cautious-looking default, leaves 6.4s on the table.
 *
 * 16.8s is within 1.9s of the floor, which is the longest single gate:
 * measure-popup loads the popup in ten languages and takes 14.9s on its own.
 * Nothing above this line can go faster than that, so splitting the gates
 * themselves would buy seconds for real complexity.
 */
const rawJobs = flag('--jobs', Math.max(2, cpus().length));
const jobs = Number(rawJobs);
// `--jobs` with nothing after it made this NaN, which spawned no workers, ran no
// gates, and printed "0/0 portes vertes" on the way to exit 0. A runner that
// measures nothing has to say so, not read as good news.
if (!Number.isInteger(jobs) || jobs < 1) {
  console.error(`--jobs attend un entier >= 1, recu ${JSON.stringify(rawJobs)}`);
  process.exit(2);
}
const only = flag('--only', '')?.split(',').filter(Boolean) ?? [];
const build = !argv.includes('--no-build');

const chosen = only.length ? GATES.filter(([n]) => only.includes(n)) : GATES;
if (only.length && chosen.length !== only.length) {
  const known = new Set(GATES.map(([n]) => n));
  const bad = only.filter((n) => !known.has(n));
  console.error('porte inconnue : ' + bad.join(', '));
  process.exit(2);
}

function run(cmd, args) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(cmd, args, { cwd: ROOT, shell: process.platform === 'win32' });
    let out = '';
    child.stdout.on('data', (b) => (out += b));
    child.stderr.on('data', (b) => (out += b));
    child.on('close', (code) => resolve({ code: code ?? 1, ms: Date.now() - started, out }));
    child.on('error', (e) => resolve({ code: 1, ms: Date.now() - started, out: String(e) }));
  });
}

const t0 = Date.now();

if (build) {
  process.stdout.write('build ... ');
  const r = await run('npm', ['run', 'build']);
  console.log(`${(r.ms / 1000).toFixed(1)}s  ${r.code === 0 ? 'ok' : 'ECHEC'}`);
  if (r.code !== 0) {
    console.error(r.out.slice(-2000));
    process.exit(1);
  }
}

const tGates = Date.now();
const queue = [...chosen];
const results = [];

async function worker() {
  for (;;) {
    const next = queue.shift();
    if (!next) return;
    const [name, cmd, args] = next;
    const r = await run(cmd, args);
    results.push({ name, ...r });
    process.stdout.write(
      `${r.code === 0 ? 'ok  ' : 'ECHEC'} ${name.padEnd(19)} ${(r.ms / 1000).toFixed(1)}s\n`,
    );
  }
}

await Promise.all(Array.from({ length: Math.min(jobs, chosen.length) }, worker));

const wall = (Date.now() - tGates) / 1000;
const cpu = results.reduce((a, r) => a + r.ms, 0) / 1000;
const failed = results.filter((r) => r.code !== 0);

// The assertion this whole script owes: every gate asked for actually ran. A
// pool that spawns no worker, or one that drops a gate off the queue, otherwise
// reports a clean sweep of nothing.
if (results.length !== chosen.length) {
  console.error(
    `\n${results.length} portes executees sur ${chosen.length} demandees. Le pool en a perdu.`,
  );
  process.exit(2);
}

console.log();
console.log('les plus lentes :');
for (const r of [...results].sort((a, b) => b.ms - a.ms).slice(0, 5)) {
  console.log(`  ${r.name.padEnd(19)} ${(r.ms / 1000).toFixed(1)}s`);
}
console.log();
console.log(
  `${results.length - failed.length}/${results.length} portes vertes | ` +
    `${jobs} en parallele | horloge ${wall.toFixed(1)}s | cumul ${cpu.toFixed(1)}s | ` +
    `gain x${(cpu / wall).toFixed(2)}` +
    (build ? ` | + ${((tGates - t0) / 1000).toFixed(1)}s de build` : ''),
);

if (failed.length) {
  console.error();
  for (const r of failed) {
    console.error(`=== ${r.name} (code ${r.code}) ===`);
    console.error(r.out.trim().split('\n').slice(-14).join('\n'));
    console.error();
  }
  process.exit(1);
}
