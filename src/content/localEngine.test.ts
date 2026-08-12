import { afterEach, describe, expect, it, vi } from 'vitest';
import { localEngine } from './localEngine';

// The engine is a module singleton with no reset, so each test uses its own
// language pair rather than trying to clear shared state.
function stubTranslator(availability: string, translate?: (t: string) => Promise<string>) {
  vi.stubGlobal('Translator', {
    availability: () => Promise.resolve(availability),
    create: () => Promise.resolve({ translate: translate ?? ((t: string) => Promise.resolve(`[${t}]`)) }),
  });
}

describe('localEngine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports absent when the browser has no Translator API', () => {
    vi.unstubAllGlobals();
    expect(localEngine.present()).toBe(false);
  });

  it('treats regional variants as the same pair', async () => {
    stubTranslator('available');
    await localEngine.probe('pt-BR', 'EN-US');
    expect(localEngine.stateOf('pt', 'en')).toBe('available');
    expect(localEngine.isReady('PT', 'en')).toBe(true);
  });

  it('ignores pairs that cannot be translated on device', () => {
    stubTranslator('available');
    localEngine.noteSeen('auto', 'de');
    localEngine.noteSeen('und', 'de');
    localEngine.noteSeen('de', 'de');
    localEngine.noteSeen('', 'de');
    // No probe was issued for any of them.
    expect(localEngine.stateOf('auto', 'de')).toBe('unknown');
    expect(localEngine.stateOf('und', 'de')).toBe('unknown');
    expect(localEngine.hasReadyForTarget('de')).toBe(false);
  });

  it('marks a pair unavailable when availability throws', async () => {
    vi.stubGlobal('Translator', {
      availability: () => Promise.reject(new Error('boom')),
      create: () => Promise.reject(new Error('boom')),
    });
    await localEngine.probe('sv', 'fi');
    expect(localEngine.stateOf('sv', 'fi')).toBe('unavailable');
  });

  // Only pairs actually seen in chat are offered, so probing a pair is not enough
  // on its own to put it in front of the user.
  it('lists only pairs seen in chat that a user gesture could enable', async () => {
    stubTranslator('downloadable');
    await localEngine.probe('is', 'mt');
    expect(localEngine.downloadablePairs()).not.toContainEqual({ src: 'is', tgt: 'mt' });

    localEngine.noteSeen('nl', 'da');
    await localEngine.probe('nl', 'da');
    expect(localEngine.downloadablePairs()).toContainEqual({ src: 'nl', tgt: 'da' });
  });

  it('refuses to translate a pair that is not downloaded, so the caller can use the cloud', async () => {
    stubTranslator('downloadable');
    await localEngine.probe('el', 'hu');
    await expect(localEngine.translate('el', 'hu', 'x')).rejects.toThrow('not_ready');
  });

  it('translates once the pair is available', async () => {
    stubTranslator('available');
    await localEngine.probe('ro', 'sk');
    await expect(localEngine.translate('ro', 'sk', 'buna')).resolves.toBe('[buna]');
  });

  it('rejects a blank on-device result instead of showing an empty translation', async () => {
    stubTranslator('available', () => Promise.resolve('   '));
    await localEngine.probe('lt', 'lv');
    await expect(localEngine.translate('lt', 'lv', 'x')).rejects.toThrow('empty');
  });

  it('notifies listeners when a probe changes state', async () => {
    stubTranslator('available');
    const seen = vi.fn();
    const off = localEngine.onChange(seen);
    await localEngine.probe('et', 'bg');
    off();
    expect(seen).toHaveBeenCalled();
  });
});
