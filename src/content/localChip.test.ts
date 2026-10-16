import { describe, expect, it } from 'vitest';
import { localChipState, type ChipEngine } from './localChip';

const engine = (pairs: { src: string; tgt: string }[], ready: string[] = []): ChipEngine => ({
  present: () => true,
  hasReadyForTarget: (t) => ready.includes(t),
  downloadablePairs: () => pairs,
  stateOf: () => 'downloadable',
  progressOf: () => 0,
});

describe('the on-device chip', () => {
  // The engine knows pairs in the resolved language. With the raw 'auto'
  // setting, the default, the chip found nothing and never offered the download.
  it('offers the download for the resolved reading language', () => {
    expect(localChipState(true, 'fr', engine([{ src: 'ja', tgt: 'fr' }]))).toEqual({ kind: 'download', label: 'JA' });
  });

  it("finds nothing when asked with 'auto', which is why the caller resolves it", () => {
    expect(localChipState(true, 'auto', engine([{ src: 'ja', tgt: 'fr' }]))).toEqual({ kind: 'hidden' });
  });

  it('says ready, and stays hidden when off or absent', () => {
    expect(localChipState(true, 'fr', engine([], ['fr']))).toEqual({ kind: 'ready' });
    expect(localChipState(false, 'fr', engine([{ src: 'ja', tgt: 'fr' }]))).toEqual({ kind: 'hidden' });
    expect(localChipState(true, 'fr', { ...engine([]), present: () => false })).toEqual({ kind: 'hidden' });
  });
});
