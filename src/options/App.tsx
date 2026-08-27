import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { defaultSettings } from '~/shared/settings';
import { send } from '~/shared/messages';
import { I18nProvider } from '~/shared/i18nContext';
import { makeT, resolveUiLocale, isRtlLocale, UI_LOCALES, UI_LOCALE_NAMES } from '~/shared/i18n';
import type { ProviderStatus, UsageStats } from '~/shared/types';
import { ProviderSection } from './sections/ProviderSection';
import { DisplaySection } from './sections/DisplaySection';
import { FilterSection } from './sections/FilterSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { DebugSection } from './sections/DebugSection';
import { UsageTrend } from './sections/UsageTrend';
import { AboutSection } from './sections/AboutSection';

type Tab = 'providers' | 'display' | 'filters' | 'advanced' | 'debug' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'providers', label: 'Providers' },
  { id: 'display', label: 'Display' },
  { id: 'filters', label: 'Filters' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'debug', label: 'Debug' },
  { id: 'about', label: 'About' },
];

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [stats, setStats] = useState<UsageStats | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('providers');
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

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
    const statsRes = await send({ type: 'stats.get' });
    if (statsRes.type === 'stats') setStats(statsRes.payload);
  }

  /**
   * Arrow keys move between tabs, Home and End jump to the ends.
   *
   * Focus has to follow the selection, not just the state: the tab that was
   * focused is about to get tabIndex -1, and a browser drops focus to the body
   * when that happens. Moved on the next frame, once the new tab has rendered
   * with tabIndex 0.
   */
  function onTabKey(e: KeyboardEvent) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((x) => x.id === tab);
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? TABS.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    const id = TABS[next]!.id;
    setTab(id);
    requestAnimationFrame(() => tabRefs.current[id]?.focus());
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
            <h1 class="text-2xl font-bold tracking-tight">Kick Chat Translator</h1>
            <p class="text-xs text-kick-muted">
              v{chrome.runtime.getManifest().version} · {t('options & preferences')}
            </p>
          </div>
          <div class="ms-auto flex items-center gap-3">
            {savedAt && <span class="text-xs text-kick-primary">{t('saved')}</span>}
            <select
              class="rounded border border-kick-stroke bg-kick-surface px-1.5 py-1 text-xs text-kick-text"
              value={settings.uiLang}
              onChange={(e) =>
                void patch({ uiLang: (e.target as HTMLSelectElement).value as Settings['uiLang'] })
              }
              /* A title alone is not an accessible name a screen reader relies
               on; aria-label is. Kept in English on purpose: it names the
               control you use to leave a language you cannot read. */
              aria-label="Interface language"
              title="Interface language"
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

        {/* The APG tabs pattern, which this was missing entirely: without
            role=tab and aria-selected a screen reader announces six unrelated
            buttons and cannot say which one is showing. Roving tabindex keeps
            the whole bar to a single tab stop — it took five before — and the
            arrows move between tabs, which is where a keyboard user reaches
            for them. */}
        <nav
          role="tablist"
          aria-label={t('Settings sections')}
          class="kt-tabs mb-5 flex gap-1 overflow-x-auto border-b border-kick-border"
          onKeyDown={onTabKey}
        >
          {TABS.map((tb) => (
            <button
              key={tb.id}
              id={`tab-${tb.id}`}
              role="tab"
              aria-selected={tab === tb.id}
              aria-controls={`panel-${tb.id}`}
              tabIndex={tab === tb.id ? 0 : -1}
              ref={(el) => {
                tabRefs.current[tb.id] = el as HTMLButtonElement | null;
              }}
              class={`shrink-0 whitespace-nowrap px-4 py-2 text-sm border-b-2 transition ${
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

        <main
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          class="space-y-6 pb-12"
        >
          {tab === 'providers' && (
            <ProviderSection settings={settings} providers={providers} onPatch={patch} />
          )}
          {tab === 'display' && <DisplaySection settings={settings} onPatch={patch} />}
          {tab === 'filters' && <FilterSection settings={settings} onPatch={patch} />}
          {tab === 'advanced' && <AdvancedSection settings={settings} onPatch={patch} />}
          {tab === 'debug' && (
            <>
              {stats && <UsageTrend stats={stats} />}
              <DebugSection />
            </>
          )}
          {tab === 'about' && <AboutSection />}
        </main>
      </div>
    </I18nProvider>
  );
}
