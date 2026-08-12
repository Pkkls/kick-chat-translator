import { describe, expect, it } from 'vitest';
import type { UsageStats } from '~/shared/types';
import { archiveDay } from './stats';

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
