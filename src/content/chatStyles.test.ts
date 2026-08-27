import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The inline display styles paint a background, a radius and a padding on the
 * translation. On an inline box those get cut at every line break: the last
 * word of a wrapped translation ended up alone on its own rounded green tile,
 * which is what "the chat is ugly" looked like up close.
 *
 * box-decoration-break: clone repairs the fragments but hands each one its own
 * green bar, so a wrapped translation reads as two translations. An
 * inline-block wraps its text inside one box instead, which is the shape the
 * thing actually is. Density is unchanged either way: 9 messages visible in a
 * 420px column, measured before and after.
 */
const css = readFileSync('src/content/inject.css', 'utf8');

function rule(selector: string): string {
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const head = m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (head === selector) return m[2]!;
  }
  return '';
}

// `replace` is deliberately absent: it paints no box at all, so it has no
// fragments to clone and nothing for a line break to cut. It is body text.
const INLINE_STYLES = ['.kt-translation-inline'];

describe('inline translation pill', () => {
  it.each(INLINE_STYLES)('%s is one box, not a run of line fragments', (selector) => {
    const body = rule(selector);
    // The lookup finding nothing would make every assertion below vacuous.
    expect(body).not.toBe('');
    expect(body).toMatch(/display:\s*inline-block/);
  });

  it.each(INLINE_STYLES)('%s cannot outgrow the message column', (selector) => {
    expect(rule(selector)).toMatch(/max-width:\s*100%/);
  });

  /**
   * Control: the styles still paint something that would fragment. If the
   * background and radius ever go, inline-block stops being load-bearing and
   * these tests would be guarding nothing.
   */
  it.each(INLINE_STYLES)('%s still paints the box the rule exists for', (selector) => {
    const body = rule(selector);
    expect(body).toMatch(/background:/);
    // The logical corners, not `border-radius`. The pill is rounded on the side
    // away from its green rule and flat against it, and mirrored that has to
    // swap: written physically it left the flat edge on the left of a line that
    // reads right to left.
    expect(body).toMatch(/border-start-end-radius:/);
    expect(body).toMatch(/border-start-start-radius:/);
  });

  // `below` is a block already, so it never had the problem and must not be
  // dragged into the fix.
  it('leaves the block style alone', () => {
    expect(rule('.kt-translation')).toMatch(/display:\s*block/);
  });
});
