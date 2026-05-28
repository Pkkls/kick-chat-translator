import { useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { send } from '~/shared/messages';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
}

export function AdvancedSection({ settings, onPatch }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">Connection</h2>
        <div class="kt-row">
          <label class="kt-label">Mode</label>
          <select
            class="kt-select"
            value={settings.connectionMode}
            onChange={(e) =>
              onPatch({ connectionMode: (e.target as HTMLSelectElement).value as Settings['connectionMode'] })
            }
          >
            <option value="auto">Auto (WebSocket + DOM fallback)</option>
            <option value="websocket">WebSocket only</option>
            <option value="dom">DOM observer only</option>
          </select>
          <p class="text-[11px] text-kick-muted">
            WebSocket directly listens to Kick's chat events for lower CPU / faster pre-translation.
          </p>
        </div>
      </section>

      <section class="kt-card space-y-4">
        <h2 class="text-sm font-semibold">Cache & performance</h2>
        <Row
          label="Cache max entries"
          hint="Larger = more hits across sessions, more disk space."
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
          label="Cache TTL (hours)"
          hint="After this, entries expire."
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
          label="Concurrent translations"
          hint="In-flight provider requests."
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
          label="Per-channel budget (req/min)"
          hint="Hard cap to avoid hammering providers on fast chats."
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
        <h2 class="text-sm font-semibold">Debugging</h2>
        <label class="flex items-center justify-between gap-3 rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2">
          <span class="text-sm">Verbose console logs</span>
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
            {confirmClear ? 'click again to confirm' : 'Clear translation cache'}
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
            {confirmReset ? 'click again to confirm' : 'Reset usage stats'}
          </button>
        </div>
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
