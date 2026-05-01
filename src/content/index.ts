import { getSettings, onSettingsChanged } from '../shared/storage';
import { ChatObserver } from './chatObserver';
import { MessageProcessor } from './messageProcessor';
import { Settings } from '../shared/types';

async function main(): Promise<void> {
  let settings: Settings = await getSettings();
  const processor = new MessageProcessor(settings);

  const observer = new ChatObserver((el, id, text) => {
    processor.process(el, id, text);
  });

  if (settings.enabled) {
    observer.start();
  }

  onSettingsChanged((updated) => {
    processor.updateSettings(updated);
    if (updated.enabled && !settings.enabled) {
      observer.start();
    } else if (!updated.enabled && settings.enabled) {
      observer.stop();
    }
    settings = updated;
  });

  console.debug('[KickTranslator] Content script loaded');
}

main().catch((err) => console.error('[KickTranslator] Init error:', err));
