import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountLangChip, unmountLangChip, updateLangChip } from './langChip';

/**
 * The chip's tooltip is also its accessible name, and it was English-only in
 * exactly the two states a user sees all the time.
 *
 * `off`, `loading` and `error` went through chrome.i18n; `auto` and `pinned`
 * were template literals, so the two common states were the untranslated ones.
 * That is backwards, and nothing caught it: these live in public/_locales,
 * reached through msg(), not through the t() catalogues the coverage test
 * scans.
 */
const LOCALES = 'public/_locales';

function catalogue(loc: string): Record<string, { message: string; placeholders?: object }> {
  return JSON.parse(readFileSync(`${LOCALES}/${loc}/messages.json`, 'utf8'));
}

function mount(): HTMLElement {
  const composer = document.createElement('div');
  composer.setAttribute('contenteditable', 'true');
  document.body.appendChild(composer);
  mountLangChip(
    composer,
    { mode: 'pinned', code: 'ja', favorites: ['ja'] },
    { onPick: () => undefined, onAuto: () => undefined },
  );
  return document.querySelector<HTMLElement>('.kt-chip')!;
}

afterEach(() => {
  unmountLangChip();
  document.body.textContent = '';
  vi.unstubAllGlobals();
});

describe('chip labelling', () => {
  it('points at the list it says it opens', () => {
    const chip = mount();
    const id = chip.getAttribute('aria-controls');
    expect(chip.getAttribute('aria-haspopup')).toBe('listbox');
    expect(id).toBeTruthy();
    // aria-controls naming an element that is not there is worse than none.
    expect(document.getElementById(id!)).not.toBeNull();
  });

  it('names itself in every state, never leaving the code to speak alone', () => {
    const chip = mount();
    for (const mode of ['auto', 'pinned', 'off', 'loading', 'error'] as const) {
      updateLangChip({ mode, code: 'ja', favorites: ['ja'] });
      const label = chip.getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(10);
      expect(label).toBe(chip.title);
    }
  });

  it('asks the catalogue for the two common states, with the language filled in', () => {
    const asked: [string, string[] | undefined][] = [];
    vi.stubGlobal('chrome', {
      i18n: {
        getMessage: (key: string, subs?: string[]) => {
          asked.push([key, subs]);
          return key === 'chipPinnedTip' ? `PINNED ${subs?.[0]}` : '';
        },
      },
    });
    const chip = mount();
    updateLangChip({ mode: 'pinned', code: 'ja', favorites: ['ja'] });
    expect(asked.some(([k]) => k === 'chipPinnedTip')).toBe(true);
    expect(chip.title).toBe('PINNED Japanese');

    updateLangChip({ mode: 'auto', code: 'es', favorites: ['ja'] });
    const auto = asked.find(([k]) => k === 'chipAutoTip');
    expect(auto?.[1]).toEqual(['ES']);
  });

  it('substitutes the placeholder in the fallback too, so the two cannot drift', () => {
    // No chrome at all: the fallback string is what ships, and it carries the
    // same $LANG$ the catalogue entry does.
    const chip = mount();
    updateLangChip({ mode: 'pinned', code: 'ja', favorites: ['ja'] });
    expect(chip.title).not.toContain('$LANG$');
    expect(chip.title).toContain('Japanese');
  });

  it('keeps every catalogue on the same keys', () => {
    const locales = readdirSync(LOCALES);
    expect(locales.length).toBeGreaterThan(1);
    const base = Object.keys(catalogue('en')).sort();
    for (const loc of locales) {
      expect({ loc, keys: Object.keys(catalogue(loc)).sort() }).toEqual({ loc, keys: base });
    }
  });

  it('declares the placeholder wherever a message uses one', () => {
    for (const loc of readdirSync(LOCALES)) {
      for (const [key, entry] of Object.entries(catalogue(loc))) {
        if (!entry.message.includes('$LANG$')) continue;
        expect({ loc, key, has: Boolean(entry.placeholders) }).toEqual({ loc, key, has: true });
      }
    }
  });
});

describe('menu rows', () => {
  const css = readFileSync('src/content/inject.css', 'utf8');
  /**
   * Body of the rule whose selector list is exactly `selector`.
   *
   * indexOf('.kt-chip-iso {') looked equivalent and was not: it matches inside
   * the longer light-theme selector first, and that rule carries colours only,
   * so the width came back 0 and the assertion failed on a value that is right
   * there in the file.
   */
  const rule = (selector: string) => {
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const head = m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (head === selector) return m[2]!;
    }
    return '';
  };

  /**
   * Two of the 42 codes carry a region: pt-br and zh-tw. At 22px the column
   * could not hold five characters, so those two wrapped onto a second line and
   * their rows came out half again as tall as their neighbours. Measured after:
   * all 43 rows are 30px.
   */
  it('gives the code column room for the longest code, and forbids wrapping', () => {
    const iso = rule('.kt-chip-iso');
    const width = Number(/width:\s*(\d+)px/.exec(iso)?.[1] ?? 0);
    expect(width).toBeGreaterThanOrEqual(34);
    expect(iso).toMatch(/white-space:\s*nowrap/);
  });

  it('keeps the menu wide enough for that column plus a name', () => {
    const min = Number(/min-width:\s*(\d+)px/.exec(rule('.kt-chip-menu'))?.[1] ?? 0);
    expect(min).toBeGreaterThanOrEqual(202);
  });

  // Control: the longest code really is five characters, so 34px is sized to
  // the data rather than to a number that looked comfortable.
  it('is sized against the actual language list', () => {
    const codes = [...readFileSync('src/shared/languages.ts', 'utf8').matchAll(/code: '([a-z-]+)'/g)]
      .map((m) => m[1]!);
    expect(codes.length).toBeGreaterThan(40);
    expect(Math.max(...codes.map((c) => c.length))).toBe(5);
  });
});
