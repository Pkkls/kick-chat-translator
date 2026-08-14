import type { Settings } from '~/shared/settings';
import { LANGUAGES } from '~/shared/languages';
import { useT } from '~/shared/i18nContext';

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
  const t = useT();
  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('General')}</h2>
        <ToggleRow
          checked={settings.ignoreEnglish}
          onChange={(v) => onPatch({ ignoreEnglish: v })}
          label={t('Skip messages already in target language')}
        />
        <ToggleRow
          checked={settings.ignoreBots}
          onChange={(v) => onPatch({ ignoreBots: v })}
          label={t('Ignore common bot accounts (StreamElements, Nightbot, …)')}
        />
        <div class="grid grid-cols-[1fr,140px] gap-3 items-start">
          <div>
            <div class="text-sm">{t('Minimum message length')}</div>
            <div class="text-[11px] text-kick-muted">
              {t('Shorter messages are left alone. Raise it to spend less provider quota on busy chats.')}
            </div>
          </div>
          <input
            type="number"
            class="kt-input"
            min={1}
            max={50}
            value={settings.minTextLength}
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (Number.isInteger(v) && v >= 1 && v <= 50) onPatch({ minTextLength: v });
            }}
          />
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Source languages allowlist')}</h2>
        <p class="text-xs text-kick-muted">
          {t('Leave empty to translate every detected language. Pick specific ones to ONLY translate those (e.g. only JA + KO).')}
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
        <h2 class="text-sm font-semibold">{t('Channels & users')}</h2>
        <div class="kt-row">
          <label class="kt-label">{t('Whitelist channels (only translate on these)')}</label>
          <textarea
            class="kt-textarea"
            value={settings.whitelistChannels.join('\n')}
            placeholder={`${t('one channel name per line')}\nsome-channel\nanother-channel`}
            onInput={(e) => onPatch({ whitelistChannels: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
        <div class="kt-row">
          <label class="kt-label">{t('Blacklist channels')}</label>
          <textarea
            class="kt-textarea"
            value={settings.blacklistChannels.join('\n')}
            placeholder={`${t('one channel name per line')}\nsome-channel`}
            onInput={(e) => onPatch({ blacklistChannels: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
        <div class="kt-row">
          <label class="kt-label">{t('Blacklist users')}</label>
          <textarea
            class="kt-textarea"
            value={settings.blacklistUsers.join('\n')}
            placeholder={`${t('one username per line')}\nsome-user`}
            onInput={(e) => onPatch({ blacklistUsers: toList((e.target as HTMLTextAreaElement).value) })}
          />
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Glossary')}</h2>
        <p class="text-[11px] text-kick-muted">
          {t('Words the engines keep getting wrong for your channels. Each line replaces the left side with the right side, after translating.')}
        </p>
        <textarea
          class="kt-textarea"
          value={settings.glossary.join('\n')}
          placeholder={`${t('one rule per line, in the form word→replacement')}\n草→lol\nkusa→lol`}
          onInput={(e) => onPatch({ glossary: toList((e.target as HTMLTextAreaElement).value) })}
        />
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
