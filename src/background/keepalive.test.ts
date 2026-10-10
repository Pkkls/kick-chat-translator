import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The keepalive keeps the worker resident, so it has to let go once no Kick tab
 * is left. Before, it was armed at every start and never cleared: the worker
 * stayed up all day on a browser where Kick was never opened.
 */
describe('keepalive', () => {
  let tabs: unknown[];
  let alarm: ((a: { name: string }) => void) | undefined;
  const created: string[] = [];
  const cleared: string[] = [];

  beforeEach(() => {
    vi.resetModules();
    tabs = [];
    alarm = undefined;
    created.length = 0;
    cleared.length = 0;
    vi.stubGlobal('chrome', {
      runtime: {
        getManifest: () => ({
          content_scripts: [{ matches: ['https://kick.com/*'], js: ['a.js'] }],
        }),
      },
      tabs: { query: vi.fn(async () => tabs) },
      alarms: {
        create: vi.fn(async (name: string) => void created.push(name)),
        clear: vi.fn(async (name: string) => (cleared.push(name), true)),
        onAlarm: { addListener: (fn: (a: { name: string }) => void) => (alarm = fn) },
      },
      storage: { session: { set: vi.fn(async () => undefined) } },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('does not arm at start when no Kick tab is open', async () => {
    const k = await import('./keepalive');
    await k.installKeepalive();
    expect(created).toEqual([]);
  });

  it('arms at start when a Kick tab is open', async () => {
    tabs = [{ id: 1 }];
    const k = await import('./keepalive');
    await k.installKeepalive();
    expect(created).toEqual(['kt.keepalive']);
  });

  it('clears itself on the first tick with no Kick tab, and re-arms on the next message', async () => {
    tabs = [{ id: 1 }];
    const k = await import('./keepalive');
    await k.installKeepalive();
    tabs = [];
    alarm?.({ name: 'kt.keepalive' });
    await flush();
    expect(cleared).toEqual(['kt.keepalive']);

    k.armKeepalive();
    expect(created).toEqual(['kt.keepalive', 'kt.keepalive']);
  });

  it('keeps going while a Kick tab stays open, and does not recreate the alarm per message', async () => {
    tabs = [{ id: 1 }];
    const k = await import('./keepalive');
    await k.installKeepalive();
    alarm?.({ name: 'kt.keepalive' });
    await flush();
    k.armKeepalive();
    k.armKeepalive();
    expect(cleared).toEqual([]);
    expect(created).toEqual(['kt.keepalive']);
  });

  it('ignores other alarms', async () => {
    const k = await import('./keepalive');
    k.listenKeepalive();
    alarm?.({ name: 'kt.update' });
    await flush();
    expect(cleared).toEqual([]);
  });
});
