import injectCss from './inject.css?inline';
import type { TranslationResult } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { getLang, langFlag, resolveBrowserLang } from '~/shared/languages';

const STYLE_ID = 'kt-inject-style';
const TRANS_CLASS = 'kt-translation';
const TRANS_INLINE_CLASS = 'kt-translation-inline';
const TRANS_COMPACT_CLASS = 'kt-translation-compact';
const LOADING_CLASS = 'kt-loading';
const ERROR_CLASS = 'kt-error';
// Every class we add under a chat line. Cleanup walks this list, so a display
// style whose class is missing here would stack a copy per re-translation.
const ARTIFACT_CLASSES = [TRANS_CLASS, TRANS_INLINE_CLASS, TRANS_COMPACT_CLASS, LOADING_CLASS, ERROR_CLASS];

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

/** #2 — Hover placeholder for lazy translate mode. */
export function injectHoverPlaceholder(
  target: Element,
  onHover: () => void,
): void {
  if (target.querySelector('.kt-hover-placeholder')) return;
  const ph = document.createElement('span');
  ph.className = 'kt-hover-placeholder';
  ph.textContent = '⟶ hover to translate';
  ph.addEventListener('mouseenter', () => {
    ph.remove();
    onHover();
  }, { once: true });
  target.appendChild(ph);
}

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = injectCss;
  document.documentElement.appendChild(style);
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

export function showError(targetEl: Element, msg: string): void {
  removeAllArtifacts(targetEl);
  const span = document.createElement('span');
  span.className = ERROR_CLASS;
  span.textContent = msg;
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
  const compact = style === 'replace'; // reuse 'replace' as compact inline
  const inline = style === 'inline';
  const el = document.createElement(inline || compact ? 'span' : 'div');
  el.className = compact ? TRANS_COMPACT_CLASS : inline ? TRANS_INLINE_CLASS : TRANS_CLASS;
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
    if (detectedLang) f.title = `from ${getLang(detectedLang)?.native ?? detectedLang.toUpperCase()}`;
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

function makeRetry(onRetry: () => void): HTMLElement {
  const btn = document.createElement('span');
  btn.className = 'kt-retry';
  btn.textContent = '⟳';
  btn.title = 'Re-translate (try again, ignore cache)';
  btn.setAttribute('role', 'button');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRetry();
  });
  return btn;
}

// ─── Floating bar pinned at top of the chat panel ────────────────────────────

const FLOAT_ID = 'kt-floating-bar';

export interface FloatingBarHandlers {
  onToggle: (enabled: boolean) => void;
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

  const opts = document.createElement('button');
  opts.type = 'button';
  opts.className = 'kt-float-opts';
  opts.title = 'Options';
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
    if (t === opts || t === localChip || count.contains(t) || opts.contains(t) || localChip.contains(t)) {
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
  // Show the resolved language, not the 'auto' sentinel.
  const shown = lang === 'auto' ? resolveBrowserLang() : lang;
  label.textContent = enabled ? `Translating → ${shown.toUpperCase()}` : 'Translation off';
}

export function updateFloatingBar(settings: Settings): void {
  const bar = document.querySelector<HTMLElement>(`#${FLOAT_ID}`);
  const label = bar?.querySelector<HTMLElement>('.kt-float-label');
  if (bar && label) setBarEnabled(bar, label, settings.enabled, settings.targetLang);
}

/** Show/hide a throttle indicator on the floating bar. */
export function showThrottleIndicator(throttled: boolean): void {
  const bar = document.querySelector<HTMLElement>(`#${FLOAT_ID}`);
  if (!bar) return;
  let ind = bar.querySelector<HTMLElement>('.kt-float-throttle');
  if (throttled && !ind) {
    ind = document.createElement('span');
    ind.className = 'kt-float-throttle';
    ind.textContent = '⏳'; // ⏳
    ind.title = 'Rate-limited — some messages skipped';
    ind.style.cssText = 'font-size:11px;opacity:.6;margin-left:2px';
    const count = bar.querySelector('.kt-float-count');
    if (count) count.before(ind);
    else bar.appendChild(ind);
  } else if (!throttled && ind) {
    ind.remove();
  }
}

/** Update the floating bar to show which provider handled the last translation. */
export function updateActiveProvider(provider: string): void {
  const bar = document.querySelector<HTMLElement>(`#${FLOAT_ID}`);
  if (!bar) return;
  let badge = bar.querySelector<HTMLElement>('.kt-float-provider');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'kt-float-provider';
    badge.style.cssText = 'font-size:10px;opacity:.5;margin-left:4px;text-transform:uppercase';
    const label = bar.querySelector('.kt-float-label');
    if (label) label.after(badge);
  }
  badge.textContent = provider;
}

/** Bump the session translation counter shown in the floating bar. */
export function incrementFloatingCount(): void {
  const count = document.querySelector<HTMLElement>(`#${FLOAT_ID} .kt-float-count`);
  if (!count) return;
  const n = Number(count.dataset.n ?? '0') + 1;
  count.dataset.n = String(n);
  count.textContent = `· ${n}`;
  count.style.display = '';
}

export function updateLocalChip(state: LocalChipState): void {
  const chip = document.querySelector<HTMLButtonElement>(`#${FLOAT_ID} .kt-float-local`);
  if (!chip) return;
  switch (state.kind) {
    case 'hidden':
      chip.style.display = 'none';
      return;
    case 'download':
      chip.style.display = '';
      chip.dataset.state = 'download';
      chip.textContent = `⬇ Local (${state.label})`;
      chip.title = 'Download on-device model — unlimited local translation';
      return;
    case 'downloading':
      chip.style.display = '';
      chip.dataset.state = 'downloading';
      chip.textContent = `Downloading ${Math.round(state.pct * 100)}%`;
      return;
    case 'ready':
      chip.style.display = '';
      chip.dataset.state = 'ready';
      chip.textContent = 'Local ✓';
      chip.title = 'Translating on-device (unlimited, offline)';
      return;
  }
}

export function unmountFloatingBar(): void {
  document.querySelector(`#${FLOAT_ID}`)?.remove();
}
