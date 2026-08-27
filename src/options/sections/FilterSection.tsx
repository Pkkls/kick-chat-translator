import { useMemo, useState } from 'preact/hooks';
import type { Settings } from '~/shared/settings';
import { sortedLanguages } from '~/shared/languages';
import { resolveUiLocale } from '~/shared/i18n';
import { useT } from '~/shared/i18nContext';
import { Check } from '../components/Check';

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
  const [langQuery, setLangQuery] = useState('');
  // Localised and collated for the interface language the user chose,
  // not the one their browser happens to run in.
  const langs = useMemo(() => sortedLanguages(resolveUiLocale(settings.uiLang)), [settings.uiLang]);
  const shown = useMemo(() => {
    const fold = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const q = fold(langQuery.trim());
    if (!q) return langs;
    return langs.filter((l) => fold(l.name).includes(q) || fold(l.code).includes(q));
  }, [langs, langQuery]);
  return (
    <>
      <section class="kt-card space-y-3">
        <h2 class="kt-section">{t('General')}</h2>
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
              {t(
                'Shorter messages are left alone. Raise it to spend less provider quota on busy chats.',
              )}
            </div>
          </div>
          {/* The heading beside it is a plain div, so nothing connects the two
              for a screen reader: axe reports the field as unlabelled. */}
          <input
            aria-label={t('Minimum message length')}
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
        <h2 class="kt-section">{t('Source languages allowlist')}</h2>
        <p class="text-xs text-kick-muted">
          {t(
            'Leave empty to translate every detected language. Pick specific ones to ONLY translate those (e.g. only JA + KO).',
          )}
        </p>
        {/* 42 languages behind a scrollbar is the same problem the chip's list
            had, and it takes the same answer: type two letters instead of
            walking the list. Matching covers the ISO code as well as the name,
            since the names render in the interface language. */}
        <input
          type="text"
          class="kt-input"
          aria-label={t('Filter languages')}
          placeholder={t('Filter languages')}
          value={langQuery}
          onInput={(e) => setLangQuery((e.target as HTMLInputElement).value)}
        />
        <div class="grid grid-cols-3 gap-1.5 max-h-[260px] overflow-auto pe-1">
          {shown.length === 0 && (
            <p role="status" class="col-span-3 py-2 text-xs text-kick-muted">
              {t('No language matches')}
            </p>
          )}
          {shown.map((l) => {
            const checked = settings.sourceLangAllowlist.includes(l.code);
            return (
              <div
                key={l.code}
                class={`rounded-md border px-2 py-1 text-xs transition ${
                  checked
                    ? 'border-kick-primary bg-kick-primary/10'
                    : 'border-kick-stroke bg-kick-dark/30'
                }`}
              >
                <Check
                  checked={checked}
                  onChange={() => {
                    const next = new Set(settings.sourceLangAllowlist);
                    if (next.has(l.code)) next.delete(l.code);
                    else next.add(l.code);
                    onPatch({ sourceLangAllowlist: [...next] });
                  }}
                  label={
                    <span class="flex min-w-0 items-center gap-2">
                      <span class="font-mono text-[10px] tracking-wider text-kick-muted">
                        {l.code.toUpperCase()}
                      </span>
                      <span class="truncate text-kick-muted">{l.name}</span>
                    </span>
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="kt-section">{t('Channels & users')}</h2>
        <div class="kt-row">
          <label class="kt-label" for="kt-whitelist-channels">
            {t('Whitelist channels (only translate on these)')}
          </label>
          <textarea
            id="kt-whitelist-channels"
            class="kt-textarea"
            value={settings.whitelistChannels.join('\n')}
            placeholder={`${t('one channel name per line')}\nsome-channel\nanother-channel`}
            onInput={(e) =>
              onPatch({ whitelistChannels: toList((e.target as HTMLTextAreaElement).value) })
            }
          />
        </div>
        <div class="kt-row">
          <label class="kt-label" for="kt-blacklist-channels">
            {t('Blacklist channels')}
          </label>
          <textarea
            id="kt-blacklist-channels"
            class="kt-textarea"
            value={settings.blacklistChannels.join('\n')}
            placeholder={`${t('one channel name per line')}\nsome-channel`}
            onInput={(e) =>
              onPatch({ blacklistChannels: toList((e.target as HTMLTextAreaElement).value) })
            }
          />
        </div>
        <div class="kt-row">
          <label class="kt-label" for="kt-blacklist-users">
            {t('Blacklist users')}
          </label>
          <textarea
            id="kt-blacklist-users"
            class="kt-textarea"
            value={settings.blacklistUsers.join('\n')}
            placeholder={`${t('one username per line')}\nsome-user`}
            onInput={(e) =>
              onPatch({ blacklistUsers: toList((e.target as HTMLTextAreaElement).value) })
            }
          />
        </div>
      </section>

      <section class="kt-card space-y-3">
        <h2 class="kt-section">{t('Glossary')}</h2>
        <p class="text-[11px] text-kick-muted">
          {t(
            'Words the engines keep getting wrong for your channels. Each line replaces the left side with the right side, after translating.',
          )}
        </p>
        <textarea
          class="kt-textarea"
          aria-label={t('Glossary')}
          value={settings.glossary.join('\n')}
          placeholder={`${t('one rule per line, in the form word→replacement')}\n草→lol\nkusa→lol`}
          onInput={(e) => onPatch({ glossary: toList((e.target as HTMLTextAreaElement).value) })}
        />
      </section>
    </>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div class="kt-setting">
      <Check checked={checked} onChange={onChange} label={label} reverse />
    </div>
  );
}
