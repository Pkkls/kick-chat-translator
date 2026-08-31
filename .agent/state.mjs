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
  // Runners and shared modules are not gates and must not be counted as
  // orphans: doing so inflated the number by two and made the figure the queue
  // quotes wrong.
  const PAS_DES_PORTES = new Set(['run-gates.mjs', 'run-live.mjs', 'playwright.mjs']);
  const surDisque = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.mjs') && !PAS_DES_PORTES.has(f))
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

/**
 * What the two stores are actually serving, read rather than remembered.
 *
 * This field exists because of a mistake. A note written in June said both
 * stores were on 2.5.0. It was repeated across a plan entry, a memory file and a
 * report, three months later, without once being re-derived. Read off the pages
 * on 2026-08-31: Chrome was on 2.9.2 and AMO on 2.7.0, which is not one wrong
 * number but two, plus the false claim that the listing text had never been
 * rewritten when it opens on "NEW IN 2.9.2".
 *
 * A store version is a page. It changes with no commit, so it cannot live in a
 * tracked file and stay true, and the only safe form for it is a request made
 * now. The two identifiers come out of README.md rather than being written here,
 * so this can never end up reading a listing the project does not link to.
 *
 * Chrome has no public API for this, so its version is scraped out of the page
 * next to the "Version" label. A scrape breaks silently, which is the one thing
 * this file must not do, so a shape that does not match reports the failure
 * instead of a value.
 */
async function boutiques() {
  const readme = (() => {
    try {
      return readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    } catch {
      return '';
    }
  })();
  const idChrome = readme.match(/chromewebstore\.google\.com\/detail\/[^/\s)]+\/([a-p]{32})/)?.[1] ?? null;
  const slugAmo = readme.match(/addons\.mozilla\.org\/(?:[a-z-]+\/)?firefox\/addon\/([a-z0-9-]+)/)?.[1] ?? null;

  const out = {
    note:
      'Lu sur les pages, jamais recopie. Une version de boutique change sans commit : ' +
      "la valeur commitee ici decrit l'instant de la generation et rien d'autre.",
    chrome: { id: idChrome },
    amo: { slug: slugAmo },
  };
  if (horsLigne) {
    out.chrome.note = 'non interroge (--hors-ligne)';
    out.amo.note = 'non interroge (--hors-ligne)';
    return out;
  }

  if (idChrome) {
    try {
      const r = await fetch(
        `https://chromewebstore.google.com/detail/kick-chat-translator/${idChrome}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );
      out.chrome.http = r.status;
      if (r.ok) {
        const html = await r.text();
        // La page pose la valeur apres le libelle, avec du balisage entre les deux.
        const bloc = html.slice(html.indexOf('>Version<'), html.indexOf('>Version<') + 400);
        out.chrome.version = bloc.match(/>(\d+\.\d+\.\d+)</)?.[1] ?? null;
        out.chrome.maj = bloc.match(/>([A-Z][a-z]+ \d{1,2}, \d{4})</)?.[1] ?? null;
        out.chrome.utilisateurs = Number(html.match(/([\d,]+)\s*users/)?.[1]?.replace(/,/g, '')) || null;
        if (!out.chrome.version) {
          out.chrome.note = 'page recue mais aucune version lisible : le balisage a bouge, ne rien deduire';
        }
      }
    } catch (e) {
      out.chrome.note = 'requete impossible: ' + String(e).slice(0, 80);
    }
  } else {
    out.chrome.note = 'aucun identifiant Chrome trouve dans README.md';
  }

  if (slugAmo) {
    try {
      const r = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${slugAmo}/`, {
        headers: { 'User-Agent': 'kct-agent-state' },
      });
      out.amo.http = r.status;
      if (r.ok) {
        const j = await r.json();
        out.amo.version = j.current_version?.version ?? null;
        out.amo.relue = j.current_version?.reviewed ?? null;
        out.amo.utilisateurs = j.average_daily_users ?? null;
        out.amo.statut = j.status ?? null;
      }
    } catch (e) {
      out.amo.note = 'requete impossible: ' + String(e).slice(0, 80);
    }
  } else {
    out.amo.note = 'aucun slug AMO trouve dans README.md';
  }
  return out;
}

/** L'ecart entre ce que le depot construit et ce que chaque boutique sert. */
function boutiquesContreVersion(b, versionLocale) {
  const ecart = (v) => (v == null ? null : v === versionLocale ? 'a jour' : `${v} contre ${versionLocale} ici`);
  return {
    versionLocale,
    chrome: ecart(b.chrome.version),
    amo: ecart(b.amo.version),
    note:
      "Un retard n'est pas un defaut : soumettre est du ressort de kil. " +
      "Ce champ existe pour qu'on cesse de citer un chiffre de tete.",
  };
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

/**
 * Local archives that carry a published version number but are not that build.
 *
 * Rebuilding after a release overwrites release/<version>.zip with something
 * the world has never seen, under a number the world already has. That is how a
 * stale package nearly went to a store once: the file name agreed with the
 * manifest inside and both disagreed with what was published. Sizes are
 * compared because the release API gives a size for every asset and no digest.
 */
function paquetsContreRelease(locaux, release) {
  if (!release?.assets?.length) return { note: release?.note ?? 'aucune release a comparer' };
  const parNom = new Map(release.assets.map((a) => [a.nom, a.octets]));
  const ecarts = [];
  for (const p of locaux) {
    const publie = parNom.get(p.fichier);
    if (publie !== undefined && publie !== p.octets) {
      ecarts.push({ fichier: p.fichier, local: p.octets, publie, delta: p.octets - publie });
    }
  }
  return {
    compares: locaux.filter((p) => parNom.has(p.fichier)).length,
    ecarts,
    note: ecarts.length
      ? 'un zip local porte un numero publie sans etre ce build : ne pas le soumettre, republier ou le supprimer'
      : null,
  };
}

const g = git();
const lesPaquets = paquets();
const laRelease = await releaseGithub(g.remotes);
const lesVersions = versions();
const lesBoutiques = await boutiques();
const etat = {
  genere: new Date().toISOString(),
  parQui: '.agent/state.mjs',
  avertissement:
    'Genere. Ne pas editer a la main : la prochaine passe ecrase. La version commitee decrit ' +
    "l'etat d'AVANT le commit qui la porte, puisque la fin de passe genere puis commite : " +
    'git.head y pointe le commit precedent et git.arbrePropre y est faux. Relancer ' +
    '`node .agent/state.mjs` avant de lire, ce que le prompt demande deja en premier.',
  git: g,
  versions: lesVersions,
  paquets: lesPaquets,
  portes: portes(),
  releaseGithub: laRelease,
  paquetsContreRelease: paquetsContreRelease(lesPaquets, laRelease),
  boutiques: lesBoutiques,
  boutiquesContreVersion: boutiquesContreVersion(lesBoutiques, lesVersions.packageJson),
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
  const pc = etat.paquetsContreRelease;
  if (pc.ecarts?.length) {
    console.log(`ATTENTION    ${pc.ecarts.length} zip local porte un numero publie sans etre ce build :`);
    for (const e of pc.ecarts) console.log(`  ${e.fichier}  local ${e.local} o, publie ${e.publie} o (${e.delta > 0 ? '+' : ''}${e.delta})`);
  } else if (pc.compares) {
    console.log(`paquets/release ${pc.compares} compare(s), aucun ecart`);
  }
  // Les boutiques passent avant la file : c'est le chiffre qu'on a cite de tete
  // et rate deux fois, une par boutique.
  const bq = etat.boutiques;
  const bcv = etat.boutiquesContreVersion;
  console.log(
    `chrome       ${bq.chrome.version ?? bq.chrome.note ?? '?'}` +
      `${bq.chrome.version ? `  (${bcv.chrome}, ${bq.chrome.utilisateurs ?? '?'} users, ${bq.chrome.maj ?? '?'})` : ''}`,
  );
  console.log(
    `amo          ${bq.amo.version ?? bq.amo.note ?? '?'}` +
      `${bq.amo.version ? `  (${bcv.amo}, ${bq.amo.utilisateurs ?? '?'} users, ${(bq.amo.relue ?? '').slice(0, 10)})` : ''}`,
  );
  console.log(`file         ${etat.file.nbOuverts} ouvert(s), ${etat.file.nbBloques} bloque(s) sur kil, ${etat.file.nbFaits} fait(s)`);
  for (const b of etat.file.bloques ?? []) console.log(`  bloque: ${b.slice(0, 90)}`);
}

console.log(`\n.agent/ETAT.json ecrit (${etat.genere}).`);
