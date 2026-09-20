import { describe, expect, it } from 'vitest';
import { toMyMemoryCode } from './mymemory';

describe('toMyMemoryCode', () => {
  it('autodetects when the source is unknown', () => {
    expect(toMyMemoryCode(undefined)).toBe('autodetect');
    expect(toMyMemoryCode('auto')).toBe('autodetect');
  });

  it('maps regional variants to the codes MyMemory expects', () => {
    expect(toMyMemoryCode('pt-br')).toBe('pt-BR');
    expect(toMyMemoryCode('pt')).toBe('pt-PT');
    expect(toMyMemoryCode('zh')).toBe('zh-CN');
    expect(toMyMemoryCode('zh-tw')).toBe('zh-TW');
    expect(toMyMemoryCode('zh-hant')).toBe('zh-TW');
    expect(toMyMemoryCode('nb')).toBe('no');
  });

  // Measured, not assumed: MyMemory echoes `target: "yue-CN"` for a bare 'yue',
  // and the reader this serves is in Hong Kong.
  it('names the region for Cantonese, which otherwise resolves to yue-CN', () => {
    expect(toMyMemoryCode('yue')).toBe('yue-HK');
    expect(toMyMemoryCode('YUE')).toBe('yue-HK');
  });

  it('passes plain 2-letter codes through (case-insensitive)', () => {
    expect(toMyMemoryCode('en')).toBe('en');
    expect(toMyMemoryCode('ja')).toBe('ja');
    expect(toMyMemoryCode('ES')).toBe('es');
  });

  it('strips an unmapped region down to its base code', () => {
    expect(toMyMemoryCode('en-GB')).toBe('en');
    expect(toMyMemoryCode('fr-CA')).toBe('fr');
  });
});
