import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every key the content script asks msg() for has to exist in the catalogue,
 * saying exactly what the fallback says.
 *
 * The options bundle has had this check since nine strings drifted through the
 * gap there. The content script had none, and it reads a different catalogue:
 * `public/_locales` through chrome.i18n, not the t() tables. What that cost,
 * measured before this file existed: thirty-nine user-visible strings written
 * straight into the DOM in English, including every label on the floating bar
 * and all sixteen reasons a line can be left untranslated.
 *
 * The fallback matters as much as the entry. chrome.i18n answers inside the
 * extension and the fallback answers everywhere else, so the two saying
 * different things is a difference nobody sees until a user is looking at the
 * one that is wrong.
 */
const LOCALES = join(process.cwd(), 'public', '_locales');
const DIR = join(process.cwd(), 'src', 'content');

type Catalog = Record<string, { message: string; placeholders?: Record<string, unknown> }>;

const catalogue = (locale: string): Catalog =>
  JSON.parse(readFileSync(join(LOCALES, locale, 'messages.json'), 'utf8')) as Catalog;

// msg('key', 'fallback') and the alias it is imported under where `msg` is
// already the name of a parameter.
const CALL = /(?:\bmsg|\blocalised)\(\s*'([A-Za-z][A-Za-z0-9_]*)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;

const calls = new Map<string, string>();
for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.ts') || name.includes('.test.')) continue;
  const src = readFileSync(join(DIR, name), 'utf8');
  for (const m of src.matchAll(CALL)) calls.set(m[1]!, m[2]!.replace(/\\'/g, "'"));
}

describe('content script catalogue coverage', () => {
  it('finds the calls at all, so an empty scan cannot pass as a clean one', () => {
    expect(calls.size).toBeGreaterThan(30);
  });

  it('has an English entry for every key asked for', () => {
    const en = catalogue('en');
    expect([...calls.keys()].filter((k) => !(k in en))).toEqual([]);
  });

  it('keeps each fallback identical to its English entry', () => {
    const en = catalogue('en');
    const drifted = [...calls]
      .filter(([k, text]) => k in en && en[k]!.message !== text)
      .map(([k, text]) => `${k}: code ${JSON.stringify(text)} vs catalogue ${JSON.stringify(en[k]!.message)}`);
    expect(drifted).toEqual([]);
  });

  it('covers the same ten languages the interface offers', () => {
    // The options page and the popup speak ten. A chat that speaks three sends
    // seven of those readers back to English the moment they look at it.
    expect(readdirSync(LOCALES).sort()).toEqual(
      ['ar', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'tr', 'zh'],
    );
  });

  it('declares a placeholder for every token a fallback carries', () => {
    const en = catalogue('en');
    for (const [key, text] of calls) {
      const tokens = text.match(/\$[A-Za-z][A-Za-z0-9_]*\$/g) ?? [];
      const declared = Object.keys(en[key]?.placeholders ?? {});
      expect({ key, count: declared.length }).toEqual({ key, count: tokens.length });
    }
  });
});
