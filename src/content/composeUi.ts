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
import { computePanelGeom } from './composeLogic';
import { showToast } from './injector';
import { msg } from './msg';

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

  // Read-only badge of the auto-detected output language (the channel's language).
  // No manual picker — the target is detected, not configured.
  const targetEl = document.createElement('span');
  targetEl.className = 'kt-compose-target';
  setTargetBadge(targetEl, targetLang);
  panel.appendChild(targetEl);

  // The translation — the hero of the chip, full width.
  const textEl = document.createElement('span');
  textEl.className = 'kt-compose-text';
  textEl.dir = 'auto'; // render RTL languages (Arabic/Hebrew/Persian) correctly
  panel.appendChild(textEl);

  // Subtle insert cue. The whole chip is clickable; this just signals the action.
  const insert = document.createElement('span');
  insert.className = 'kt-compose-insert';
  insert.textContent = '↵';
  insert.title = msg('composeInsertTip', 'Insert · Ctrl/Cmd+Enter · Esc to dismiss');
  panel.appendChild(insert);

  // Clicking the translation inserts it (mousedown, so the composer doesn't lose
  // focus to a real click first — keeps the caret where the user expects).
  panel.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlers.onInsert();
  });

  document.body.appendChild(panel);

  const reposition = (): void => {
    if (panel.dataset.state === 'hidden') return; // no layout work while not shown
    positionPanel(panel, composer);
  };

  // Track the composer's box so the panel stays glued to it when the input grows
  // to multiple lines — fires only on a real size change, never on the keystroke path.
  let resizeObs: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(reposition);
    resizeObs.observe(composer);
  }

  ui = { panel, textEl, targetEl, composer, reposition, resizeObs };

  window.addEventListener('scroll', reposition, { passive: true, capture: true });
  window.addEventListener('resize', reposition, { passive: true });
  // The on-screen keyboard / pinch-zoom move the visual viewport without firing a
  // window resize — track it so the panel stays put above the keyboard.
  window.visualViewport?.addEventListener('resize', reposition);
  window.visualViewport?.addEventListener('scroll', reposition);
  reposition();
}

function positionPanel(panel: HTMLElement, composer: HTMLElement): void {
  const r = composer.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return; // composer detached / hidden
  // Track the *visual* viewport so the panel rides above the on-screen keyboard
  // (which shrinks visualViewport without touching innerHeight) instead of hiding
  // behind it. Falls back to the layout viewport on desktop.
  const vv = window.visualViewport;
  const keyboardInset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
  const geom = computePanelGeom(
    { left: r.left, top: r.top, width: r.width },
    { innerWidth: window.innerWidth, innerHeight: window.innerHeight, keyboardInset },
    findOverlayTopAbove(composer, r.top),
  );
  panel.style.left = `${geom.left}px`;
  panel.style.width = `${geom.width}px`;
  panel.style.bottom = `${geom.bottom}px`;
}

// Overlays Kick pops up over the composer (emote / emoji picker, autocomplete) that
// our panel must not overlap. Selector-light + size-gated so it ignores the small
// toggle buttons and never dodges ordinary chat content.
const OVERLAY_SELECTORS = [
  '[data-testid*="emote" i]',
  '[data-testid*="emoji" i]',
  '[class*="emote-picker" i]',
  '[class*="emoji-picker" i]',
  '[role="dialog"]',
  '[role="listbox"]',
];

/**
 * Viewport-relative top of an overlay that opens *above* the composer, or undefined
 * when none is open — so the panel can sit above the overlay rather than under it.
 */
function findOverlayTopAbove(composer: HTMLElement, composerTop: number): number | undefined {
  for (const sel of OVERLAY_SELECTORS) {
    let nodes: NodeListOf<HTMLElement>;
    try {
      nodes = document.querySelectorAll<HTMLElement>(sel);
    } catch {
      continue; // invalid selector, skip
    }
    for (const el of nodes) {
      if (el.id === COMPOSE_ID || el.contains(composer) || composer.contains(el)) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 40 || box.height < 40) continue; // ignore icons / toggle buttons
      // A popover sitting above the composer (not the chat list below, nor a side panel).
      if (box.top < composerTop && box.bottom <= composerTop + 8) return box.top;
    }
  }
  return undefined;
}

export function updateComposePreview(state: ComposeUiState): void {
  if (!ui) return;
  const { panel, textEl } = ui;
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
  el.title = msg('composeAutoTip', 'Auto · writing in $LANG$', [
    getLang(lang)?.native ?? lang.toUpperCase(),
  ]);
}

export function isComposePreviewMounted(): boolean {
  return ui !== undefined && document.getElementById(COMPOSE_ID) !== null;
}

/** True when a translation is currently on screen (used for keyboard shortcuts). */
export function isComposePreviewVisible(): boolean {
  return ui?.panel.dataset.state === 'ready';
}

/** Toggle a subtle rate-limit indicator on the panel. */
export function setComposeThrottle(on: boolean): void {
  if (ui) ui.panel.dataset.throttled = on ? 'true' : 'false';
}

export function unmountComposePreview(): void {
  if (ui) {
    window.removeEventListener('scroll', ui.reposition, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', ui.reposition);
    window.visualViewport?.removeEventListener('resize', ui.reposition);
    window.visualViewport?.removeEventListener('scroll', ui.reposition);
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
    // An unchanged box only means the insert failed when the translation would
    // have changed it. When it matches what was typed there is nothing to rescue,
    // and copying anyway would overwrite the user's clipboard for nothing.
    window.setTimeout(() => {
      if (text.trim() !== before && readComposerText(el).trim() === before) copyAndToast(text);
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
