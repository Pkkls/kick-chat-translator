import { useEffect, useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { defaultSettings } from '~/shared/settings';
import { send } from '~/shared/messages';
import type { ProviderStatus } from '~/shared/types';
import { ProviderSection } from './sections/ProviderSection';
import { DisplaySection } from './sections/DisplaySection';
import { FilterSection } from './sections/FilterSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { AboutSection } from './sections/AboutSection';

type Tab = 'providers' | 'display' | 'filters' | 'advanced' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'providers', label: 'Providers' },
  { id: 'display', label: 'Display' },
  { id: 'filters', label: 'Filters' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'about', label: 'About' },
];

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [tab, setTab] = useState<Tab>('providers');
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, []);

  async function refresh() {
    const settingsRes = await send({ type: 'settings.get' });
    if (settingsRes.type === 'settings') setSettings(settingsRes.payload);
    const provRes = await send({ type: 'providers.status' });
    if (provRes.type === 'providers') setProviders(provRes.payload);
  }

  async function patch(patchValue: Partial<Settings>) {
    const res = await send({ type: 'settings.set', payload: patchValue });
    if (res.type === 'settings') {
      setSettings(res.payload);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(undefined), 1500);
    }
  }

  return (
    <div class="mx-auto max-w-3xl px-6 py-10">
      <header class="mb-6 flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-kick-primary text-kick-dark font-black text-xl">
          K
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Kick Chat Translator</h1>
          <p class="text-xs text-kick-muted">v2 · options & preferences</p>
        </div>
        {savedAt && <span class="ml-auto text-xs text-kick-primary">saved</span>}
      </header>

      <nav class="mb-5 flex gap-1 border-b border-kick-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            class={`px-4 py-2 text-sm border-b-2 transition ${
              tab === t.id
                ? 'border-kick-primary text-kick-text'
                : 'border-transparent text-kick-muted hover:text-kick-text'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main class="space-y-6 pb-12">
        {tab === 'providers' && <ProviderSection settings={settings} providers={providers} onPatch={patch} />}
        {tab === 'display' && <DisplaySection settings={settings} onPatch={patch} />}
        {tab === 'filters' && <FilterSection settings={settings} onPatch={patch} />}
        {tab === 'advanced' && <AdvancedSection settings={settings} onPatch={patch} />}
        {tab === 'about' && <AboutSection />}
      </main>
    </div>
  );
}
