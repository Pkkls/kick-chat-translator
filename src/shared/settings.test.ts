import { describe, expect, it } from 'vitest';
import { defaultSettings, SettingsSchema } from './settings';

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

describe('defaultSettings', () => {
  it('returns a fresh copy each time', () => {
    const a = defaultSettings();
    const b = defaultSettings();
    a.providerOrder.push('deepl');
    expect(b.providerOrder).not.toContain('deepl');
  });
});
