/**
 * Fail the build if instrumentation reached a bundle that ships.
 *
 * shared/metrics.ts selects its sink with `__KT_METRICS__ ? live : NOOP`, a
 * constant vite folds at build time. That is a claim about esbuild's dead-code
 * elimination, and an unverified claim about a privacy boundary is worth nothing:
 * this asserts it against the actual output.
 *
 * Both directions are checked, because a gate that can only pass is not a gate.
 * On a release build the marker must be ABSENT. On `build:metrics` it must be
 * PRESENT, which is the control: if the instrumented build were also clean, the
 * absence in the release build would prove nothing except that the sink is dead
 * everywhere.
 *
 * Run automatically at the end of `npm run build` and `npm run build:metrics`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Duplicated from shared/metrics.ts rather than imported: importing it would run
// the module, which needs the __KT_METRICS__ global that only exists inside a
// vite build. The metrics test asserts the constant still equals this string.
const MARKER = 'kt.metrics.v1';
const DIST = 'dist';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

function main(): void {
  const instrumented = process.env.KT_METRICS === '1';

  let files: string[];
  try {
    files = walk(DIST);
  } catch {
    console.error(`[check-strip] no ${DIST}/ to check. Run a build first.`);
    process.exit(1);
  }

  const hits = files.filter((f) => readFileSync(f, 'utf8').includes(MARKER)).map((f) => relative(DIST, f));

  if (instrumented) {
    if (hits.length === 0) {
      console.error(
        `[check-strip] CONTROL FAILED: an instrumented build carries no "${MARKER}".\n` +
          `  The sink was stripped from the build that is supposed to keep it, so the\n` +
          `  release check below proves nothing. Look at the define in vite.config.ts.`,
      );
      process.exit(1);
    }
    // "Present somewhere" is too weak a control, and it already passed once while
    // half the instrumentation was dead: the service worker kept its sink, the
    // content script did not, and every page-side measurement recorded nothing.
    // The two bundles are produced by two separate vite passes, so each one has to
    // be named or the failure of either hides behind the other.
    const normalized = hits.map((h) => h.replace(/\\/g, '/'));
    for (const required of ['assets/content.js']) {
      if (!normalized.includes(required)) {
        console.error(
          `[check-strip] CONTROL FAILED: "${MARKER}" is missing from ${required}.\n` +
            `  Found instead in: ${normalized.join(', ') || '(nothing)'}\n` +
            `  That bundle comes from scripts/bundle-content.ts, which runs as its own\n` +
            `  vite pass with configFile:false. Check that KT_METRICS reaches it.`,
        );
        process.exit(1);
      }
    }
    console.log(`[check-strip] instrumented build, marker present in ${hits.length} file(s): ${normalized.join(', ')}`);
    return;
  }

  if (hits.length > 0) {
    console.error(
      `[check-strip] RELEASE BUILD CARRIES INSTRUMENTATION: "${MARKER}" found in\n` +
        hits.map((h) => `  - ${h}`).join('\n') +
        `\n  This bundle must not ship. Something references LiveMetrics outside the\n` +
        `  __KT_METRICS__ ternary, so esbuild could not drop it.`,
    );
    process.exit(1);
  }

  console.log(`[check-strip] release build clean: no "${MARKER}" in ${files.length} bundled file(s).`);
}

main();
