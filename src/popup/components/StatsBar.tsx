import type { UsageStats } from '~/shared/types';

interface Props {
  stats: UsageStats;
}

export function StatsBar({ stats }: Props) {
  const hitRate = stats.totalRequests > 0 ? Math.round((stats.totalCacheHits / stats.totalRequests) * 100) : 0;
  const topLangs = Object.entries(stats.byLang)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div class="flex flex-col gap-2 pt-1">
      <div class="grid grid-cols-3 gap-2 text-center">
        <Stat label="requests" value={stats.totalRequests} />
        <Stat label="cache" value={`${hitRate}%`} />
        <Stat label="errors" value={stats.totalErrors} tone={stats.totalErrors > 0 ? 'warn' : 'mute'} />
      </div>
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
