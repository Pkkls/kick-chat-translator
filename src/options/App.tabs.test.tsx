import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The tab bar had no ARIA at all: six buttons, none announced as a tab, none
 * telling which was showing, and five Tab presses to cross it.
 *
 * Read from the source rather than mounted — App pulls the whole settings
 * pipeline through chrome.runtime, and what is asserted here is the markup
 * contract, which the source carries exactly.
 */
const src = readFileSync('src/options/App.tsx', 'utf8');

describe('options tab bar', () => {
  it('declares the tablist and its tabs', () => {
    expect(src).toContain('role="tablist"');
    expect(src).toContain('role="tab"');
    expect(src).toContain('aria-selected={tab === tb.id}');
  });

  it('names the tablist, which axe requires of a landmark-like grouping', () => {
    expect(src).toMatch(/role="tablist"[\s\S]{0,120}aria-label=/);
  });

  it('binds each tab to the panel it shows, both ways', () => {
    expect(src).toContain('aria-controls={`panel-${tb.id}`}');
    expect(src).toContain('id={`tab-${tb.id}`}');
    expect(src).toContain('id={`panel-${tab}`}');
    expect(src).toContain('aria-labelledby={`tab-${tab}`}');
  });

  it('rovs the tabindex so the bar is one tab stop', () => {
    expect(src).toContain('tabIndex={tab === tb.id ? 0 : -1}');
  });

  it('handles the four keys the pattern asks for', () => {
    const keys = src.slice(src.indexOf('function onTabKey'));
    const body = keys.slice(0, keys.indexOf('\n  }\n'));
    for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) expect(body).toContain(k);
    // Wraps rather than stopping at the ends, which is what APG specifies.
    expect(body).toContain('% TABS.length');
  });

  it('moves focus after the render, not during it', () => {
    // The tab losing focus is about to get tabIndex -1; focusing the new one
    // in the same tick lands on an element that has not rendered yet and the
    // browser drops focus to the body.
    expect(src).toMatch(/requestAnimationFrame\(\(\) => tabRefs\.current\[id\]\?\.focus\(\)\)/);
  });
});
