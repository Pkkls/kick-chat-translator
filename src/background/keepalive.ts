import { KEEPALIVE_INTERVAL_SEC } from '~/shared/constants';

const ALARM = 'kt.keepalive';

export function installKeepalive(): void {
  void chrome.alarms.create(ALARM, {
    periodInMinutes: KEEPALIVE_INTERVAL_SEC / 60,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM) return;
    // Touch storage to keep SW alive across burst-idle periods
    void chrome.storage.session.set({ 'kt.lastAlarm': Date.now() }).catch(() => undefined);
  });
}
