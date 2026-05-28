import { useEffect, useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { defaultSettings } from '~/shared/settings';
import { LANGUAGES } from '~/shared/languages';
import { send } from '~/shared/messages';
import type { ProviderStatus, UsageStats } from '~/shared/types';
import { Toggle } from './components/Toggle';
import { ProviderPill } from './components/ProviderPill';
import { StatsBar } from './components/StatsBar';

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [stats, setStats] = useState<UsageStats | undefined>(undefined);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, []);

  async function refresh() {
    const settingsRes = await send({ type: 'settings.get' });
    if (settingsRes.type === 'settings') setSettings(settingsRes.payload);
    const statsRes = await send({ type: 'stats.get' });
    if (statsRes.type === 'stats') setStats(statsRes.payload);
    const provRes = await send({ type: 'providers.status' });
    if (provRes.type === 'providers') setProviders(provRes.payload);
  }

  async function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next: Partial<Settings> = { [key]: value } as Partial<Settings>;
    const res = await send({ type: 'settings.set', payload: next });
    if (res.type === 'settings') {
      setSettings(res.payload);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(undefined), 1500);
    }
  }

  function openOptions() {
    void chrome.runtime.openOptionsPage();
  }

  return (
    <div class="flex flex-col gap-3 p-4">
      <header class="flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded bg-kick-primary text-kick-dark font-black text-sm">
          K
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-kick-text">Kick Translator</span>
          <span class="text-[10px] text-kick-muted">v2 · {savedAt ? 'saved' : 'ready'}</span>
        </div>
        <div class="ml-auto">
          <Toggle
            checked={settings.enabled}
            onChange={(v) => void patch('enabled', v)}
            label="enable"
          />
        </div>
      </header>

      <section class="kt-card flex flex-col gap-2">
        <label class="kt-label">Target language</label>
        <select
          class="kt-select"
          value={settings.targetLang}
          onChange={(e) => void patch('targetLang', (e.target as HTMLSelectElement).value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label} ({l.native})
            </option>
          ))}
        </select>

        <div class="flex gap-2">
          <div class="flex-1">
            <label class="kt-label mb-1 block">Display</label>
            <select
              class="kt-select"
              value={settings.displayStyle}
              onChange={(e) =>
                void patch('displayStyle', (e.target as HTMLSelectElement).value as Settings['displayStyle'])
              }
            >
              <option value="below">Below original</option>
              <option value="inline">Inline</option>
              <option value="replace">Replace</option>
              <option value="hover">Hover (on demand)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <Toggle
            checked={settings.showOriginal}
            onChange={(v) => void patch('showOriginal', v)}
            label="keep original"
          />
          <Toggle
            checked={settings.showSourceBadge}
            onChange={(v) => void patch('showSourceBadge', v)}
            label="lang badge"
          />
        </div>
      </section>

      <section class="kt-card flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="kt-label">Providers</span>
          <span class="text-[10px] text-kick-muted">order in options</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {providers.map((p) => (
            <ProviderPill key={p.id} status={p} />
          ))}
        </div>
      </section>

      {settings.popupShowsStats && stats && (
        <section class="kt-card">
          <span class="kt-label">Today</span>
          <StatsBar stats={stats} />
        </section>
      )}

      <footer class="flex items-center justify-between gap-2">
        <button
          class="kt-btn-ghost"
          onClick={() => {
            send({ type: 'cache.clear' }).catch(() => undefined);
          }}
        >
          Clear cache
        </button>
        <button class="kt-btn" onClick={openOptions}>
          Options
        </button>
      </footer>
    </div>
  );
}
