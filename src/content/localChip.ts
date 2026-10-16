import type { LocalChipState } from './injector';
import type { PairState } from './localEngine';

/** The parts of the on-device engine the chip reads. */
export interface ChipEngine {
  present(): boolean;
  hasReadyForTarget(tgt: string): boolean;
  downloadablePairs(): { src: string; tgt: string }[];
  stateOf(src: string, tgt: string): PairState;
  progressOf(src: string, tgt: string): number;
}

/**
 * What the floating bar's on-device chip shows.
 *
 * `target` must be the RESOLVED reading language. The engine is asked in it
 * (pipeline effTarget), so the pairs it knows are 'en>fr', never 'en>auto'.
 * This used to read the raw setting, and 'auto', the default, matched no pair:
 * the download chip never showed and the on-device engine, about seventy
 * times faster than the cloud, was never offered to anyone who kept it.
 */
export function localChipState(localEnabled: boolean, target: string, engine: ChipEngine): LocalChipState {
  if (!localEnabled || !engine.present()) return { kind: 'hidden' };
  if (engine.hasReadyForTarget(target)) return { kind: 'ready' };
  const downloadable = engine.downloadablePairs().filter((p) => p.tgt === target);
  const downloading = downloadable.find((p) => engine.stateOf(p.src, p.tgt) === 'downloading');
  if (downloading) return { kind: 'downloading', pct: engine.progressOf(downloading.src, downloading.tgt) };
  if (downloadable.length > 0) return { kind: 'download', label: downloadable[0]!.src.toUpperCase() };
  return { kind: 'hidden' };
}
