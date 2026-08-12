import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettingsJson, SettingsSchema } from './settings';

describe('SettingsSchema', () => {
  it('fills defaults for missing fields', () => {
    const s = SettingsSchema.parse({});
    expect(s.enabled).toBe(true);
    expect(s.targetLang).toBe('auto');
    expect(s.composeTargetLang).toBe('auto');
    expect(s.providerOrder).toEqual(['google', 'mymemory', 'lingva']);
  });

  it('rejects invalid lingva URL', () => {
    const result = SettingsSchema.safeParse({ lingvaInstance: 'not a url' });
    expect(result.success).toBe(false);
  });

  it('accepts empty lingvaInstance as default', () => {
    const result = SettingsSchema.safeParse({ lingvaInstance: '' });
    expect(result.success).toBe(true);
  });
});

describe('parseSettingsJson', () => {
  it('round-trips an exported payload', () => {
    const source = { ...defaultSettings(), targetLang: 'fr', concurrency: 8 };
    const back = parseSettingsJson(JSON.stringify(source));
    expect(back.targetLang).toBe('fr');
    expect(back.concurrency).toBe(8);
  });

  it('fills defaults for a backup from an older build', () => {
    const parsed = parseSettingsJson(JSON.stringify({ targetLang: 'ja' }));
    expect(parsed.targetLang).toBe('ja');
    expect(parsed.concurrency).toBe(defaultSettings().concurrency);
  });

  it('drops unknown fields from a newer build', () => {
    const parsed = parseSettingsJson(JSON.stringify({ futureOption: 42 }));
    expect(parsed).not.toHaveProperty('futureOption');
  });

  it('throws on malformed JSON', () => {
    expect(() => parseSettingsJson('{ not json')).toThrow();
  });

  it('throws on a structurally invalid payload', () => {
    expect(() => parseSettingsJson(JSON.stringify({ lingvaInstance: 'not a url' }))).toThrow();
  });
});

describe('defaultSettings', () => {
  it('returns a fresh copy each time', () => {
    const a = defaultSettings();
    const b = defaultSettings();
    a.providerOrder.push('deepl');
    expect(b.providerOrder).not.toContain('deepl');
  });
});
