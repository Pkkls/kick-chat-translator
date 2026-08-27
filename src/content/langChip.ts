/**
 * Language chip — the control in Kick's chat action bar.
 *
 * Bottom right, beside the gear and the send button. That position is the
 * whole point: changing the language you write in must never mean travelling
 * to the top of the chat and back.
 *
 * It sat inside the message box first. Loading it on a live channel showed why
 * that was wrong: the box is Kick's editor, its internals move, and the chip
 * ended up under it rather than in it. The action bar is a row of controls
 * that already exists for exactly this kind of button.
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
const LIST_ID = 'kt-lang-list';
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
  return findActionCluster(composer) ?? composer.parentElement ?? composer;
}

/**
 * The right-hand cluster of Kick's chat action bar — the one holding the gear
 * and the send button.
 *
 * Measured on a live channel: the bar is a 380x36 row sitting as a SIBLING of
 * the composer's block, and it holds two groups — a counter pushed left, and a
 * `ml-auto` cluster pushed right. The chip belongs at the head of that right
 * cluster, so it reads as one of the chat's own controls.
 *
 * Found by shape rather than by class: walk up from the field, and for each
 * ancestor look at the next sibling. The bar is the first one that lays its
 * children side by side and contains a button.
 */
function findActionCluster(composer: HTMLElement): Element | null {
  let node: HTMLElement | null = composer;
  for (let depth = 0; node && depth < 5; depth++) {
    const bar = node.nextElementSibling;
    if (bar instanceof HTMLElement && isSideBySide(bar) && bar.querySelector('button')) {
      // The cluster pushed to the right is the last child that holds a button.
      const groups = [...bar.children].filter((k) => k.querySelector('button') ?? k.tagName === 'BUTTON');
      const right = groups[groups.length - 1];
      if (right instanceof HTMLElement && right.getBoundingClientRect().width > 0) return right;
      return bar;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * True when this element lays its children out ACROSS rather than DOWN.
 *
 * Two children at the same height with different left edges is what a row
 * actually is, and unlike a height threshold it does not depend on Kick's
 * spacing — an earlier version judged by height and missed the row by 7px.
 */
function isSideBySide(el: HTMLElement): boolean {
  const kids = [...el.children].filter((k) => {
    const b = k.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  });
  if (kids.length < 2) return false;
  for (let i = 1; i < kids.length; i++) {
    const a = kids[i - 1]!.getBoundingClientRect();
    const b = kids[i]!.getBoundingClientRect();
    if (Math.abs(a.top - b.top) < Math.max(a.height, b.height) && Math.abs(a.left - b.left) > 8) {
      return true;
    }
  }
  return false;
}

/** The chip goes at the head of the cluster, before the gear. */
function insertInRow(row: Element, wrap: HTMLElement): void {
  row.insertBefore(wrap, row.firstElementChild);
}

function makeChip(): HTMLButtonElement {
  const chip = document.createElement('button');
  chip.id = CHIP_ID;
  chip.type = 'button';
  chip.className = 'kt-chip';
  chip.setAttribute('aria-haspopup', 'listbox');
  chip.setAttribute('aria-expanded', 'false');
  chip.setAttribute('aria-controls', MENU_ID);

  const tag = document.createElement('span');
  tag.className = 'kt-chip-tag';
  chip.appendChild(tag);
  return chip;
}

/**
 * The popup. Deliberately role-less.
 *
 * A `listbox` may only contain `option` children, so putting the filter field
 * inside one is invalid — axe rejects it as a critical violation. The correct
 * shape is a combobox that owns a separate listbox, which is what this builds.
 */
function makeMenu(): HTMLElement {
  const menu = document.createElement('div');
  menu.id = MENU_ID;
  menu.className = 'kt-chip-menu';
  menu.hidden = true;
  return menu;
}

/**
 * Match a language against what was typed.
 *
 * Both the displayed name and the ISO code, because the two audiences differ:
 * someone reading a Japanese interface sees フランス語 but may well type "fr".
 * Accents are folded so "francais" finds "français".
 */
export function matchesQuery(name: string, code: string, query: string): boolean {
  const fold = (s: string): string =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = fold(query.trim());
  if (!q) return true;
  return fold(name).includes(q) || fold(code).includes(q);
}

/** Rows of the list: a filter box, the favourites, then every supported language. */
function fillMenu(menu: HTMLElement, state: ChipState, h: ChipHandlers, close: () => void): void {
  menu.textContent = '';

  // 42 languages do not fit any list at screen height, so the list is never
  // meant to be walked: two keystrokes should reach any of them. Sorting alone
  // makes the list predictable, not short.
  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'kt-chip-search';
  search.setAttribute('role', 'combobox');
  search.setAttribute('aria-expanded', 'true');
  search.setAttribute('aria-controls', LIST_ID);
  search.setAttribute('aria-autocomplete', 'list');
  search.setAttribute('aria-label', msg('chipSearch', 'Filter languages'));
  search.placeholder = msg('chipSearch', 'Filter languages');
  menu.appendChild(search);

  const list = document.createElement('div');
  list.id = LIST_ID;
  list.className = 'kt-chip-list';
  list.setAttribute('role', 'listbox');
  menu.appendChild(list);

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

    row.dataset.name = name;
    row.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      if (code === 'auto') h.onAuto();
      else h.onPick(code);
    });
    list.appendChild(row);
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
  sep.setAttribute('role', 'presentation');
  list.appendChild(sep);

  // Sorted with the UI locale's collation, on the names actually displayed —
  // a plain sort puts Čeština after Zulu in any locale that has accents.
  const rest = LANGUAGES.filter((l) => !seen.has(l.code))
    .map((l) => ({ code: l.code, name: localName(l.code, l.native) }))
    .sort((a, b) => collator().compare(a.name, b.name));
  for (const l of rest) add(l.code, l.name, 'all');

  const empty = document.createElement('div');
  empty.className = 'kt-chip-empty';
  empty.setAttribute('role', 'status');
  empty.hidden = true;
  empty.textContent = msg('chipNoMatch', 'No language matches');
  menu.appendChild(empty);

  const applyFilter = (): void => {
    const q = search.value;
    let shown = 0;
    for (const row of menu.querySelectorAll<HTMLElement>('.kt-chip-row')) {
      const hit = matchesQuery(row.dataset.name ?? '', row.dataset.code ?? '', q);
      row.hidden = !hit;
      if (hit) shown++;
    }
    // The separator only means something while both groups are on screen.
    sep.hidden = q.trim().length > 0;
    empty.hidden = shown > 0;
  };
  search.addEventListener('input', applyFilter);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      menu.querySelector<HTMLElement>('.kt-chip-row:not([hidden])')?.focus();
    } else if (e.key === 'Enter') {
      // Enter on a single remaining match picks it: two keystrokes, no pointer.
      e.preventDefault();
      const rows = menu.querySelectorAll<HTMLElement>('.kt-chip-row:not([hidden])');
      if (rows.length >= 1) rows[0]!.click();
    }
  });
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
function msg(key: string, fallback: string, subs?: string[]): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
      return chrome.i18n.getMessage(key, subs) || fallback;
    }
  } catch {
    /* not running as an extension */
  }
  // The fallback carries the same $LANG$ placeholder as the catalogue entry, so
  // the two cannot drift into saying different things.
  return subs?.length ? fallback.replace('$LANG$', subs[0]!) : fallback;
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

  // Two different ways the menu goes wrong, and only one was handled.
  //
  // Clipping: an ancestor with overflow hidden cuts it off, which isClipped
  // detects. Leaving the viewport: the flow position is set by CSS alone, which
  // knows nothing about the window. Measured at 420x520 with the chip at y=194,
  // the menu opened upward and its top landed at -132 — a third of the list
  // above the top of the screen, with no way to reach it.
  //
  // So the early return has to answer both questions, not just the first.
  const flow = menu.getBoundingClientRect();
  const insideViewport =
    flow.top >= 0 &&
    flow.left >= 0 &&
    flow.right <= window.innerWidth &&
    flow.bottom <= window.innerHeight;
  if (!isClipped(chip) && insideViewport) return;

  // Seen live on kick.com: this ran off the left of the chat column and over
  // the video player, and off the top of the window, because the only bound it
  // respected was the RIGHT edge. Every edge is clamped now, and the height is
  // whatever actually fits between the chip and the edge it opens towards —
  // not a fixed 320px the window may not have.
  const GAP = 6;
  const MARGIN = 8;
  const W = menu.offsetWidth || 190;
  const r = chip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const roomAbove = r.top - GAP - MARGIN;
  const roomBelow = vh - r.bottom - GAP - MARGIN;
  const above = roomAbove >= Math.min(menu.scrollHeight, roomBelow) || roomAbove > roomBelow;
  const room = Math.max(80, above ? roomAbove : roomBelow);
  const h = Math.min(menu.scrollHeight, room);

  menu.classList.add('kt-chip-menu-fixed');
  menu.style.maxHeight = `${h}px`;
  menu.style.left = `${Math.max(MARGIN, Math.min(r.right - W, vw - W - MARGIN))}px`;
  menu.style.top = `${above ? Math.max(MARGIN, r.top - GAP - h) : Math.min(r.bottom + GAP, vh - h - MARGIN)}px`;
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
    menu.querySelector<HTMLElement>('.kt-chip-search')?.focus();
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
    const rows = Array.from(menu.querySelectorAll<HTMLElement>('.kt-chip-row:not([hidden])'));
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
  insertInRow(host, wrap);

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
      chip.title = msg(
        'chipAutoTip',
        "Writing in the channel's language ($LANG$). Click to switch, hold for the list.",
        [state.code.toUpperCase()],
      );
      break;
    default:
      tag.textContent = state.code.toUpperCase();
      chip.title = msg(
        'chipPinnedTip',
        "Writing in $LANG$. Click for the channel's language, hold for the list.",
        [localName(state.code, state.code.toUpperCase())],
      );
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
