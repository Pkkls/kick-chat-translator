import { mkdirSync, readdirSync, statSync, existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { crc32, deflateRawSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = resolve(ROOT, 'dist');
const RELEASE = resolve(ROOT, 'release');

interface PackageJson {
  version: string;
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) {
    console.error('dist/ does not exist. Run `npm run build` first.');
    process.exit(1);
  }
  if (!existsSync(RELEASE)) mkdirSync(RELEASE, { recursive: true });

  const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8')) as PackageJson;
  // "chromium" covers Chrome, Brave and Edge — they all load the same build.
  const tag = process.env.BROWSER === 'firefox' ? 'firefox' : 'chromium';
  const zipName = `kick-chat-translator-${pkg.version}-${tag}.zip`;
  const zipPath = resolve(RELEASE, zipName);

  if (existsSync(zipPath)) rmSync(zipPath);

  zipDir(DIST, zipPath);

  const sha = sha256(zipPath);
  console.info(`Packed: ${relative(ROOT, zipPath)} (${sha.slice(0, 12)}…)`);
  console.info(`  node ${process.version}, full sha256 ${sha}`);
  warnNodeMismatch();
}

/**
 * Say out loud which Node built this, and whether it is the pinned one.
 *
 * The 2.9.x packages went out built on 22 while .nvmrc pins 20 and CI runs 20.
 * Both satisfy `engines: >=20`, so nothing anywhere objected, and the mismatch
 * was only noticed while writing reviewer notes that had to state a version.
 * Printing it at pack time turns a fact somebody has to remember into one the
 * release log already contains.
 *
 * A warning and not a failure: `engines` allows 22, so refusing would have this
 * script contradict package.json. What it must not do is stay silent.
 */
function warnNodeMismatch(): void {
  const nvmrcPath = resolve(ROOT, '.nvmrc');
  if (!existsSync(nvmrcPath)) return;
  const pinned = readFileSync(nvmrcPath, 'utf8').trim().replace(/^v/, '').split('.')[0];
  const running = process.version.replace(/^v/, '').split('.')[0];
  if (pinned && running && pinned !== running) {
    console.warn(
      `  note: .nvmrc pins node ${pinned} and CI builds on it; this archive was built on ${running}.`,
    );
  }
}

function sha256(path: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

/**
 * Write the archive here instead of shelling out to whatever the platform has.
 *
 * Windows PowerShell 5.1 ships Compress-Archive on .NET Framework, which writes
 * BACKSLASH separators into the entry names. The zip format requires forward
 * slashes, so the result is not a tree at all: a store or a browser reading it
 * sees flat files literally named `assets\content.js`. It was silently producing
 * a malformed package on every Windows build.
 *
 * Node has no zip writer, but the parts we need are small, and emitting them
 * directly means ONE code path on every platform instead of two that disagree.
 * Entry order and timestamps are fixed, so the same dist/ always yields a byte
 * identical zip and two packages can be compared by hash.
 */
interface ZipEntry {
  /** Always forward slashed, and ending in "/" for a directory. */
  name: string;
  body: Buffer;
  isDir: boolean;
}

function collectEntries(root: string, prefix = ''): ZipEntry[] {
  const out: ZipEntry[] = [];
  for (const name of readdirSync(root).sort()) {
    const full = join(root, name);
    const rel = `${prefix}${name}`;
    if (statSync(full).isDirectory()) {
      out.push({ name: `${rel}/`, body: Buffer.alloc(0), isDir: true });
      out.push(...collectEntries(full, `${rel}/`));
    } else {
      out.push({ name: rel, body: readFileSync(full), isDir: false });
    }
  }
  return out;
}

const DOS_TIME = 0;
const DOS_DATE = 0x0021; // 1980-01-01, fixed so the output is reproducible
const UTF8_NAMES = 0x0800;

function buildZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const stored = entry.isDir ? Buffer.alloc(0) : deflateRawSync(entry.body);
    const method = entry.isDir ? 0 : 8;
    const sum = entry.isDir ? 0 : crc32(entry.body);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(UTF8_NAMES, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(entry.body.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, stored);

    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(UTF8_NAMES, 8);
    record.writeUInt16LE(method, 10);
    record.writeUInt16LE(DOS_TIME, 12);
    record.writeUInt16LE(DOS_DATE, 14);
    record.writeUInt32LE(sum, 16);
    record.writeUInt32LE(stored.length, 20);
    record.writeUInt32LE(entry.body.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt16LE(0, 30);
    record.writeUInt16LE(0, 32);
    record.writeUInt16LE(0, 34);
    record.writeUInt16LE(0, 36);
    // Unix mode in the high word: 0755 for a directory, 0644 for a file.
    record.writeUInt32LE(entry.isDir ? 0x41ed0010 : 0x81a40000, 38);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);

    offset += local.length + name.length + stored.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, directory, end]);
}

function zipDir(dir: string, outPath: string): void {
  writeFileSync(outPath, buildZip(collectEntries(dir)));
}

// Light walk just to assert tree exists
function _ensureFiles(): void {
  const seen: string[] = [];
  const walk = (p: string): void => {
    for (const name of readdirSync(p)) {
      const full = join(p, name);
      if (statSync(full).isDirectory()) walk(full);
      else seen.push(full);
    }
  };
  walk(DIST);
  if (seen.length === 0) throw new Error('dist is empty');
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
