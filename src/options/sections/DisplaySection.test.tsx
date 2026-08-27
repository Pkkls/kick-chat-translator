import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { defaultSettings, type Settings } from '~/shared/settings';
import { DisplaySection } from './DisplaySection';

const SAMPLE = '¿alguien más está viendo esto?';

function mount(patch: Partial<Settings>): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  // act flushes the effect synchronously for a sync callback; the thenable it
  // hands back is only useful for async ones, so it is deliberately dropped.
  void act(() => {
    render(
      <DisplaySection settings={{ ...defaultSettings(), ...patch }} onPatch={() => undefined} />,
      root,
    );
  });
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.classList.remove('kt-hide-original');
});

// The preview is built by the content script's own inject(), so the class it ends
// up with is the same one a real chat line would get. Picking a style has to move
// that class, otherwise the preview is decoration rather than an answer to "what
// does this style look like".
describe('display style preview', () => {
  it.each([
    ['below', 'kt-translation'],
    ['inline', 'kt-translation-inline'],
    ['replace', 'kt-translation-replace'],
  ] as const)('renders %s with the real %s class', (style, cls) => {
    const root = mount({ displayStyle: style });
    const shown = root.querySelector(`.${cls}`);
    expect(shown).not.toBeNull();
    expect(shown?.textContent).toContain('is anyone else seeing this?');
  });

  /**
   * `hover` shows nothing until you point at the line, so a preview that drew a
   * finished translation described one of the other three styles.
   *
   * "Nothing" is now literal. It used to append a green "Hover to translate"
   * under every message, worth +61% of row height measured against an untouched
   * line, so the preview has to show the absence rather than the label.
   */
  it('previews hover as the nothing it draws', () => {
    const root = mount({ displayStyle: 'hover' });
    const mark = root.querySelector('.kt-hover-armed');
    expect(mark, 'the row was never armed').not.toBeNull();
    expect(mark!.textContent, 'the marker is bookkeeping, not a label').toBe('');
    expect(
      root.querySelector('.kt-translation'),
      'a finished translation is exactly what hover does not show',
    ).toBeNull();
  });

  it('offers every value the schema accepts', () => {
    const root = mount({});
    const labels = [...root.querySelectorAll('button')].map((b) => b.textContent ?? '');
    for (const label of ['Below', 'Inline', 'Replace', 'On hover']) {
      expect(
        labels.some((l) => l.includes(label)),
        `no card for ${label}`,
      ).toBe(true);
    }
  });

  it('keeps the sample original next to the translation', () => {
    const root = mount({ displayStyle: 'below' });
    expect(root.textContent).toContain(SAMPLE);
  });

  it('shows the source badge only when that setting is on', () => {
    expect(mount({ showSourceBadge: true }).querySelector('.kt-flag')).not.toBeNull();
    document.body.innerHTML = '';
    expect(mount({ showSourceBadge: false }).querySelector('.kt-flag')).toBeNull();
  });

  // The hide-original rule lives on the document root, so the preview shows what
  // the toggle does rather than describing it.
  it('follows the keep-original toggle', () => {
    mount({ showOriginal: false });
    expect(document.documentElement.classList.contains('kt-hide-original')).toBe(true);
    document.body.innerHTML = '';
    mount({ showOriginal: true });
    expect(document.documentElement.classList.contains('kt-hide-original')).toBe(false);
  });
});

/**
 * `replace` hides the original itself, so "keep original text visible" cannot
 * do anything while it is selected. Leaving the switch live would put the same
 * defect back that this style was just fixed for: a control that moves and
 * changes nothing.
 */
describe('keep-original while Replace is selected', () => {
  const keepOriginal = (root: HTMLElement) =>
    [...root.querySelectorAll('input[type=checkbox]')].find((i) =>
      (i.closest('label')?.textContent ?? '').includes('Keep original text visible'),
    ) as HTMLInputElement | undefined;

  it('turns the switch off and says why', () => {
    const root = mount({ displayStyle: 'replace' });
    const box = keepOriginal(root);
    expect(box, 'the keep-original switch was not found at all').toBeDefined();
    expect(box!.disabled).toBe(true);
    expect(root.textContent).toContain('The Replace style always hides it.');
  });

  // Control: the switch is live under the styles that do leave an original
  // standing, or the assertion above would pass on a switch that is never
  // usable at all.
  it.each(['below', 'inline'] as const)('leaves it usable under %s', (style) => {
    const root = mount({ displayStyle: style });
    expect(keepOriginal(root)!.disabled).toBe(false);
    expect(root.textContent).not.toContain('The Replace style always hides it.');
  });
});
