import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: JSX.Element | string;
  /** Renders the mixed state. `checked` is ignored while this is true. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** A change is in flight; the box pulses and the input stops accepting input. */
  busy?: boolean;
  invalid?: boolean;
  /** Secondary line under the label. */
  hint?: string;
  /**
   * Box after the label rather than before it.
   *
   * The settings rows have always put the control on the right, and moving 55
   * of them at once would relocate every switch under existing users without
   * asking. The reading order in the accessibility tree is unaffected: the
   * input keeps carrying the label either way.
   */
  reverse?: boolean;
}

/**
 * Checkbox.
 *
 * A real `<input type="checkbox">` sits underneath at full size and carries the
 * keyboard behaviour, the accessibility tree and the click target; everything
 * visible is drawn on the sibling box, which is `pointer-events: none` so the
 * click always lands on the input.
 *
 * The tick and the dash are two `<path>` in one `<svg>`, toggled by state. Kept
 * that way deliberately: an SVG tick beside a CSS rectangle renders at two
 * different weights and the mixed state ends up looking like a different
 * control.
 *
 * `accent-color` would be one line instead of all this, and it is what the page
 * used before. It paints a white tick on the brand green — measured 1.37:1,
 * against 14.11:1 for the dark tick drawn here — and gives no way to change it.
 */
export function Check({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  busy = false,
  invalid = false,
  hint,
  reverse = false,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  // `indeterminate` exists only as a DOM property, never as an attribute, so it
  // has to be written after every render rather than passed as a prop.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      class={reverse ? 'kt-check kt-check-reverse' : 'kt-check'}
      data-busy={busy ? 'true' : undefined}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled || busy}
        aria-invalid={invalid || undefined}
        aria-busy={busy || undefined}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
      <span class="kt-check-box" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path class="tick" d="M3.5 8.5l3 3 6-6.5" />
          <path class="dash" d="M4 8h8" />
        </svg>
      </span>
      <span class="flex flex-col">
        <span class="kt-check-label text-sm">{label}</span>
        {hint && <span class="text-[11px] text-kick-muted">{hint}</span>}
      </span>
    </label>
  );
}
