import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHAT_MESSAGES } from './index';
import { CHAT_LOCALES } from './codes';

describe('chat locale codes', () => {
  it('names exactly the catalogues the worker can hand over', () => {
    expect([...CHAT_LOCALES].sort()).toEqual(Object.keys(CHAT_MESSAGES).sort());
  });

  // The point of the list: the page script must not import the catalogues.
  it('keeps the catalogues out of the page script', () => {
    const page = readdirSync('src/content').filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'));
    expect(page.length).toBeGreaterThan(20); // an empty scan must not pass
    const offenders = page.filter((f) => /from '\.\/i18n(\/index)?'/.test(readFileSync(`src/content/${f}`, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
