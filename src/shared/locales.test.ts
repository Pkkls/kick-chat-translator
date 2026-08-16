import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json' with { type: 'json' };

/**
 * Guards the store-listing translations in public/_locales.
 *
 * These strings are never rendered by any code path, so nothing else in this
 * suite can fail when one is wrong. They are read by the Chrome Web Store and by
 * AMO at review time, which is the worst place to discover a missing key: the
 * store falls back to the default locale silently and the reach we added is
 * simply absent, with no error anywhere.
 */
const ROOT = join(process.cwd(), 'public', '_locales');
const DEFAULT_LOCALE = 'en';
/** Chrome Web Store short-description limit. */
const MAX_BLURB = 132;

type Catalog = Record<string, { message: string; description?: string }>;

function read(locale: string): Catalog {
  return JSON.parse(readFileSync(join(ROOT, locale, 'messages.json'), 'utf8')) as Catalog;
}

const locales = readdirSync(ROOT);

describe('store listing locales', () => {
  it('ships the locale the manifest declares as default', () => {
    expect(locales).toContain(DEFAULT_LOCALE);
  });

  it('keeps the English blurb identical to the package description', () => {
    // Two places state what this extension does. They drift the moment one is
    // edited alone, and the store then advertises something the repo denies.
    expect(read(DEFAULT_LOCALE).extDescription?.message).toBe(pkg.description);
  });

  it.each(locales)('%s carries exactly the default locale keys', (locale) => {
    expect(Object.keys(read(locale)).sort()).toEqual(Object.keys(read(DEFAULT_LOCALE)).sort());
  });

  it.each(locales)('%s has no empty or over-long message', (locale) => {
    for (const [key, entry] of Object.entries(read(locale))) {
      expect(entry.message.trim(), `${locale}/${key} is empty`).not.toBe('');
      expect(entry.message.length, `${locale}/${key} is over ${MAX_BLURB} chars`).toBeLessThanOrEqual(MAX_BLURB);
    }
  });

  it.each(locales)('%s left no untranslated copy of the English text', (locale) => {
    if (locale === DEFAULT_LOCALE) return;
    // A placeholder pasted from the default locale reads as done and ships as a
    // no-op: the reader gets English in a store that promised their language.
    expect(read(locale).extDescription?.message).not.toBe(read(DEFAULT_LOCALE).extDescription?.message);
  });
});
