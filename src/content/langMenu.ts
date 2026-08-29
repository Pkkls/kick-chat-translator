/**
 * The language list, shared by the chip in the action bar and the float bar.
 *
 * There is one of these on purpose. The float bar used a native <select> with
 * 43 options: measured on a live channel, its dropdown covered 845 of the chat
 * panel's 890 pixels, and a native dropdown is drawn by the system, outside the
 * document, where no stylesheet and no max-height can reach it. Writing a
 * second menu to fix that would leave two lists to keep in agreement, so the
 * chip's list became this module and the bar calls it too.
 *
 * The shape answers one situation: someone streaming in a language that is not
 * their own, switching between three or four of them live, while the chat
 * scrolls. So the favourites sit on top as flag tiles, taken by colour without
 * reading and without scrolling, and everything else is two keystrokes away
 * through the filter. Forty-two rows fit in no window at screen height, so the
 * list is not meant to be walked.
 */
import { LANGUAGES, getLang, uiLocale } from '~/shared/languages';
import { flagClass } from '~/shared/flags';
import { msg } from './msg';

export interface LangMenuState {
  /** The code currently in effect, shown as the selected option. */
  code: string;
  /** Offered above the full list, most recent first. */
  favorites: readonly string[];
}

export interface LangMenuHandlers {
  /** A language was chosen. */
  onPick: (code: string) => void;
  /** The reader went back to following the channel's language. */
  onAuto: () => void;
  /**
   * A language was added to or removed from the favourites. Optional: a caller
   * that does not store favourites simply gets no star.
   */
  onToggleFavorite?: (code: string) => void;
}

/** Verbatim lucide paths. A hand-approximated path renders a broken glyph. */
const ICONS: Readonly<Record<string, string>> = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  star:
    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};

function icon(name: keyof typeof ICONS, cls: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `kt-lang-ico ${cls}`.trim());
  // innerHTML on an SVG element takes markup we wrote ourselves, from the table
  // above; nothing here comes from the page or from a translation.
  svg.innerHTML = ICONS[name] ?? '';
  return svg;
}

/**
 * Does this language match what was typed?
 *
 * Matches the name and the ISO code, accent-insensitively, so someone typing
 * "francais" finds "Français" and someone typing "br" finds "pt-br".
 */
export function matchesQuery(name: string, code: string, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return fold(name).includes(q) || fold(code).includes(q);
}

function fold(s: string): string {
  return s
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Collation for the language list, cached against the locale it was built for.
 *
 * It used to be cached outright. That was safe while the locale came from the
 * browser and could not change inside a page; it is not now that it comes from
 * a setting the user can change with the chat open, and a stale collator sorts
 * the list by the language they just left.
 */
let cachedCollator: { locale: string; c: Intl.Collator } | undefined;
function collator(): Intl.Collator {
  const locale = uiLocale();
  if (cachedCollator?.locale !== locale) cachedCollator = { locale, c: new Intl.Collator(locale) };
  return cachedCollator.c;
}

/**
 * The language's name in the reader's own language.
 *
 * The list used to render in English whatever the interface language was, so a
 * Japanese reader configuring a fully translated extension still met a list
 * they could not read. Intl.DisplayNames knows all of these already; falling
 * back to the native name keeps a name on screen if it does not.
 */
export function localName(code: string, fallback: string): string {
  try {
    const dn = new Intl.DisplayNames([uiLocale()], { type: 'language' });
    const n = dn.of(code);
    if (n && n !== code) return n;
  } catch {
    /* Intl.DisplayNames is missing or refuses the tag; the native name stands. */
  }
  return fallback;
}

/** Is any ancestor clipping this element? */
export function isClipped(el: Element): boolean {
  let p: Element | null = el.parentElement;
  while (p && p !== document.body) {
    const s = getComputedStyle(p);
    if (/hidden|clip|auto|scroll/.test(`${s.overflow} ${s.overflowX} ${s.overflowY}`)) return true;
    p = p.parentElement;
  }
  return false;
}

/** The empty panel, ready to be filled. Hidden until something opens it. */
export function makeLangMenu(id: string): HTMLElement {
  const menu = document.createElement('div');
  menu.id = id;
  menu.className = 'kt-lang-panel';
  menu.hidden = true;
  return menu;
}

interface Row {
  el: HTMLElement;
  code: string;
  name: string;
}

/**
 * Fill the panel and wire it.
 *
 * @param close Called after a pick, and by Escape. The caller owns hiding the
 *   panel and returning focus, because only it knows what opened it.
 */
export function fillLangMenu(
  menu: HTMLElement,
  state: LangMenuState,
  h: LangMenuHandlers,
  close: () => void,
): void {
  menu.textContent = '';
  const listId = `${menu.id}-list`;

  const searchWrap = document.createElement('div');
  searchWrap.className = 'kt-lang-search';
  searchWrap.appendChild(icon('search', ''));
  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'kt-lang-input';
  search.setAttribute('role', 'combobox');
  search.setAttribute('aria-expanded', 'true');
  search.setAttribute('aria-controls', listId);
  search.setAttribute('aria-autocomplete', 'list');
  search.setAttribute('aria-label', msg('chipSearch', 'Filter languages'));
  search.placeholder = msg('chipSearch', 'Filter languages');
  searchWrap.appendChild(search);
  menu.appendChild(searchWrap);

  const box = document.createElement('div');
  box.id = listId;
  box.setAttribute('role', 'listbox');
  box.setAttribute('aria-label', msg('chipSearch', 'Filter languages'));
  menu.appendChild(box);

  const rows: Row[] = [];
  const seen = new Set<string>();

  // ── Favourites, as flag tiles on one row ──────────────────────────────
  // No heading above them: four tiles over a hairline read as a group without
  // being named, and naming it would cost a row of height on a panel whose
  // whole point is to stop covering the chat. The name is on the group for
  // anyone who cannot see the composition.
  const favs = state.favorites.filter((c) => getLang(c));
  if (favs.length) {
    const strip = document.createElement('div');
    strip.className = 'kt-lang-favs';
    strip.setAttribute('role', 'group');
    strip.setAttribute('aria-label', msg('langFavorites', 'Favourites'));
    for (const code of favs) {
      seen.add(code);
      const info = getLang(code);
      if (!info) continue;
      const name = localName(code, info.native);
      const tile = document.createElement('div');
      tile.className = 'kt-lang-fav';
      tile.setAttribute('role', 'option');
      tile.tabIndex = -1;
      tile.setAttribute('aria-selected', String(code === state.code));
      tile.setAttribute('aria-label', name);

      const fc = flagClass(code);
      if (fc) {
        const flag = document.createElement('span');
        flag.className = fc;
        tile.appendChild(flag);
      }
      const tag = document.createElement('span');
      tag.className = 'kt-lang-tag';
      tag.textContent = code.toUpperCase();
      tile.appendChild(tag);

      tile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
        h.onPick(code);
      });
      strip.appendChild(tile);
      rows.push({ el: tile, code, name });
    }
    box.appendChild(strip);

    const sep = document.createElement('div');
    sep.className = 'kt-lang-sep';
    sep.setAttribute('role', 'presentation');
    box.appendChild(sep);
  }

  // ── Everything else, scrollable ───────────────────────────────────────
  const list = document.createElement('div');
  list.className = 'kt-lang-list';
  // axe asks a scrollable region to be reachable by keyboard. It costs no tab
  // stop while the panel is shut, which is the only state the bar is measured
  // in, and it is one more Tab away only once the panel is already open.
  list.tabIndex = 0;
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', msg('langAll', 'All languages'));
  box.appendChild(list);

  const addRow = (code: string, name: string, isAuto: boolean): void => {
    const row = document.createElement('div');
    row.className = 'kt-lang-row';
    row.setAttribute('role', 'option');
    row.tabIndex = -1;
    row.setAttribute('aria-selected', String(code === state.code));
    row.dataset.code = code;
    row.dataset.name = name;

    if (isAuto) {
      const globe = document.createElement('span');
      globe.className = 'kt-lang-globe';
      globe.appendChild(icon('globe', ''));
      row.appendChild(globe);
    } else {
      const fc = flagClass(code);
      if (fc) {
        const flag = document.createElement('span');
        flag.className = `${fc} kt-lang-flag`;
        row.appendChild(flag);
      } else {
        // No flag rather than a wrong one; the gap keeps the columns aligned.
        const hole = document.createElement('span');
        hole.className = 'kt-lang-globe';
        row.appendChild(hole);
      }
    }

    const iso = document.createElement('span');
    iso.className = 'kt-lang-iso';
    iso.textContent = isAuto ? 'AUTO' : code.toUpperCase();
    row.appendChild(iso);

    const label = document.createElement('span');
    label.className = 'kt-lang-name';
    label.textContent = name;
    row.appendChild(label);

    if (!isAuto && h.onToggleFavorite) {
      const star = icon('star', 'kt-lang-star');
      star.dataset.on = 'false';
      // A <button> inside role="option" is invalid, and 42 focusable stars
      // would be 42 tab stops. Pointer here, Alt+Enter on the focused row.
      star.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        h.onToggleFavorite?.(code);
      });
      row.appendChild(star);
    }

    row.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      if (isAuto) h.onAuto();
      else h.onPick(code);
    });
    list.appendChild(row);
    rows.push({ el: row, code, name });
  };

  addRow('auto', msg('chipAuto', "Channel's language"), true);
  seen.add('auto');

  const rest = LANGUAGES.filter((l) => !seen.has(l.code))
    .map((l) => ({ code: l.code, name: localName(l.code, l.native) }))
    // Sorted with the UI locale's collation, on the names actually displayed:
    // a plain sort puts Čeština after Zulu in any locale that has accents.
    .sort((a, b) => collator().compare(a.name, b.name));
  for (const l of rest) addRow(l.code, l.name, false);

  const empty = document.createElement('div');
  empty.className = 'kt-lang-empty';
  empty.setAttribute('role', 'status');
  empty.hidden = true;
  empty.textContent = msg('chipNoMatch', 'No language matches');
  list.appendChild(empty);

  const strip = box.querySelector<HTMLElement>('.kt-lang-favs');
  const sep = box.querySelector<HTMLElement>('.kt-lang-sep');

  const applyFilter = (): void => {
    const q = search.value;
    let shown = 0;
    for (const r of rows) {
      const hit = matchesQuery(r.name, r.code, q);
      r.el.hidden = !hit;
      if (hit) shown++;
    }
    // While filtering, the favourites strip and its hairline only get in the
    // way: what was typed is the grouping now.
    const filtering = q.trim().length > 0;
    if (strip) strip.hidden = filtering;
    if (sep) sep.hidden = filtering;
    empty.hidden = shown > 0;
  };

  const visible = (): HTMLElement[] => rows.filter((r) => !r.el.hidden).map((r) => r.el);

  const move = (from: HTMLElement | null, step: number): void => {
    const v = visible();
    if (!v.length) return;
    const i = from ? v.indexOf(from) : -1;
    const next = v[Math.max(0, Math.min(v.length - 1, i + step))];
    next?.focus();
  };

  search.addEventListener('input', applyFilter);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      visible()[0]?.focus();
    } else if (e.key === 'Enter') {
      // Enter on a single remaining match picks it: two keystrokes, no pointer.
      e.preventDefault();
      visible()[0]?.click();
    }
  });

  box.addEventListener('keydown', (e) => {
    const here = document.activeElement as HTMLElement | null;
    const onRow = here?.classList.contains('kt-lang-row') || here?.classList.contains('kt-lang-fav');
    if (!onRow) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(here!, 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const v = visible();
      if (v.indexOf(here!) === 0) search.focus();
      else move(here!, -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      visible()[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const v = visible();
      v[v.length - 1]?.focus();
    } else if (e.key === 'Enter' && e.altKey) {
      // The star has no tab stop, so this is its keyboard equivalent.
      e.preventDefault();
      const code = here!.dataset.code;
      if (code && h.onToggleFavorite) h.onToggleFavorite(code);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      here!.click();
    }
  });

  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });
}

/** Put the focus where the panel expects it when it opens. */
export function focusLangMenu(menu: HTMLElement): void {
  menu.querySelector<HTMLInputElement>('.kt-lang-input')?.focus();
}

/**
 * Anchor the panel. Normally it rides with what opened it; inside a clipping
 * ancestor it switches to viewport coordinates so it stays whole. Flips to the
 * other side of the anchor when there is not enough room on the preferred one.
 *
 * @param prefer Which side to try first. The chip sits at the bottom of the
 *   chat and opens upward; the float bar sits at the top and opens downward.
 */
export function placeLangMenu(
  anchor: HTMLElement,
  menu: HTMLElement,
  prefer: 'above' | 'below' = 'above',
): void {
  menu.classList.remove('kt-lang-panel-fixed');
  menu.style.cssText = '';

  // Two different ways the panel goes wrong, and only one used to be handled.
  //
  // Clipping: an ancestor with overflow hidden cuts it off, which isClipped
  // detects. Leaving the viewport: the flow position is set by CSS alone, which
  // knows nothing about the window. Measured at 420x520 with the chip at y=194,
  // the menu opened upward and its top landed at -132, a third of the list
  // above the top of the screen with no way to reach it.
  const flow = menu.getBoundingClientRect();
  const insideViewport =
    flow.top >= 0 &&
    flow.left >= 0 &&
    flow.right <= window.innerWidth &&
    flow.bottom <= window.innerHeight;
  if (!isClipped(anchor) && insideViewport) return;

  // Seen live on kick.com: this ran off the left of the chat column and over
  // the video player, and off the top of the window, because the only bound it
  // respected was the RIGHT edge. Every edge is clamped now, and the height is
  // whatever actually fits, not a fixed number the window may not have.
  const GAP = 6;
  const MARGIN = 8;
  const W = menu.offsetWidth || 236;
  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const roomAbove = r.top - GAP - MARGIN;
  const roomBelow = vh - r.bottom - GAP - MARGIN;
  const wanted = Math.min(menu.scrollHeight, prefer === 'above' ? roomBelow : roomAbove);
  const above =
    prefer === 'above' ? roomAbove >= wanted || roomAbove > roomBelow : roomBelow < wanted && roomAbove > roomBelow;
  const room = Math.max(80, above ? roomAbove : roomBelow);
  const h = Math.min(menu.scrollHeight, room);

  menu.classList.add('kt-lang-panel-fixed');
  menu.style.maxHeight = `${h}px`;
  menu.style.left = `${Math.max(MARGIN, Math.min(r.right - W, vw - W - MARGIN))}px`;
  menu.style.top = `${above ? Math.max(MARGIN, r.top - GAP - h) : Math.min(r.bottom + GAP, vh - h - MARGIN)}px`;
}
