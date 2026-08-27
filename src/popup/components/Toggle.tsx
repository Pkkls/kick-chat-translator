interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
        class={`relative inline-block h-5 w-9 rounded-full transition ${checked ? 'bg-kick-primary' : 'bg-kick-border'}`}
      >
        <span
          class={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
        <input
          type="checkbox"
          checked={checked}
          class="sr-only"
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        />
      </span>
      {label && <span class="text-xs text-kick-muted">{label}</span>}
    </label>
  );
}
