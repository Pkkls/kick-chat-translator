import { KEEPALIVE_INTERVAL_SEC } from '~/shared/constants';

const ALARM = 'kt.keepalive';

/**
 * Keep the worker warm while a Kick tab is open, and only then.
 *
 * The alarm fires every 25 s (Chrome rounds it up to 30), and an alarm event
 * is enough to stop an MV3 worker from going idle. It used to be armed at every
 * worker start and never cleared, so the worker stayed resident for as long as
 * the browser was open, on a machine where nobody had opened Kick all day.
 *
 * Now each tick asks whether a tab still matches the content script, and clears
 * the alarm when none does. The worker then sleeps like any other, and the next
 * message from a Kick tab arms it again (`armKeepalive` in index.ts). Waking it
 * for that first message is the one cold start a reader pays, at the first line
 * of a session instead of never.
 */
let armed = false;
let listening = false;

/**
 * Register the alarm handler.
 *
 * Called at the worker's top level and not from an async init: an MV3 worker
 * woken BY the alarm only delivers it to listeners that exist in its first
 * turn, and a handler added after an `await` would miss the tick that has to
 * decide whether to clear itself.
 */
export function listenKeepalive(): void {
  if (listening) return;
  listening = true;
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM) return;
    void tick();
  });
}

/** Arm the alarm if it is not already. Cheap enough to call on every message. */
export function armKeepalive(): void {
  if (armed) return;
  armed = true;
  void chrome.alarms.create(ALARM, { periodInMinutes: KEEPALIVE_INTERVAL_SEC / 60 });
}

/** At worker start: arm only when a Kick tab is already there to keep warm. */
export async function installKeepalive(): Promise<void> {
  listenKeepalive();
  if (await kickTabOpen()) armKeepalive();
  else await disarm();
}

async function tick(): Promise<void> {
  if (!(await kickTabOpen())) {
    await disarm();
    return;
  }
  // The alarm is re-armed under this worker's own flag: a worker that was
  // restarted lost `armed` but kept the alarm, and the next message must not
  // recreate it and shift its schedule for nothing.
  armed = true;
  // Touch storage to keep the MV3 service worker alive across burst-idle periods.
  // storage.session exists on Chromium and Firefox 115+; guard so the alarm never
  // throws on a browser that lacks it (Firefox's background page doesn't need it anyway).
  if (chrome.storage.session) {
    await chrome.storage.session.set({ 'kt.lastAlarm': Date.now() }).catch(() => undefined);
  }
}

async function disarm(): Promise<void> {
  armed = false;
  await chrome.alarms.clear(ALARM).catch(() => undefined);
}

/**
 * Whether any tab is on a page the content script runs on.
 *
 * The match patterns come from the manifest so this cannot drift from where
 * the script is injected, and the host permission on kick.com is what lets the
 * query filter on URL without the `tabs` permission. A failed query counts as
 * open: keeping the worker up a little longer is the cheap mistake.
 */
async function kickTabOpen(): Promise<boolean> {
  const [cs] = chrome.runtime.getManifest().content_scripts ?? [];
  if (!cs?.matches?.length) return true;
  try {
    const tabs = await chrome.tabs.query({ url: cs.matches });
    return tabs.length > 0;
  } catch {
    return true;
  }
}
