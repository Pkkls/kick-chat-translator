import { describe, expect, it } from 'vitest';
import { isNewerVersion, parseVersion } from './version';

describe('parseVersion', () => {
  it('strips a leading v and splits numerically', () => {
    expect(parseVersion('v2.2.1')).toEqual([2, 2, 1]);
    expect(parseVersion('2.2.1')).toEqual([2, 2, 1]);
  });
  it('coerces non-numeric segments to 0', () => {
    expect(parseVersion('v2.x')).toEqual([2, 0]);
    expect(parseVersion('')).toEqual([0]);
  });
});

describe('isNewerVersion', () => {
  it('detects a strictly newer version', () => {
    expect(isNewerVersion('v2.2.1', '2.2.0')).toBe(true);
    expect(isNewerVersion('2.3.0', '2.2.9')).toBe(true);
    expect(isNewerVersion('3.0.0', '2.9.9')).toBe(true);
    expect(isNewerVersion('v2.2.10', 'v2.2.9')).toBe(true);
  });
  it('returns false for equal or older', () => {
    expect(isNewerVersion('2.2.1', '2.2.1')).toBe(false);
    expect(isNewerVersion('v2.2.1', 'v2.2.1')).toBe(false);
    expect(isNewerVersion('2.2.0', '2.2.1')).toBe(false);
    expect(isNewerVersion('2.1.9', '2.2.0')).toBe(false);
  });
  it('handles differing segment counts', () => {
    expect(isNewerVersion('2.2.1.1', '2.2.1')).toBe(true);
    expect(isNewerVersion('2.2', '2.2.1')).toBe(false);
  });
});
