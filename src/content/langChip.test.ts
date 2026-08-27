import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findComposerRow,
  isClipped,
  isLangChipMounted,
  localName,
  matchesQuery,
  mountLangChip,
  unmountLangChip,
  updateLangChip,
} from './langChip';
import type { ChipState } from './langChip';
import { withFavorite } from '~/shared/languages';
import { FAVORITE_LANGS_MAX } from '~/shared/constants';

/** A message box shaped like Kick's: a wide short row holding several children. */
function makeComposerRow(): { row: HTMLElement; composer: HTMLElement } {
  document.body.innerHTML = '';
  const row = document.createElement('div');
  const shield = document.createElement('span');
  const composer = document.createElement('div');
  composer.setAttribute('contenteditable', 'true');
  const emote = document.createElement('span');
  row.append(shield, composer, emote);
  document.body.appendChild(row);

  // happy-dom reports zero boxes, so the row's shape has to be declared.
  row.getBoundingClientRect = () => ({ width: 320, height: 40, top: 0, left: 0, right: 320, bottom: 40, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return { row, composer };
}

const state = (over: Partial<ChipState> = {}): ChipState => ({
  mode: 'auto',
  code: 'ko',
  favorites: [],
  ...over,
});

const noop = { onPick: () => {}, onAuto: () => {} };

beforeEach(() => {
  unmountLangChip();
  document.body.innerHTML = '';
});

describe('findComposerRow', () => {
  it('walks up to the row that holds the input, not the input itself', () => {
    const { row, composer } = makeComposerRow();
    expect(findComposerRow(composer)).toBe(row);
  });

  // A column-shaped or single-child ancestor is not the row; without this the
  // chip lands in a wrapper and drifts away from the text field.
  it('falls back to the direct parent when no row-shaped ancestor exists', () => {
    document.body.innerHTML = '';
    const wrapper = document.createElement('div');
    const composer = document.createElement('div');
    wrapper.appendChild(composer);
    document.body.appendChild(wrapper);
    wrapper.getBoundingClientRect = () => ({ width: 300, height: 300 }) as DOMRect;
    expect(findComposerRow(composer)).toBe(wrapper);
  });
});

describe('mounting', () => {
  it('puts the chip inside the message box row', () => {
    const { row, composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    expect(row.querySelector('#kt-lang-chip')).not.toBeNull();
    expect(isLangChipMounted()).toBe(true);
  });

  it('does not mount twice', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    mountLangChip(composer, state(), noop);
    expect(document.querySelectorAll('#kt-lang-chip')).toHaveLength(1);
  });

  it('removes everything it added on unmount', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    unmountLangChip();
    expect(document.querySelector('#kt-lang-chip')).toBeNull();
    expect(document.querySelector('.kt-chip-host')).toBeNull();
    expect(isLangChipMounted()).toBe(false);
  });

  // Control: a stale chip left by a re-render must not be reported as mounted.
  it('reports not mounted once the node is gone from the document', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    document.body.innerHTML = '';
    expect(isLangChipMounted()).toBe(false);
  });
});

describe('states', () => {
  const read = () => document.querySelector<HTMLElement>('#kt-lang-chip')!;

  it('shows the ISO code when a language is pinned', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ mode: 'pinned', code: 'fr' }), noop);
    expect(read().textContent).toBe('FR');
    expect(read().dataset.mode).toBe('pinned');
  });

  it('carries every mode onto the element', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    for (const mode of ['auto', 'pinned', 'off', 'loading', 'error'] as const) {
      updateLangChip(state({ mode, code: 'fr' }));
      expect(read().dataset.mode).toBe(mode);
    }
  });

  it('always carries an accessible name', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ mode: 'pinned', code: 'fr' }), noop);
    expect(read().getAttribute('aria-label')).toBeTruthy();
  });
});

describe('interaction', () => {
  it('a click on auto with a favourite pins that favourite', () => {
    const { composer } = makeComposerRow();
    const onPick = vi.fn();
    mountLangChip(composer, state({ mode: 'auto', favorites: ['fr'] }), { onPick, onAuto: () => {} });
    document.querySelector<HTMLElement>('#kt-lang-chip')!.click();
    expect(onPick).toHaveBeenCalledWith('fr');
  });

  it('a click on a pinned chip goes back to the channel language', () => {
    const { composer } = makeComposerRow();
    const onAuto = vi.fn();
    mountLangChip(composer, state({ mode: 'pinned', code: 'fr', favorites: ['fr'] }), { onPick: () => {}, onAuto });
    document.querySelector<HTMLElement>('#kt-lang-chip')!.click();
    expect(onAuto).toHaveBeenCalled();
  });

  // With nothing pinned there is no sensible toggle target, so the click has to
  // open the list instead of doing nothing.
  it('opens the list when there is no favourite yet', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ mode: 'auto', favorites: [] }), noop);
    document.querySelector<HTMLElement>('#kt-lang-chip')!.click();
    expect(document.querySelector<HTMLElement>('#kt-lang-menu')!.hidden).toBe(false);
  });

  it('does nothing at all while translation is paused', () => {
    const { composer } = makeComposerRow();
    const onPick = vi.fn();
    const onAuto = vi.fn();
    mountLangChip(composer, state({ mode: 'off', favorites: ['fr'] }), { onPick, onAuto });
    document.querySelector<HTMLElement>('#kt-lang-chip')!.click();
    expect(onPick).not.toHaveBeenCalled();
    expect(onAuto).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLElement>('#kt-lang-menu')!.hidden).toBe(true);
  });

  it('the Down arrow opens the list', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    const chip = document.querySelector<HTMLElement>('#kt-lang-chip')!;
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.querySelector<HTMLElement>('#kt-lang-menu')!.hidden).toBe(false);
  });

  it('Escape closes the list and hands focus back to the chip', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    const chip = document.querySelector<HTMLElement>('#kt-lang-chip')!;
    const menu = document.querySelector<HTMLElement>('#kt-lang-menu')!;
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(chip);
  });

  it('lists the favourites above the full catalogue', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ favorites: ['fr', 'ja'] }), noop);
    document.querySelector<HTMLElement>('#kt-lang-chip')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const groups = Array.from(document.querySelectorAll<HTMLElement>('.kt-chip-row')).map(
      (r) => r.dataset.group,
    );
    expect(groups.slice(0, 3)).toEqual(['auto', 'fav', 'fav']);
    expect(groups).toContain('all');
  });

  it('a language never appears twice, favourite or not', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ favorites: ['fr'] }), noop);
    document.querySelector<HTMLElement>('#kt-lang-chip')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const codes = Array.from(document.querySelectorAll<HTMLElement>('.kt-chip-row')).map(
      (r) => r.dataset.code,
    );
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('localName', () => {
  it('gives the language its name rather than an ISO code', () => {
    // The bug this exists for: the list rendered in English whatever the
    // interface language was.
    expect(localName('fr', 'Français')).toMatch(/\p{L}/u);
  });

  it('falls back to the native name for a code nothing recognises', () => {
    expect(localName('zzzz', 'Fallback')).toBe('Fallback');
  });
});

describe('withFavorite', () => {
  it('puts the newest pick first', () => {
    expect(withFavorite(['fr', 'en'], 'ja')).toEqual(['ja', 'fr', 'en']);
  });

  it('moves an existing favourite up instead of duplicating it', () => {
    expect(withFavorite(['fr', 'en'], 'en')).toEqual(['en', 'fr']);
  });

  it('never grows past the cap', () => {
    const many = withFavorite(['fr', 'en', 'es', 'ja'], 'ko');
    expect(many).toHaveLength(FAVORITE_LANGS_MAX);
    expect(many[0]).toBe('ko');
  });

  it('ignores a code that is not a supported language', () => {
    expect(withFavorite(['fr'], 'zzzz')).toEqual(['fr']);
  });
});

describe('clipping', () => {
  it('does not switch to viewport coordinates when nothing clips', () => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state(), noop);
    const chip = document.querySelector<HTMLElement>('#kt-lang-chip')!;
    expect(isClipped(chip)).toBe(false);
  });

  // Control: the detection must actually fire, otherwise the escape hatch is
  // dead code that never runs where it is needed.
  it('detects an ancestor that would slice the list in half', () => {
    const { row, composer } = makeComposerRow();
    row.style.overflow = 'hidden';
    mountLangChip(composer, state(), noop);
    const chip = document.querySelector<HTMLElement>('#kt-lang-chip')!;
    expect(isClipped(chip)).toBe(true);
  });
});

describe('filtering — 42 languages must never need a scrollbar', () => {
  const openList = (favorites: string[] = []) => {
    const { composer } = makeComposerRow();
    mountLangChip(composer, state({ favorites }), noop);
    document.querySelector<HTMLElement>('#kt-lang-chip')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    return document.querySelector<HTMLInputElement>('.kt-chip-search')!;
  };
  const visible = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.kt-chip-row')).filter((r) => !r.hidden);

  it('opens with the filter focused, so typing just works', () => {
    const search = openList();
    expect(document.activeElement).toBe(search);
  });

  it('narrows the list as you type', () => {
    const search = openList();
    const before = visible().length;
    search.value = 'fr';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const after = visible().length;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  it('matches the ISO code, which is what a non-English reader types', () => {
    const search = openList();
    search.value = 'ja';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(visible().some((r) => r.dataset.code === 'ja')).toBe(true);
  });

  it('says so when nothing matches, instead of showing an empty box', () => {
    const search = openList();
    search.value = 'zzzzzz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(visible()).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('.kt-chip-empty')!.hidden).toBe(false);
  });

  it('Enter takes the first remaining match', () => {
    const { composer } = makeComposerRow();
    const onPick = vi.fn();
    mountLangChip(composer, state(), { onPick, onAuto: () => {} });
    document.querySelector<HTMLElement>('#kt-lang-chip')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const search = document.querySelector<HTMLInputElement>('.kt-chip-search')!;
    search.value = 'japan';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onPick).toHaveBeenCalled();
  });
});

describe('matchesQuery', () => {
  it('ignores accents in either direction', () => {
    expect(matchesQuery('français', 'fr', 'francais')).toBe(true);
    expect(matchesQuery('francais', 'fr', 'français')).toBe(true);
  });

  it('matches on the ISO code as well as the name', () => {
    expect(matchesQuery('フランス語', 'fr', 'fr')).toBe(true);
  });

  it('an empty query keeps everything', () => {
    expect(matchesQuery('anything', 'xx', '   ')).toBe(true);
  });

  // Control: it must actually reject, or the filter is decorative.
  it('rejects what does not match', () => {
    expect(matchesQuery('français', 'fr', 'zzz')).toBe(false);
  });
});

describe('anchoring, against the DOM actually measured on kick.com', () => {
  const box = (w: number, h: number, x: number, y: number) => () =>
    ({ width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, x, y, toJSON: () => ({}) }) as DOMRect;

  /**
   * The real shape, read off a live channel:
   *   row      380x77  @1520,818   shield | composer block | emote button
   *     shield  35x73  @1530,820
   *     block  293x73  @1565,820
   *       field 293x46 @1565,820
   *     emote   36x36  @1858,838
   */
  function liveDom() {
    document.body.innerHTML = '';
    const row = document.createElement('div');
    const shield = document.createElement('div');
    const block = document.createElement('div');
    const field = document.createElement('div');
    const emote = document.createElement('button');
    field.setAttribute('contenteditable', 'true');
    block.appendChild(field);
    row.append(shield, block, emote);
    document.body.appendChild(row);

    row.getBoundingClientRect = box(380, 77, 1520, 818);
    shield.getBoundingClientRect = box(35, 73, 1530, 820);
    block.getBoundingClientRect = box(293, 73, 1565, 820);
    field.getBoundingClientRect = box(293, 46, 1565, 820);
    emote.getBoundingClientRect = box(36, 36, 1858, 838);
    return { row, block, field, emote };
  }

  it('picks the row holding the shield and the emote, not the field wrapper', () => {
    const { row, field } = liveDom();
    expect(findComposerRow(field)).toBe(row);
  });

  // The regression this exists for: judging by height put the chip 49px below
  // the message box, because the row is 77px tall and the field only 46px.
  it('is not fooled by the row being much taller than the field', () => {
    const { row, field } = liveDom();
    const found = findComposerRow(field) as HTMLElement;
    const fb = found.getBoundingClientRect();
    const cb = field.getBoundingClientRect();
    expect(fb.height - cb.height, 'the row is legitimately much taller').toBeGreaterThan(24);
    expect(found).toBe(row);
  });

  it('mounts the chip beside the emote button, not after it', () => {
    const { row, field, emote } = liveDom();
    mountLangChip(field, state(), noop);
    const host = row.querySelector('.kt-chip-host')!;
    expect(host.nextElementSibling).toBe(emote);
  });

  it('leaves the chip on the same line as the field', () => {
    const { field } = liveDom();
    mountLangChip(field, state(), noop);
    const chip = document.querySelector('#kt-lang-chip')!;
    expect(chip.closest('div')?.parentElement?.contains(field)).toBe(true);
  });
});
