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

describe('the inline emote-name stripper leaves ordinary words alone', () => {
  // Measured over 11583 words of the store listings: the previous rules
  // destroyed 30 distinct ordinary words before anything was translated, and
  // the reader saw a translation of a sentence they had not written. Nothing
  // pinned those rules, so all ten tests above passed either way.
  const intacts = [
    // Turkish forms the negative aorist with -mez. An `ez` alternative in the
    // suffix list deleted a whole grammatical class, in the second most read of
    // the localised listings.
    'bu is gerekmez ama yine de deneyelim',
    'o gelmez ve bize haber göndermez',
    // Spanish and Czech pay the same price for `ez`.
    'no me lo puedo creer otra vez lo mismo',
    'bez problemu, uvidime se zitra',
    // A lowercase word of thirteen characters or more is ordinary in Spanish,
    // Portuguese, Turkish, German and Finnish. The rule that deleted those
    // caught exactly one emote name, which the suffix rule catches too.
    'que configuracion usas para el raton',
    'esto es completamente diferente amigo',
    'obrigado pelo armazenamento gratuito',
  ];

  for (const phrase of intacts) {
    it(`keeps every word of ${JSON.stringify(phrase.slice(0, 28))}`, () => {
      expect(parseKickContent(phrase).realText).toBe(phrase);
    });
  }

  it('still strips emote names mixed into a sentence', () => {
    expect(parseKickContent('hola pepeLaugh que tal la partida').realText).toBe(
      'hola que tal la partida',
    );
    expect(parseKickContent('eso fue OMEGALUL de verdad').realText).toBe('eso fue de verdad');
    expect(parseKickContent('mira namedarumajankiss2 ahora').realText).toBe('mira ahora');
  });
});
