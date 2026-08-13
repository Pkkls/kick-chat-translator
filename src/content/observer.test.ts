import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatObserver } from './observer';

interface Recorded {
  disconnected: boolean;
  target: unknown;
}

const created: Recorded[] = [];

class RecordingObserver {
  private rec: Recorded = { disconnected: false, target: undefined };
  constructor(_cb: unknown) {
    created.push(this.rec);
  }
  observe(target: unknown): void {
    this.rec.target = target;
  }
  disconnect(): void {
    this.rec.disconnected = true;
  }
  takeRecords(): unknown[] {
    return [];
  }
}

beforeEach(() => {
  created.length = 0;
  vi.stubGlobal('MutationObserver', RecordingObserver);
  document.body.innerHTML = '<div id="channel-chatroom"></div>';
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('ChatObserver lifecycle', () => {
  it('observes once attached', () => {
    const obs = new ChatObserver(() => undefined);
    obs.start();
    expect(created.length).toBeGreaterThan(0);
    obs.stop();
  });

  // Anything left observing document.body with subtree:true keeps running for the
  // life of the page and fires on every mutation anywhere in it.
  it('disconnects everything it started when stopped', () => {
    const obs = new ChatObserver(() => undefined);
    obs.start();
    obs.stop();

    expect(created.length).toBeGreaterThan(0);
    expect(created.filter((o) => !o.disconnected)).toEqual([]);
  });

  // reset() + start() runs on every channel switch, so anything not cleaned up
  // here accumulates one more observer per navigation.
  it('does not accumulate observers across channel switches', () => {
    const obs = new ChatObserver(() => undefined);
    obs.start();
    for (let i = 0; i < 5; i++) {
      obs.reset();
      obs.start();
    }
    const live = created.filter((o) => !o.disconnected);
    obs.stop();

    // At most the two an attached observer legitimately holds.
    expect(live.length).toBeLessThanOrEqual(2);
  });
});
