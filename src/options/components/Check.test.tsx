import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { Check } from './Check';

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
const box = (el: HTMLElement) => el.querySelector<HTMLElement>('.kt-check-box')!;

describe('Check', () => {
  it('keeps a real checkbox underneath, so the browser still owns the keyboard', () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="Ignore bots" />);
    expect(input(el)).not.toBeNull();
    expect(input(el).type).toBe('checkbox');
  });

  it('is named by its label without needing an id', () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="Ignore bots" />);
    // The input lives inside the <label>, which is what names it.
    expect(input(el).closest('label')?.textContent).toContain('Ignore bots');
  });

  it('reports the new value when toggled', () => {
    const onChange = vi.fn();
    const el = mount(<Check checked={false} onChange={onChange} label="x" />);
    input(el).click();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire while disabled', () => {
    const onChange = vi.fn();
    const el = mount(<Check checked={false} onChange={onChange} label="x" disabled />);
    input(el).click();
    expect(onChange).not.toHaveBeenCalled();
  });

  // `busy` disables the input as well: a change in flight must not be raced by
  // a second click before the first has landed.
  it('does not fire while busy', () => {
    const onChange = vi.fn();
    const el = mount(<Check checked={false} onChange={onChange} label="x" busy />);
    input(el).click();
    expect(onChange).not.toHaveBeenCalled();
    expect(input(el).disabled).toBe(true);
  });

  it('sets the mixed state as a property, which is the only way it exists', async () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="x" indeterminate />);
    // Written by an effect. Preact schedules those on a microtask plus a
    // frame, so one setTimeout(0) is not always enough under happy-dom.
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    expect(input(el).indeterminate).toBe(true);
    // Control: it is genuinely a property, never an attribute.
    expect(input(el).getAttribute('indeterminate')).toBeNull();
  });

  it('announces busy and invalid to assistive technology', () => {
    const busyEl = mount(<Check checked={false} onChange={() => {}} label="x" busy />);
    expect(input(busyEl).getAttribute('aria-busy')).toBe('true');
    render(null, host!);
    const badEl = mount(<Check checked={false} onChange={() => {}} label="x" invalid />);
    expect(input(badEl).getAttribute('aria-invalid')).toBe('true');
  });

  it('leaves those attributes off when the states do not apply', () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="x" />);
    expect(input(el).getAttribute('aria-busy')).toBeNull();
    expect(input(el).getAttribute('aria-invalid')).toBeNull();
  });

  /**
   * The drawn box must never intercept the click: the input underneath is what
   * toggles, and a box that swallows the pointer makes the control inert.
   *
   * Asserted against the stylesheet rather than the element — the rule is
   * applied with @apply, so it is compiled into the CSS and never appears in
   * className.
   */
  it('hides the drawn box from the pointer', () => {
    const css = readFileSync('src/options/styles.css', 'utf8');
    const rule = css.slice(css.indexOf('.kt-check-box {'));
    expect(rule.slice(0, rule.indexOf('}'))).toContain('pointer-events-none');
  });

  it('carries the tick and the dash in one svg, so they cannot drift apart', () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="x" />);
    const svgs = box(el).querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
    expect(svgs[0]!.querySelectorAll('path')).toHaveLength(2);
  });

  it('renders the hint under the label when given one', () => {
    const el = mount(<Check checked onChange={() => {}} label="Pause" hint="Saves quota" />);
    expect(el.textContent).toContain('Saves quota');
  });

  it('flips the paint order on reverse without moving the input', () => {
    const el = mount(<Check checked={false} onChange={() => {}} label="x" reverse />);
    expect(el.querySelector('label')!.className).toContain('kt-check-reverse');
    // Still inside the label, so it is still what names and toggles.
    expect(input(el).closest('label')).not.toBeNull();
  });
});
