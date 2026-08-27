import { useEffect, useRef, useMemo } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { sortedLanguages } from '~/shared/languages';
import { resolveUiLocale } from '~/shared/i18n';
import { useT } from '~/shared/i18nContext';
import { Check } from '../components/Check';
import { applyShowOriginal, ensureStyles, inject, armHoverTranslate } from '~/content/injector';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
}

export function DisplaySection({ settings, onPatch }: Props) {
  const t = useT();
  // Localised and collated for the interface language the user chose,
  // not the one their browser happens to run in.
  const langs = useMemo(() => sortedLanguages(resolveUiLocale(settings.uiLang)), [settings.uiLang]);
  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Translation target')}</h2>
        <div class="kt-row">
          <label class="kt-label">{t('Translate everything to')}</label>
          <select
            aria-label={t('Translate everything to')}
            class="kt-select"
            value={settings.targetLang}
            onChange={(e) => onPatch({ targetLang: (e.target as HTMLSelectElement).value })}
          >
            <option value="auto">{t('Auto — your browser language')}</option>
            {langs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <p class="text-[11px] text-kick-muted">
          {t('Auto reads incoming chat in your own language, detected from the browser.')}
        </p>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="text-sm font-semibold">{t('Display style')}</h2>
        {/* Two by two rather than a single row. A fourth column would put each
            card at 60px on the 280px window the page is checked against, and
            the descriptions are what make the cards worth having. */}
        <div class="grid grid-cols-2 gap-2">
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
            desc={t('In place of the original text. Emotes stay.')}
            onClick={() => onPatch({ displayStyle: 'replace' })}
          />
          {/* Shipped and wired through the pipeline since before this refit,
              and selectable from nowhere: the picker offered three of the
              schema's four values, so the one that spares the quota was
              reachable only by writing storage by hand. */}
          <StyleCard
            active={settings.displayStyle === 'hover'}
            label={t('On hover')}
            desc={t('Only when you point at the line. Spares your quota.')}
            onClick={() => onPatch({ displayStyle: 'hover' })}
          />
        </div>

        <StylePreview settings={settings} />

        <ToggleRow
          checked={settings.showFloatingBar}
          onChange={(v) => onPatch({ showFloatingBar: v })}
          label={t('Show floating bar at top of chat (toggle live)')}
        />
        <ToggleRow
          checked={settings.showComposerChip}
          onChange={(v) => onPatch({ showComposerChip: v })}
          label={t('Show the quick language button in chat')}
        />
        <ToggleRow
          checked={settings.showOriginal}
          onChange={(v) => onPatch({ showOriginal: v })}
          label={t('Keep original text visible')}
          disabled={settings.displayStyle === 'replace'}
          hint={
            settings.displayStyle === 'replace'
              ? t('The Replace style always hides it.')
              : undefined
          }
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
          {t(
            'Translate what you type before sending. A live preview appears above the chat box; click it to drop the translation in. Uses the same DeepL-first chain as incoming chat.',
          )}
        </p>
        <ToggleRow
          checked={settings.composeEnabled}
          onChange={(v) => onPatch({ composeEnabled: v })}
          label={t('Enable compose preview')}
        />
        <div class="kt-row">
          <label class="kt-label">{t('Write my messages in')}</label>
          <select
            aria-label={t('Write my messages in')}
            class="kt-select"
            value={settings.composeTargetLang}
            onChange={(e) => onPatch({ composeTargetLang: (e.target as HTMLSelectElement).value })}
          >
            <option value="auto">{t("Auto — the channel's language")}</option>
            {langs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <p class="text-[11px] text-kick-muted">
          {t("Auto detects the channel's broadcast language from Kick — no manual picking.")}
        </p>
        <ToggleRow
          checked={settings.composeInsertMode === 'insert'}
          onChange={(v) => onPatch({ composeInsertMode: v ? 'insert' : 'copy' })}
          label={t('Click inserts into the chat box (off = copy to clipboard instead)')}
        />
      </section>
    </>
  );
}

/** A made-up viewer, so nothing here reads as a real person. */
const SAMPLE_USER = 'viewer_23';
const SAMPLE_TEXT = '¿alguien más está viendo esto?';

/**
 * A fake chat line rendered by the content script's own inject(), under the
 * content script's own stylesheet. Nothing is reimplemented here on purpose: an
 * imitation would start lying the next time inject.css is touched, and the whole
 * point of this preview is to answer "what does this style actually look like".
 */
function StylePreview({ settings }: { settings: Settings }) {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    ensureStyles();
    applyShowOriginal(settings.showOriginal);

    el.textContent = '';
    const row = document.createElement('div');
    const who = document.createElement('span');
    who.className = 'font-bold';
    who.textContent = `${SAMPLE_USER}: `;
    const said = document.createElement('span');
    said.className = 'font-normal';
    said.textContent = SAMPLE_TEXT;
    row.append(who, said);
    el.appendChild(row);

    // `hover` shows nothing until you point at the line, so rendering it with
    // inject() drew a finished translation and the card described something
    // else entirely. The preview exists to answer "what does this look like",
    // and for this style the honest answer is the message, unchanged. Armed
    // rather than left bare, so the preview is the real code path.
    if (settings.displayStyle === 'hover') {
      armHoverTranslate(row, () => undefined);
      return;
    }

    inject(
      row,
      {
        messageId: 'preview',
        translatedText: t('is anyone else seeing this?'),
        detectedLang: 'es',
        provider: 'google',
        cached: false,
      },
      settings,
      () => undefined, // the retry button is part of the look; it has nothing to retry here
    );
  }, [settings, t]);

  return (
    <div>
      <div class="text-[11px] text-kick-muted mb-1">{t('Preview')}</div>
      <div
        ref={host}
        class="rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2 text-sm"
      />
    </div>
  );
}

function StyleCard({
  active,
  label,
  desc,
  onClick,
}: {
  active: boolean;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      class={`text-left rounded-md border p-3 transition ${
        active
          ? 'border-kick-primary bg-kick-primary/10'
          : 'border-kick-border bg-kick-dark/40 hover:border-kick-muted'
      }`}
      onClick={onClick}
    >
      <div class="text-sm font-semibold">{label}</div>
      <div class="text-[11px] text-kick-muted mt-0.5">{desc}</div>
    </button>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  disabled,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div class="rounded-md border border-kick-border bg-kick-dark/40 px-3 py-2">
      <Check
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
        hint={hint}
        reverse
      />
    </div>
  );
}
