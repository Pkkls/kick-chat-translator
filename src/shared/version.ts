/** Update-availability status, surfaced in the popup. */
export interface UpdateStatus {
  /** Installed extension version (from the manifest). */
  current: string;
  /** Latest published release tag, or null when unknown (never checked / offline). */
  latest: string | null;
  /** True when `latest` is strictly newer than `current`. */
  updateAvailable: boolean;
  /** Where to send the user to get the update. */
  releaseUrl: string;
}

/** Parse "v2.2.1" / "2.2.1" into numeric parts; non-numeric segments → 0. */
export function parseVersion(v: string): number[] {
  return v
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((n) => {
      const x = parseInt(n, 10);
      return Number.isFinite(x) ? x : 0;
    });
}

/** True when `latest` is strictly newer than `current` (numeric, segment-by-segment). */
export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}
