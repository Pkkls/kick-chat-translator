export const DEFAULT_SETTINGS = {
  enabled: true,
  showOriginal: true,
  displayStyle: 'below' as const,
  targetLang: 'en',
};

export const CHAT_SELECTORS = {
  container: [
    // Kick known selectors (various versions)
    '#chatroom-messages',
    '.chatroom-messages',
    '[data-testid="chat-messages"]',
    '.chat-messages-container',
    '.messages-list',
    '#chat-messages',
    '.chat-entries',
    '[class*="chatroom"] [class*="messages"]',
    '[class*="chat"] [class*="messages"]',
    '[class*="chat-list"]',
    '[class*="message-list"]',
  ],
  message: [
    '[data-chat-entry]',
    '.chat-entry',
    '.chat-message-item',
    '[class*="chat-entry"]',
    '[class*="chat-message"]',
    '[class*="message-item"]',
    'li[data-id]',
  ],
  messageText: [
    '.chat-message-content',
    '[data-chat-entry-content]',
    '.message-text',
    '[class*="message-content"]',
    '[class*="chat-content"]',
    'span[class*="text"]',
  ],
  messageId: 'data-id',
};

export const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
export const LIBRETRANSLATE_URL = 'https://libretranslate.com/translate';

export const CACHE_MAX_SIZE = 500;
export const MIN_TEXT_LENGTH = 3;
