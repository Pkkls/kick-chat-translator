import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PANEL_COLUMN_SHARE,
  PANEL_MAX_W,
  PANEL_MIN_W,
  panelGeometry,
  type PanelGeometryInput,
} from './langMenu';

/**
 * What opening the language panel is allowed to cost the chat.
 *
 * Reported from a real session: picking the reading language made the chat look
 * like it had gone. Measured on this repository's own bar-panel stage, with the
 * float bar at the top of a 340x890 chat column:
 *
 *   panel 408 x 401, left 8   ->  68px wider than the column it sits in
 *
 * A layer wider than the thing it covers has no visible relationship to it, so
 * it does not read as a layer. Nothing bounded it but the window, so on a short
 * window it took the whole column as well.
 *
 * The numbers below are that stage. They are here rather than in a browser gate
 * because happy-dom resolves no layout: a test that drove placeLangMenu would
 * measure zeros and pass on anything.
 */

/** The stage: a 340x890 chat column, the bar at its top, a 1280x1000 window. */
function stage(over: Partial<PanelGeometryInput> = {}): PanelGeometryInput {
  return {
    anchor: { top: 0, bottom: 37, right: 340 },
    column: { width: 340, height: 890 },
    viewport: { width: 1280, height: 1000 },
    // 408 wide it wants to be, 401 tall it comes out at.
    content: { width: 408, height: 401 },
    prefer: 'below',
    ...over,
  };
}

describe('the language panel stays inside the chat', () => {
  it('never draws wider than the column it sits in', () => {
    const g = panelGeometry(stage());
    expect(g.width).toBeLessThanOrEqual(340 - 16);
    expect(g.width).toBe(324);
  });

  // Control: the bound has to be the column and not a constant that happens to
  // match it. A wider column gets a wider panel, up to the readable maximum.
  it('takes the full readable width when the column allows it', () => {
    expect(panelGeometry(stage({ column: { width: 600, height: 890 } })).width).toBe(PANEL_MAX_W);
  });

  // ...and a column narrower than the floor does not squeeze it into a strip.
  it('stops shrinking at the floor', () => {
    expect(panelGeometry(stage({ column: { width: 200, height: 890 } })).width).toBe(PANEL_MIN_W);
  });

  it('keeps its right edge inside the window', () => {
    const g = panelGeometry(stage());
    expect(g.left).toBeGreaterThanOrEqual(8);
    expect(g.left + g.width).toBeLessThanOrEqual(1280 - 8);
  });
});

describe('the chat is still there behind it', () => {
  // The heart of the report. Four column heights, from a desktop to a laptop
  // with the video player taking most of the window.
  it.each([
    [890, 401],
    [620, 372],
    [480, 288],
    [360, 216],
  ])('on a %ipx column the panel is %ipx tall', (columnH, expected) => {
    const g = panelGeometry(stage({ column: { width: 340, height: columnH } }));
    expect(Math.round(g.maxHeight)).toBe(expected);
    expect(g.maxHeight).toBeLessThanOrEqual(columnH * PANEL_COLUMN_SHARE + 0.5);
  });

  it('always leaves a readable strip of chat showing', () => {
    for (const columnH of [360, 480, 620, 890, 1400]) {
      const g = panelGeometry(stage({ column: { width: 340, height: columnH } }));
      const left = columnH - g.maxHeight;
      expect(left, `${columnH}px column leaves ${left}px of chat`).toBeGreaterThanOrEqual(
        columnH * (1 - PANEL_COLUMN_SHARE) - 0.5,
      );
    }
  });

  // Control: with the cap removed the old behaviour comes back, so the
  // assertions above are pinning the cap and not an accident of the content
  // height. A 360px column with no cap would take the panel's full 401px, which
  // is taller than the column itself.
  it('would cover the whole of a short column without the cap', () => {
    const uncapped = panelGeometry(stage({ column: { width: 340, height: 0 } }));
    expect(uncapped.maxHeight).toBe(401);
    expect(uncapped.maxHeight).toBeGreaterThan(360);
  });
});

describe('the panel says it is a layer', () => {
  const css = readFileSync('src/content/inject.css', 'utf8');

  function ruleFor(selector: string): string {
    return (
      new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    );
  }

  // An opaque panel with a hairline over a near-black chat is what the report
  // describes. The house rule bans drop shadows because every other surface
  // sits in the flow; this one covers one. The exception is named in
  // scratchpad/audit_da.py, which keeps that gate honest rather than silent.
  it('carries the one drop shadow in the sheet', () => {
    expect(ruleFor('.kt-lang-panel')).toMatch(/box-shadow:\s*var\(--kt-shadow-panel\)/);
  });

  // The token, and its light-theme value, both live in the shared theme file
  // rather than in a second hand-written block on this rule.
  it('takes that shadow from the shared theme, in both schemes', () => {
    const theme = readFileSync('src/shared/theme.css', 'utf8');
    expect(theme.match(/--kt-shadow-panel:/g) ?? []).toHaveLength(2);
  });

  // The cap has to reach the stylesheet, or the JS clamp is overruled by a
  // max-inline-size the window decides.
  it('caps its width on what placeLangMenu measured, not on the window', () => {
    expect(ruleFor('.kt-lang-panel')).toMatch(/max-inline-size:\s*min\(var\(--kt-lp-max-w/);
  });
});
