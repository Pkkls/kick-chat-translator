/**
 * Compose preview panel — the floating box above the chat composer that shows a
 * live translation of what the user is typing.
 *
 * Positioned `fixed` and tracked to the composer's bounding box so it never
 * mutates Kick's layout (zero layout shift) and never reflows the input. All
 * state transitions keep the previous text on screen until the next one is ready,
 * so the panel never flashes empty while a request is in flight.
 */
import { getLang, langFlag } from '~/shared/languages';
import { showToast } from './injector';

const COMPOSE_ID = 'kt-compose-bar';

export type ComposeUiState =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'ready'; text: string; provider: string };

export interface ComposeUiHandlers {
  /** User clicked the translation to insert it into the chat box. */
  onInsert: () => void;
}

interface ComposeUi {
  panel: HTMLElement;
  textEl: HTMLElement;
  providerEl: HTMLElement;
  targetEl: HTMLElement;
  composer: HTMLElement;
  reposition: () => void;
  resizeObs: ResizeObserver | undefined;
}

let ui: ComposeUi | undefined;

/** Read the plain text currently in the composer (textarea/input value or contenteditable text). */
export function readComposerText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el.value;
  // innerText preserves line breaks for multi-line messages; textContent collapses them.
  return el.innerText ?? el.textContent ?? '';
}

export function mountComposePreview(
  composer: HTMLElement,
  targetLang: string,
  handlers: ComposeUiHandlers,
): void {
  // Re-mount cleanly if the composer node changed (SPA swap).
  if (ui && ui.composer === composer && document.getElementById(COMPOSE_ID)) return;
  unmountComposePreview();

  const panel = document.createElement('div');
  panel.id = COMPOSE_ID;
  panel.className = 'kt-compose';
  panel.dataset.state = 'hidden';

  const arrow = document.createElement('span');
  arrow.className = 'kt-compose-arrow';
  arrow.textContent = '➜';
  panel.appendChild(arrow);

  // Read-only badge of the auto-detected output language (the channel's language).
  // No manual picker — the target is detected, not configured.
  const targetEl = document.createElement('span');
  targetEl.className = 'kt-compose-target';
  setTargetBadge(targetEl, targetLang);
  panel.appendChild(targetEl);

  const textEl = document.createElement('span');
  textEl.className = 'kt-compose-text';
  textEl.dir = 'auto'; // render RTL languages (Arabic/Hebrew/Persian) correctly
  panel.appendChild(textEl);

  const providerEl = document.createElement('span');
  providerEl.className = 'kt-compose-provider';
  panel.appendChild(providerEl);

  const hint = document.createElement('span');
  hint.className = 'kt-compose-hint';
  hint.textContent = 'click to insert';
  panel.appendChild(hint);

  // Clicking the translation inserts it (mousedown, so the composer doesn't lose
  // focus to a real click first — keeps the caret where the user expects).
  panel.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlers.onInsert();
  });

  document.body.appendChild(panel);

  const reposition = (): void => positionPanel(panel, composer);

  // Track the composer's box so the panel stays glued to it when the input grows
  // to multiple lines — fires only on a real size change, never on the keystroke path.
  let resizeObs: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(reposition);
    resizeObs.observe(composer);
  }

  ui = { panel, textEl, providerEl, targetEl, composer, reposition, resizeObs };

  window.addEventListener('scroll', reposition, { passive: true, capture: true });
  window.addEventListener('resize', reposition, { passive: true });
  reposition();
}

function positionPanel(panel: HTMLElement, composer: HTMLElement): void {
  const r = composer.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return; // composer detached / hidden
  panel.style.left = `${Math.round(r.left)}px`;
  panel.style.width = `${Math.round(r.width)}px`;
  // Sit just above the composer, measured from the viewport bottom.
  panel.style.bottom = `${Math.round(window.innerHeight - r.top + 6)}px`;
}

export function updateComposePreview(state: ComposeUiState): void {
  if (!ui) return;
  const { panel, textEl, providerEl } = ui;
  switch (state.kind) {
    case 'hidden':
      panel.dataset.state = 'hidden';
      return;
    case 'loading':
      // Keep prior text visible and pulsing while refreshing. On a first
      // translation (no text yet) stay hidden so there's no empty-panel flash.
      panel.dataset.state = textEl.textContent ? 'loading' : 'hidden';
      if (textEl.textContent) ui.reposition();
      return;
    case 'ready':
      textEl.textContent = state.text;
      providerEl.textContent = state.provider.toUpperCase();
      panel.dataset.state = 'ready';
      ui.reposition();
      return;
  }
}

/** Update the target badge when the detected channel language (or override) changes. */
export function setComposeTargetLang(lang: string): void {
  if (ui) setTargetBadge(ui.targetEl, lang);
}

function setTargetBadge(el: HTMLElement, lang: string): void {
  el.textContent = langFlag(lang);
  el.title = `Auto · writing in ${getLang(lang)?.native ?? lang.toUpperCase()}`;
}

export function isComposePreviewMounted(): boolean {
  return ui !== undefined && document.getElementById(COMPOSE_ID) !== null;
}

export function unmountComposePreview(): void {
  if (ui) {
    window.removeEventListener('scroll', ui.reposition, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', ui.reposition);
    ui.resizeObs?.disconnect();
  }
  document.getElementById(COMPOSE_ID)?.remove();
  ui = undefined;
}

// ─── Writing the translation back into Kick's composer ───────────────────────

/**
 * Insert `text` into the composer, replacing its current content. Falls back to
 * the clipboard (with a toast) when the editor genuinely doesn't accept the write.
 *
 * Kick ships a Lexical contenteditable (`div.editor-input[role=textbox]`). Verified
 * live: `document.execCommand('insertText')` is silently ignored there, but a
 * synthetic `beforeinput`/insertText over a full selection is honoured and replaces
 * the content. Lexical reconciles a frame later, so success is checked async.
 */
export function insertIntoComposer(el: HTMLElement, text: string, mode: 'insert' | 'copy'): void {
  if (mode === 'copy') {
    copyAndToast(text);
    return;
  }
  try {
    const before = readComposerText(el).trim();

    // Native textarea/input (legacy / mobile layouts): write via the prototype
    // setter so React's value tracker notices, then fire input.
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.focus();
      el.select();
      setNativeValue(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Rich contenteditable: select-all so the translation replaces the typed
    // source, then drive a synthetic insertText that Lexical/React will apply.
    el.focus();
    selectAllIn(el);
    el.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: text, bubbles: true, cancelable: true }),
    );

    // Fall back to clipboard only if the box is genuinely unchanged after the
    // editor has had a frame to apply — a lenient check so editor-side transforms
    // (emoji shortcodes, autolink) don't trigger a spurious "copied" toast.
    window.setTimeout(() => {
      if (readComposerText(el).trim() === before) copyAndToast(text);
    }, 180);
  } catch {
    copyAndToast(text);
  }
}

function selectAllIn(el: HTMLElement): void {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.select();
    return;
  }
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
}

function setNativeValue(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
}

function copyAndToast(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => undefined);
  showToast('Translation copied — paste with Ctrl+V');
}
