import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultSettings } from '~/shared/settings';
import type { Settings } from '~/shared/settings';
import type { TranslationResult } from '~/shared/types';
import { TRANSLATION_SELECTOR, applyShowOriginal, inject, markSkipped, removeAllArtifacts, showError, showLoading } from './injector';
// Read from disk: vitest runs with CSS processing off, so `?inline` imports
// resolve to an empty string and would make these assertions pass on anything.
const injectCss = readFileSync('src/content/inject.css', 'utf8');

const result = (translatedText: string): TranslationResult => ({
  messageId: '1',
  translatedText,
  detectedLang: 'es',
  provider: 'deepl',
  cached: false,
});

function settingsWith(displayStyle: Settings['displayStyle']): Settings {
  return { ...defaultSettings(), displayStyle, showSourceBadge: false, showProviderBadge: false };
}

/** Everything the injector adds under a chat line. */
function artifacts(el: Element): Element[] {
  return [...el.children];
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.classList.remove('kt-hide-original');
});

describe('injector artifacts', () => {
  it('shows the translated text', () => {
    const target = document.createElement('div');
    inject(target, result('hola'), settingsWith('below'));
    expect(target.textContent).toContain('hola');
  });

  // Re-injecting happens on every retry, so a second translation must replace the
  // first rather than stack under the message.
  it.each(['below', 'inline', 'replace', 'hover'] as const)(
    'replaces a previous translation in %s mode',
    (style) => {
      const target = document.createElement('div');
      inject(target, result('first'), settingsWith(style));
      inject(target, result('second'), settingsWith(style));

      expect(artifacts(target)).toHaveLength(1);
      expect(target.textContent).toContain('second');
      expect(target.textContent).not.toContain('first');
    },
  );

  it('clears a translation when an error replaces it', () => {
    const target = document.createElement('div');
    inject(target, result('hola'), settingsWith('replace'));
    showError(target, 'nope');

    expect(artifacts(target)).toHaveLength(1);
    expect(target.textContent).toContain('nope');
    expect(target.textContent).not.toContain('hola');
  });

  it('removes a loading indicator once the translation lands', () => {
    const target = document.createElement('div');
    showLoading(target);
    inject(target, result('hola'), settingsWith('below'));

    expect(artifacts(target)).toHaveLength(1);
    expect(target.textContent).toContain('hola');
  });

  it('removes every artifact it added', () => {
    const target = document.createElement('div');
    inject(target, result('hola'), settingsWith('replace'));
    removeAllArtifacts(target);
    expect(artifacts(target)).toHaveLength(0);
  });

  // A suffixed class is a *different* class: `.kt-translation` never matches
  // `.kt-translation-compact`. That is how compact mode ended up with no green
  // cue, no copy cursor and a retry button that could never be revealed.
  describe('every display style carries the same cue', () => {
    const styleClasses = ['kt-translation', 'kt-translation-inline', 'kt-translation-compact'] as const;

    it.each(styleClasses)('%s has the green background', (cls) => {
      // Anchored: the class must own the rule, not merely appear in a shared
      // selector list such as the copy-cursor one.
      const block = new RegExp(`^\\.${cls}\\s*\\{([^}]*)\\}`, 'm').exec(injectCss)?.[1] ?? '';
      expect(block).toMatch(/background:\s*rgba\(83, 252, 24/);
    });

    it('lists every style in the copy-cursor rule', () => {
      const selector = /([^{}]*)\{\s*cursor:\s*copy;\s*\}/.exec(injectCss)?.[1] ?? '';
      for (const cls of styleClasses) expect(selector).toContain(`.${cls}`);
    });

    it('reveals the retry button on every style', () => {
      for (const cls of styleClasses) expect(injectCss).toContain(`.${cls}:hover .kt-retry`);
    });
  });

  // The same suffixed-class trap, this time in the "has this line been translated
  // already?" guards. Missing a style there does not just look wrong: the row reads
  // as untranslated, so it gets re-submitted and paid for again.
  describe('the already-translated guard', () => {
    it.each(['below', 'inline', 'replace', 'hover'] as const)('finds a %s translation', (style) => {
      const target = document.createElement('div');
      inject(target, result('hola'), settingsWith(style));
      expect(target.querySelector(TRANSLATION_SELECTOR)).not.toBeNull();
    });

    it('is not re-spelled by hand at any call site', () => {
      for (const file of ['src/content/index.ts', 'src/content/pipeline.ts']) {
        expect(readFileSync(file, 'utf8')).not.toContain("'.kt-translation, ");
      }
    });
  });

  // A line whose engine gave up lost its translation AND the retry button living
  // inside it, so it became indistinguishable from a line that was never
  // translated, with no way to ask again.
  describe('a line whose engine gave up', () => {
    it('keeps a way to try again', () => {
      const target = document.createElement('div');
      let retried = 0;
      showError(target, 'quota', () => { retried++; });
      const btn = target.querySelector<HTMLElement>('.kt-retry');
      expect(btn).not.toBeNull();
      btn?.click();
      expect(retried).toBe(1);
    });

    // Callers that offer no retry keep the old, quieter marker.
    it('offers no button when the caller passes no retry', () => {
      const target = document.createElement('div');
      showError(target, 'quota');
      expect(target.querySelector('.kt-retry')).toBeNull();
    });

    // The button is opacity:0 until its own box is hovered. Forgetting the
    // error box in that rule ships a button nothing can reveal, which is
    // exactly how the Replace style lost its own retry.
    it('can reveal that button on hover', () => {
      expect(injectCss).toContain('.kt-error:hover .kt-retry');
    });
  });

  // Why a line was left alone used to be knowable only by instrumenting the
  // pipeline by hand. It now sits in the line's own tooltip.
  describe('the reason a line was left alone', () => {
    it('goes in the tooltip', () => {
      const target = document.createElement('div');
      markSkipped(target, 'it is only chat slang');
      expect(target.getAttribute('title')).toBe('Not translated: it is only chat slang');
    });

    // The chat reuses its rows, so a reason has to be removable, or it ends up
    // explaining a message it was never about.
    it('is dropped again when there is no reason to give', () => {
      const target = document.createElement('div');
      markSkipped(target, 'it is only chat slang');
      markSkipped(target, '');
      expect(target.hasAttribute('title')).toBe(false);
    });
  });

  // `showOriginal` shipped as a stored setting no content-script code ever read.
  describe('hiding the original text', () => {
    it('marks the document root only when the original must be hidden', () => {
      applyShowOriginal(false);
      expect(document.documentElement.classList.contains('kt-hide-original')).toBe(true);
      applyShowOriginal(true);
      expect(document.documentElement.classList.contains('kt-hide-original')).toBe(false);
    });

    // The rule keys off the element that HOLDS the translation, so a row the
    // virtual scroller recycled without one shows its text again with no
    // per-row bookkeeping to undo.
    //
    // Note on what this test can and cannot prove: it reads the rule as text.
    // The DOM this suite runs on cannot evaluate `:has()` at all (a relative
    // `~` throws, a relative `>` silently matches nothing), so no test here can
    // exercise the selector against a row. The shapes it has to cover were
    // measured in a browser instead, see the round 16 journal entry.
    it('hides Kick text only on lines that carry a translation', () => {
      const rule = /\.kt-hide-original[^{]*\{[^}]*\}/.exec(injectCss)?.[0] ?? '';
      expect(rule).toMatch(/display:\s*none/);
      for (const cls of ['kt-translation', 'kt-translation-inline', 'kt-translation-compact']) {
        // The holder is matched by its child, never by a sibling of the text:
        // in a reply Kick nests the message a level deeper and a sibling rule
        // cannot reach it.
        expect(rule).toContain(`div:has(> .${cls})`);
      }
      expect(rule).not.toContain('~ .kt-translation');
      // Two renderings of the same original have to go: the span Kick writes,
      // and the container a chat emote extension puts beside it and shows
      // instead, after hiding Kick's own.
      expect(rule).toContain('span.font-normal');
      expect(rule).toContain('.seventv-text-token');
    });

    // With the text gone there is nothing on the pill's left for the gap to
    // separate it from, so it reads as a stray indent.
    it('closes the gap in front of a pill that no longer follows anything', () => {
      for (const cls of ['kt-translation-inline', 'kt-translation-compact']) {
        expect(injectCss).toMatch(
          new RegExp(`\\.kt-hide-original[^{]*\\.${cls}[^{]*\\{[^}]*margin-left:\\s*0`),
        );
      }
    });
  });

  it('leaves the original message content alone', () => {
    const target = document.createElement('div');
    const original = document.createElement('span');
    original.textContent = 'mensaje';
    target.appendChild(original);

    inject(target, result('message'), settingsWith('below'));
    removeAllArtifacts(target);

    expect(artifacts(target)).toEqual([original]);
    expect(target.textContent).toBe('mensaje');
  });
});
