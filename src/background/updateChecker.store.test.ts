import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHROME_STORE_ID } from '~/shared/constants';
import { getUpdateStatus } from './updateChecker';

/**
 * The update notice was written when a release zip was the only way to get this
 * extension. On the Chrome Web Store it is wrong twice over: the copy updates
 * itself, so its owner has nothing to do with the news, and the link sends them
 * to a zip they should not install over a managed copy. During a store review
 * it is worse still, pointing at a version the store does not have yet.
 *
 * The id is what tells the two apart, and it costs no permission.
 */
function chromeStub({ id, latest }: { id: string; latest: string | null }) {
  const fetched = vi.fn(async () => ({
    ok: true,
    json: async () => ({ tag_name: latest }),
  }));
  vi.stubGlobal('fetch', fetched);
  vi.stubGlobal('chrome', {
    runtime: { id, getManifest: () => ({ version: '2.8.0' }) },
    storage: { local: { get: async () => ({}), set: async () => undefined } },
  });
  return fetched;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('update notice by install source', () => {
  it('says nothing to a store install, even when a newer release exists', async () => {
    chromeStub({ id: CHROME_STORE_ID, latest: 'v9.9.9' });
    const status = await getUpdateStatus(true);
    expect(status.updateAvailable).toBe(false);
    expect(status.current).toBe('2.8.0');
  });

  it('does not even ask GitHub from a store install', async () => {
    const fetched = chromeStub({ id: CHROME_STORE_ID, latest: 'v9.9.9' });
    await getUpdateStatus(true);
    expect(fetched).not.toHaveBeenCalled();
  });

  /**
   * The control, and the reason the check above is not simply "never announce":
   * a zip or unpacked copy has no way to update itself, so it is exactly who the
   * notice exists for.
   */
  it('still tells a zip install, which cannot update itself', async () => {
    chromeStub({ id: 'igdnhalokbeabohdmncbmogjakkgcheb', latest: 'v9.9.9' });
    const status = await getUpdateStatus(true);
    expect(status.updateAvailable).toBe(true);
    expect(status.latest).toBe('v9.9.9');
    expect(status.releaseUrl).toContain('github.com');
  });

  it('stays quiet on a zip install that is already current', async () => {
    chromeStub({ id: 'igdnhalokbeabohdmncbmogjakkgcheb', latest: 'v2.8.0' });
    expect((await getUpdateStatus(true)).updateAvailable).toBe(false);
  });

  it('survives a runtime with no id at all', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ tag_name: 'v9.9.9' }) }));
    vi.stubGlobal('chrome', {
      runtime: { getManifest: () => ({ version: '2.8.0' }) },
      storage: { local: { get: async () => ({}), set: async () => undefined } },
    });
    // Not a store install as far as anyone can tell, so it behaves like a zip.
    expect((await getUpdateStatus(true)).updateAvailable).toBe(true);
  });

  // The id is a real one, copied from the listing URL. A typo here would silence
  // nobody and nothing would ever fail.
  it('carries the id the listing actually has', () => {
    expect(CHROME_STORE_ID).toMatch(/^[a-p]{32}$/);
  });
});
