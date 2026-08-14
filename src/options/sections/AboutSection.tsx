import { useT } from '~/shared/i18nContext';

export function AboutSection() {
  const t = useT();
  return (
    <section class="kt-card space-y-4">
      <div>
        <h2 class="text-sm font-semibold mb-1">{t('About')}</h2>
        <p class="text-sm text-kick-muted leading-relaxed">
          {t('Kick Chat Translator listens to chat in real time and translates non-English (or non-target-language) messages right under the original. No tracking, no account, fully open-source.')}
        </p>
      </div>
      <div>
        <h3 class="text-xs uppercase tracking-wider text-kick-muted mb-1">{t('Links')}</h3>
        <ul class="text-sm space-y-1">
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator" target="_blank" rel="noreferrer">
              {t('GitHub repository')}
            </a>
          </li>
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md" target="_blank" rel="noreferrer">
              {t('Privacy policy')}
            </a>
          </li>
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator/issues" target="_blank" rel="noreferrer">
              {t('Report an issue')}
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h3 class="text-xs uppercase tracking-wider text-kick-muted mb-1">{t('How translation happens')}</h3>
        <ol class="list-decimal list-inside text-sm text-kick-muted space-y-1">
          <li>{t('The extension reads each chat message from the page as it appears.')}</li>
          <li>{t('Each chat message is parsed; emotes and links are stripped before translation.')}</li>
          <li>{t('The extension picks the first available provider in your chain.')}</li>
          <li>{t('Translations are cached locally in IndexedDB to avoid duplicate calls.')}</li>
        </ol>
      </div>
    </section>
  );
}
