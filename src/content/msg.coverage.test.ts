import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAT_MESSAGES } from './i18n';
import { msg, setContentLocale } from './msg';

/**
 * Every key the content script asks msg() for has to exist in every catalogue,
 * and no catalogue may quietly ship the English text back.
 *
 * The options bundle has had a check like this since nine strings drifted
 * through the gap there. The content script had none, and what that cost,
 * measured before this file existed: thirty-nine user-visible strings written
 * straight into the DOM in English, including every label on the floating bar
 * and all sixteen reasons a line can be left untranslated.
 *
 * The catalogues are IMPORTED, not read as text. Two earlier scans in this
 * codebase parsed source with a regex and quietly saw less than they claimed:
 * one missed every fallback written with double quotes, which is what prettier
 * does to a string containing an apostrophe, and one missed every entry after
 * prettier rewrote the generated files to single quotes. A probe that cannot
 * see a third of its subject reports a clean run.
 */
const DIR = join(process.cwd(), 'src', 'content');
const LOCALES = Object.keys(CHAT_MESSAGES);

// Both quote styles, and a fallback that may sit on its own line after
// prettier has wrapped the call.
const CALL =
  /(?:\bmsg|\blocalised)\(\s*'([A-Za-z][A-Za-z0-9_]*)'\s*,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;

const calls = new Map<string, string>();
for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.ts') || name.includes('.test.')) continue;
  const src = readFileSync(join(DIR, name), 'utf8');
  for (const m of src.matchAll(CALL)) {
    calls.set(m[1]!, (m[2] ?? m[3] ?? '').replace(/\\'/g, "'"));
  }
}

describe('chat catalogue coverage', () => {
  it('finds the calls at all, so an empty scan cannot pass as a clean one', () => {
    expect(calls.size).toBeGreaterThan(40);
  });

  it('covers the nine languages the interface offers beyond English', () => {
    // English is not shipped: it is the fallback at every call site.
    expect(LOCALES.slice().sort()).toEqual(['ar', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'tr', 'zh']);
  });

  it.each(LOCALES)('%s answers for every key the code asks for', (locale) => {
    const table = CHAT_MESSAGES[locale]!;
    expect([...calls.keys()].filter((k) => !(k in table))).toEqual([]);
  });

  it.each(LOCALES)('%s carries nothing the code never asks for', (locale) => {
    expect(Object.keys(CHAT_MESSAGES[locale]!).filter((k) => !calls.has(k))).toEqual([]);
  });

  /**
   * A paste of the English text reads as done and ships as a no-op: the reader
   * gets English from a catalogue that promised their language.
   *
   * Four entries genuinely land on the same string, all of them in the Romance
   * languages and all of them words those languages share with English. They
   * are named here rather than waved past, so a fifth has to be argued for
   * instead of appearing.
   *
   * A regex scan over the generated files said there were none of these. It was
   * looking for double quotes, and prettier had rewritten the files to single
   * ones. That is why this suite imports the catalogues.
   */
  const SHARED_WITH_ENGLISH: Record<string, string[]> = {
    barOptionsTip: ['fr'], // "Options"
    barVia: ['fr', 'pt', 'es'], // "via", Latin, unchanged
    localDownload: ['fr', 'pt', 'es'], // "Local (…)"
    localReady: ['fr', 'pt', 'es'], // "Local"
  };

  it.each(LOCALES)('%s left no untranslated copy of the English text', (locale) => {
    const table = CHAT_MESSAGES[locale]!;
    const same = [...calls]
      .filter(([k, en]) => table[k] === en)
      .map(([k]) => k)
      .filter((k) => !SHARED_WITH_ENGLISH[k]?.includes(locale));
    expect(same).toEqual([]);
  });

  // Control: every entry on the list is still actually identical. Once one is
  // translated the exemption is stale, and a stale exemption is a hole nobody
  // is watching.
  it('keeps no exemption it no longer needs', () => {
    const stale: string[] = [];
    for (const [key, locales] of Object.entries(SHARED_WITH_ENGLISH)) {
      for (const locale of locales) {
        if (CHAT_MESSAGES[locale]?.[key] !== calls.get(key)) stale.push(`${locale}/${key}`);
      }
    }
    expect(stale).toEqual([]);
  });

  it.each(LOCALES)('%s keeps every placeholder its English carries', (locale) => {
    const table = CHAT_MESSAGES[locale]!;
    for (const [key, en] of calls) {
      const wanted = (en.match(/\$[A-Za-z][A-Za-z0-9_]*\$/g) ?? []).sort();
      const got = (table[key]?.match(/\$[A-Za-z][A-Za-z0-9_]*\$/g) ?? []).sort();
      expect({ key, got }).toEqual({ key, got: wanted });
    }
  });
});

/**
 * The point of the whole move. chrome.i18n answers in the browser's language
 * and MV3 has no way to ask it for another, so `uiLang` moved the options page
 * and left the chat alone.
 */
describe('the chat follows the uiLang setting', () => {
  it('answers in the language that was set, not the browser one', () => {
    setContentLocale('ja');
    expect(msg('barOn', 'Translating')).toBe(CHAT_MESSAGES.ja!.barOn);
    setContentLocale('fr');
    expect(msg('barOn', 'Translating')).toBe(CHAT_MESSAGES.fr!.barOn);
  });

  it('falls back to the English argument for a language it does not ship', () => {
    setContentLocale('en');
    expect(msg('barOn', 'Translating')).toBe('Translating');
  });

  // Control: without this the two above would pass on a msg() that always
  // returned its fallback, which is exactly the state before this change.
  it('is actually reading a table, not handing back the fallback', () => {
    setContentLocale('ru');
    expect(msg('barOn', 'Translating')).not.toBe('Translating');
    setContentLocale('en');
  });

  it('substitutes placeholders in a catalogue entry as well as in a fallback', () => {
    setContentLocale('fr');
    const out = msg('flagFrom', 'from $LANG$', ['Japonais']);
    expect(out).toContain('Japonais');
    expect(out).not.toContain('$LANG$');
    setContentLocale('en');
    expect(msg('flagFrom', 'from $LANG$', ['Japanese'])).toBe('from Japanese');
  });
});
