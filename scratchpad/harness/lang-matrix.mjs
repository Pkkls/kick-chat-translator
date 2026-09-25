/**
 * Write the cross-language detection report.
 *
 *   npx tsx scratchpad/harness/lang-matrix.mjs
 *
 * Needs tsx rather than plain node because it imports `src/content/langDetect.ts`
 * and its `~/` aliases. `shlyokavitsa.mjs` in this folder does the same.
 *
 * It computes nothing of its own: the scoring lives in `src/content/langMatrix.ts`
 * and is shared with `src/content/langMatrix.test.ts`, so the report and the
 * assertions can never disagree. This file only chooses where the output lands.
 *
 * The test is what runs in CI. This is what you read.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { confidentRun, detectRun, report } from '../../src/content/langMatrix.ts';

const stamp = new Date().toISOString().slice(0, 10);
const text = report(confidentRun(), detectRun(), stamp);
const dest = fileURLToPath(new URL('./lang-matrix.md', import.meta.url));
writeFileSync(dest, text, 'utf8');

// Enough on stdout to know it worked without opening the file.
const head = text.split('\n').filter((l) => l.startsWith('| all lines') || l.startsWith('| short only'));
console.log(`wrote ${dest}`);
console.log(head.join('\n'));
