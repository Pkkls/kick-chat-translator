import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountLangChip, unmountLangChip } from './langChip';

/**
 * Closing the list has to hand focus back to the chip that opened it.
 *
 * Escape did. Picking a language did not: the row was removed from the tab
 * order as the menu hid, focus fell to <body>, and a keyboard user who had just
 * chosen their language had to tab in from the top of the page to get anywhere
 * near the chat again. Measured in Chrome before the fix: Enter left
 * document.activeElement on BODY.
 */
function open(): { chip: HTMLElement; picks: string[] } {
  const composer = document.createElement('div');
  composer.setAttribute('contenteditable', 'true');
  document.body.appendChild(composer);
  const picks: string[] = [];
  mountLangChip(
    composer,
    { mode: 'pinned', code: 'ja', favorites: ['ja', 'es'] },
    { onPick: (c) => picks.push(c), onAuto: () => picks.push('auto') },
  );
  const chip = document.querySelector<HTMLElement>('.kt-chip')!;
  chip.focus();
  chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  return { chip, picks };
}

const rows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.kt-chip-row:not([hidden])'));

afterEach(() => {
  unmountLangChip();
  document.body.textContent = '';
  vi.unstubAllGlobals();
});

describe('chip menu focus', () => {
  it('opens on ArrowDown and lands in the filter field', () => {
    open();
    expect(document.querySelector('.kt-chip')!.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(document.querySelector('.kt-chip-search'));
  });

  it('gives focus back to the chip when a language is picked', () => {
    const { chip, picks } = open();
    const spanish = rows().find((r) => r.dataset.code === 'es')!;
    spanish.focus();
    spanish.click();
    expect(picks).toEqual(['es']);
    expect(document.activeElement).toBe(chip);
  });

  it('gives it back on Escape too', () => {
    const { chip } = open();
    const menu = document.querySelector<HTMLElement>('.kt-chip-menu')!;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(chip);
  });

  /**
   * The control for the two above: the outside-click listener runs on `click`,
   * after focus has already moved to whatever was clicked. Pulling focus back
   * there would drag it off a Kick control the user just aimed at.
   */
  it('leaves focus alone when the list is dismissed by clicking elsewhere', () => {
    const { chip } = open();
    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    elsewhere.click();
    expect(document.querySelector<HTMLElement>('.kt-chip-menu')!.hidden).toBe(true);
    expect(document.activeElement).toBe(elsewhere);
    expect(document.activeElement).not.toBe(chip);
  });
});
