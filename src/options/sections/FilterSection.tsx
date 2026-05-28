import type { Settings } from '~/shared/settings';
import { LANGUAGES } from '~/shared/languages';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
}

function toList(v: string): string[] {
  return v
    .split(/[\s,\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function FilterSection({ settings, onPatch }: Props) {
  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">General</h2>
        <ToggleRow
          checked={settings.ignoreEnglish}
          onChange={(v) => onPatch({ ignoreEnglish: v })}
          label="Skip messages already in target language"
        />
        <ToggleRow
          checked={settings.ignoreBots}
          onChange={(v) => onPatch({ ignoreBots: v })}
          label="Ignore common bot accounts (StreamElements, Nightbot, …)"
        />
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">Source languages allowlist</h2>
        <p class="text-xs text-kick-muted">
          Leave empty to translate every detected language. Pick specific ones to ONLY translate those (e.g. only JA + KO).
        </p>
        <div class="grid grid-cols-3 gap-1.5 max-h-[260px] overflow-auto pr-1">
          {LANGUAGES.map((l) => {
            const checked = settings.sourceLangAllowlist.includes(l.code);
            return (
              <label key={l.code} class={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs cursor-pointer transition ${
                checked ? 'border-kick-primary bg-kick-primary/10' : 'border-kick-border bg-kick-dark/30'
              }`}>
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 accent-kick-primary"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(settings.sourceLangAllowlist);
                    if (next.has(l.code)) next.delete(l.code);
                    else next.add(l.code);
                    onPatch({ sourceLangAllowlist: [...next] });
                  }}
                />
                <span>{l.flag}</span>
                <span class="text-kick-muted truncate">{l.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">Channels & users</h2>
        <div class="kt-row">
          <label class="kt-label">Whitelist channels (only translate on these)</label>
          <textarea
            class="kt-textarea"
            value={settings.whitelistChannels.join('\n')}
            placeholder="adinross&#10;trainwreckstv"
            onInput={(e) => onPatch({ whitelistChannels: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
        <div class="kt-row">
          <label class="kt-label">Blacklist channels</label>
          <textarea
            class="kt-textarea"
            value={settings.blacklistChannels.join('\n')}
            onInput={(e) => onPatch({ blacklistChannels: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
        <div class="kt-row">
          <label class="kt-label">Blacklist users</label>
          <textarea
            class="kt-textarea"
            value={settings.blacklistUsers.join('\n')}
            placeholder="annoyingbot&#10;spammer123"
            onInput={(e) => onPatch({ blacklistUsers: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
      </section>
    </>
  );
}

function ToggleRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label class="flex items-center justify-between gap-3 rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2">
      <span class="text-sm">{label}</span>
      <input
        type="checkbox"
        class="h-4 w-4 accent-kick-primary"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
    </label>
  );
}
