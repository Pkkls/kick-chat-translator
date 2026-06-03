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
