import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';
import type { UsageStats } from '~/shared/types';
import { UsageTrend } from './UsageTrend';

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
  render(<UsageTrend stats={stats} />, host);
  return host;
}

/** The sparkline bars are the only elements carrying a title. */
function bars(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll('[title]')] as HTMLElement[];
}

describe('UsageTrend sparkline', () => {
  afterEach(() => {
    if (host) {
      render(null, host);
      host.remove();
      host = undefined;
    }
  });

  it('shows no trend until two days have been recorded', () => {
    const el = mount(makeStats({ totalRequests: 10, totalCacheHits: 5 }));
    expect(bars(el)).toHaveLength(0);
  });

  it('draws one bar per recorded day, today included', () => {
    const el = mount(
      makeStats({
        totalRequests: 4,
        totalCacheHits: 1,
        history: [
          { day: '2026-08-11', requests: 10, cacheHits: 5 },
          { day: '2026-08-12', requests: 20, cacheHits: 19 },
        ],
      }),
    );
    const titles = bars(el).map((b) => b.getAttribute('title'));
    expect(titles).toEqual(['2026-08-11: 50% (10)', '2026-08-12: 95% (20)', '2026-08-13: 25% (4)']);
  });

  it('sizes each bar by that day hit rate', () => {
    const el = mount(
      makeStats({
        totalRequests: 4,
        totalCacheHits: 3,
        history: [{ day: '2026-08-12', requests: 10, cacheHits: 1 }],
      }),
    );
    expect(bars(el).map((b) => b.style.height)).toEqual(['10%', '75%']);
  });

  it('skips days with no traffic rather than drawing them as 0%', () => {
    const el = mount(
      makeStats({
        totalRequests: 6,
        totalCacheHits: 3,
        history: [
          { day: '2026-08-10', requests: 8, cacheHits: 4 },
          { day: '2026-08-11', requests: 0, cacheHits: 0 },
        ],
      }),
    );
    const titles = bars(el).map((b) => b.getAttribute('title'));
    expect(titles).toEqual(['2026-08-10: 50% (8)', '2026-08-13: 50% (6)']);
  });

  it('keeps a real 0% day visible instead of collapsing it', () => {
    const el = mount(
      makeStats({
        totalRequests: 5,
        totalCacheHits: 0,
        history: [{ day: '2026-08-12', requests: 9, cacheHits: 9 }],
      }),
    );
    const today = bars(el).at(-1)!;
    expect(today.getAttribute('title')).toBe('2026-08-13: 0% (5)');
    expect(today.className).toContain('min-h-');
  });

  it('shows at most seven days', () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      day: `2026-07-${String(i + 1).padStart(2, '0')}`,
      requests: 10,
      cacheHits: i,
    }));
    const el = mount(makeStats({ totalRequests: 2, totalCacheHits: 1, history }));
    expect(bars(el)).toHaveLength(7);
  });

  // One day is not a trend, and with no languages either there is nothing to
  // show — the section removes itself rather than drawing an empty frame.
  it('renders nothing at all when there is neither a trend nor a language', () => {
    const el = mount(makeStats({ totalRequests: 3, totalCacheHits: 1 }));
    expect(bars(el)).toHaveLength(0);
    expect(el.textContent?.trim()).toBe('');
  });

  it('still shows the languages when there is only one day of history', () => {
    const el = mount(makeStats({ totalRequests: 3, totalCacheHits: 1, byLang: { ko: 12 } }));
    expect(bars(el)).toHaveLength(0);
    expect(el.textContent).toContain('ko');
  });
});
