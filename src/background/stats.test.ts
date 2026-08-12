import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UsageStats } from '~/shared/types';
import { STORAGE_KEY_STATS } from '~/shared/constants';
import { archiveDay, StatsTracker } from './stats';

function day(todayKey: string, totalRequests: number, totalCacheHits: number, history?: UsageStats['history']): UsageStats {
  return {
    totalRequests,
    totalCacheHits,
    totalErrors: 0,
    byProvider: {},
    byLang: {},
    byChannel: {},
    charsSent: 0,
    todayKey,
    history,
  };
}

function stubStorage(initial: Record<string, unknown>): void {
  const store: Record<string, unknown> = { ...initial };
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: (key: string) => Promise.resolve(key in store ? { [key]: store[key] } : {}),
        set: (obj: Record<string, unknown>) => {
          Object.assign(store, obj);
          return Promise.resolve();
        },
      },
    },
  });
}

describe('StatsTracker.load', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The worker is normally restarted after midnight rather than kept alive across
  // the rollover, so this is the path that actually retains a day.
  it('archives the stored day when it loads on a later date', async () => {
    stubStorage({ [STORAGE_KEY_STATS]: day('2020-01-01', 10, 4) });

    const state = await new StatsTracker().load();

    expect(state.todayKey).not.toBe('2020-01-01');
    expect(state.totalRequests).toBe(0);
    expect(state.history).toEqual([{ day: '2020-01-01', requests: 10, cacheHits: 4 }]);
  });

  it('keeps an unfinished day and tolerates a record without history', async () => {
    const today = new Date().toISOString().slice(0, 10);
    stubStorage({ [STORAGE_KEY_STATS]: day(today, 7, 3) });

    const state = await new StatsTracker().load();

    expect(state.totalRequests).toBe(7);
    expect(state.history).toEqual([]);
  });

  it('starts clean when nothing is stored yet', async () => {
    stubStorage({});

    const state = await new StatsTracker().load();

    expect(state.totalRequests).toBe(0);
    expect(state.history).toEqual([]);
  });
});

describe('archiveDay', () => {
  it('appends the finished day, newest last', () => {
    const out = archiveDay(day('2026-08-11', 10, 4, [{ day: '2026-08-10', requests: 5, cacheHits: 1 }]));
    expect(out).toEqual([
      { day: '2026-08-10', requests: 5, cacheHits: 1 },
      { day: '2026-08-11', requests: 10, cacheHits: 4 },
    ]);
  });

  it('drops a day with no traffic instead of storing it as 0%', () => {
    const prior = [{ day: '2026-08-10', requests: 5, cacheHits: 1 }];
    expect(archiveDay(day('2026-08-11', 0, 0, prior))).toEqual(prior);
  });

  it('tolerates a record stored before history existed', () => {
    expect(archiveDay(day('2026-08-11', 3, 2))).toEqual([{ day: '2026-08-11', requests: 3, cacheHits: 2 }]);
  });

  it('keeps only the most recent days', () => {
    const prior = Array.from({ length: 7 }, (_, i) => ({
      day: `2026-08-0${i + 1}`,
      requests: 1,
      cacheHits: 0,
    }));
    const out = archiveDay(day('2026-08-11', 9, 9, prior), 7);
    expect(out).toHaveLength(7);
    expect(out[0]?.day).toBe('2026-08-02');
    expect(out[6]?.day).toBe('2026-08-11');
  });

  it('does not duplicate a day already present in history', () => {
    const prior = [{ day: '2026-08-11', requests: 2, cacheHits: 1 }];
    const out = archiveDay(day('2026-08-11', 8, 5, prior));
    expect(out).toEqual([{ day: '2026-08-11', requests: 8, cacheHits: 5 }]);
  });
});
