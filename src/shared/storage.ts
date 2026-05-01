import { Settings } from './types';
import { DEFAULT_SETTINGS } from './constants';

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return result as Settings;
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(partial);
}

export function onSettingsChanged(callback: (settings: Settings) => void): void {
  chrome.storage.onChanged.addListener(async (_changes, area) => {
    if (area !== 'sync') return;
    callback(await getSettings());
  });
}
