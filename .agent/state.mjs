/**
 * Regenerates .agent/ETAT.json: what is true right now, obtained by running
 * things rather than by remembering them.
 *
 * Why this file exists. The handoff written on 2026-08-27 opened a session on
 * 2026-08-29 with four claims: a clean tree, HEAD on 196b441, version 2.8.0,
 * and the offline gates still running in series. The tree had thirteen modified
 * files, HEAD was five commits further on, the version was 2.8.1, and
 * run-gates.mjs had been pooling one worker per core for some time. Four
 * claims, four wrong, in under forty-eight hours. Prose about a repository goes
 * stale at the speed the repository moves.
 *
 * So nothing here is written down. Every field is the output of a command, a
 * parse of a file on disk, or a request. PROMPT.md carries the method and is
 * allowed to contain no fact at all; this carries the facts and contains no
 * method.
 *
 *   node .agent/state.mjs           writes .agent/ETAT.json
 *   node .agent/state.mjs --texte   the same, readable, on stdout
 *   node .agent/state.mjs --hors-ligne   skips the network probe
 *
 * Exit code is 0 even when the repository is in a bad state: this reports, it
 * does not judge. A non-zero exit means the report itself could not be made.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const texte = process.argv.includes('--texte');
const horsLigne = process.argv.includes('--hors-ligne');

/** Run a command and return its trimmed stdout, or null when it fails. */
function sh(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function json(rel) {
  const p = path.join(ROOT, rel);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

// ─── git ─────────────────────────────────────────────────────────────────────

function git() {
  const remotes = {};
  for (const ligne of (sh('git', ['remote', '-v']) ?? '').split('\n')) {
    const m = ligne.match(/^(\S+)\s+(\S+)\s+\(fetch\)$/);
    if (m) remotes[m[1]] = m[2];
  }

  const branche = sh('git', ['branch', '--show-current']);
  const ecarts = {};
  for (const r of Object.keys(remotes)) {
    // left = commits the remote has and we do not, right = ours it lacks.
    const c = sh('git', ['rev-list', '--left-right', '--count', `${r}/${branche}...HEAD`]);
    if (c) {
      const [derriere, devant] = c.split(/\s+/).map(Number);
      ecarts[r] = { derriere, devant, aJour: derriere === 0 && devant === 0 };
    } else {
      ecarts[r] = { note: `pas de ${r}/${branche} connu localement` };
    }
  }

  // Two remotes can name the same repository. When they do, one of them has a
  // stale tracking ref and reports a divergence the other denies: the first run
  // of this file showed origin "a jour" and public "16 devant" for one URL.
  // Naming the duplicate is cheaper than explaining the number every time.
  const parUrl = {};
  for (const [nom, url] of Object.entries(remotes)) (parUrl[url] ??= []).push(nom);
  const doublons = Object.entries(parUrl)
    .filter(([, noms]) => noms.length > 1)
    .map(([url, noms]) => ({ url, noms }));
  for (const d of doublons) for (const n of d.noms) if (ecarts[n]) ecarts[n].aliasDe = d.noms.filter((x) => x !== n);

  const sale = (sh('git', ['status', '--porcelain']) ?? '').split('\n').filter((l) => l.trim());
  return {
    remotesEnDouble: doublons,
    branche,
    head: sh('git', ['rev-parse', 'HEAD']),
    sujet: sh('git', ['log', '-1', '--format=%s']),
    arbrePropre: sale.length === 0,
    fichiersModifies: sale.length,
    dernierTag: sh('git', ['describe', '--tags', '--abbrev=0']),
    decrit: sh('git', ['describe', '--tags']),
    remotes,
    ecarts,
  };
}

// ─── versions ────────────────────────────────────────────────────────────────

/**
 * The three places a version lives, and whether they agree.
 *
 * package.json is the source, dist/manifest.json is what a browser would load,
 * and they drift the moment someone bumps without rebuilding. That drift is
 * exactly what shipped a stale package under a fresh number once already.
 */
function versions() {
  const pkg = json('package.json')?.version ?? null;
  const dist = json('dist/manifest.json')?.version ?? null;
  return {
    packageJson: pkg,
    distManifest: dist,
    accordent: pkg !== null && pkg === dist,
    note: pkg === dist ? null : 'dist/ ne correspond pas a package.json : rebuild avant de packer',
  };
}

// ─── paquets ─────────────────────────────────────────────────────────────────

/**
 * The manifest version inside each archive, read by inflating it.
 *
 * Not by parsing the filename, and not by searching the archive's bytes: a zip
 * is DEFLATE-compressed, so a string search over it finds nothing whatever the
 * contents are. A probe that cannot see what it looks for reports every archive
 * as empty and reads like good news.
 */
function versionDansZip(fichier) {
  const buf = readFileSync(fichier);
  for (let i = 0; i < buf.length - 4; i++) {
    if (buf.readUInt32LE(i) !== 0x02014b50) continue;
    const nlen = buf.readUInt16LE(i + 28);
    if (buf.toString('utf8', i + 46, i + 46 + nlen) !== 'manifest.json') continue;
    const clen = buf.readUInt32LE(i + 20);
    const meth = buf.readUInt16LE(i + 10);
    const off = buf.readUInt32LE(i + 42);
    const ln = buf.readUInt16LE(off + 26);
    const le = buf.readUInt16LE(off + 28);
    const d = buf.subarray(off + 30 + ln + le, off + 30 + ln + le + clen);
    const brut = meth === 0 ? d : inflateRawSync(d);
    return JSON.parse(brut.toString('utf8')).version;
  }
  return null;
}

function paquets() {
  const dir = path.join(ROOT, 'release');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => {
      const p = path.join(dir, f);
      let dedans = null;
      let erreur = null;
      try {
        dedans = versionDansZip(p);
      } catch (e) {
        erreur = String(e).slice(0, 120);
      }
      const nomme = f.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null;
      return {
        fichier: f,
        octets: readFileSync(p).length,
        versionDuNom: nomme,
        versionDuManifest: dedans,
        accordent: nomme !== null && nomme === dedans,
        erreur,
      };
    })
    .sort((a, b) => a.fichier.localeCompare(b.fichier));
}

// ─── portes ──────────────────────────────────────────────────────────────────

/**
 * The offline gates run-gates.mjs enumerates, and every harness on disk that it
 * does not. The second list is the one worth looking at: a harness written for
 * a defect and never wired into the runner protects nothing on the next pass.
 */
function portes() {
  const runner = path.join(ROOT, 'scratchpad/harness/run-gates.mjs');
  let enumerees = [];
  if (existsSync(runner)) {
    const s = readFileSync(runner, 'utf8');
    const bloc = s.match(/const GATES = \[([\s\S]*?)\n\];/);
    // Only the first string of each tuple. Matching every quoted string inside
    // the block counted the command's script path as a gate too and reported
    // thirty-six where there are eighteen.
    if (bloc) enumerees = [...bloc[1].matchAll(/^\s*\[\s*'([^']+)'/gm)].map((m) => m[1]);
  }
  const dir = path.join(ROOT, 'scratchpad/harness');
  const surDisque = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.mjs') && f !== 'run-gates.mjs')
        .map((f) => f.replace(/\.mjs$/, ''))
    : [];
  const orphelins = surDisque.filter((n) => !enumerees.includes(n)).sort();
  return {
    runner: existsSync(runner) ? 'scratchpad/harness/run-gates.mjs' : null,
    enumerees: enumerees.length,
    noms: enumerees,
    harnaisSurDisque: surDisque.length,
    orphelins,
    nbOrphelins: orphelins.length,
    note:
      'Les portes live ouvrent un navigateur sur kick.com et ne sont dans aucun runner. ' +
      'Un orphelin n est pas forcement un defaut ; un orphelin qui couvre du code livre en est un.',
  };
}

// ─── ce que voit un utilisateur ──────────────────────────────────────────────

/**
 * The release endpoint as an unauthenticated client sees it, which is what
 * updateChecker gets. Asked without a token on purpose: with one, a private
 * repository answers 200 and hides that every user is getting a 404.
 */
async function releaseGithub(remotes) {
  const url = remotes.origin ?? Object.values(remotes)[0] ?? '';
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!m) return { note: 'aucun remote github reconnu' };
  const depot = `${m[1]}/${m[2]}`;
  if (horsLigne) return { depot, note: 'non interroge (--hors-ligne)' };
  try {
    const r = await fetch(`https://api.github.com/repos/${depot}/releases/latest`, {
      headers: { 'User-Agent': 'kct-agent-state' },
    });
    if (!r.ok) {
      return {
        depot,
        http: r.status,
        note:
          r.status === 404
            ? '404 anonyme : soit aucune release, soit le depot est prive. updateChecker recoit ca chez tes utilisateurs.'
            : 'reponse inattendue',
      };
    }
    const j = await r.json();
    return {
      depot,
      http: 200,
      tag: j.tag_name,
      publiee: j.published_at,
      assets: (j.assets ?? []).map((a) => ({ nom: a.name, octets: a.size })),
    };
  } catch (e) {
    return { depot, note: 'requete impossible: ' + String(e).slice(0, 80) };
  }
}

// ─── la file ─────────────────────────────────────────────────────────────────

/** Items PLAN.md marks as waiting on kil, lifted so they are visible at once. */
function bloqueSurKil() {
  const p = path.join(HERE, 'PLAN.md');
  // Absent is a state, not a hole: the counters stay numbers so nothing
  // downstream prints "undefined ouvert(s)" the way the first run did.
  if (!existsSync(p)) return { note: 'PLAN.md absent', bloques: [], nbBloques: 0, nbOuverts: 0, nbFaits: 0 };
  const lignes = readFileSync(p, 'utf8').split('\n');
  const bloques = lignes.filter((l) => /^\s*-\s*\[k\]/i.test(l)).map((l) => l.replace(/^\s*-\s*\[k\]\s*/i, '').trim());
  const ouverts = lignes.filter((l) => /^\s*-\s*\[ \]/.test(l)).length;
  const faits = lignes.filter((l) => /^\s*-\s*\[x\]/i.test(l)).length;
  return { bloques, nbBloques: bloques.length, nbOuverts: ouverts, nbFaits: faits };
}

// ─── sortie ──────────────────────────────────────────────────────────────────

const g = git();
const etat = {
  genere: new Date().toISOString(),
  parQui: '.agent/state.mjs',
  avertissement: 'Genere. Ne pas editer a la main : la prochaine passe ecrase.',
  git: g,
  versions: versions(),
  paquets: paquets(),
  portes: portes(),
  releaseGithub: await releaseGithub(g.remotes),
  file: bloqueSurKil(),
};

mkdirSync(HERE, { recursive: true });
writeFileSync(path.join(HERE, 'ETAT.json'), JSON.stringify(etat, null, 2) + '\n', 'utf8');

if (texte) {
  const v = etat.versions;
  console.log(`branche      ${etat.git.branche}  ${etat.git.head?.slice(0, 8)}  ${etat.git.decrit ?? ''}`);
  console.log(`arbre        ${etat.git.arbrePropre ? 'propre' : etat.git.fichiersModifies + ' fichier(s) modifie(s)'}`);
  for (const [r, e] of Object.entries(etat.git.ecarts)) {
    const alias = e.aliasDe?.length ? `  (meme depot que ${e.aliasDe.join(', ')})` : '';
    console.log(`  ${r.padEnd(10)} ${e.note ?? (e.aJour ? 'a jour' : `${e.derriere} derriere / ${e.devant} devant`)}${alias}`);
  }
  console.log(`version      package.json ${v.packageJson}, dist ${v.distManifest}${v.accordent ? '' : '  <-- ' + v.note}`);
  console.log(`paquets      ${etat.paquets.length}`);
  for (const p of etat.paquets) {
    console.log(`  ${p.fichier.padEnd(42)} manifest ${p.versionDuManifest}${p.accordent ? '' : '  <-- le nom dit ' + p.versionDuNom}`);
  }
  console.log(`portes       ${etat.portes.enumerees} enumerees, ${etat.portes.harnaisSurDisque} harnais, ${etat.portes.nbOrphelins} orphelins`);
  if (etat.portes.nbOrphelins) console.log(`  ${etat.portes.orphelins.join(' ')}`);
  const rg = etat.releaseGithub;
  console.log(`release      ${rg.tag ? rg.tag + ' (' + (rg.assets?.length ?? 0) + ' assets, vue sans auth)' : rg.note}`);
  console.log(`file         ${etat.file.nbOuverts} ouvert(s), ${etat.file.nbBloques} bloque(s) sur kil, ${etat.file.nbFaits} fait(s)`);
  for (const b of etat.file.bloques ?? []) console.log(`  bloque: ${b.slice(0, 90)}`);
}

console.log(`\n.agent/ETAT.json ecrit (${etat.genere}).`);
