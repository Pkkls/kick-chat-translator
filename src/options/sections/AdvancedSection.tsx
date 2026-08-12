import { useRef, useState } from 'preact/hooks';
import { exportSettings, importSettings, type Settings } from '~/shared/settings';
import { send } from '~/shared/messages';
import { useT } from '~/shared/i18nContext';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
}

export function AdvancedSection({ settings, onPatch }: Props) {
  const t = useT();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [importFailed, setImportFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runExport(): Promise<void> {
    const url = URL.createObjectURL(
      new Blob([await exportSettings()], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kick-chat-translator-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runImport(file: File): Promise<void> {
    try {
      await importSettings(await file.text());
      location.reload();
    } catch {
      setImportFailed(true);
    }
  }

  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Connection')}</h2>
        <div class="kt-row">
          <label class="kt-label">{t('Mode')}</label>
          <select
            class="kt-select"
            value={settings.connectionMode}
            onChange={(e) =>
              onPatch({ connectionMode: (e.target as HTMLSelectElement).value as Settings['connectionMode'] })
            }
          >
            <option value="auto">{t('Auto (WebSocket + DOM fallback)')}</option>
            <option value="websocket">{t('WebSocket only')}</option>
            <option value="dom">{t('DOM observer only')}</option>
          </select>
          <p class="text-[11px] text-kick-muted">
            {t("WebSocket directly listens to Kick's chat events for lower CPU / faster pre-translation.")}
          </p>
        </div>
        <label class="flex items-center justify-between gap-3 rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2">
          <span class="text-sm">
            {t('Pause when tab is hidden')}
            <span class="block text-[11px] text-kick-muted">
              {t("Background Kick tabs won't translate (saves DeepL quota while you're away).")}
            </span>
          </span>
          <input
            type="checkbox"
            class="h-4 w-4 accent-kick-primary"
            checked={settings.pauseWhenHidden}
            onChange={(e) => onPatch({ pauseWhenHidden: (e.target as HTMLInputElement).checked })}
          />
        </label>
      </section>

      <section class="kt-card space-y-4">
        <h2 class="text-sm font-semibold">{t('Cache & performance')}</h2>
        <Row
          label={t('Cache max entries')}
          hint={t('Larger = more hits across sessions, more disk space.')}
          input={
            <input
              type="number"
              class="kt-input"
              min={100}
              max={20000}
              step={100}
              value={settings.cacheMaxEntries}
              onInput={(e) => onPatch({ cacheMaxEntries: Number((e.target as HTMLInputElement).value) })}
            />
          }
        />
        <Row
          label={t('Cache TTL (hours)')}
          hint={t('After this, entries expire.')}
          input={
            <input
              type="number"
              class="kt-input"
              min={1}
              max={720}
              value={settings.cacheTtlHours}
              onInput={(e) => onPatch({ cacheTtlHours: Number((e.target as HTMLInputElement).value) })}
            />
          }
        />
        <Row
          label={t('Concurrent translations')}
          hint={t('In-flight provider requests.')}
          input={
            <input
              type="number"
              class="kt-input"
              min={1}
              max={16}
              value={settings.concurrency}
              onInput={(e) => onPatch({ concurrency: Number((e.target as HTMLInputElement).value) })}
            />
          }
        />
        <Row
          label={t('Per-channel budget (req/min)')}
          hint={t('Hard cap to avoid hammering providers on fast chats.')}
          input={
            <input
              type="number"
              class="kt-input"
              min={10}
              max={2000}
              value={settings.perChannelBudgetPerMin}
              onInput={(e) => onPatch({ perChannelBudgetPerMin: Number((e.target as HTMLInputElement).value) })}
            />
          }
        />
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Backup')}</h2>
        <p class="text-[11px] text-kick-muted">
          {t('Save your configuration to a JSON file, or restore it on another browser.')}
        </p>
        <div class="flex gap-2">
          <button class="kt-btn-ghost" onClick={() => void runExport()}>
            {t('Export settings')}
          </button>
          <button class="kt-btn-ghost" onClick={() => fileRef.current?.click()}>
            {t('Import settings')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            class="hidden"
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              input.value = '';
              setImportFailed(false);
              if (file) void runImport(file);
            }}
          />
        </div>
        {importFailed && <p class="text-[11px] text-red-400">{t('Invalid settings file')}</p>}
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Debugging')}</h2>
        <label class="flex items-center justify-between gap-3 rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2">
          <span class="text-sm">{t('Verbose console logs')}</span>
          <input
            type="checkbox"
            class="h-4 w-4 accent-kick-primary"
            checked={settings.debug}
            onChange={(e) => onPatch({ debug: (e.target as HTMLInputElement).checked })}
          />
        </label>
        <div class="flex gap-2 pt-1">
          <button
            class="kt-btn-ghost"
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true);
                setTimeout(() => setConfirmClear(false), 2500);
                return;
              }
              void send({ type: 'cache.clear' });
              setConfirmClear(false);
            }}
          >
            {confirmClear ? t('click again to confirm') : t('Clear translation cache')}
          </button>
          <button
            class="kt-btn-ghost"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 2500);
                return;
              }
              void send({ type: 'stats.reset' });
              setConfirmReset(false);
            }}
          >
            {confirmReset ? t('click again to confirm') : t('Reset usage stats')}
          </button>
          <button
            class="kt-btn-ghost"
            onClick={() => {
              if (!confirmResetAll) {
                setConfirmResetAll(true);
                setTimeout(() => setConfirmResetAll(false), 2500);
                return;
              }
              setConfirmResetAll(false);
              void send({ type: 'settings.reset' }).then(() => location.reload());
            }}
          >
            {confirmResetAll ? t('click again to confirm') : t('Reset all settings to defaults')}
          </button>
        </div>
        <p class="text-[11px] text-kick-muted">
          {t('"Reset all settings" restores defaults — use it if translations stop appearing because a filter (whitelist / source-language allowlist) was left active.')}
        </p>
      </section>
    </>
  );
}

function Row({ label, hint, input }: { label: string; hint: string; input: preact.ComponentChildren }) {
  return (
    <div class="grid grid-cols-[1fr,140px] gap-3 items-start">
      <div>
        <div class="text-sm">{label}</div>
        <div class="text-[11px] text-kick-muted">{hint}</div>
      </div>
      <div>{input}</div>
    </div>
  );
}
