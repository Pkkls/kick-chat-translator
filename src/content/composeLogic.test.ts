import { describe, expect, it } from 'vitest';
import { RateLimiter, Sequencer, decideComposeAction } from './composeLogic';

describe('decideComposeAction', () => {
  it('skips empty / whitespace-only input', () => {
    expect(decideComposeAction('', undefined, undefined, 'en')).toBe('skip-empty');
    expect(decideComposeAction('   ', undefined, undefined, 'en')).toBe('skip-empty');
  });

  it('skips fragments below the minimum length', () => {
    expect(decideComposeAction('a', undefined, undefined, 'en', 2)).toBe('skip-short');
  });

  it('skips chat noise (laughter / emoji spam)', () => {
    expect(decideComposeAction('wwww', undefined, undefined, 'en')).toBe('skip-noise');
    expect(decideComposeAction('jajaja', undefined, undefined, 'en')).toBe('skip-noise');
  });

  it('skips when the detected source already equals the target', () => {
    expect(decideComposeAction('hello there friend', undefined, 'en', 'en')).toBe('skip-same-lang');
    expect(decideComposeAction('hello there friend', undefined, 'EN', 'en')).toBe('skip-same-lang');
  });

  it('still translates when detection is uncertain (let the provider auto-detect)', () => {
    expect(decideComposeAction('some ambiguous text', undefined, undefined, 'en')).toBe('translate');
  });

  it('dedups identical consecutive text', () => {
    expect(decideComposeAction('bonjour tout le monde', 'bonjour tout le monde', 'fr', 'en')).toBe('skip-unchanged');
    // Trailing whitespace must not defeat dedup.
    expect(decideComposeAction('bonjour  ', 'bonjour', 'fr', 'en')).toBe('skip-unchanged');
  });

  it('translates fresh foreign text', () => {
    expect(decideComposeAction('bonjour tout le monde', undefined, 'fr', 'en')).toBe('translate');
  });
});

describe('Sequencer', () => {
  it('hands out monotonic ids and only the newest is current', () => {
    const s = new Sequencer();
    const a = s.next();
    const b = s.next();
    expect(b).toBeGreaterThan(a);
    expect(s.isCurrent(a)).toBe(false);
    expect(s.isCurrent(b)).toBe(true);
    expect(s.current).toBe(b);
  });
});

describe('RateLimiter', () => {
  it('allows up to max within the window, then denies', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.tryAcquire(0)).toBe(true);
    expect(rl.tryAcquire(0)).toBe(true);
    expect(rl.tryAcquire(0)).toBe(false);
  });

  it('recovers once the window slides past old hits', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.tryAcquire(0)).toBe(true);
    expect(rl.tryAcquire(500)).toBe(false);
    expect(rl.tryAcquire(1001)).toBe(true);
  });
});
