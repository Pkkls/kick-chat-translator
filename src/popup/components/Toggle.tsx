interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * On/off switch.
 *
 * Measured before this rewrite, on the two grounds it appears on:
 *   rail, off   #1f2731  1.18 on a card, 1.28 on the page — invisible, where
 *                        WCAG 1.4.11 asks 3:1 of a control's boundary
 *   knob, on    #ffffff  1.37 on the brand green — the knob vanished exactly
 *                        when the switch was on
 * So an off switch showed no track and an on switch showed no knob.
 *
 * Now: the rail is #60666d off (3.07 / 3.34) and the brand green on; the knob
 * is white on the dark rail (5.80) and dark on the green (14.11). The real
 * input sits first in the DOM so `peer-*` can reach the drawn parts, which is
 * also what gives the switch a focus ring — it had none, and being `sr-only`
 * meant the browser had nothing to outline.
 */
export function Toggle({ checked, onChange, label, disabled = false }: Props) {
  return (
    <label
      class={`inline-flex select-none items-center gap-2 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        class="peer sr-only"
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
      <span
        class={`relative inline-block h-5 w-9 rounded-full transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kick-primary ${
          checked ? 'bg-kick-primary' : 'bg-kick-stroke'
        }`}
      >
        <span
          class={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
            checked ? 'left-[18px] bg-kick-dark' : 'left-0.5 bg-white'
          }`}
        />
      </span>
      {label && <span class="text-xs text-kick-muted">{label}</span>}
    </label>
  );
}
