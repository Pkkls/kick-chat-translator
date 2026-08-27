import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { Toggle } from './Toggle';

let host: HTMLDivElement | undefined;

function mount(el: preact.VNode): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  render(el, host);
  return host;
}

afterEach(() => {
  if (host) render(null, host);
  host?.remove();
  host = undefined;
});

const input = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
const rail = (el: HTMLElement) => el.querySelector<HTMLElement>('span.relative')!;
const knob = (el: HTMLElement) => rail(el).querySelector<HTMLElement>('span')!;

describe('Toggle', () => {
  it('reports the new value', () => {
    const onChange = vi.fn();
    const el = mount(<Toggle checked={false} onChange={onChange} />);
    input(el).click();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire while disabled', () => {
    const onChange = vi.fn();
    const el = mount(<Toggle checked={false} onChange={onChange} disabled />);
    input(el).click();
    expect(onChange).not.toHaveBeenCalled();
  });

  /**
   * The rail used to be `bg-kick-border`, which flattens to 1.18:1 on a card —
   * an off switch with no visible track. `kick-stroke` is the token measured
   * for a control's boundary.
   */
  it('draws a visible rail when off', () => {
    const el = mount(<Toggle checked={false} onChange={() => {}} />);
    expect(rail(el).className).toContain('bg-kick-stroke');
    expect(rail(el).className).not.toContain('bg-kick-border');
  });

  /**
   * The knob used to be white in both states. White on the brand green is
   * 1.37:1 — the knob disappeared exactly when the switch was on.
   */
  it('darkens the knob when on, so it stays visible against the green', () => {
    const off = mount(<Toggle checked={false} onChange={() => {}} />);
    expect(knob(off).className).toContain('bg-white');
    render(null, host!);
    const on = mount(<Toggle checked onChange={() => {}} />);
    expect(knob(on).className).toContain('bg-kick-dark');
    expect(knob(on).className).not.toContain('bg-white');
  });

  /**
   * The input is visually hidden, so the browser has nothing of its own to
   * outline: the ring has to be drawn on the rail via the peer relationship.
   * That only works while the input precedes the rail in the DOM.
   */
  it('can show a focus ring at all', () => {
    const el = mount(<Toggle checked={false} onChange={() => {}} />);
    expect(input(el).className).toContain('peer');
    expect(rail(el).className).toContain('peer-focus-visible:outline');
    expect(input(el).compareDocumentPosition(rail(el)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows its label when given one', () => {
    const el = mount(<Toggle checked onChange={() => {}} label="enable" />);
    expect(el.textContent).toContain('enable');
  });
});
