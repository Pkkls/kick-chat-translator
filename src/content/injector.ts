import injectCss from './inject.css?inline';
import type { TranslationResult } from '~/shared/types';
import type { Settings } from '~/shared/settings';
import { langFlag } from '~/shared/languages';

const STYLE_ID = 'kt-inject-style';
const TRANS_CLASS = 'kt-translation';
const TRANS_INLINE_CLASS = 'kt-translation-inline';
const LOADING_CLASS = 'kt-loading';
const HOVER_CLASS = 'kt-hover-trigger';
const ERROR_CLASS = 'kt-error';

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = injectCss;
  document.documentElement.appendChild(style);
}

export function removeAllArtifacts(messageEl: Element): void {
  messageEl
    .querySelectorAll(`.${TRANS_CLASS}, .${TRANS_INLINE_CLASS}, .${LOADING_CLASS}, .${HOVER_CLASS}, .${ERROR_CLASS}`)
    .forEach((n) => n.remove());
}

export function showLoading(messageEl: Element): void {
  if (messageEl.querySelector(`.${LOADING_CLASS}`)) return;
  const span = document.createElement('span');
  span.className = LOADING_CLASS;
  span.textContent = '…';
  messageEl.appendChild(span);
}

export function showError(messageEl: Element, msg: string): void {
  removeAllArtifacts(messageEl);
  const span = document.createElement('span');
  span.className = ERROR_CLASS;
  span.textContent = msg;
  messageEl.appendChild(span);
}

export function showHoverTrigger(messageEl: Element, onClick: () => void): void {
  if (messageEl.querySelector(`.${HOVER_CLASS}`)) return;
  const btn = document.createElement('button');
  btn.className = HOVER_CLASS;
  btn.type = 'button';
  btn.textContent = 'translate';
  btn.addEventListener(
    'click',
    (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      btn.remove();
      onClick();
    },
    { once: true },
  );
  messageEl.appendChild(btn);
}

export function inject(messageEl: Element, result: TranslationResult, settings: Settings): void {
  removeAllArtifacts(messageEl);
  const flag = settings.showSourceBadge ? langFlag(result.detectedLang) : '';
  const provider = settings.showProviderBadge ? result.provider : '';

  switch (settings.displayStyle) {
    case 'inline':
      injectInline(messageEl, result.translatedText, flag, provider);
      return;
    case 'replace':
      injectReplace(messageEl, result.translatedText, flag, provider, settings.showOriginal);
      return;
    case 'below':
    case 'hover':
    default:
      injectBelow(messageEl, result.translatedText, flag, provider);
  }
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

function injectBelow(messageEl: Element, text: string, flag: string, provider: string): void {
  const div = document.createElement('div');
  div.className = TRANS_CLASS;
  div.appendChild(withBadges(text, flag, provider));
  messageEl.appendChild(div);
}

function injectInline(messageEl: Element, text: string, flag: string, provider: string): void {
  const span = document.createElement('span');
  span.className = TRANS_INLINE_CLASS;
  span.appendChild(withBadges(text, flag, provider));
  messageEl.appendChild(span);
}

function injectReplace(
  messageEl: Element,
  text: string,
  flag: string,
  provider: string,
  showOriginal: boolean,
): void {
  if (showOriginal) {
    injectBelow(messageEl, text, flag, provider);
    return;
  }
  // Replace text nodes of the deepest text container with translation
  const target = messageEl.querySelector('.chat-entry-content, [class*="message-content"]') ?? messageEl;
  const original = target.cloneNode(true) as Element;
  original.classList.add('kt-orig-hidden');
  (original as HTMLElement).style.display = 'none';
  target.replaceChildren();
  target.appendChild(withBadges(text, flag, provider));
  target.appendChild(original);
}
