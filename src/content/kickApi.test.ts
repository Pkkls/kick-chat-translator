import { describe, expect, it } from 'vitest';
import { extractChannelSlug } from './kickApi';

describe('extractChannelSlug', () => {
  it('returns the first path segment for a channel URL', () => {
    expect(extractChannelSlug('/adinross')).toBe('adinross');
    expect(extractChannelSlug('/adinross/clips')).toBe('adinross');
  });

  it('returns undefined for reserved routes', () => {
    expect(extractChannelSlug('/browse')).toBeUndefined();
    expect(extractChannelSlug('/community')).toBeUndefined();
    expect(extractChannelSlug('/settings')).toBeUndefined();
    expect(extractChannelSlug('/')).toBeUndefined();
  });

  it('lowercases the slug', () => {
    expect(extractChannelSlug('/AdinRoss')).toBe('adinross');
  });
});
