import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractMessageText, extractUsername, findChatContainer, pickInjectionTarget } from './selectors';
import { confidentLanguage } from './langDetect';

/**
 * Does the synthetic chat produce rows this extension can actually read?
 *
 * scripts/kick-fake-chat.js exists because Kick has next to no Hong Kong
 * channels, so the only way to watch the Cantonese path run on a page is to
 * write the page. Its failure mode is silent and expensive: a row that looks
 * right in the console, sits in the chat, and is skipped by the observer because
 * one class name is off. Nothing reports that. You just see no translation and
 * conclude the feature is broken.
 *
 * So the script is loaded and run here rather than re-described. The test reads
 * the real file, which means a change to the row markup either keeps these three
 * selectors happy or fails the suite, and the two cannot drift apart.
 */

// From the project root, not from import.meta.url: under happy-dom that URL is
// an http: one and readFileSync refuses it.
const script = readFileSync(resolve(process.cwd(), 'scripts/kick-fake-chat.js'), 'utf8');

interface FakeChat {
  burst: () => void;
  send: (text: string) => boolean;
  clear: () => void;
  stop: () => void;
  corpus: [string, string][];
}

function loadFakeChat(): FakeChat {
  // The script auto-starts an interval when it finds a container. The test drives
  // it by hand, so it is stopped as soon as it is loaded.
  (0, eval)(script);
  const api = (globalThis as unknown as { ktFakeChat: FakeChat }).ktFakeChat;
  api.stop();
  return api;
}

beforeEach(() => {
  // One real-shaped row, because findChatContainer only accepts a container that
  // already holds one. That is deliberate in the extension and it applies here.
  document.body.innerHTML = `
    <div id="channel-chatroom">
      <div class="no-scrollbar">
        <div data-index="0">
          <div class="group"><div class="w-full min-w-0 shrink-0">
            <button class="inline font-bold" style="color:#fff">someone</button>
            <span class="font-normal">hello</span>
          </div></div>
        </div>
      </div>
    </div>`;
});

describe('the synthetic Cantonese chat', () => {
  it('appends rows the observer will find', () => {
    const fake = loadFakeChat();
    const before = document.querySelectorAll('div[data-index]').length;
    fake.burst();
    const after = document.querySelectorAll('div[data-index]').length;
    expect(after - before).toBe(fake.corpus.length);
  });

  it('builds rows the three extractors read correctly', () => {
    const fake = loadFakeChat();
    fake.send('佢哋去咗邊度呀');
    const container = findChatContainer(document);
    expect(container).not.toBeNull();
    const row = Array.from(container!.querySelectorAll('div[data-index]')).at(-1)!;

    expect(extractMessageText(row)).toBe('佢哋去咗邊度呀');
    expect(extractUsername(row)).toBeTruthy();
    // Not the row itself: the translation has to land inside the bubble.
    expect(pickInjectionTarget(row)).not.toBe(row);
    expect(pickInjectionTarget(row).className).toContain('shrink-0');
  });

  it('never reuses a data-index, which the observer dedupes on', () => {
    const fake = loadFakeChat();
    fake.burst();
    const indices = Array.from(document.querySelectorAll('div[data-index]')).map((r) =>
      r.getAttribute('data-index'),
    );
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('cleans up after itself, leaving the page as it was', () => {
    const fake = loadFakeChat();
    const before = document.querySelectorAll('div[data-index]').length;
    fake.burst();
    fake.clear();
    expect(document.querySelectorAll('div[data-index]').length).toBe(before);
  });

  // The corpus is only worth streaming if the detector answers on it the way the
  // bench says it does. This is the join between the two: the lines that reach a
  // real page are the lines that were measured, including the ones that miss.
  it('carries a corpus the detector reads as labelled, misses included', () => {
    const fake = loadFakeChat();
    for (const [label, text] of fake.corpus) {
      const got = confidentLanguage(text);
      if (label === 'yue' || label === 'mix') {
        expect(got, `${label} line should read as Cantonese: ${text}`).toBe('yue');
      } else {
        // Neither the controls nor the misses may come back as Cantonese. They
        // are allowed to come back named by their SCRIPT: since the traditional
        // and simplified rule landed, a line written in traditional characters
        // is answered zh-tw whether it is Hong Kong Cantonese stripped of its
        // markers or Taiwanese standard Chinese, because that is all the text
        // says. What must never happen is calling it Cantonese on no evidence.
        expect(got, `${label} line must not be read as Cantonese: ${text}`).not.toBe('yue');
      }
    }
  });

  // A corpus that only shows wins would advertise a better product than exists.
  it('keeps known misses in the corpus rather than hiding them', () => {
    const fake = loadFakeChat();
    expect(fake.corpus.some(([label]) => label === 'miss')).toBe(true);
    expect(fake.corpus.some(([label]) => label === 'zh-tw')).toBe(true);
  });
});
