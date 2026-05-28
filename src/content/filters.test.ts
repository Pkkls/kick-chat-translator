import { describe, expect, it } from 'vitest';
import { defaultSettings } from '~/shared/settings';
import {
  isSameLanguageAsTarget,
  shouldDropBySourceLang,
  shouldDropByUserOrChannel,
} from './filters';

describe('shouldDropByUserOrChannel', () => {
  it('drops common bots when ignoreBots is on', () => {
    const s = { ...defaultSettings(), ignoreBots: true };
    const drop = shouldDropByUserOrChannel(
      { username: 'streamelements', channel: 'foo', isBot: false },
      s,
    );
    expect(drop).toBe('bot');
  });

  it('drops blacklisted users', () => {
    const s = { ...defaultSettings(), blacklistUsers: ['spammer'] };
    const drop = shouldDropByUserOrChannel(
      { username: 'spammer', channel: 'foo', isBot: false },
      s,
    );
    expect(drop).toBe('user_blacklisted');
  });

  it('enforces whitelist when non-empty', () => {
    const s = { ...defaultSettings(), whitelistChannels: ['adin'] };
    const drop = shouldDropByUserOrChannel(
      { username: 'someone', channel: 'foo', isBot: false },
      s,
    );
    expect(drop).toBe('channel_not_whitelisted');
  });

  it('passes by default', () => {
    const drop = shouldDropByUserOrChannel(
      { username: 'someone', channel: 'foo', isBot: false },
      defaultSettings(),
    );
    expect(drop).toBeUndefined();
  });
});

describe('shouldDropBySourceLang', () => {
  it('returns undefined when allowlist empty', () => {
    expect(shouldDropBySourceLang('ja', defaultSettings())).toBeUndefined();
  });

  it('drops langs not in allowlist', () => {
    const s = { ...defaultSettings(), sourceLangAllowlist: ['ja', 'ko'] };
    expect(shouldDropBySourceLang('fr', s)).toBe('lang_not_allowed');
    expect(shouldDropBySourceLang('ja', s)).toBeUndefined();
  });
});

describe('isSameLanguageAsTarget', () => {
  it('compares case-insensitively', () => {
    expect(isSameLanguageAsTarget('EN', 'en')).toBe(true);
    expect(isSameLanguageAsTarget('ja', 'en')).toBe(false);
  });
});
