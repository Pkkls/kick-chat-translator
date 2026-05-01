import { getSettings, saveSettings } from '../shared/storage';
import { Settings } from '../shared/types';

async function init(): Promise<void> {
  const settings = await getSettings();

  const toggleEl = document.getElementById('toggleEnabled') as HTMLInputElement;
  const styleEl = document.getElementById('displayStyle') as HTMLSelectElement;
  const showOrigEl = document.getElementById('showOriginal') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const statusMsg = document.getElementById('statusMsg') as HTMLSpanElement;

  toggleEl.checked = settings.enabled;
  styleEl.value = settings.displayStyle;
  showOrigEl.checked = settings.showOriginal;

  saveBtn.addEventListener('click', async () => {
    const updated: Partial<Settings> = {
      enabled: toggleEl.checked,
      displayStyle: styleEl.value as Settings['displayStyle'],
      showOriginal: showOrigEl.checked,
    };
    try {
      await saveSettings(updated);
      statusMsg.textContent = 'Saved!';
      statusMsg.className = 'status';
      setTimeout(() => { statusMsg.textContent = ''; }, 2000);
    } catch {
      statusMsg.textContent = 'Error';
      statusMsg.className = 'status error';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
