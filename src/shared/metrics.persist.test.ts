import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMetrics, readAllMetrics } from './metrics';

/**
 * Metrics must survive the process that recorded them.
 *
 * In MV3 the service worker is killed whenever it goes idle, so its sink is
 * rebuilt empty over and over. The first version of this module wrote a fresh
 * snapshot with `set` on every flush, which meant each restart erased everything
 * before it. Measured after a full night of collection: eight hours of samples
 * had become the forty seconds since the last restart.
 *
 * These tests drive the sink through simulated restarts, because that is the only
 * thing that separates a sink which accumulates from one which merely appears to.
 */

function fakeChrome() {
  const local = new Map<string, unknown>();
  return {
    local,
    api: {
      storage: {
        local: {
          get: (k: string | string[]) => {
            const keys = Array.isArray(k) ? k : [k];
            const out: Record<string, unknown> = {};
            for (const key of keys) if (local.has(key)) out[key] = local.get(key);
            return Promise.resolve(out);
          },
          set: (o: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(o)) local.set(k, v);
            return Promise.resolve();
          },
          remove: (k: string) => {
            local.delete(k);
            return Promise.resolve();
          },
        },
      },
    },
  };
}

let env: ReturnType<typeof fakeChrome>;

beforeEach(() => {
  env = fakeChrome();
  vi.stubGlobal('chrome', env.api);
  vi.stubGlobal('__KT_METRICS__', true);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Run the debounced flush and let its promise settle. */
async function settle(): Promise<void> {
  await vi.runAllTimersAsync();
}

/** A worker restart: the module cache and the memoised sink go, storage stays. */
async function restart(): Promise<typeof import('./metrics')> {
  vi.resetModules();
  return import('./metrics');
}

describe('metrics survive a restart', () => {
  it('adds counters across two lives instead of replacing them', async () => {
    createMetrics('sw').count('probe', 3);
    await settle();

    const second = await restart();
    second.createMetrics('sw').count('probe', 4);
    await settle();

    const [snap] = await second.readAllMetrics();
    expect(snap?.counts.probe).toBe(7);
  });

  it('keeps timing samples from the earlier life', async () => {
    const first = createMetrics('sw');
    first.timing('lat', 100);
    first.timing('lat', 200);
    await settle();

    const second = await restart();
    second.createMetrics('sw').timing('lat', 300);
    await settle();

    const [snap] = await second.readAllMetrics();
    expect(snap?.timings.lat?.n).toBe(3);
    expect(snap?.timings.lat?.max).toBe(300);
    expect(snap?.timings.lat?.min).toBe(100);
  });

  it('keeps the earliest start, because `since` describes the record', async () => {
    createMetrics('sw').count('probe');
    await settle();
    const firstSince = (await readAllMetrics())[0]?.since;

    vi.setSystemTime(Date.now() + 60_000);
    const second = await restart();
    second.createMetrics('sw').count('probe');
    await settle();

    expect((await second.readAllMetrics())[0]?.since).toBe(firstSince);
  });

  it('does not re-add what it already handed to storage', async () => {
    // The trap in the merge: flushing twice without clearing memory would fold the
    // same counters in again, and a long session would inflate geometrically.
    const m = createMetrics('sw');
    m.count('probe', 5);
    await settle();
    m.count('probe', 1);
    await settle();

    expect((await readAllMetrics())[0]?.counts.probe).toBe(6);
  });

  it('keeps the two scopes apart', async () => {
    createMetrics('sw').count('probe', 2);
    createMetrics('content').count('probe', 9);
    await settle();

    const all = await readAllMetrics();
    expect(all.find((s) => s.scope === 'sw')?.counts.probe).toBe(2);
    expect(all.find((s) => s.scope === 'content')?.counts.probe).toBe(9);
  });
});
