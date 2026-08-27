import { describe, expect, it } from 'vitest';
import { render } from 'preact';
import type { UsageStats } from '~/shared/types';
import { StatsBar } from './StatsBar';

function makeStats(over: Partial<UsageStats> = {}): UsageStats {
  return {
    totalRequests: 0,
    totalCacheHits: 0,
    totalErrors: 0,
    byProvider: {},
    byLang: {},
    byChannel: {},
    charsSent: 0,
    todayKey: '2026-08-13',
    ...over,
  };
}

let host: HTMLDivElement | undefined;

function mount(stats: UsageStats): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  render(<StatsBar stats={stats} />, host);
  return host;
}

describe('StatsBar', () => {
  it('shows the three numbers a popup is opened to check', () => {
    const el = mount(makeStats({ totalRequests: 120, totalCacheHits: 30, totalErrors: 2 }));
    expect(el.textContent).toContain('120');
    expect(el.textContent).toContain('25%');
    expect(el.textContent).toContain('2');
  });

  it('reads 0% rather than NaN before anything has been translated', () => {
    const el = mount(makeStats());
    expect(el.textContent).toContain('0%');
    expect(el.textContent).not.toContain('NaN');
  });

  // The sparkline and the per-language pills moved to the Options page, where
  // there is room to read them; the popup overflowed by 69px with them in it.
  // Their tests moved with them, to options/sections/UsageTrend.test.tsx.
  it('draws no chart: the popup is for acting, not for contemplating', () => {
    const el = mount(makeStats({
      totalRequests: 10,
      totalCacheHits: 5,
      byLang: { ko: 4 },
      history: [{ day: '2026-08-11', requests: 10, cacheHits: 5 }],
    }));
    expect(el.querySelectorAll('[title]')).toHaveLength(0);
  });
});
