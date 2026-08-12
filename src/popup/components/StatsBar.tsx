import type { UsageStats } from '~/shared/types';
import { useT } from '~/shared/i18nContext';

interface Props {
  stats: UsageStats;
}

export function StatsBar({ stats }: Props) {
  const t = useT();
  const hitRate = stats.totalRequests > 0 ? Math.round((stats.totalCacheHits / stats.totalRequests) * 100) : 0;
  const topLangs = Object.entries(stats.byLang)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  // Days with no traffic are never archived, so the trend skips them instead of
  // drawing an idle day as a 0% hit rate.
  const trend = [
    ...(stats.history ?? []),
    { day: stats.todayKey, requests: stats.totalRequests, cacheHits: stats.totalCacheHits },
  ]
    .filter((d) => d.requests > 0)
    .slice(-7);

  return (
    <div class="flex flex-col gap-2 pt-1">
      <div class="grid grid-cols-3 gap-2 text-center">
        <Stat label={t('requests')} value={stats.totalRequests} />
        <Stat label={t('cache')} value={`${hitRate}%`} />
        <Stat label={t('errors')} value={stats.totalErrors} tone={stats.totalErrors > 0 ? 'warn' : 'mute'} />
      </div>
      {trend.length > 1 && (
        <div class="pt-1">
          <div class="mb-1 text-[10px] uppercase tracking-wide text-kick-muted">
            {t('cache hit rate, last 7 days')}
          </div>
          <div class="flex h-8 items-end gap-1">
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
        <div class="flex flex-wrap gap-1 pt-1">
          {topLangs.map(([lang, count]) => (
            <span key={lang} class="rounded bg-kick-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-kick-muted">
              {lang} {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'normal' }: { label: string; value: number | string; tone?: 'normal' | 'warn' | 'mute' }) {
  const color = tone === 'warn' ? 'text-red-300' : tone === 'mute' ? 'text-kick-muted' : 'text-kick-text';
  return (
    <div class="flex flex-col">
      <span class={`text-base font-semibold ${color}`}>{value}</span>
      <span class="text-[10px] uppercase tracking-wide text-kick-muted">{label}</span>
    </div>
  );
}
