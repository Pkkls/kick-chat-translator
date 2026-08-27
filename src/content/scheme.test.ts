import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyChatScheme } from './injector';

/**
 * The regression this guards: the injected UI switched on the OS scheme, so a
 * light desktop reading Kick's dark chat got the light palette on a dark ground.
 * Kick owns its theme, so the ground is what decides.
 */
function os(light: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: light && q.includes('light'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function ground(color: string): HTMLElement {
  const el = document.createElement('div');
  el.style.backgroundColor = color;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.documentElement.removeAttribute('data-kt-scheme');
  document.body.textContent = '';
  vi.unstubAllGlobals();
});

describe('applyChatScheme', () => {
  it('reads the ground, not the desktop: dark chat under a light OS stays dark', () => {
    os(true);
    expect(applyChatScheme(ground('rgb(11, 11, 12)'))).toBe('dark');
    expect(document.documentElement.getAttribute('data-kt-scheme')).toBe('dark');
  });

  it('and the mirror case: light chat under a dark OS goes light', () => {
    os(false);
    expect(applyChatScheme(ground('rgb(255, 255, 255)'))).toBe('light');
  });

  // Control: without a ground to read, the OS is all there is, and it must
  // still be consulted rather than defaulting blindly.
  it('falls back to the OS only when nothing paints', () => {
    os(true);
    expect(applyChatScheme(null)).toBe('light');
    os(false);
    expect(applyChatScheme(null)).toBe('dark');
  });

  it('ignores a translucent layer and keeps climbing to what actually paints', () => {
    os(true);
    const outer = ground('rgb(11, 11, 12)');
    const inner = document.createElement('div');
    // A hover veil over the row: it tints, it does not decide.
    inner.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
    outer.appendChild(inner);
    expect(applyChatScheme(inner)).toBe('dark');
  });

  it('puts the boundary between Kick greys and Kick whites', () => {
    os(false);
    // #171A1C is Kick's chat surface; #FFFFFF is its light one.
    expect(applyChatScheme(ground('rgb(23, 26, 28)'))).toBe('dark');
    expect(applyChatScheme(ground('rgb(244, 244, 245)'))).toBe('light');
  });
});
