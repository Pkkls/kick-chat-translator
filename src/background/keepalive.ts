import { KEEPALIVE_INTERVAL_SEC } from '~/shared/constants';

const ALARM = 'kt.keepalive';

export function installKeepalive(): void {
  void chrome.alarms.create(ALARM, {
    periodInMinutes: KEEPALIVE_INTERVAL_SEC / 60,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM) return;
    // Touch storage to keep the MV3 service worker alive across burst-idle periods.
    // storage.session exists on Chromium and Firefox 115+; guard so the alarm never
    // throws on a browser that lacks it (Firefox's background page doesn't need it anyway).
    if (chrome.storage.session) {
      void chrome.storage.session.set({ 'kt.lastAlarm': Date.now() }).catch(() => undefined);
    }
  });
}
