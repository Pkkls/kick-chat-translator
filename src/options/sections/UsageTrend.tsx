import type { UsageStats } from '~/shared/types';
import { useT } from '~/shared/i18nContext';

/**
 * Cache hit rate over the last week, and the languages seen most.
 *
 * This used to sit in the popup, where it cost 59px of a surface that already
 * overflowed by 69px — and neither answers the question a popup gets opened
 * for. Here there is room to actually read it.
 */
export function UsageTrend({ stats }: { stats: UsageStats }) {
  const t = useT();

  // Days with no traffic are never archived, so the trend skips them instead of
  // drawing an idle day as a 0% hit rate.
  const trend = [
    ...(stats.history ?? []),
    { day: stats.todayKey, requests: stats.totalRequests, cacheHits: stats.totalCacheHits },
  ]
    .filter((d) => d.requests > 0)
    .slice(-7);

  const topLangs = Object.entries(stats.byLang)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (trend.length <= 1 && topLangs.length === 0) return null;

  return (
    <section class="kt-card space-y-3">
      <h2 class="text-sm font-semibold">{t('Usage')}</h2>

      {trend.length > 1 && (
        <div>
          <div class="mb-1 text-[10px] uppercase tracking-wide text-kick-muted">
            {t('cache hit rate, last 7 days')}
          </div>
          <div class="flex h-10 items-end gap-1">
            {trend.map((d) => {
              const pct = Math.round((d.cacheHits / d.requests) * 100);
              return (
                <div
                  key={d.day}
                  class="min-h-[2px] flex-1 rounded-sm bg-kick-primary/70"
                  style={{ height: `${pct}%` }}
                  title={`${d.day}: ${pct}% (${d.requests})`}
                />
              );
            })}
          </div>
        </div>
      )}

      {topLangs.length > 0 && (
        <div>
          <div class="mb-1 text-[10px] uppercase tracking-wide text-kick-muted">
            {t('most translated languages')}
          </div>
          <div class="flex flex-wrap gap-1">
            {topLangs.map(([lang, count]) => (
              <span
                key={lang}
                class="rounded bg-kick-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-kick-muted"
              >
                {lang} {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
