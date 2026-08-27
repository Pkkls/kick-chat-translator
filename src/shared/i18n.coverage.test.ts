import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import keys from './i18n/keys.json';

/**
 * Every literal handed to t() must be a canonical key.
 *
 * The suite already checked the other direction — each catalog covers exactly
 * keys.json — which meant a brand new t('...') was perfectly green while
 * rendering its English source text in all nine languages. Nine strings had
 * drifted through that gap before this ran: the tab bar's own label, the
 * language filter, its empty state, the three provider row buttons, the chip
 * toggle, and both usage headings.
 *
 * Only literals are checked. `t(tb.label)` resolves at runtime and cannot be
 * read from the source, so it is skipped rather than guessed at.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'i18n' ? [] : sources(path);
    if (!/\.tsx?$/.test(name) || name.includes('.test.')) return [];
    return [path];
  });
}

// t( then a quote, then everything up to the matching quote, escapes allowed.
const CALL = /\bt\(\s*(['"])((?:[^'"\\]|\\.)*?)\1/g;

describe('i18n coverage', () => {
  const canonical = new Set(keys as string[]);
  const literals = new Map<string, string>();
  for (const file of sources('src')) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(CALL)) {
      literals.set(m[2]!.replace(/\\'/g, "'"), file);
    }
  }

  it('finds the calls at all, so an empty scan cannot pass as a clean one', () => {
    // Without this, a broken pattern reports zero literals and zero misses.
    expect(literals.size).toBeGreaterThan(100);
  });

  it('has a canonical key for every literal passed to t()', () => {
    const missing = [...literals]
      .filter(([k]) => !canonical.has(k))
      .map(([k, f]) => `${k}  <- ${f}`);
    expect(missing).toEqual([]);
  });
});
