import { describe, expect, it } from 'vitest';
import { parseKickContent } from './emoteParser';

describe('realText (what we actually translate)', () => {
  it('drops emote-only messages to empty realText', () => {
    expect(parseKickContent('[emote:1:KEKW] [emote:2:PepeLaugh]').realText).toBe('');
  });
  it('drops url-only messages to empty realText', () => {
    expect(parseKickContent('https://discord.gg/foo').realText).toBe('');
  });
  it('drops mention-only messages to empty realText', () => {
    expect(parseKickContent('@joao').realText).toBe('');
  });
  it('keeps the real words, removing emotes/mentions/urls', () => {
    const r = parseKickContent('@joao vamos [emote:1:KEKW] https://x.io agora');
    expect(r.realText).toBe('vamos  agora'.replace(/\s+/g, ' ').trim());
  });
});

describe('parseKickContent', () => {
  it('returns plain text untouched when there are no markers', () => {
    const r = parseKickContent('hello world');
    expect(r.plain).toBe('hello world');
    expect(r.realText).toBe('hello world');
    expect(r.tokens).toEqual([{ kind: 'text', value: 'hello world' }]);
  });

  it('extracts an emote token and replaces it with a readable placeholder', () => {
    const r = parseKickContent('hi [emote:123:Kappa] there');
    expect(r.tokens).toHaveLength(3);
    const emote = r.tokens[1];
    expect(emote).toEqual({ kind: 'emote', id: '123', name: 'Kappa' });
    expect(r.plain).toBe('hi :Kappa: there');
  });

  it('extracts mention with leading whitespace preserved', () => {
    const r = parseKickContent('yo @adin nice');
    const mention = r.tokens.find((t) => t.kind === 'mention');
    expect(mention).toEqual({ kind: 'mention', user: 'adin' });
    expect(r.plain).toContain('@adin');
  });

  it('extracts URLs without breaking adjacent text', () => {
    const r = parseKickContent('check https://kick.com/foo now');
    const url = r.tokens.find((t) => t.kind === 'url');
    expect(url).toEqual({ kind: 'url', href: 'https://kick.com/foo' });
    expect(r.plain).toBe('check [link] now');
  });

  it('does not double-match overlapping URLs and mentions', () => {
    const r = parseKickContent('see https://kick.com/@adin x');
    const url = r.tokens.find((t) => t.kind === 'url');
    expect(url?.kind).toBe('url');
    // the @adin inside the URL must not be extracted as a mention
    const mention = r.tokens.find((t) => t.kind === 'mention');
    expect(mention).toBeUndefined();
  });

  it('strips multiple emotes correctly', () => {
    const r = parseKickContent('[emote:1:A] [emote:2:B] text');
    const emotes = r.tokens.filter((t) => t.kind === 'emote');
    expect(emotes).toHaveLength(2);
    expect(r.plain).toBe(':A: :B: text');
  });
});
