import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * One palette, for all three surfaces.
 *
 * This is the gate the consolidation needs to survive. Before it, the popup and
 * the options page read a palette written in tailwind.config.ts, the injected
 * chat stylesheet had 76 colour literals of its own and 41 hand-written
 * light-theme blocks restating them, and neither of those palettes was the ink
 * and surface the art direction names. Three generations of the same decisions
 * had piled up, and nothing failed when a fourth was added.
 *
 * What is checked: no surface may spell a colour. Every one of them has to ask
 * src/shared/theme.css for it, and that file has to agree with
 * .agent/PROMPT.md, which is where Kick's own values are written down.
 *
 * Flag artwork is exempt and says why at its exemption.
 */

const THEME = 'src/shared/theme.css';
const read = (p: string) => readFileSync(p, 'utf8');
/**
 * Comments quote measurements that look exactly like declarations: both the
 * stylesheets and the Tailwind config carry the history of what a value used to
 * be and what it measured. Line comments go too, which is why the config's
 * record of #0a0e12 and #13181f is not read as the config still holding them.
 */
const uncomment = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Fresh each time: a shared global regex carries `lastIndex` between calls. */
const colour = () => /#[0-9a-fA-F]{3,8}\b|rgba?\((?!var)[^)]*\)/g;

describe('the art direction is Kick’s, and it is written once', () => {
  const theme = read(THEME);

  // The three anchors, read from the file that states them rather than from a
  // stylesheet that happens to use them.
  const prompt = read('.agent/PROMPT.md');

  it.each([
    ['green', '#53FC18', /--kt-green-rgb:\s*83 252 24/],
    ['ink', '#0B0B0C', /--kt-ink-rgb:\s*11 11 12/],
    ['surface', '#171A1C', /--kt-surface-rgb:\s*23 26 28/],
  ])('%s is %s in the direction, and that is what the token holds', (_name, hex, token) => {
    expect(prompt, `the direction no longer names ${hex}`).toContain(hex);
    expect(theme).toMatch(token);
  });

  // The direction allows two radii and one duration, and audit_da.py fails the
  // stylesheet on any other. They are stated here so the pages inherit them
  // instead of restating them.
  it('states the two radii and the one duration', () => {
    expect(theme).toMatch(/--kt-r-sm:\s*4px/);
    expect(theme).toMatch(/--kt-r-md:\s*8px/);
    expect(theme).toMatch(/--kt-dur:\s*0\.15s/);
  });

  // Both schemes come from this file. The scheme is switched by the attribute
  // the content script stamps, never by the OS: Kick owns its own theme.
  it('carries both schemes, keyed on the attribute and not on the desktop', () => {
    expect(theme).toMatch(/^:root\s*\{/m);
    expect(theme).toMatch(/^html\[data-kt-scheme='light'\]\s*\{/m);
    expect(theme).not.toContain('prefers-color-scheme');
  });
});

describe('no surface spells a colour of its own', () => {
  /**
   * `.kt-flag-xx` paints a flag with CSS gradients. Those values are the flags
   * of forty-two countries, which are data and not theme: France's blue is not
   * a token and must never follow one. Narrow on purpose, the frame
   * (`.kt-flag`) and the language badge (`.kt-src-flag`) are theme and are
   * checked like everything else.
   */
  const isArtwork = (selector: string) => /\.kt-flag-[a-z]/.test(selector);

  it('the injected chat stylesheet', () => {
    const css = uncomment(read('src/content/inject.css'));
    const offenders: string[] = [];
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1]!.trim().replace(/\s+/g, ' ');
      if (isArtwork(sel)) continue;
      const lits = (m[2]!.match(colour()) ?? []).filter((x) => !x.startsWith('rgb(var'));
      if (lits.length) offenders.push(`${sel.slice(0, 50)} -> ${lits.join(' ')}`);
    }
    expect(offenders, `these rules spell a colour instead of asking ${THEME}`).toEqual([]);
  });

  it.each(['src/popup/styles.css', 'src/options/styles.css'])('%s', (path) => {
    const css = uncomment(read(path));
    expect(css.match(colour()) ?? [], `spelled in ${path} instead of asking ${THEME}`).toEqual([]);
    // `theme()` inlines the raw Tailwind value, which is an <alpha-value>
    // template now and not a colour.
    expect(css).not.toMatch(/theme\(['"]colors\./);
    expect(css).toContain("@import '../shared/theme.css'");
  });

  it('the Tailwind config decides nothing', () => {
    const cfg = uncomment(read('tailwind.config.ts'));
    expect(cfg.match(colour()) ?? [], 'tailwind.config.ts holds a palette again').toEqual([]);
    // Channel triples, so `bg-kick-primary/10` keeps working.
    expect(cfg).toMatch(/rgb\(var\(--kt-\$\{name\}-rgb\) \/ <alpha-value>\)/);
  });

  // Control: the check has to see a colour that is really there, or the four
  // assertions above would pass on a regex that matches nothing.
  it('sees a colour when there is one', () => {
    const sample = uncomment('.x { color: #ff0000; } /* #00ff00 is only a note */');
    expect(sample.match(colour())).toEqual(['#ff0000']);
  });
});
