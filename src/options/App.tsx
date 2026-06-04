import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { defaultSettings } from '~/shared/settings';
import { send } from '~/shared/messages';
import { I18nProvider } from '~/shared/i18nContext';
import { makeT, resolveUiLocale, isRtlLocale, UI_LOCALES, UI_LOCALE_NAMES } from '~/shared/i18n';
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

  const locale = resolveUiLocale(settings.uiLang);
  const t = useMemo(() => makeT(locale), [locale]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  }, [locale]);

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
    <I18nProvider value={t}>
    <div class="mx-auto max-w-3xl px-6 py-10">
      <header class="mb-6 flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-kick-primary text-kick-dark font-black text-xl">
          K
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Kick Chat Translator</h1>
          <p class="text-xs text-kick-muted">{t('v2 · options & preferences')}</p>
        </div>
        <div class="ml-auto flex items-center gap-3">
          {savedAt && <span class="text-xs text-kick-primary">{t('saved')}</span>}
          <select
            class="rounded border border-kick-border bg-transparent px-1.5 py-1 text-xs text-kick-text"
            value={settings.uiLang}
            onChange={(e) => void patch({ uiLang: (e.target as HTMLSelectElement).value as Settings['uiLang'] })}
            title="Language"
          >
            <option value="auto">Auto</option>
            {UI_LOCALES.map((l) => (
              <option key={l} value={l}>
                {UI_LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav class="mb-5 flex gap-1 border-b border-kick-border">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            class={`px-4 py-2 text-sm border-b-2 transition ${
              tab === tb.id
                ? 'border-kick-primary text-kick-text'
                : 'border-transparent text-kick-muted hover:text-kick-text'
            }`}
            onClick={() => setTab(tb.id)}
          >
            {t(tb.label)}
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
    </I18nProvider>
  );
}
