import { Settings } from '../shared/types';

const TRANSLATION_CLASS = 'kt-translation';
const ORIGINAL_WRAPPER_CLASS = 'kt-original';
const FLAG_CLASS = 'kt-flag';
const LOADING_CLASS = 'kt-loading';

// Short ASCII language labels shown next to translations
const LANG_LABELS: Record<string, string> = {
  JA: 'JP', KO: 'KR', ZH: 'CN', PT: 'PT', ES: 'ES',
  FR: 'FR', DE: 'DE', RU: 'RU', AR: 'AR', TR: 'TR',
  IT: 'IT', PL: 'PL', NL: 'NL', SV: 'SV', ID: 'ID',
  TH: 'TH', VI: 'VI', UK: 'UA', CS: 'CZ', RO: 'RO',
};

function langLabel(detectedLang: string): string {
  const code = detectedLang.toUpperCase().split('-')[0];
  return LANG_LABELS[code] ?? code.slice(0, 2);
}

export function showLoadingIndicator(messageEl: Element): void {
  removeTranslation(messageEl);
  const span = document.createElement('span');
  span.className = LOADING_CLASS;
  span.textContent = ' ...';
  span.style.cssText = 'opacity:0.4;font-size:0.75em;margin-left:4px;';
  messageEl.appendChild(span);
}

export function removeTranslation(messageEl: Element): void {
  messageEl.querySelector('.' + TRANSLATION_CLASS)?.remove();
  messageEl.querySelector('.' + LOADING_CLASS)?.remove();
  const wrapper = messageEl.querySelector('.' + ORIGINAL_WRAPPER_CLASS);
  if (wrapper) {
    wrapper.replaceWith(...Array.from(wrapper.childNodes));
  }
}

export function injectTranslation(
  messageEl: Element,
  originalText: string,
  translatedText: string,
  detectedLang: string,
  settings: Settings
): void {
  removeTranslation(messageEl);

  const label = langLabel(detectedLang);

  if (settings.displayStyle === 'replace') {
    injectReplace(messageEl, translatedText, label, settings.showOriginal);
  } else if (settings.displayStyle === 'inline') {
    injectInline(messageEl, translatedText, label);
  } else {
    injectBelow(messageEl, translatedText, label);
  }
}

function injectBelow(messageEl: Element, translatedText: string, label: string): void {
  const div = document.createElement('div');
  div.className = TRANSLATION_CLASS;
  div.style.cssText = [
    'margin-top:2px',
    'padding:2px 6px',
    'background:rgba(255,255,255,0.06)',
    'border-left:2px solid rgba(83,218,126,0.6)',
    'border-radius:0 4px 4px 0',
    'font-size:0.85em',
    'color:rgba(255,255,255,0.75)',
    'line-height:1.4',
  ].join(';');

  const badge = document.createElement('span');
  badge.className = FLAG_CLASS;
  badge.title = label;
  badge.textContent = '[' + label + '] ';
  badge.style.cssText = 'opacity:0.6;font-size:0.8em;font-weight:600;';

  div.appendChild(badge);
  div.appendChild(document.createTextNode(translatedText));
  messageEl.appendChild(div);
}

function injectInline(messageEl: Element, translatedText: string, label: string): void {
  const span = document.createElement('span');
  span.className = TRANSLATION_CLASS;
  span.style.cssText = [
    'margin-left:6px',
    'padding:1px 5px',
    'background:rgba(83,218,126,0.15)',
    'border-radius:3px',
    'font-size:0.85em',
    'color:rgba(255,255,255,0.7)',
  ].join(';');
  span.textContent = '[' + label + '] ' + translatedText;
  messageEl.appendChild(span);
}

function injectReplace(
  messageEl: Element,
  translatedText: string,
  label: string,
  showOriginal: boolean
): void {
  const textSelectors = [
    '.chat-message-content',
    '[data-chat-entry-content]',
    '.message-text',
    '[class*="message-content"]',
  ];

  let textEl: Element | null = null;
  for (const sel of textSelectors) {
    textEl = messageEl.querySelector(sel);
    if (textEl) break;
  }

  if (!textEl) {
    injectBelow(messageEl, translatedText, label);
    return;
  }

  if (showOriginal) {
    const original = textEl.innerHTML;
    const wrapper = document.createElement('span');
    wrapper.className = ORIGINAL_WRAPPER_CLASS;
    wrapper.innerHTML = original;
    textEl.innerHTML = '';
    textEl.appendChild(wrapper);
  }

  const translation = document.createElement('span');
  translation.className = TRANSLATION_CLASS;
  if (showOriginal) {
    translation.style.cssText = 'display:block;margin-top:2px;color:rgba(255,255,255,0.75);font-size:0.9em;';
  }
  translation.textContent = '[' + label + '] ' + translatedText;
  textEl.appendChild(translation);
}
