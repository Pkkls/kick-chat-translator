import { describe, expect, it } from 'vitest';
import {
  COMPOSE_MAX_LEN,
  RateLimiter,
  Sequencer,
  decideComposeAction,
  isLinkOrMentionOnly,
  maskProtected,
  unmaskProtected,
} from './composeLogic';

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

  it('skips text longer than the cap', () => {
    expect(decideComposeAction('a'.repeat(COMPOSE_MAX_LEN + 1), undefined, 'fr', 'en')).toBe('skip-long');
  });

  it('skips link/mention-only input', () => {
    expect(decideComposeAction('https://kick.com/foo', undefined, undefined, 'en')).toBe('skip-noise');
    expect(decideComposeAction('@alice @bob', undefined, undefined, 'en')).toBe('skip-noise');
  });

  it('skips pure streaming slang (gg/ez/poggers)', () => {
    expect(decideComposeAction('gg ez poggers', undefined, undefined, 'en')).toBe('skip-noise');
  });
});

describe('maskProtected / unmaskProtected', () => {
  it('shields @handles and URLs, then restores them', () => {
    const { masked, tokens } = maskProtected('hey @cool.user check https://kick.com/x nice');
    expect(masked).not.toContain('@cool.user');
    expect(masked).not.toContain('https://');
    expect(tokens).toEqual(['@cool.user', 'https://kick.com/x']);
    // A translator that keeps the placeholders → handles/links come back intact.
    const translated = masked.replace('hey', 'salut').replace('check', 'regarde').replace('nice', 'sympa');
    const restored = unmaskProtected(translated, tokens);
    expect(restored).toContain('@cool.user');
    expect(restored).toContain('https://kick.com/x');
  });
  it('is a no-op when there is nothing to protect', () => {
    const { masked, tokens } = maskProtected('bonjour tout le monde');
    expect(masked).toBe('bonjour tout le monde');
    expect(tokens).toEqual([]);
    expect(unmaskProtected('hello everyone', tokens)).toBe('hello everyone');
  });
});

describe('isLinkOrMentionOnly', () => {
  it('detects link/mention-only text', () => {
    expect(isLinkOrMentionOnly('https://example.com')).toBe(true);
    expect(isLinkOrMentionOnly('@user')).toBe(true);
    expect(isLinkOrMentionOnly('@user https://x.io')).toBe(true);
  });
  it('passes text with real words', () => {
    expect(isLinkOrMentionOnly('@user check this https://x.io')).toBe(false);
    expect(isLinkOrMentionOnly('bonjour')).toBe(false);
    expect(isLinkOrMentionOnly('')).toBe(false);
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
