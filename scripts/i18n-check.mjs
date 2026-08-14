// i18n reconciliation check.
// 1. Extracts t('...') / t("...") literal keys used across the wired UI files.
// 2. Flags any code key absent from keys.json (would render English in EVERY locale).
// 3. Reports per-locale coverage vs keys.json (missing => English fallback; extra => typo/unused).
// Run: node scripts/i18n-check.mjs   (exit 1 if a code key is missing from keys.json)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const keys = JSON.parse(readFileSync(join(root, 'src/shared/i18n/keys.json'), 'utf8'));
const keySet = new Set(keys);
const unesc = (s) => s.replace(/\\(['"\\])/g, '$1');

const codeFiles = [
  'src/options/App.tsx',
  'src/popup/App.tsx',
  'src/popup/components/ProviderPill.tsx',
  'src/popup/components/StatsBar.tsx',
  'src/options/sections/AboutSection.tsx',
  'src/options/sections/AdvancedSection.tsx',
  'src/options/sections/DisplaySection.tsx',
  'src/options/sections/EngineCard.tsx',
  'src/options/sections/FilterSection.tsx',
  'src/options/sections/ProviderSection.tsx',
];

const tRe = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/g;
const codeKeys = new Set();
for (const f of codeFiles) {
  const s = readFileSync(join(root, f), 'utf8');
  let m;
  while ((m = tRe.exec(s))) codeKeys.add(unesc(m[2]));
}
const codeMissing = [...codeKeys].filter((k) => !keySet.has(k));

// Kept in step with UI_LOCALES in src/shared/i18n.ts, minus 'en' which needs no
// catalogue because the key is the message. A locale missing from this list is
// never checked, so it can drift out of date without anything saying so.
const locales = ['ja', 'fr', 'zh', 'ar', 'ru', 'pt', 'es', 'tr', 'ko'];
const keyLineRe = /^\s*"((?:\\.|[^"\\])*)"\s*:/;
const report = {};
for (const loc of locales) {
  const s = readFileSync(join(root, `src/shared/i18n/${loc}.ts`), 'utf8');
  const lk = new Set();
  for (const line of s.split('\n')) {
    const m = line.match(keyLineRe);
    if (m) lk.add(unesc(m[1]));
  }
  report[loc] = {
    entries: lk.size,
    missing: keys.filter((k) => !lk.has(k)),
    extra: [...lk].filter((k) => !keySet.has(k)),
  };
}

console.log('Canonical keys.json:', keys.length);
console.log('CODE t() literal keys :', codeKeys.size);
console.log('CODE keys NOT in keys.json (English in every locale):', codeMissing.length);
codeMissing.forEach((k) => console.log('   x', JSON.stringify(k)));
console.log('\nPer-locale coverage (vs keys.json):');
for (const loc of locales) {
  const r = report[loc];
  console.log(`  ${loc}: ${r.entries} keys | missing ${r.missing.length} | extra ${r.extra.length}`);
  r.missing.slice(0, 8).forEach((k) => console.log('       missing:', JSON.stringify(k)));
  r.extra.slice(0, 8).forEach((k) => console.log('       extra  :', JSON.stringify(k)));
}

process.exit(codeMissing.length > 0 ? 1 : 0);
