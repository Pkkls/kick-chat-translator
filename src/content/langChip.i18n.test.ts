import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { localName, mountLangChip, unmountLangChip, updateLangChip } from './langChip';
import { setContentLocale } from './msg';
import { CHAT_MESSAGES } from './i18n';

/**
 * The chip's tooltip is also its accessible name, and it was English-only in
 * exactly the two states a user sees all the time.
 *
 * `off`, `loading` and `error` went through the catalogue; `auto` and `pinned`
 * were template literals, so the two common states were the untranslated ones.
 *
 * Key parity across catalogues is checked in msg.coverage.test.ts, which reads
 * the compiled tables rather than parsing files, and the store-listing strings
 * in locales.test.ts. Two checks lived here and duplicated both.
 */
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

  it('takes the two common states from the catalogue of the language that is set', () => {
    // This used to stub chrome.i18n. The chat reads a compiled catalogue keyed
    // on `uiLang` now, because chrome.i18n answers in the browser's language and
    // MV3 offers no way to ask it for another, so the setting moved the options
    // page and left the chat where it was.
    setContentLocale('ja');
    const chip = mount();
    updateLangChip({ mode: 'pinned', code: 'ja', favorites: ['ja'] });
    expect(chip.title).toBe(
      CHAT_MESSAGES.ja!.chipPinnedTip!.replace('$LANG$', localName('ja', 'JA')),
    );

    updateLangChip({ mode: 'auto', code: 'es', favorites: ['ja'] });
    expect(chip.title).toBe(CHAT_MESSAGES.ja!.chipAutoTip!.replace('$LANG$', 'ES'));
  });

  // Control: the same two states in English come back as the fallback the code
  // carries, so the test above is reading a table rather than any string at all.
  it('falls back to the English written at the call site', () => {
    setContentLocale('en');
    const chip = mount();
    updateLangChip({ mode: 'auto', code: 'es', favorites: ['ja'] });
    expect(chip.title).toContain("Writing in the channel's language (ES)");
  });

  it('substitutes the placeholder in the fallback too, so the two cannot drift', () => {
    // No chrome at all: the fallback string is what ships, and it carries the
    // same $LANG$ the catalogue entry does.
    const chip = mount();
    updateLangChip({ mode: 'pinned', code: 'ja', favorites: ['ja'] });
    expect(chip.title).not.toContain('$LANG$');
    expect(chip.title).toContain('Japanese');
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
   * their rows came out half again as tall as their neighbours.
   *
   * The column holds a drawn 16x12 flag now, not text: pt-br draws .kt-flag-br
   * and zh-tw draws .kt-flag-tw, so neither renders a character. The width this
   * asks for is therefore the flag's, and `nowrap` stays because the ISO code
   * is still the fallback for a language with no flag.
   *
   * What used to be guarded here -- a five-character code meeting a slot too
   * narrow for it -- is guarded upstream now: flags.test.ts asserts the table
   * covers every offered language, so a language reaching this fallback fails
   * there first. Uniform row height is asserted where it can actually be seen,
   * on the rendered menu, by scratchpad/harness/lang-menu-live.mjs.
   */
  it('gives the flag column room for the flag, and forbids wrapping', () => {
    const iso = rule('.kt-chip-iso');
    const width = Number(/width:\s*(\d+)px/.exec(iso)?.[1] ?? 0);
    expect(width).toBeGreaterThanOrEqual(16);
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
