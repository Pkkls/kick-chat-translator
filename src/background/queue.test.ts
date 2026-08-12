import { describe, expect, it, vi } from 'vitest';
import { ConcurrencyQueue, TokenBucket } from './queue';

describe('ConcurrencyQueue', () => {
  it('limits parallelism to N at a time', async () => {
    const q = new ConcurrencyQueue(2);
    let active = 0;
    let max = 0;
    const tasks: Promise<unknown>[] = [];
    for (let i = 0; i < 6; i++) {
      tasks.push(
        q.add(async () => {
          active += 1;
          if (active > max) max = active;
          await new Promise((r) => setTimeout(r, 10));
          active -= 1;
          return i;
        }),
      );
    }
    const results = await Promise.all(tasks);
    expect(results).toHaveLength(6);
    expect(max).toBeLessThanOrEqual(2);
  });

  it('rejections propagate', async () => {
    const q = new ConcurrencyQueue(1);
    await expect(q.add(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });
});

describe('TokenBucket', () => {
  it('grants up to capacity tokens then refuses', () => {
    const b = new TokenBucket(3, 0);
    expect(b.tryTake()).toBe(true);
    expect(b.tryTake()).toBe(true);
    expect(b.tryTake()).toBe(true);
    expect(b.tryTake()).toBe(false);
  });

  // Fake timers, not a real sleep: this bucket regains a token every 10ms, so on a
  // busy machine enough wall time could pass between the first two calls for the
  // refusal to refill and the assertion to flip.
  it('refills over time', () => {
    vi.useFakeTimers();
    try {
      const b = new TokenBucket(1, 6000); // 6000/min = 100/s
      expect(b.tryTake()).toBe(true);
      expect(b.tryTake()).toBe(false);
      vi.advanceTimersByTime(50);
      expect(b.tryTake()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
