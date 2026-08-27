import injectCss from './inject.css?inline';
import type { TranslationResult } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { sortedLanguages, getLang, langFlag, resolveBrowserLang } from '~/shared/languages';
import { findChatPanel } from './selectors';
import { msg } from './msg';

const STYLE_ID = 'kt-inject-style';
const TRANS_CLASS = 'kt-translation';
const TRANS_INLINE_CLASS = 'kt-translation-inline';
const TRANS_REPLACE_CLASS = 'kt-translation-replace';
const LOADING_CLASS = 'kt-loading';
const ERROR_CLASS = 'kt-error';
const HOVER_CLASS = 'kt-hover-armed';
// Every class we add under a chat line. Cleanup walks this list, so a display
// style whose class is missing here would stack a copy per re-translation.
const ARTIFACT_CLASSES = [
  TRANS_CLASS,
  TRANS_INLINE_CLASS,
  TRANS_REPLACE_CLASS,
  LOADING_CLASS,
  ERROR_CLASS,
  HOVER_CLASS,
];
/**
 * Matches a line this extension has already dealt with, whatever the outcome:
 * translated, still in flight, or given up on.
 *
 * DERIVED from ARTIFACT_CLASSES on purpose, never hand listed. Three separate
 * callers have now picked a subset of that list and forgotten a class: the
 * compact style at item 34, the bar lookups at item 73, and the error marker
 * here, which handed every failed line back to the engine on each scroll pause.
 * Deriving takes the choice away from the caller.
 */
export const HANDLED_SELECTOR = ARTIFACT_CLASSES.map((c) => `.${c}`).join(', ');

/** #7 — Show a temporary toast at bottom-right (auto-fades after 3s). */
export function showToast(message: string): void {
  // Don't spam toasts — max 1 visible at a time.
  const existing = document.querySelector('.kt-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'kt-toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/** #8 — Copy translation text to clipboard on click. */
function attachCopyHandler(el: HTMLElement, text: string): void {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(text).then(() => {
      const orig = el.style.opacity;
      el.style.opacity = '0.4';
      setTimeout(() => (el.style.opacity = orig), 300);
    });
  });
}

/**
 * Cursor dwell before a line is sent off to be translated.
 *
 * The row is the target now, and a row is a big target: a pointer travelling
 * from the video to the message box crosses every line on the way. Waiting a
 * moment is the difference between "I stopped on this line" and "I passed over
 * it", and this style exists to spend less.
 */
const HOVER_DWELL_MS = 180;

/**
 * #2 — Arm a line to translate itself when the pointer rests on it.
 *
 * This used to append a green "Hover to translate" under every message, and
 * that is what it cost, measured in a real browser against an untouched row:
 * 31.4px became 50.6px, +61%, and a 420px window went from 13 messages to 8.
 * The style whose entire purpose is to spend less was the most expensive one on
 * screen, and it charged that on lines nobody had asked to translate.
 *
 * Nothing is drawn now. The row itself is the target, and the marker left
 * behind carries no text and no box: it exists so the "already dealt with"
 * sweep can see the line, which is a bookkeeping job, not a label.
 */
export function armHoverTranslate(target: Element, onHover: () => void): void {
  // Children walked rather than queried. A ":scope >" selector matches nothing
  // in the DOM the unit suite runs on, so a guard written that way is correct in
  // a browser and invisible to every test: this one armed the same row twice and
  // the suite had no way to say so.
  if ([...target.children].some((c) => c.classList.contains(HOVER_CLASS))) return;
  const mark = document.createElement('span');
  mark.className = HOVER_CLASS;
  target.appendChild(mark);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const fire = (): void => {
    // The listener sits on the row, which Kick's virtual scroller recycles, so
    // it can outlive the message it was armed for. The marker cannot: any path
    // that re-processes the line takes it out. Its absence is what says this
    // closure is stale, and firing anyway would put the previous message's
    // translation on somebody else's line.
    cancel();
    target.removeEventListener('mouseenter', enter);
    target.removeEventListener('mouseleave', cancel);
    if (!mark.isConnected) return;
    mark.remove();
    onHover();
  };
  const enter = (): void => {
    cancel();
    timer = setTimeout(fire, HOVER_DWELL_MS);
  };

  target.addEventListener('mouseenter', enter);
  target.addEventListener('mouseleave', cancel);
}

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = injectCss;
  document.documentElement.appendChild(style);
}

/**
 * Stamp the document with the scheme the chat is actually painted in.
 *
 * The injected UI used to switch on `prefers-color-scheme`, which is the OS
 * setting and has nothing to do with Kick: a user on a light desktop reading a
 * dark chat got the light palette — `rgba(20,25,35,.88)` text — on Kick's dark
 * ground, which is unreadable. Kick owns its own theme, so the ground is what
 * gets asked.
 *
 * Measured rather than read off a class name, because Kick's class names churn
 * and a stale one would silently pin the wrong palette.
 *
 * Returns the scheme so a caller can log or test it.
 */
export function applyChatScheme(root: Element | null = document.body): 'light' | 'dark' {
  const scheme = detectScheme(root) ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-kt-scheme', scheme);
  return scheme;
}

/** First opaque background walking up from `el`, as a light/dark verdict. */
function detectScheme(el: Element | null): 'light' | 'dark' | null {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const rgba = parseRgb(getComputedStyle(n).backgroundColor);
    // Anything translucent lets the ground below show through, so it does not
    // decide on its own — keep climbing until something actually paints.
    if (rgba && rgba[3] >= 0.9) return luminance(rgba) > 0.4 ? 'light' : 'dark';
  }
  return null;
}

function parseRgb(v: string): [number, number, number, number] | null {
  const m = v.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  return [Number(m[0]), Number(m[1]), Number(m[2]), m[3] === undefined ? 1 : Number(m[3])];
}

function luminance([r, g, b]: [number, number, number, number]): number {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * `showOriginal` off — hide Kick's own message text and leave only ours.
 *
 * One class on the document root, then a CSS rule that only bites on lines
 * already carrying a translation. Nothing is written per row, so the virtual
 * scroller recycling a line can never leave it hidden with nothing to read.
 */
export function applyShowOriginal(showOriginal: boolean): void {
  document.documentElement.classList.toggle('kt-hide-original', !showOriginal);
}

/**
 * Say why a line was left alone, in its tooltip.
 *
 * A `title` costs nothing until the pointer stops on it, so this stays on
 * permanently rather than hiding behind the debug setting.
 *
 * An empty reason CLEARS the tooltip, and every message must call this, because
 * the chat recycles its lines: a row that carried a reason and is reused for a
 * message that does translate would otherwise explain the wrong message.
 */
export function markSkipped(targetEl: Element, reason: string): void {
  if (!reason) {
    targetEl.removeAttribute('title');
    return;
  }
  targetEl.setAttribute('title', msg('skipPrefix', 'Not translated: $REASON$', [reason]));
}

export function removeAllArtifacts(targetEl: Element): void {
  for (const child of [...targetEl.children]) {
    if (ARTIFACT_CLASSES.some((c) => child.classList.contains(c))) child.remove();
  }
}

export function showLoading(targetEl: Element): void {
  if (targetEl.querySelector(`:scope > .${LOADING_CLASS}`)) return;
  const span = document.createElement('span');
  span.className = LOADING_CLASS;
  span.textContent = ' …';
  targetEl.appendChild(span);
}

export function showError(targetEl: Element, text: string, onRetry?: () => void): void {
  removeAllArtifacts(targetEl);
  const span = document.createElement('span');
  span.className = ERROR_CLASS;
  span.textContent = text;
  // Without this the line is indistinguishable from one that was never
  // translated, and there is nothing left to click to ask again.
  if (onRetry) span.appendChild(makeRetry(onRetry));
  targetEl.appendChild(span);
}

export function inject(
  targetEl: Element,
  result: TranslationResult,
  settings: Settings,
  onRetry?: () => void,
): void {
  removeAllArtifacts(targetEl);
  const flag = settings.showSourceBadge ? langFlag(result.detectedLang) : '';
  const provider = settings.showProviderBadge ? result.provider : '';

  const style = settings.displayStyle;
  // `replace` used to be compact inline under another name: same span, same
  // place, italic instead of upright, and the original left standing right
  // beside it. Measured, it rendered the same 9 messages at the same 44.1px as
  // `inline` — a fourth entry in the picker that changed nothing. It now takes
  // the message's place: the stylesheet hides the line's own text tokens
  // whenever this class is present, so the setting no longer needs a second
  // opinion from `showOriginal`.
  const replace = style === 'replace';
  const inline = style === 'inline';
  const el = document.createElement(inline || replace ? 'span' : 'div');
  el.className = replace ? TRANS_REPLACE_CLASS : inline ? TRANS_INLINE_CLASS : TRANS_CLASS;
  el.appendChild(withBadges(result.translatedText, flag, provider, result.detectedLang));
  if (onRetry) el.appendChild(makeRetry(onRetry));
  // #8 — Click-to-copy translation.
  attachCopyHandler(el as HTMLElement, result.translatedText);
  targetEl.appendChild(el);
}

function withBadges(text: string, flag: string, provider: string, detectedLang?: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (flag) {
    const f = document.createElement('span');
    f.className = 'kt-flag';
    f.textContent = flag;
    if (detectedLang) {
      f.title = msg('flagFrom', 'from $LANG$', [
        getLang(detectedLang)?.native ?? detectedLang.toUpperCase(),
      ]);
    }
    frag.appendChild(f);
  }
  // dir="auto" so RTL translations (Arabic/Hebrew/Persian) render correctly.
  const t = document.createElement('span');
  t.dir = 'auto';
  t.textContent = text;
  frag.appendChild(t);
  if (provider) {
    const p = document.createElement('span');
    p.className = 'kt-provider';
    p.textContent = provider;
    frag.appendChild(p);
  }
  return frag;
}

/**
 * The retry control on a failed line.
 *
 * Measured before this was fixed: `opacity: 0` at rest, no `tabindex`, never
 * reached in six tab presses, and on a touch device `(hover: hover)` is false
 * so it stayed at zero opacity forever. It announced itself as a button in the
 * accessibility tree while obeying nothing but a mouse hover.
 *
 * Its 7.9x11 box is left alone deliberately: WCAG 2.5.8 exempts a target that
 * sits inline in a block of text, which is exactly where this one lives, and
 * inflating it to 24px would push every failed chat line taller - the defect
 * this same session just removed twice.
 */
function makeRetry(onRetry: () => void): HTMLElement {
  const btn = document.createElement('span');
  btn.className = 'kt-retry';
  btn.textContent = String.fromCharCode(0x27f3);
  btn.title = msg('retryTip', 'Re-translate, ignoring the cache');
  btn.setAttribute('role', 'button');
  btn.tabIndex = 0;
  const fire = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    onRetry();
  };
  btn.addEventListener('click', fire);
  // A span with role=button gets none of a button's keyboard behaviour, so
  // both activation keys have to be written out. Space is prevented as well,
  // or the chat scrolls under the user instead.
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fire(e);
  });
  return btn;
}

// ─── Floating bar pinned at top of the chat panel ────────────────────────────

const FLOAT_ID = 'kt-floating-bar';

/**
 * The bar, resolved through the panel that is actually on screen.
 *
 * Kick leaves a SECOND chat panel carrying the same id, hidden behind a
 * suspense placeholder its renderer never removed, and it comes first in
 * document order. A document-wide lookup therefore answers about the wrong copy
 * the moment that one exists, which is exactly what buried the bar before the
 * mount was fixed. Same resolver as the mount, deliberately not a second
 * mechanism.
 */
function findBar(): HTMLElement | null {
  return findChatPanel()?.querySelector<HTMLElement>(`#${FLOAT_ID}`) ?? null;
}

export interface FloatingBarHandlers {
  onToggle: (enabled: boolean) => void;
  /** Reading language picked on the bar, so the two most used settings need no page. */
  onTargetLang: (code: string) => void;
  onOpenOptions: () => void;
  /** Invoked from a real click (user gesture) so on-device models can download. */
  onEnableLocal: () => void;
}

export type LocalChipState =
  | { kind: 'hidden' }
  | { kind: 'download'; label: string }
  | { kind: 'downloading'; pct: number }
  | { kind: 'ready' };

export function mountFloatingBar(container: Element, settings: Settings, h: FloatingBarHandlers): void {
  const host = container.closest('#channel-chatroom') ?? container;
  if (host.querySelector(`#${FLOAT_ID}`)) return;

  const bar = document.createElement('div');
  bar.id = FLOAT_ID;
  bar.className = 'kt-float';

  const dot = document.createElement('span');
  dot.className = 'kt-float-dot';
  bar.appendChild(dot);

  const label = document.createElement('span');
  label.className = 'kt-float-label';
  bar.appendChild(label);

  // The reading language, on the bar. Changing it used to mean opening a page.
  const langPick = document.createElement('select');
  langPick.className = 'kt-float-lang';
  langPick.title = msg('barLangTip', 'Translate into');
  // Localised and collated, like every other language menu in the extension:
  // an English-only list is unreadable to anyone running a translated UI.
  for (const opt of [
    { code: 'auto', label: 'Auto' },
    ...sortedLanguages().map((l) => ({ code: l.code, label: l.name })),
  ]) {
    const o = document.createElement('option');
    o.value = opt.code;
    o.textContent = opt.label;
    langPick.appendChild(o);
  }
  langPick.value = settings.targetLang;
  // The bar itself toggles on click, so neither opening nor using the picker
  // may bubble up to it.
  langPick.addEventListener('click', (e) => e.stopPropagation());
  langPick.addEventListener('change', (e) => {
    e.stopPropagation();
    setBarEnabled(bar, label, bar.dataset.enabled === 'true', langPick.value);
    h.onTargetLang(langPick.value);
  });
  bar.appendChild(langPick);

  const count = document.createElement('span');
  count.className = 'kt-float-count';
  count.dataset.n = '0';
  count.style.display = 'none';
  bar.appendChild(count);

  const localChip = document.createElement('button');
  localChip.type = 'button';
  localChip.className = 'kt-float-local';
  localChip.style.display = 'none';
  localChip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    h.onEnableLocal(); // user gesture — allows model download
  });
  bar.appendChild(localChip);

  // Pause and resume were already here, but only as a click anywhere on the bar,
  // which nothing announced. This is the same action with a face on it.
  const power = document.createElement('button');
  power.type = 'button';
  power.className = 'kt-float-power';
  power.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const enabled = bar.dataset.enabled !== 'true';
    setBarEnabled(bar, label, enabled, bar.dataset.lang ?? settings.targetLang);
    h.onToggle(enabled);
  });
  bar.appendChild(power);

  const opts = document.createElement('button');
  opts.type = 'button';
  opts.className = 'kt-float-opts';
  opts.title = msg('barOptionsTip', 'Options');
  opts.textContent = '⚙';
  opts.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    h.onOpenOptions();
  });
  bar.appendChild(opts);

  setBarEnabled(bar, label, settings.enabled, settings.targetLang);

  bar.addEventListener('click', (e) => {
    const t = e.target as Node;
    if (
      t === opts || t === localChip || t === langPick || t === power ||
      count.contains(t) || opts.contains(t) || localChip.contains(t) ||
      langPick.contains(t) || power.contains(t)
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const enabled = bar.dataset.enabled !== 'true';
    setBarEnabled(bar, label, enabled, bar.dataset.lang ?? settings.targetLang);
    h.onToggle(enabled);
  });

  host.insertBefore(bar, host.firstChild);
}

function setBarEnabled(bar: HTMLElement, label: HTMLElement, enabled: boolean, lang: string): void {
  bar.dataset.enabled = String(enabled);
  bar.dataset.lang = lang;
  // Measured on a live channel: "Translating → EN" took 133px of a 420px bar,
  // a third of it, and the "→ EN" half repeated the language menu sitting right
  // beside it. The state is what the label is for; the language has its own
  // control. The resolved code still reaches the tooltip, where it costs
  // nothing and answers "what does auto mean here".
  const shown = lang === 'auto' ? resolveBrowserLang() : lang;
  label.textContent = enabled
    ? msg('barOn', 'Translating')
    : msg('barOff', 'Translation off');
  label.title = enabled
    ? lang === 'auto'
      ? msg('barOnTipAuto', 'Reading chat in $LANG$ (auto)', [shown.toUpperCase()])
      : msg('barOnTip', 'Reading chat in $LANG$', [shown.toUpperCase()])
    : msg('chipPaused', 'Translation paused');
  // Scoped to the bar we were handed, never to the document: there are two chat
  // panels on the page and only one of them is the one on screen.
  const picker = bar.querySelector<HTMLSelectElement>('.kt-float-lang');
  if (picker && picker.value !== lang) picker.value = lang;
  const power = bar.querySelector<HTMLElement>('.kt-float-power');
  if (power) {
    power.textContent = enabled ? '⏸' : '▶';
    power.title = enabled
      ? msg('barPause', 'Pause translation')
      : msg('barResume', 'Resume translation');
  }
}

export function updateFloatingBar(settings: Settings): void {
  const bar = findBar();
  const label = bar?.querySelector<HTMLElement>('.kt-float-label');
  if (bar && label) setBarEnabled(bar, label, settings.enabled, settings.targetLang);
}

/** Show/hide a throttle indicator on the floating bar. */
export function showThrottleIndicator(throttled: boolean): void {
  const bar = findBar();
  if (!bar) return;
  let ind = bar.querySelector<HTMLElement>('.kt-float-throttle');
  if (throttled && !ind) {
    ind = document.createElement('span');
    ind.className = 'kt-float-throttle';
    ind.textContent = '⏳'; // ⏳
    ind.title = msg('barThrottled', 'Rate-limited, some messages skipped');
    ind.style.cssText = 'font-size:11px;opacity:.6;margin-left:2px';
    const count = bar.querySelector('.kt-float-count');
    if (count) count.before(ind);
    else bar.appendChild(ind);
  } else if (!throttled && ind) {
    ind.remove();
  }
}

/**
 * Record which provider handled the last translation.
 *
 * It used to be printed in the bar: 39px of a 420px row, permanently, naming a
 * service the reader has no decision to make about while it is working. Which
 * engine answered matters when one stops answering, and the Options page
 * already reports that. It lives in the state pill's tooltip now, alongside
 * the language, so it is one hover away instead of always in the way.
 */
export function updateActiveProvider(provider: string): void {
  const bar = findBar();
  if (!bar) return;
  bar.querySelector('.kt-float-provider')?.remove();
  bar.dataset.provider = provider;
  const label = bar.querySelector<HTMLElement>('.kt-float-label');
  if (!label) return;
  const base = label.title.split(' · ')[0] ?? label.title;
  label.title = msg('barVia', '$BASE$ · via $PROVIDER$', [base, provider]);
}

/** Bump the session translation counter shown in the floating bar. */
export function incrementFloatingCount(): void {
  const count = findBar()?.querySelector<HTMLElement>('.kt-float-count') ?? null;
  if (!count) return;
  const n = Number(count.dataset.n ?? '0') + 1;
  count.dataset.n = String(n);
  count.textContent = `· ${n}`;
  count.style.display = '';
}

export function updateLocalChip(state: LocalChipState): void {
  const chip = findBar()?.querySelector<HTMLButtonElement>('.kt-float-local') ?? null;
  if (!chip) return;
  switch (state.kind) {
    case 'hidden':
      chip.style.display = 'none';
      return;
    case 'download':
      chip.style.display = '';
      chip.dataset.state = 'download';
      chip.textContent = `⬇ ${msg('localDownload', 'Local ($SIZE$)', [state.label])}`;
      chip.title = msg(
        'localDownloadTip',
        'Download the on-device model for unlimited local translation',
      );
      return;
    case 'downloading':
      chip.style.display = '';
      chip.dataset.state = 'downloading';
      chip.textContent = msg('localDownloading', 'Downloading $PCT$%', [
        String(Math.round(state.pct * 100)),
      ]);
      return;
    case 'ready':
      chip.style.display = '';
      chip.dataset.state = 'ready';
      chip.textContent = `${msg('localReady', 'Local')} ✓`;
      chip.title = msg('localReadyTip', 'Translating on your device, unlimited and offline');
      return;
  }
}

export function unmountFloatingBar(): void {
  // Teardown stays document wide, and on purpose: it is the one operation that
  // must not leave a copy behind. If a bar ever ended up in the panel that is
  // off screen, scoping this would strand it there for good. Removing every
  // match is what "unmount" means, and it cannot pick the wrong one.
  for (const stale of document.querySelectorAll(`#${FLOAT_ID}`)) stale.remove();
}
