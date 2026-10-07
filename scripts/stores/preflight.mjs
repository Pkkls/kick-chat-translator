/**
 * What a release will ask of a person, said before the tag rather than by a
 * store refusing it after.
 *
 *   node scripts/stores/preflight.mjs [<since-tag>] [--html <file>]
 *
 * Compares HEAD with the last tag that is not HEAD's own (or <since-tag>) and
 * lists the steps no API can do:
 * - a permission or host permission added: its justification goes in the Chrome
 *   dashboard's Privacy tab. 3.0.2 added `scripting`, the tag went out without
 *   it, and Chrome refused the submission with INVALID_ITEM_METADATA.
 * - a file of store/chrome/description/ changed: each language is pasted in the
 *   dashboard, since the Chrome API has no listing method.
 *
 * Fails, before any of that, when a shipped permission is missing from
 * PRIVACY.md or from store/chrome/dashboard/permission-justifications.txt.
 *
 * With --html, writes one page holding every text to paste, each with a copy
 * button, so the manual part is a series of clicks rather than a search.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const git = (cmd) => execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const htmlAt = args.includes('--html') ? args[args.indexOf('--html') + 1] : undefined;
const sinceArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--html');

const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const since =
  sinceArg ??
  git('tag --sort=-creatordate --list "v*"')
    .split('\n')
    .find((t) => t && t !== `v${version}`);
if (!since) {
  console.error('preflight: no earlier tag to compare with');
  process.exit(2);
}

/** Every permission string in a manifest.config.ts source, both arrays. */
export function permissionsOf(source) {
  const found = new Set();
  for (const key of ['permissions', 'host_permissions']) {
    const m = source.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`));
    if (!m) continue;
    for (const q of m[1].matchAll(/'([^']+)'|"([^"]+)"/g)) found.add(q[1] ?? q[2]);
  }
  return found;
}

const now = permissionsOf(fs.readFileSync(path.join(ROOT, 'manifest.config.ts'), 'utf8'));
const before = permissionsOf(git(`show ${since}:manifest.config.ts`));
const added = [...now].filter((p) => !before.has(p));

const JUSTIFS = 'store/chrome/dashboard/permission-justifications.txt';
const justifs = fs.readFileSync(path.join(ROOT, JUSTIFS), 'utf8');
const privacy = fs.readFileSync(path.join(ROOT, 'PRIVACY.md'), 'utf8');
const bare = (p) => p.replace('https://', '').replace('/*', '');
const errors = [];
for (const p of now) {
  if (!justifs.includes(p) && !justifs.includes(bare(p))) errors.push(`${JUSTIFS} has no justification for ${p}`);
  if (!p.includes('://') && !privacy.includes(`\`${p}\``)) errors.push(`PRIVACY.md does not list the \`${p}\` permission`);
}

const descChanged = git(`diff --name-only ${since} HEAD -- store/chrome/description`)
  .split('\n')
  .filter(Boolean);

/** The paragraph of the justification file that belongs to a permission. */
function justificationOf(p) {
  const blocks = justifs.split(/\n\s*\n/);
  return blocks.find((b) => b.split('\n')[0].trim() === p || b.split('\n')[0].includes(bare(p)))?.trim() ?? '';
}

const steps = [];
for (const p of added) steps.push({ what: `Privacy tab: justification for the new permission \`${p}\``, text: justificationOf(p) });
for (const f of descChanged) {
  const lang = path.basename(f, '.txt');
  steps.push({ what: `Store listing, ${lang}: paste the description`, text: fs.readFileSync(path.join(ROOT, f), 'utf8').trim() });
}

console.log(`preflight ${version} against ${since}`);
console.log(`  permissions added: ${added.length ? added.join(', ') : 'none'}`);
console.log(`  Chrome descriptions changed: ${descChanged.length}`);
if (errors.length) {
  for (const e of errors) console.error(`  ERROR ${e}`);
  process.exit(1);
}
if (!steps.length) {
  console.log('  nothing to do by hand: the tag can go.');
} else {
  console.log(`  ${steps.length} step(s) by hand in the Chrome dashboard BEFORE the tag:`);
  for (const s of steps) console.log(`   - ${s.what}`);
}

if (htmlAt) {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cards = steps
    .map(
      (s, i) => `<section><h2>${esc(s.what)}</h2><button data-i="${i}">Copy</button><pre id="t${i}">${esc(s.text)}</pre></section>`,
    )
    .join('\n');
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Release ${version} by hand</title>
<style>
:root{--ink:#0B0B0C;--surface:#171A1C;--text:#E8EAEB;--green:#53FC18}
body{margin:0;padding:16px;background:var(--ink);color:var(--text);font:15px/1.5 system-ui,sans-serif}
main{max-width:760px;margin:auto}section{background:var(--surface);border-radius:8px;padding:16px;margin:16px 0}
h2{font-size:15px;margin:0 0 8px}pre{white-space:pre-wrap;word-break:break-word;margin:8px 0 0}
button{background:var(--green);color:var(--ink);border:0;border-radius:4px;padding:8px 14px;font-weight:600;cursor:pointer;transition:opacity .15s}
button:focus-visible{outline:2px solid var(--text);outline-offset:2px}
</style></head><body><main><h1>Release ${version}: ${steps.length} step(s) in the Chrome dashboard</h1>
<p>Do these, save, then push the tag (or run <code>node scripts/stores/cws.mjs publish</code> if it is already out).</p>
${cards || '<p>Nothing to do by hand.</p>'}
</main><script>
for (const b of document.querySelectorAll('button')) b.addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('t' + b.dataset.i).textContent);
  b.textContent = 'Copied';
});
</script></body></html>`;
  fs.writeFileSync(htmlAt, page);
  console.log(`  -> ${htmlAt}`);
}
