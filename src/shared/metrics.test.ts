import { describe, expect, it } from 'vitest';
import { createMetrics, summarize } from './metrics';

describe('summarize', () => {
  it('reports an empty reservoir as absent rather than instant', () => {
    expect(summarize([])).toEqual({ n: 0, min: 0, p50: 0, p95: 0, max: 0, mean: 0 });
  });

  it('picks percentiles out of an unsorted reservoir', () => {
    const s = summarize([50, 10, 90, 30, 70]);
    expect(s.n).toBe(5);
    expect(s.min).toBe(10);
    expect(s.max).toBe(90);
    expect(s.p50).toBe(50);
    expect(s.mean).toBe(50);
  });

  it('keeps p95 near the tail so one timeout is visible', () => {
    const samples = [...Array(19).fill(20), 4000];
    const s = summarize(samples);
    expect(s.p50).toBe(20);
    expect(s.p95).toBe(4000);
    // A tail that the median cannot see is the whole reason p95 is recorded.
    expect(s.p50).toBeLessThan(s.p95);
  });
});

describe('createMetrics', () => {
  /**
   * The load-bearing test of this module.
   *
   * Release builds get the NOOP sink, and `measure` wraps every provider call in
   * the translation chain. A NOOP that forgot to invoke its callback would not
   * fail a type check and would not fail any other test: it would ship an
   * extension that silently translates nothing.
   */
  it('still runs the work it was asked to time', async () => {
    const m = createMetrics('sw');
    let ran = false;
    const out = await m.measure('probe', async () => {
      ran = true;
      return 'translated';
    });
    expect(ran).toBe(true);
    expect(out).toBe('translated');
  });

  it('lets a failure through instead of swallowing it', async () => {
    const m = createMetrics('sw');
    await expect(m.measure('probe', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });

  it('accepts counters and timings without a storage backend', () => {
    // Reaching this line at all proves __KT_METRICS__ is defined under vitest:
    // an undefined build constant throws ReferenceError inside createMetrics.
    const m = createMetrics('content');
    expect(() => {
      m.count('probe');
      m.timing('probe', 12);
    }).not.toThrow();
  });
});
