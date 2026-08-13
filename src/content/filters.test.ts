import { describe, expect, it } from 'vitest';
import { defaultSettings } from '~/shared/settings';
import {
  isNoise,
  isSameLanguageAsTarget,
  shouldDropBySourceLang,
  shouldDropByUserOrChannel,
} from './filters';

describe('shouldDropByUserOrChannel', () => {
  it('drops common bots when ignoreBots is on', () => {
    const s = { ...defaultSettings(), ignoreBots: true };
    expect(shouldDropByUserOrChannel({ username: 'streamelements', channel: 'foo', isBot: false }, s)).toBe('bot');
  });

  it('drops blacklisted users', () => {
    const s = { ...defaultSettings(), blacklistUsers: ['spammer'] };
    expect(shouldDropByUserOrChannel({ username: 'spammer', channel: 'foo', isBot: false }, s)).toBe('user_blacklisted');
  });

  it('enforces whitelist when non-empty', () => {
    const s = { ...defaultSettings(), whitelistChannels: ['adin'] };
    expect(shouldDropByUserOrChannel({ username: 'someone', channel: 'foo', isBot: false }, s)).toBe(
      'channel_not_whitelisted',
    );
  });

  it('passes by default', () => {
    expect(
      shouldDropByUserOrChannel({ username: 'someone', channel: 'foo', isBot: false }, defaultSettings()),
    ).toBeUndefined();
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
  it('treats regional variants as the same base language', () => {
    expect(isSameLanguageAsTarget('pt', 'pt-br')).toBe(true);
    expect(isSameLanguageAsTarget('zh', 'zh-tw')).toBe(true);
    expect(isSameLanguageAsTarget('pt', 'es')).toBe(false);
  });
  it('is false when detection is undefined', () => {
    expect(isSameLanguageAsTarget(undefined, 'en')).toBe(false);
  });
});

describe('isNoise', () => {
  it('flags emoji-only', () => {
    expect(isNoise('🤣🤣🤣')).toBe(true);
    expect(isNoise('😂')).toBe(true);
  });
  it('flags laughter / w-spam (multi-language)', () => {
    expect(isNoise('wwwww')).toBe(true);
    expect(isNoise('WWWWWWWW')).toBe(true);
    expect(isNoise('jajajaja')).toBe(true);
    expect(isNoise('lolol')).toBe(true);
    expect(isNoise('kkkkkk')).toBe(true); // BR
    expect(isNoise('rsrs')).toBe(true); // BR
    expect(isNoise('huehue')).toBe(true); // BR
    expect(isNoise('xddd')).toBe(true);
    expect(isNoise('hehe')).toBe(true);
    expect(isNoise('uwu')).toBe(true);
  });
  it('flags single repeated char and punctuation', () => {
    expect(isNoise('ーーーー')).toBe(true);
    expect(isNoise('!!!')).toBe(true);
    expect(isNoise('123')).toBe(true);
  });
  it('does NOT flag real messages', () => {
    expect(isNoise('その意味は')).toBe(false);
    expect(isNoise('hola amigo')).toBe(false);
    expect(isNoise('下ネタきも')).toBe(false);
  });
});

describe('username matching across letter case', () => {
  const drop = (name: string, blacklisted: string) =>
    shouldDropByUserOrChannel(
      { username: name.trim().toLowerCase(), channel: 'c', isBot: false },
      // Stored exactly as the options page stores it.
      { ...defaultSettings(), blacklistUsers: [blacklisted.trim().toLowerCase()] },
    );

  it('blocks an ASCII name whatever case it was typed in', () => {
    expect(drop('Bob', 'bob')).toBe('user_blacklisted');
    expect(drop('Bob', 'BOB')).toBe('user_blacklisted');
  });

  // Lowercasing Turkish İ in JS yields "i" plus a combining dot, and the number of
  // those dots depends on how the name was capitalised, so the same name typed in
  // a different case stopped matching itself.
  it('blocks a Turkish name whatever case it was typed in', () => {
    expect(drop('İbrahim', 'İbrahim')).toBe('user_blacklisted');
    expect(drop('İbrahim', 'İBRAHİM')).toBe('user_blacklisted');
    expect(drop('İBRAHİM', 'İbrahim')).toBe('user_blacklisted');
  });

  it('does not block a different name', () => {
    expect(drop('İbrahim', 'mehmet')).toBeUndefined();
  });
});
