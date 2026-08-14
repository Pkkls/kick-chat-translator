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
    render(<DisplaySection settings={{ ...defaultSettings(), ...patch }} onPatch={() => undefined} />, root);
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
    ['replace', 'kt-translation-compact'],
    ['hover', 'kt-translation'],
  ] as const)('renders %s with the real %s class', (style, cls) => {
    const root = mount({ displayStyle: style });
    const shown = root.querySelector(`.${cls}`);
    expect(shown).not.toBeNull();
    expect(shown?.textContent).toContain('is anyone else seeing this?');
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
