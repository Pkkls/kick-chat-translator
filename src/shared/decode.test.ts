import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities } from './decode';

describe('decodeHtmlEntities', () => {
  it('returns input unchanged when no entities', () => {
    expect(decodeHtmlEntities('hola amigo')).toBe('hola amigo');
  });
  it('decodes named entities', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeHtmlEntities('say &quot;hi&quot;')).toBe('say "hi"');
    expect(decodeHtmlEntities('it&apos;s')).toBe("it's");
  });
  it('decodes numeric + hex entities', () => {
    expect(decodeHtmlEntities('it&#39;s')).toBe("it's");
    expect(decodeHtmlEntities('&#x27;quoted&#x27;')).toBe("'quoted'");
  });
  it('leaves unknown entities intact', () => {
    expect(decodeHtmlEntities('a &unknown; b')).toBe('a &unknown; b');
  });
});
