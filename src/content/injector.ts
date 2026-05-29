import injectCss from './inject.css?inline';
import type { TranslationResult } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { langFlag } from '~/shared/languages';

const STYLE_ID = 'kt-inject-style';
const TRANS_CLASS = 'kt-translation';
const TRANS_INLINE_CLASS = 'kt-translation-inline';
const LOADING_CLASS = 'kt-loading';
const ERROR_CLASS = 'kt-error';

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = injectCss;
  document.documentElement.appendChild(style);
}

export function removeAllArtifacts(targetEl: Element): void {
  targetEl
    .querySelectorAll(`:scope > .${TRANS_CLASS}, :scope > .${TRANS_INLINE_CLASS}, :scope > .${LOADING_CLASS}, :scope > .${ERROR_CLASS}`)
    .forEach((n) => n.remove());
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

  const inline = settings.displayStyle === 'inline';
  const el = document.createElement(inline ? 'span' : 'div');
  el.className = inline ? TRANS_INLINE_CLASS : TRANS_CLASS;
  el.appendChild(withBadges(result.translatedText, flag, provider));
  if (onRetry) el.appendChild(makeRetry(onRetry));
  targetEl.appendChild(el);
}

function withBadges(text: string, flag: string, provider: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (flag) {
    const f = document.createElement('span');
    f.className = 'kt-flag';
    f.textContent = flag;
    frag.appendChild(f);
  }
  frag.appendChild(document.createTextNode(text));
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
  label.textContent = enabled ? `Translating → ${lang.toUpperCase()}` : 'Translation off';
}

export function updateFloatingBar(settings: Settings): void {
  const bar = document.querySelector<HTMLElement>(`#${FLOAT_ID}`);
  const label = bar?.querySelector<HTMLElement>('.kt-float-label');
  if (bar && label) setBarEnabled(bar, label, settings.enabled, settings.targetLang);
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
