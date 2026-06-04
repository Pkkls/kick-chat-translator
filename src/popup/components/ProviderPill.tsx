import type { ProviderStatus } from '~/shared/types';
import { useT } from '~/shared/i18nContext';

const LABELS: Record<string, string> = {
  google: 'Google',
  deepl: 'DeepL',
  mymemory: 'MyMemory',
  lingva: 'Lingva',
};

interface Props {
  status: ProviderStatus;
}

export function ProviderPill({ status }: Props) {
  const t = useT();
  const tone = status.available ? 'border-kick-primary/40 text-kick-primary bg-kick-primary/10' : 'border-red-500/30 text-red-300 bg-red-500/10';
  const label = LABELS[status.id] ?? status.id;
  return (
    <span
      class={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${tone}`}
      title={status.lastError ?? (status.available ? t('available') : t('unavailable'))}
    >
      <span class={`h-1.5 w-1.5 rounded-full ${status.available ? 'bg-kick-primary' : 'bg-red-400'}`} />
      {label}
    </span>
  );
}
