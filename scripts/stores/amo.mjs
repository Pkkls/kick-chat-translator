/**
 * addons.mozilla.org API v5: the same release as the browser walk in SKILL.md,
 * without a browser.
 *
 *   node .claude/skills/publish-stores/amo.mjs status
 *   node .claude/skills/publish-stores/amo.mjs release <firefox.zip> <source.zip> <amo-notes.json>
 *   node .claude/skills/publish-stores/amo.mjs listing <amo-listing.json>
 *
 * `release` uploads the package, waits for validation, creates the version
 * with its source archive, then sets the release notes and reviewer notes.
 * `listing` sets the summary and description in every locale of the JSON.
 * Both JSON files come from payloads.mjs.
 *
 * Reads, outside the repository:
 *   ~/.config/kick-chat-translator/amo-api.json   {"issuer": "...", "secret": "..."} (AMO_API_KEY overrides the path)
 * The secret and the tokens are never printed.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SLUG = process.env.AMO_SLUG ?? 'kick-chat-translator';
const KEY_FILE = process.env.AMO_API_KEY ?? path.join(os.homedir(), '.config', 'kick-chat-translator', 'amo-api.json');
const API = process.env.AMO_API ?? 'https://addons.mozilla.org/api/v5';

const die = (msg) => {
  console.error('amo: ' + msg);
  process.exit(1);
};

// AMO allows five minutes at most; a fresh token per request stays well inside.
function auth() {
  if (!fs.existsSync(KEY_FILE)) die(`cle d API absente : ${KEY_FILE}`);
  const { issuer, secret } = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  if (!issuer || !secret) die(`${KEY_FILE} doit contenir issuer et secret`);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss: issuer, jti: crypto.randomUUID(), iat: now, exp: now + 60 })}`;
  return `JWT ${unsigned}.${crypto.createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
}

async function call(method, url, body, quiet = false) {
  const headers = { Authorization: auth() };
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const r = await fetch(url, { method, headers, body });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  if (!quiet || !r.ok) console.log(`${method} ${url.replace(API, '')} -> ${r.status}`);
  if (!r.ok) {
    console.log(JSON.stringify(json, null, 2).slice(0, 3000));
    process.exit(1);
  }
  return json;
}

// The devhub forms say en-us, the API wants en-US.
const apiLocale = (l) => l.replace(/-([a-z]+)$/, (_, r) => '-' + r.toUpperCase());
const localised = (o) => Object.fromEntries(Object.entries(o).map(([l, t]) => [apiLocale(l), t]));
const file = (p) => {
  if (!p || !fs.existsSync(p)) die(`fichier introuvable : ${p ?? '(aucun)'}`);
  return new Blob([fs.readFileSync(p)]);
};

const [cmd, ...args] = process.argv.slice(2);
const addon = `${API}/addons/addon/${SLUG}`;

if (cmd === 'status') {
  const a = await call('GET', `${addon}/`);
  const v = a.current_version ?? {};
  console.log(JSON.stringify({ current: v.version, file: v.file?.status, status: a.status }, null, 2));
} else if (cmd === 'release') {
  const [zip, source, notesFile] = args;
  const pkg = file(zip);
  const src = file(source);
  const { notes, rev } = JSON.parse(fs.readFileSync(notesFile ?? die('amo-notes.json manquant'), 'utf8'));

  const fd = new FormData();
  fd.set('upload', pkg, path.basename(zip));
  fd.set('channel', 'listed');
  let up = await call('POST', `${API}/addons/upload/`, fd);
  for (let i = 0; !up.processed && i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    up = await call('GET', `${API}/addons/upload/${up.uuid}/`, undefined, true);
  }
  if (!up.processed) die('validation toujours en cours apres 5 minutes');
  const v = up.validation ?? {};
  console.log(`validation : ${v.errors ?? '?'} erreur(s), ${v.warnings ?? '?'} avertissement(s), version ${up.version}`);
  if (!up.valid) die('le paquet ne passe pas la validation');

  const vf = new FormData();
  vf.set('upload', up.uuid);
  vf.set('source', src, path.basename(source));
  const version = await call('POST', `${addon}/versions/`, vf);
  await call('PATCH', `${addon}/versions/${version.id}/`, { release_notes: localised(notes), approval_notes: rev });
  const after = await call('GET', `${addon}/versions/${version.id}/`, undefined, true);
  console.log(JSON.stringify({
    version: after.version,
    file: after.file?.status,
    source: Boolean(after.source),
    release_notes: Object.keys(after.release_notes ?? {}).length,
  }, null, 2));
} else if (cmd === 'listing') {
  const { summary, description } = JSON.parse(fs.readFileSync(args[0] ?? die('amo-listing.json manquant'), 'utf8'));
  const sent = localised(summary);
  await call('PATCH', `${addon}/`, { summary: sent, description: localised(description) });
  // Without `lang`, translated fields come back as {locale: text}: compare them all.
  // AMO serves descriptions with URLs turned into outgoing links, even with
  // wrap_outgoing_links=false, so the markup is stripped before comparing.
  const plain = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const a = await call('GET', `${addon}/`, undefined, true);
  const same = Object.keys(sent).filter((l) => a.summary?.[l] === sent[l] && plain(a.description?.[l]) === localised(description)[l]);
  console.log(`fiche : ${same.length}/${Object.keys(sent).length} locales relues identiques`);
  if (same.length !== Object.keys(sent).length) die(`differentes : ${Object.keys(sent).filter((l) => !same.includes(l)).join(' ')}`);
} else {
  console.error('usage: amo.mjs status | release <firefox.zip> <source.zip> <amo-notes.json> | listing <amo-listing.json>');
  process.exit(2);
}
