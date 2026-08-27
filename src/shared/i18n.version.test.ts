import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import keys from './i18n/keys.json';

/**
 * No interface string may carry a version number.
 *
 * The options page header said "v2 · options & preferences" from the day the
 * v2 line started, and it was still saying it at 2.8.0. The number was inside
 * the translated key, so it had been baked into all nine catalogues as well:
 * ten places to edit, none of which anyone would think to edit when bumping a
 * version. The popup had always read `getManifest().version` instead, so the
 * two surfaces disagreed with each other.
 */
describe('interface strings', () => {
  const canonical = keys as string[];

  it('has keys to check, so an empty list cannot pass', () => {
    expect(canonical.length).toBeGreaterThan(100);
  });

  it('carries no version number', () => {
    // `v2`, `2.8`, `v2.8.0`. Not a bare digit: "1000/day" and "~1000" are fine.
    const versionish = /(?:^|[\s(])v\d+(?:\.\d+)*(?:$|[\s).·])|\d+\.\d+\.\d+/;
    expect(canonical.filter((k) => versionish.test(k))).toEqual([]);
  });

  it('carries no version number in any translation either', () => {
    const offenders: string[] = [];
    for (const loc of ['ar', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'tr', 'zh']) {
      const text = readFileSync(`src/shared/i18n/${loc}.ts`, 'utf8');
      for (const m of text.matchAll(/^\s*'([^']*)':\s*'([^']*)',/gm)) {
        if (/(?:^|[\s(])v\d+(?:\.\d+)*(?:$|[\s).·])/.test(m[2]!)) offenders.push(`${loc}: ${m[2]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Control: the header still says something, and it comes from the manifest.
   * A page that dropped the line entirely would satisfy every check above.
   */
  it('reads the version from the manifest, as the popup does', () => {
    const app = readFileSync('src/options/App.tsx', 'utf8');
    expect(app).toMatch(/chrome\.runtime\.getManifest\(\)\.version/);
    expect(app).toContain("t('options & preferences')");
  });
});
