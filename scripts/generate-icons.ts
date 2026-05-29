import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ICONS_DIR = resolve(ROOT, 'public/icons');
const SVG_PATH = resolve(ICONS_DIR, 'icon.svg');
const SIZES = [16, 32, 48, 128];

async function main(): Promise<void> {
  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true });
  if (!existsSync(SVG_PATH)) {
    await writeFile(SVG_PATH, DEFAULT_SVG);
    console.info(`Wrote default ${SVG_PATH}`);
  }
  const svg = await readFile(SVG_PATH);
  for (const size of SIZES) {
    const out = resolve(ICONS_DIR, `icon${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.info(`Wrote ${out}`);
  }
}

const DEFAULT_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="0" y="0" width="128" height="128" rx="22" fill="#0a0e12"/>
  <path d="M30 30 L30 98 L48 98 L48 76 L58 76 L78 98 L100 98 L72 66 L98 30 L78 30 L58 56 L48 56 L48 30 Z" fill="#53fc18"/>
  <circle cx="100" cy="36" r="8" fill="#53fc18"/>
</svg>
`;

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
