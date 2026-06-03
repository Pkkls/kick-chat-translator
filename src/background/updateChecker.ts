/**
 * "Update available" check. Polls the GitHub *latest release* tag (throttled, cached
 * in storage.local) and compares it to the installed manifest version. The popup
 * surfaces a button when a newer release exists. No auto-update — the button just
 * links to the release page (the extension is distributed as a release zip).
 */
import {
  GITHUB_LATEST_RELEASE_API,
  GITHUB_RELEASES_URL,
  STORAGE_KEY_UPDATE,
  UPDATE_CHECK_TTL_MS,
} from '~/shared/constants';
import { isNewerVersion, type UpdateStatus } from '~/shared/version';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('update');

interface CachedCheck {
  at: number;
  latest: string | null;
}

function currentVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '0.0.0';
  }
}

async function fetchLatestTag(): Promise<string | null> {
  try {
    const res = await fetch(GITHUB_LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    return data.tag_name ?? null;
  } catch (err: unknown) {
    log.debug('update check failed', err);
    return null;
  }
}

/**
 * Resolve update status, using a cached GitHub result unless it's stale (or `force`).
 * Network failures degrade gracefully to the last known value (or "unknown").
 */
export async function getUpdateStatus(force = false): Promise<UpdateStatus> {
  const current = currentVersion();
  const stored = await chrome.storage.local.get(STORAGE_KEY_UPDATE);
  const cached = stored[STORAGE_KEY_UPDATE] as CachedCheck | undefined;
  let latest = cached?.latest ?? null;

  if (force || !cached || Date.now() - cached.at > UPDATE_CHECK_TTL_MS) {
    const fetched = await fetchLatestTag();
    if (fetched !== null) {
      latest = fetched;
      await chrome.storage.local.set({ [STORAGE_KEY_UPDATE]: { at: Date.now(), latest } satisfies CachedCheck });
    } else if (!cached) {
      // Record the attempt so a persistent network failure doesn't hammer the API.
      await chrome.storage.local.set({ [STORAGE_KEY_UPDATE]: { at: Date.now(), latest: null } satisfies CachedCheck });
    }
  }

  return {
    current,
    latest,
    updateAvailable: latest !== null && isNewerVersion(latest, current),
    releaseUrl: GITHUB_RELEASES_URL,
  };
}
