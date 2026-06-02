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
