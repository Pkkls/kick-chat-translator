import { send } from '~/shared/messages';
import type { UsageCounter, UsageCounts } from '~/shared/usage';
import { refresh7TV } from './platform';

/**
 * The page's half of the opt-in usage statistics: counts in memory and hands
 * them to the worker at most once a minute, and when the page goes away.
 * Counts nothing at all without consent.
 */

const FLUSH_MS = 60_000;
let enabled = false;
let counts: UsageCounts = {};
let timer: ReturnType<typeof setTimeout> | undefined;

export function setUsageEnabled(on: boolean): void {
  enabled = on;
  if (!on) counts = {};
}

export function countUsage(k: UsageCounter): void {
  if (!enabled) return;
  counts[k] = (counts[k] ?? 0) + 1;
  timer ??= setTimeout(flush, FLUSH_MS);
}

function flush(): void {
  timer = undefined;
  if (!enabled || Object.keys(counts).length === 0) return;
  const batch = counts;
  counts = {};
  void send({
    type: 'usage.add',
    counts: batch,
    env: { has7tv: refresh7TV(), localApi: 'Translator' in self },
  }).catch(() => undefined);
}

addEventListener('pagehide', flush);
