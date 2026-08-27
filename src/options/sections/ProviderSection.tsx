import type { CloudProviderId, Settings } from '~/shared/settings';
import type { ProviderStatus } from '~/shared/types';
import { useT } from '~/shared/i18nContext';
import { Check } from '../components/Check';
import { EngineCard } from './EngineCard';

const PROVIDER_LABELS: Record<CloudProviderId, string> = {
  google: 'Google Translate (free, no key)',
  deepl: 'DeepL (best quality, needs key)',
  mymemory: 'MyMemory (free, ~1000/day)',
  lingva: 'Lingva (LibreTranslate front, configurable)',
};

interface Props {
  settings: Settings;
  providers: ProviderStatus[];
  onPatch: (p: Partial<Settings>) => void;
}

export function ProviderSection({ settings, providers, onPatch }: Props) {
  const t = useT();

  function move(id: CloudProviderId, dir: -1 | 1) {
    const order = [...settings.providerOrder];
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= order.length) return;
    const tmp = order[idx];
    const other = order[swap];
    if (tmp === undefined || other === undefined) return;
    order[idx] = other;
    order[swap] = tmp;
    onPatch({ providerOrder: order });
  }

  function toggle(id: CloudProviderId) {
    const order = [...settings.providerOrder];
    const idx = order.indexOf(id);
    if (idx >= 0) order.splice(idx, 1);
    else order.push(id);
    onPatch({ providerOrder: order });
  }

  const all: CloudProviderId[] = ['google', 'deepl', 'mymemory', 'lingva'];

  return (
    <>
      <EngineCard settings={settings} onPatch={onPatch} />

      <section class="kt-card">
        <h2 class="text-sm font-semibold mb-3">{t('Cloud fallback chain')}</h2>
        <p class="text-xs text-kick-muted mb-3">
          {t(
            "Used when on-device is off or a language pair isn't downloaded. Providers are tried in order; failing ones are temporarily skipped (exponential cooldown).",
          )}
        </p>
        <ul class="flex flex-col gap-1.5">
          {settings.providerOrder.map((id, i) => {
            const status = providers.find((p) => p.id === id);
            return (
              <li
                key={id}
                class="flex items-center gap-2 rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2"
              >
                <span class="font-mono text-xs text-kick-muted w-5">{i + 1}.</span>
                <span class="flex-1 text-sm">{t(PROVIDER_LABELS[id])}</span>
                {status && (
                  <span
                    class={`text-[10px] font-medium uppercase ${status.available ? 'text-kick-primary' : 'text-red-300'}`}
                  >
                    {status.available ? t('ok') : t('down')}
                  </span>
                )}
                <button class="kt-btn-ghost py-1 px-2 text-xs" onClick={() => move(id, -1)}>
                  ↑
                </button>
                <button class="kt-btn-ghost py-1 px-2 text-xs" onClick={() => move(id, +1)}>
                  ↓
                </button>
                <button class="kt-btn-ghost py-1 px-2 text-xs" onClick={() => toggle(id)}>
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <div class="mt-3 flex flex-wrap gap-2">
          {all
            .filter((id) => !settings.providerOrder.includes(id))
            .map((id) => (
              <button key={id} class="kt-btn-ghost text-xs" onClick={() => toggle(id)}>
                + {t(PROVIDER_LABELS[id])}
              </button>
            ))}
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">DeepL</h2>
        <div class="kt-row">
          <label class="kt-label">{t('API key')}</label>
          <input
            aria-label={t('API key')}
            class="kt-input font-mono"
            type="password"
            value={settings.deeplApiKey}
            placeholder="••••••••-••••-••••-••••-••••••••••••:fx"
            onInput={(e) => onPatch({ deeplApiKey: (e.target as HTMLInputElement).value.trim() })}
          />
          <p class="text-[11px] text-kick-muted">
            Free plan: 1,000,000 chars/month. Key ends with <code>:fx</code>. Get one at{' '}
            <a
              class="text-kick-primary underline"
              href="https://www.deepl.com/pro#developer"
              target="_blank"
              rel="noreferrer"
            >
              deepl.com/pro#developer
            </a>
            .
          </p>
        </div>
        <div class="kt-row">
          <label class="kt-label">{t('Plan')}</label>
          <select
            aria-label={t('Plan')}
            class="kt-select"
            value={settings.deeplPlan}
            onChange={(e) =>
              onPatch({ deeplPlan: (e.target as HTMLSelectElement).value as 'free' | 'pro' })
            }
          >
            <option value="free">{t('Free (api-free.deepl.com)')}</option>
            <option value="pro">{t('Pro (api.deepl.com)')}</option>
          </select>
        </div>
        <Check
          checked={settings.deeplSmartRouting}
          onChange={(v) => onPatch({ deeplSmartRouting: v })}
          label={t('Smart budget routing')}
        />
        <p class="text-[11px] text-kick-muted -mt-2">
          {t(
            'Spend DeepL only on the European languages it clearly wins at; other targets (Japanese, Arabic, Hindi…) use the free engines first, so your DeepL quota lasts much longer.',
          )}
        </p>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Lingva instance')}</h2>
        <div class="kt-row">
          <label class="kt-label">{t('Custom URL (optional)')}</label>
          <input
            class="kt-input font-mono"
            type="url"
            value={settings.lingvaInstance}
            placeholder="https://lingva.lunar.icu"
            onInput={(e) =>
              onPatch({ lingvaInstance: (e.target as HTMLInputElement).value.trim() })
            }
          />
          <p class="text-[11px] text-kick-muted">
            {t('Leave blank to use the default public instance.')}
          </p>
        </div>
      </section>
    </>
  );
}
