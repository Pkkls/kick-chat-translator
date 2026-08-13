import type { Settings } from '~/shared/settings';
import { LANGUAGES } from '~/shared/languages';
import { useT } from '~/shared/i18nContext';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
}

export function DisplaySection({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Translation target')}</h2>
        <div class="kt-row">
          <label class="kt-label">{t('Translate everything to')}</label>
          <select
            class="kt-select"
            value={settings.targetLang}
            onChange={(e) => onPatch({ targetLang: (e.target as HTMLSelectElement).value })}
          >
            <option value="auto">{t('Auto — your browser language')}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.native})
              </option>
            ))}
          </select>
        </div>
        <p class="text-[11px] text-kick-muted">{t('Auto reads incoming chat in your own language, detected from the browser.')}</p>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Display style')}</h2>
        <div class="grid grid-cols-3 gap-2">
          <StyleCard
            active={settings.displayStyle === 'below'}
            label={t('Below')}
            desc={t('On a new line under the message.')}
            onClick={() => onPatch({ displayStyle: 'below' })}
          />
          <StyleCard
            active={settings.displayStyle === 'inline'}
            label={t('Inline')}
            desc={t('In a pill after the original text.')}
            onClick={() => onPatch({ displayStyle: 'inline' })}
          />
          <StyleCard
            active={settings.displayStyle === 'replace'}
            label={t('Replace')}
            desc={t('After the message in smaller italics (Kick\'s virtual scroll can\'t be replaced in-place).')}
            onClick={() => onPatch({ displayStyle: 'replace' })}
          />
        </div>

        <ToggleRow
          checked={settings.showFloatingBar}
          onChange={(v) => onPatch({ showFloatingBar: v })}
          label={t('Show floating bar at top of chat (toggle live)')}
        />
        <ToggleRow
          checked={settings.showOriginal}
          onChange={(v) => onPatch({ showOriginal: v })}
          label={t('Keep original text visible')}
        />
        <ToggleRow
          checked={settings.showSourceBadge}
          onChange={(v) => onPatch({ showSourceBadge: v })}
          label={t('Show source language badge')}
        />
        <ToggleRow
          checked={settings.showProviderBadge}
          onChange={(v) => onPatch({ showProviderBadge: v })}
          label={t('Show which provider was used')}
        />
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Compose preview')}</h2>
        <p class="text-[12px] text-kick-muted">
          {t('Translate what you type before sending. A live preview appears above the chat box; click it to drop the translation in. Uses the same DeepL-first chain as incoming chat.')}
        </p>
        <ToggleRow
          checked={settings.composeEnabled}
          onChange={(v) => onPatch({ composeEnabled: v })}
          label={t('Enable compose preview')}
        />
        <div class="kt-row">
          <label class="kt-label">{t('Write my messages in')}</label>
          <select
            class="kt-select"
            value={settings.composeTargetLang}
            onChange={(e) => onPatch({ composeTargetLang: (e.target as HTMLSelectElement).value })}
          >
            <option value="auto">{t('Auto — the channel\'s language')}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.native})
              </option>
            ))}
          </select>
        </div>
        <p class="text-[11px] text-kick-muted">{t('Auto detects the channel\'s broadcast language from Kick — no manual picking.')}</p>
        <ToggleRow
          checked={settings.composeInsertMode === 'insert'}
          onChange={(v) => onPatch({ composeInsertMode: v ? 'insert' : 'copy' })}
          label={t('Click inserts into the chat box (off = copy to clipboard instead)')}
        />
      </section>
    </>
  );
}

function StyleCard({ active, label, desc, onClick }: { active: boolean; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      class={`text-left rounded-md border p-3 transition ${
        active ? 'border-kick-primary bg-kick-primary/10' : 'border-kick-border bg-kick-dark/40 hover:border-kick-muted'
      }`}
      onClick={onClick}
    >
      <div class="text-sm font-semibold">{label}</div>
      <div class="text-[11px] text-kick-muted mt-0.5">{desc}</div>
    </button>
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
