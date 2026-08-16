import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * RERENDER_KEYS in index.ts is a hand-kept list of the settings a chat line bakes
 * in when it is drawn. Forgetting an entry does not fail a type check and does not
 * fail any other test: the setting simply stops applying to what is already on
 * screen, and only a page reload makes it take effect. That is the defect item 96
 * was reported for, and this file exists because the fix for it is another hand
 * kept list, which is the shape that has now recurred five times in this module.
 *
 * So the expectation is derived from the injector's own source rather than typed
 * out a second time.
 */

/** Everything above the floating-bar section is the per-chat-line path. */
const BAR_BOUNDARY = "const FLOAT_ID";

function perLineSettingKeys(): string[] {
  const source = readFileSync('src/content/injector.ts', 'utf8');
  const cut = source.indexOf(BAR_BOUNDARY);
  expect(cut, 'the floating-bar boundary moved; this probe no longer scopes anything').toBeGreaterThan(0);
  const perLine = source.slice(0, cut);
  return [...new Set([...perLine.matchAll(/\bsettings\.([a-zA-Z]+)/g)].map((m) => m[1] as string))];
}

function rerenderKeys(): string[] {
  const source = readFileSync('src/content/index.ts', 'utf8');
  const block = /const RERENDER_KEYS = \[([^\]]*)\]/.exec(source);
  expect(block, 'RERENDER_KEYS was renamed or reshaped').not.toBeNull();
  return [...(block?.[1] ?? '').matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1] as string);
}

describe('re-render on settings change', () => {
  it('re-runs rows for every setting the injector reads per line', () => {
    const read = perLineSettingKeys();
    // Control: a probe that found nothing would pass the assertion below on an
    // empty list, which is exactly how this class of bug survives.
    expect(read.length, 'the probe read no settings at all').toBeGreaterThan(2);
    for (const key of read) {
      expect(rerenderKeys(), `injector reads settings.${key} per line but it is not in RERENDER_KEYS`).toContain(key);
    }
  });

  it('leaves showOriginal out, because it is applied live through the root class', () => {
    // Not an oversight. applyShowOriginal toggles one class on documentElement and
    // the CSS follows immediately, so re-running every row for it would be work
    // with no visible effect.
    expect(rerenderKeys()).not.toContain('showOriginal');
  });

  it('keeps the reading language in the list', () => {
    // The only entry that costs a network request, and the one the defect was
    // originally reported for.
    expect(rerenderKeys()).toContain('targetLang');
  });
});
