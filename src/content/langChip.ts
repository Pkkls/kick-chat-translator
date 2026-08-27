/**
 * Language chip — the control that lives INSIDE Kick's message box.
 *
 * It sits next to the emote button, at the right end of the row you type in.
 * That position is the whole point: changing the language you write in must
 * never mean travelling to the top of the chat and back. Everything the chip
 * does is reachable without moving the pointer away from the text field.
 *
 * One click toggles between the channel's language (auto) and the first
 * favourite. Press-and-hold, or the Down arrow, opens the list. The list is
 * seeded by whatever you pick, so there is no configuration step and the
 * favourites never reorder themselves under the pointer between two clicks.
 *
 * Anchoring rules, learned the hard way elsewhere in this codebase: the panel
 * is re-rendered by Kick's SPA, so the chip has to be re-mountable at any time,
 * and it must never be the reason a layout moves.
 */
import { LANGUAGES, getLang } from '~/shared/languages';

const CHIP_ID = 'kt-lang-chip';
const MENU_ID = 'kt-lang-menu';
const HOLD_MS = 400;

export type ChipMode = 'auto' | 'pinned' | 'off' | 'loading' | 'error';

export interface ChipState {
  mode: ChipMode;
  /** ISO code shown on the chip. Ignored when mode is 'off' or 'loading'. */
  code: string;
  /** Languages offered above the full list, most recent first. */
  favorites: readonly string[];
}

export interface ChipHandlers {
  /** A language was chosen, either by toggling or from the list. */
  onPick: (code: string) => void;
  /** The chip was toggled back to following the channel's language. */
  onAuto: () => void;
}

interface Mounted {
  chip: HTMLButtonElement;
  menu: HTMLElement;
  host: Element;
  cleanup: (() => void)[];
}

let ui: Mounted | undefined;

/**
 * The row Kick draws around the text field — the one holding the shield, the
 * input and the emote button.
 *
 * Walking up from the editable node rather than matching a class: Kick renames
 * classes between releases, but the shape of the row (a box a bit taller than
 * the text, holding more than one child) is stable. Falls back to the
 * composer's own parent, which always exists.
 */
export function findComposerRow(composer: HTMLElement): Element {
  let node: HTMLElement | null = composer.parentElement;
  for (let depth = 0; node && depth < 4; depth++) {
    const box = node.getBoundingClientRect();
    // A row, not a column: wider than tall, and short enough to be one line.
    const isRow = box.width > box.height * 3 && box.height > 0 && box.height < 90;
    if (isRow && node.childElementCount > 1) return node;
    node = node.parentElement;
  }
  return composer.parentElement ?? composer;
}

function makeChip(): HTMLButtonElement {
  const chip = document.createElement('button');
  chip.id = CHIP_ID;
  chip.type = 'button';
  chip.className = 'kt-chip';
  chip.setAttribute('aria-haspopup', 'listbox');
  chip.setAttribute('aria-expanded', 'false');

  const tag = document.createElement('span');
  tag.className = 'kt-chip-tag';
  chip.appendChild(tag);
  return chip;
}

function makeMenu(): HTMLElement {
  const menu = document.createElement('div');
  menu.id = MENU_ID;
  menu.className = 'kt-chip-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;
  return menu;
}

/** Rows of the list: the favourites first, then every supported language. */
function fillMenu(menu: HTMLElement, state: ChipState, h: ChipHandlers, close: () => void): void {
  menu.textContent = '';

  const add = (code: string, name: string, group: string): void => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'kt-chip-row';
    row.dataset.code = code;
    row.dataset.group = group;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(code === state.code));

    const iso = document.createElement('span');
    iso.className = 'kt-chip-iso';
    iso.textContent = code === 'auto' ? '' : code.toUpperCase();
    row.appendChild(iso);

    const label = document.createElement('span');
    label.className = 'kt-chip-name';
    label.textContent = name;
    row.appendChild(label);

    row.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      if (code === 'auto') h.onAuto();
      else h.onPick(code);
    });
    menu.appendChild(row);
  };

  add('auto', autoLabel(), 'auto');

  const seen = new Set<string>(['auto']);
  for (const code of state.favorites) {
    if (seen.has(code)) continue;
    seen.add(code);
    const info = getLang(code);
    if (info) add(code, localName(code, info.native), 'fav');
  }

  const sep = document.createElement('div');
  sep.className = 'kt-chip-sep';
  menu.appendChild(sep);

  // Sorted with the UI locale's collation, on the names actually displayed —
  // a plain sort puts Čeština after Zulu in any locale that has accents.
  const rest = LANGUAGES.filter((l) => !seen.has(l.code))
    .map((l) => ({ code: l.code, name: localName(l.code, l.native) }))
    .sort((a, b) => collator().compare(a.name, b.name));
  for (const l of rest) add(l.code, l.name, 'all');
}

let cachedCollator: Intl.Collator | undefined;
function collator(): Intl.Collator {
  cachedCollator ??= new Intl.Collator(uiLocale());
  return cachedCollator;
}

/**
 * The interface language.
 *
 * `chrome` is absent under test and in any non-extension context, and reading a
 * missing binding throws rather than yielding undefined — hence the typeof
 * guard rather than optional chaining.
 */
function uiLocale(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage() || navigator.language || 'en';
    }
    return navigator.language || 'en';
  } catch {
    return 'en';
  }
}

/**
 * A string from the extension's catalogue.
 *
 * `chrome.i18n` reads `_locales/` without pulling the options-page translation
 * bundle into this script, which is deliberately free of it. Falls back to the
 * English source string outside an extension context, and under test.
 */
function msg(key: string, fallback: string): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
      return chrome.i18n.getMessage(key) || fallback;
    }
  } catch {
    /* not running as an extension */
  }
  return fallback;
}

function autoLabel(): string {
  return msg('chipAuto', "Channel's language");
}

/**
 * The language's name in the reader's own language.
 *
 * The list used to render in English whatever the interface language was, so a
 * Japanese user configuring a fully translated extension still met a list they
 * could not read. Intl.DisplayNames knows all of these already; falling back to
 * the native name keeps the row meaningful if it ever answers nothing.
 */
export function localName(code: string, fallback: string): string {
  try {
    const dn = new Intl.DisplayNames([uiLocale()], { type: 'language' });
    return dn.of(code) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * True when some ancestor would clip a popup drawn outside the box.
 *
 * The message box is Kick's, not ours, and nothing stops it carrying
 * `overflow: hidden`. An absolutely positioned list inside a clipping ancestor
 * is silently cut in half, which looks like the feature is broken rather than
 * mispositioned — so this is worth a few reads of the cascade on each open.
 */
export function isClipped(el: Element): boolean {
  let node: Element | null = el.parentElement;
  while (node && node !== document.body) {
    const s = getComputedStyle(node);
    // The shorthand has to be read too: a page that sets `overflow` alone
    // leaves the longhands empty in some engines, and the clip goes unseen.
    if (/hidden|clip|auto|scroll/.test(`${s.overflow} ${s.overflowX} ${s.overflowY}`)) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Anchor the list. Normally it rides with the chip; inside a clipping ancestor
 * it switches to viewport coordinates so it stays whole. Also flips below the
 * chip when there is not enough room above.
 */
function placeMenu(chip: HTMLElement, menu: HTMLElement): void {
  menu.classList.remove('kt-chip-menu-fixed');
  menu.style.cssText = '';
  if (!isClipped(chip)) return;

  const r = chip.getBoundingClientRect();
  const gap = 6;
  const h = Math.min(menu.scrollHeight, 320);
  const above = r.top - gap - h >= 0;
  menu.classList.add('kt-chip-menu-fixed');
  menu.style.left = `${Math.max(8, Math.min(r.right - 190, window.innerWidth - 198))}px`;
  if (above) menu.style.top = `${r.top - gap - h}px`;
  else menu.style.top = `${r.bottom + gap}px`;
}

export function isLangChipMounted(): boolean {
  return Boolean(ui && document.getElementById(CHIP_ID));
}

export function mountLangChip(composer: HTMLElement, state: ChipState, h: ChipHandlers): void {
  if (ui && ui.chip.isConnected && document.getElementById(CHIP_ID)) return;
  unmountLangChip();

  const host = findComposerRow(composer);
  const chip = makeChip();
  const menu = makeMenu();
  const cleanup: (() => void)[] = [];

  const close = (): void => {
    menu.hidden = true;
    chip.setAttribute('aria-expanded', 'false');
  };
  const open = (): void => {
    fillMenu(menu, current, h, close);
    menu.hidden = false;
    chip.setAttribute('aria-expanded', 'true');
    placeMenu(chip, menu);
    menu.querySelector<HTMLElement>('.kt-chip-row')?.focus();
  };

  let current = state;
  let held = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onDown = (): void => {
    held = false;
    timer = setTimeout(() => {
      held = true;
      open();
    }, HOLD_MS);
  };
  const stopHold = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const onClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (held) {
      held = false;
      return;
    }
    if (current.mode === 'off') return;
    // No favourite yet: the list IS the first interaction, and whatever gets
    // picked becomes the favourite. No empty state to design around.
    if (current.mode === 'auto' && current.favorites.length === 0) {
      open();
      return;
    }
    if (current.mode === 'auto') h.onPick(current.favorites[0]!);
    else h.onAuto();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open();
    }
  };

  chip.addEventListener('pointerdown', onDown);
  chip.addEventListener('pointerup', stopHold);
  chip.addEventListener('pointerleave', stopHold);
  chip.addEventListener('pointercancel', stopHold);
  chip.addEventListener('click', onClick);
  chip.addEventListener('keydown', onKey);
  cleanup.push(() => {
    stopHold();
    chip.removeEventListener('pointerdown', onDown);
    chip.removeEventListener('pointerup', stopHold);
    chip.removeEventListener('pointerleave', stopHold);
    chip.removeEventListener('pointercancel', stopHold);
    chip.removeEventListener('click', onClick);
    chip.removeEventListener('keydown', onKey);
  });

  const onMenuKey = (e: KeyboardEvent): void => {
    const rows = Array.from(menu.querySelectorAll<HTMLElement>('.kt-chip-row'));
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      rows[(i + 1) % rows.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      rows[(i - 1 + rows.length) % rows.length]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      chip.focus(); // focus returns to what opened the list
    }
  };
  menu.addEventListener('keydown', onMenuKey);
  cleanup.push(() => menu.removeEventListener('keydown', onMenuKey));

  const onDocClick = (e: Event): void => {
    if (menu.hidden) return;
    if (!menu.contains(e.target as Node) && e.target !== chip) close();
  };
  document.addEventListener('click', onDocClick);
  cleanup.push(() => document.removeEventListener('click', onDocClick));

  const wrap = document.createElement('div');
  wrap.className = 'kt-chip-host';
  wrap.appendChild(chip);
  wrap.appendChild(menu);
  host.appendChild(wrap);

  ui = { chip, menu, host, cleanup };
  updateLangChip(state);
  // `current` is what the handlers read when the list is built later.
  const track = (s: ChipState): void => {
    current = s;
  };
  trackers.push(track);
  cleanup.push(() => {
    const i = trackers.indexOf(track);
    if (i >= 0) trackers.splice(i, 1);
  });
}

const trackers: ((s: ChipState) => void)[] = [];

export function updateLangChip(state: ChipState): void {
  for (const t of trackers) t(state);
  if (!ui) return;
  const { chip } = ui;
  const tag = chip.querySelector<HTMLElement>('.kt-chip-tag');
  if (!tag) return;

  chip.dataset.mode = state.mode;
  switch (state.mode) {
    case 'off':
      tag.textContent = 'OFF';
      chip.title = msg('chipPaused', 'Translation paused');
      break;
    case 'loading':
      tag.textContent = '···';
      chip.title = msg('chipLoading', 'Translating…');
      break;
    case 'error':
      tag.textContent = '!';
      chip.title = msg('chipError', 'Translation unavailable. Click to retry.');
      break;
    case 'auto':
      tag.textContent = state.code ? state.code.toUpperCase() : 'AUTO';
      chip.title = `Writing in the channel's language (${state.code.toUpperCase()}). Click to switch, hold for the list.`;
      break;
    default:
      tag.textContent = state.code.toUpperCase();
      chip.title = `Writing in ${localName(state.code, state.code.toUpperCase())}. Click for the channel's language, hold for the list.`;
  }
  chip.setAttribute('aria-label', chip.title);
}

export function unmountLangChip(): void {
  if (!ui) {
    document.getElementById(CHIP_ID)?.closest('.kt-chip-host')?.remove();
    return;
  }
  for (const fn of ui.cleanup) fn();
  ui.chip.closest('.kt-chip-host')?.remove();
  ui = undefined;
}
