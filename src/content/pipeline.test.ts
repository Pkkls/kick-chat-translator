import { describe, it, expect, vi, beforeEach } from 'vitest';

// Headless the pipeline: stub the DOM/runtime side-effecting modules so we can drive
// the message path and assert on what gets dispatched to the service worker.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('~/shared/messages', () => ({ send: sendMock }));
vi.mock('./injector', () => ({
  inject: vi.fn(),
  incrementFloatingCount: vi.fn(),
  injectHoverPlaceholder: vi.fn(),
  removeAllArtifacts: vi.fn(),
  showError: vi.fn(),
  showLoading: vi.fn(),
  showThrottleIndicator: vi.fn(),
  showToast: vi.fn(),
  updateActiveProvider: vi.fn(),
}));
vi.mock('./localEngine', () => ({
  localEngine: { present: () => false, noteSeen: vi.fn(), isReady: () => false, translate: vi.fn() },
}));
vi.mock('./memcache', () => ({ memCache: { get: () => undefined, set: vi.fn() } }));

import { TranslationPipeline } from './pipeline';
import { defaultSettings } from '~/shared/settings';

const JP = 'これはテストメッセージです';
const wsMsg = (text: string) => ({ id: '1', text, channel: 'chan', username: 'user', isBot: false });

describe('TranslationPipeline — effTarget (regression)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ type: 'translate.result', payload: { ok: false, error: { code: 'x', message: 'x' } } });
  });

  // Regression for the self-referential getter (`return this.effTarget === 'auto' ? … : this.effTarget`)
  // that infinite-recursed → threw in prepare() → every incoming message was dropped before reaching
  // the SW. With the bug this test throws RangeError and send is never called.
  it('resolves the auto target and dispatches to the SW without recursing', async () => {
    const pipeline = new TranslationPipeline({ ...defaultSettings(), enabled: true, targetLang: 'auto', pauseWhenHidden: false });
    await pipeline.onWebSocketMessage(wsMsg(JP));
    expect(sendMock).toHaveBeenCalledTimes(1);
    const target = sendMock.mock.calls[0]?.[0]?.payload?.targetLang as string | undefined;
    expect(target).toBeTruthy();
    expect(target).not.toBe('auto'); // resolved to a real language, not the raw sentinel
  });

  it('passes an explicit target through verbatim', async () => {
    const pipeline = new TranslationPipeline({ ...defaultSettings(), enabled: true, targetLang: 'fr', pauseWhenHidden: false });
    await pipeline.onWebSocketMessage(wsMsg(JP));
    expect(sendMock.mock.calls[0]?.[0]?.payload?.targetLang).toBe('fr');
  });
});

describe('TranslationPipeline — minTextLength', () => {
  const SHORT_JP = 'おはよう';

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ type: 'translate.result', payload: { ok: false, error: { code: 'x', message: 'x' } } });
  });

  it('translates a short message at the default floor', async () => {
    const pipeline = new TranslationPipeline({ ...defaultSettings(), enabled: true, targetLang: 'fr', pauseWhenHidden: false });
    await pipeline.onWebSocketMessage(wsMsg(SHORT_JP));
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('drops it once the configured floor is raised above its length', async () => {
    const pipeline = new TranslationPipeline({
      ...defaultSettings(),
      enabled: true,
      targetLang: 'fr',
      pauseWhenHidden: false,
      minTextLength: SHORT_JP.length + 1,
    });
    await pipeline.onWebSocketMessage(wsMsg(SHORT_JP));
    expect(sendMock).not.toHaveBeenCalled();
  });
});

/**
 * The websocket path only warms the cache — it never injects. The DOM path is the
 * only one that puts a translation on screen. So anything the warm path does to
 * shared state must not be able to suppress the display path.
 */
describe('TranslationPipeline — websocket warm vs DOM display', () => {
  const domMsg = (text: string, username = 'user') => {
    const rowElement = document.createElement('div');
    const injectionTarget = document.createElement('div');
    rowElement.appendChild(injectionTarget);
    return { rowElement, injectionTarget, id: 'd1', text, channel: 'chan', username, isBot: false };
  };

  const makePipeline = () =>
    new TranslationPipeline({ ...defaultSettings(), enabled: true, targetLang: 'fr', pauseWhenHidden: false });

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ type: 'translate.result', payload: { ok: false, error: { code: 'x', message: 'x' } } });
  });

  it('still displays a message the websocket already warmed', async () => {
    const pipeline = makePipeline();
    await pipeline.onWebSocketMessage(wsMsg(JP));
    sendMock.mockClear();

    await pipeline.onDomMessage(domMsg(JP));
    expect(sendMock).toHaveBeenCalled();
  });

  it('still skips a message the same user just repeated', async () => {
    const pipeline = makePipeline();
    await pipeline.onDomMessage(domMsg(JP));
    sendMock.mockClear();

    await pipeline.onDomMessage(domMsg(JP));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('keeps translating different users sending the same text', async () => {
    const pipeline = makePipeline();
    await pipeline.onDomMessage(domMsg(JP, 'alice'));
    sendMock.mockClear();

    await pipeline.onDomMessage(domMsg(JP, 'bob'));
    expect(sendMock).toHaveBeenCalled();
  });
});
