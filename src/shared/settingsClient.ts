/**
 * Settings access for the content script, without zod.
 *
 * shared/settings.ts is the only file in the codebase that imports zod, and the
 * content script was the only place that pulled it in for values rather than
 * types. Measured on this tree: zod is 13.7 KB gzipped, 16.8% of content.js, and
 * it was there to re-validate a blob this extension had just written itself.
 *
 * So the content script asks the service worker instead. The worker already owns
 * `settings.get` and `settings.set`, already holds the schema, and already applies
 * the result. Nothing is validated twice and no default is written down twice,
 * which is the failure mode a second local copy of the defaults would have had.
 *
 * The trade is a message round trip at startup, on an extension whose every
 * translation is already a message to that same worker.
 */
import type { Settings } from './settings';
import { send } from './messages';
import { STORAGE_KEY_DEEPL_KEY, STORAGE_KEY_SETTINGS } from './constants';

/** Current settings, straight from the worker that owns them. */
export async function fetchSettings(): Promise<Settings> {
  const res = await send({ type: 'settings.get' });
  if (res.type !== 'settings') throw new Error(`settings.get answered ${res.type}`);
  return res.payload;
}

/** Apply a change. The worker validates, persists and re-applies it. */
export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const res = await send({ type: 'settings.set', payload: patch });
  if (res.type !== 'settings') throw new Error(`settings.set answered ${res.type}`);
  return res.payload;
}

/**
 * Call back whenever settings change, wherever the change came from.
 *
 * Watches both areas because item 101 moved the DeepL key to storage.local, and
 * re-asks the worker rather than reading the changed value: the payload of a sync
 * change carries an empty key, and the payload of a local change carries only the
 * key. Only the worker can hand back a whole Settings.
 */
export function watchSettings(cb: (next: Settings) => void): () => void {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ): void => {
    const touched =
      (area === 'sync' && changes[STORAGE_KEY_SETTINGS] !== undefined) ||
      (area === 'local' && changes[STORAGE_KEY_DEEPL_KEY] !== undefined);
    if (!touched) return;
    void fetchSettings().then(cb).catch(() => undefined);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
