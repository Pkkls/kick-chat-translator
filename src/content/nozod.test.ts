import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * zod must not come back into the content script.
 *
 * It ran on every Kick page for one reason: the content script imported a value
 * from shared/settings.ts, and that module carries the schema runtime. Measured
 * on this tree when item 102 removed it, content.js went from 81.3 KB to 69.0 KB
 * gzipped, a 15.1% cut, for a validation pass over a blob this extension had just
 * written itself.
 *
 * The regression is silent and one character wide: changing `import type { Settings }`
 * to `import { Settings }` in any file the content script reaches puts all of it
 * back, and every test still passes. So the import graph is walked instead.
 */

const ENTRY = 'src/content/index.ts';
const BANNED = 'zod';

function resolveSpec(spec: string, fromFile: string): string | undefined {
  let base: string;
  if (spec.startsWith('~/')) base = resolve('src', spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
  else return undefined; // a bare package: not ours to walk into
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')]) {
    if (existsSync(cand) && !cand.endsWith('/')) {
      try {
        if (readFileSync(cand, 'utf8')) return cand;
      } catch {
        /* a directory, keep trying */
      }
    }
  }
  return undefined;
}

/** Files reachable from the entry through VALUE imports only. */
function valueGraph(entry: string): { files: Set<string>; offenders: string[] } {
  const files = new Set<string>();
  const offenders: string[] = [];
  const queue = [resolve(entry)];

  while (queue.length) {
    const file = queue.pop() as string;
    if (files.has(file)) continue;
    files.add(file);
    const source = readFileSync(file, 'utf8');

    for (const m of source.matchAll(/^\s*import\s+([\s\S]*?)\s*from\s*'([^']+)'/gm)) {
      const clause = m[1] ?? '';
      const spec = m[2] ?? '';
      // `import type { X } from` is erased by the compiler and costs nothing.
      if (/^type\b/.test(clause)) continue;
      if (spec === BANNED) {
        offenders.push(`${file.replace(/\\/g, '/')} imports ${BANNED} as a value`);
        continue;
      }
      const next = resolveSpec(spec, file);
      if (next) queue.push(next);
    }
  }
  return { files, offenders };
}

describe('content script dependency budget', () => {
  it('reaches no value import of zod', () => {
    const { files, offenders } = valueGraph(ENTRY);
    // Control: a walker that resolved nothing would report no offender either.
    expect(files.size, 'the import walk visited almost nothing; the resolver is broken').toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });

  it('still reaches the modules that make the check meaningful', () => {
    // Second control, naming files that must be in the graph. Without it, a walk
    // that stopped at the entry would satisfy the size check above on a big enough
    // entry file and prove nothing about the tree below it.
    const { files } = valueGraph(ENTRY);
    const names = [...files].map((f) => f.replace(/\\/g, '/'));
    for (const needed of ['src/content/pipeline.ts', 'src/content/injector.ts', 'src/shared/settingsClient.ts']) {
      expect(names.some((n) => n.endsWith(needed)), `${needed} is not in the walked graph`).toBe(true);
    }
  });

  it('confirms shared/settings.ts is where zod actually lives', () => {
    // If this fails, zod moved and the guard above is watching the wrong thing.
    expect(readFileSync('src/shared/settings.ts', 'utf8')).toContain(`from '${BANNED}'`);
  });
});
