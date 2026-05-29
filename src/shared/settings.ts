import { z } from 'zod';
import { STORAGE_KEY_SETTINGS } from './constants';

export const ProviderOrderSchema = z.array(
  z.enum(['google', 'deepl', 'mymemory', 'lingva']),
);

/** Cloud-chain providers (on-device 'local' runs in the content script, not here). */
export type CloudProviderId = z.infer<typeof ProviderOrderSchema>[number];

export const SettingsSchema = z.object({
  enabled: z.boolean().default(true),
  targetLang: z.string().default('en'),
  displayStyle: z.enum(['below', 'inline', 'replace']).default('below'),
  showOriginal: z.boolean().default(true),
  showSourceBadge: z.boolean().default(true),
  showProviderBadge: z.boolean().default(false),
  showFloatingBar: z.boolean().default(true),

  // Engine strategy.
  // local-first : on-device Chromium Translator when the model is downloaded, else cloud.
  // cloud-first : always cloud chain; on-device only if cloud fails.
  // local-only  : on-device only, never hit the network.
  engineMode: z.enum(['local-first', 'cloud-first', 'local-only']).default('local-first'),
  localEnabled: z.boolean().default(true),
  localAutoDownload: z.boolean().default(false), // download new pairs as soon as a gesture allows

  providerOrder: ProviderOrderSchema.default(['google', 'mymemory', 'lingva']),
  deeplApiKey: z.string().default(''),
  deeplPlan: z.enum(['free', 'pro']).default('free'),
  lingvaInstance: z.string().url().or(z.literal('')).default(''),

  // Filters
  ignoreEnglish: z.boolean().default(true),
  ignoreBots: z.boolean().default(true),
  blacklistUsers: z.array(z.string()).default([]),
  blacklistChannels: z.array(z.string()).default([]),
  whitelistChannels: z.array(z.string()).default([]),
  sourceLangAllowlist: z.array(z.string()).default([]),

  // Performance
  cacheMaxEntries: z.number().int().positive().max(20_000).default(5_000),
  cacheTtlHours: z.number().int().positive().max(720).default(24),
  concurrency: z.number().int().min(1).max(16).default(4),
  perChannelBudgetPerMin: z.number().int().min(10).max(2000).default(200),

  // Connection strategy
  connectionMode: z.enum(['auto', 'websocket', 'dom']).default('auto'),
  // Pause translating in tabs that aren't visible — stops background tabs from
  // burning provider quota (DeepL) while you're not watching.
  pauseWhenHidden: z.boolean().default(true),
  debug: z.boolean().default(false),

  // UI
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  popupShowsStats: z.boolean().default(true),
});

export type Settings = z.infer<typeof SettingsSchema>;

const DEFAULTS: Settings = SettingsSchema.parse({});

export function defaultSettings(): Settings {
  return { ...DEFAULTS, providerOrder: [...DEFAULTS.providerOrder] };
}

export async function loadSettings(): Promise<Settings> {
  const raw = await chrome.storage.sync.get(STORAGE_KEY_SETTINGS);
  const candidate = raw[STORAGE_KEY_SETTINGS];
  if (!candidate) return defaultSettings();
  const parsed = SettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaultSettings();
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = SettingsSchema.parse({ ...current, ...patch });
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: next });
  return next;
}

export function watchSettings(cb: (next: Settings) => void): () => void {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ): void => {
    if (area !== 'sync') return;
    const change = changes[STORAGE_KEY_SETTINGS];
    if (!change) return;
    const parsed = SettingsSchema.safeParse(change.newValue);
    if (parsed.success) cb(parsed.data);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
