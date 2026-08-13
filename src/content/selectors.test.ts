import { afterEach, describe, expect, it } from 'vitest';
import {
  findChatPanel,
  extractMessageText,
  extractUsername,
  findAllRows,
  findChatContainer,
  matchesMessageRow,
  pickFirst,
  pickInjectionTarget,
  SELECTORS,
} from './selectors';

/**
 * Markup copied from live kick.com chat (2026-08). The badges are <img>/<svg>
 * inside <div>s, the name is a <button> carrying its own text, the separator and
 * the timestamp are bold/semibold spans, and only the message body is font-normal.
 */
function liveRow(body: string, name = '8Iackmamba'): Element {
  const host = document.createElement('div');
  host.innerHTML = `
    <div data-index="63" class="absolute inset-x-0 top-0">
      <div class="group relative px-2 lg:px-3">
        <div class="w-full min-w-0 shrink-0 rounded-lg px-2 break-words">
          <span class="text-neutral pr-1 font-semibold">04:16 AM</span>
          <div class="inline-flex min-w-0 flex-nowrap items-baseline rounded cursor-pointer">
            <div class="flex items-center gap-1 self-center pr-1">
              <div class="inline-flex shrink-0 items-center">
                <div data-state="closed"><img alt="Level 39" src="badge.png"></div>
              </div>
            </div>
            <button class="inline font-bold" data-prevent-expand="true" style="color: rgb(255, 255, 255);">${name}</button>
          </div>
          <span class="inline-flex font-bold" aria-hidden="true">:&nbsp;</span>
          <span class="leading-[1.55] font-normal">${body}</span>
        </div>
      </div>
    </div>`;
  document.body.appendChild(host);
  return host.querySelector('div[data-index]')!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('extractUsername on the live Kick layout', () => {
  // Regression: every earlier strategy looked for a title attribute or a span
  // inside the button. Kick now puts the name straight on the button, so all of
  // them returned undefined and the user blacklist silently stopped matching.
  it('reads the name from the button itself', () => {
    expect(extractUsername(liveRow('hola amigos'))).toBe('8iackmamba');
  });

  it('still reads a title attribute when one is present', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div data-index="1"><button title="OldStyle">x</button></div>`;
    document.body.appendChild(host);
    expect(extractUsername(host.querySelector('div[data-index]')!)).toBe('oldstyle');
  });

  it('still reads a styled bold span when one is present', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div data-index="1"><span class="inline-flex font-bold" style="color: rgb(1,2,3)">Legacy</span></div>`;
    document.body.appendChild(host);
    expect(extractUsername(host.querySelector('div[data-index]')!)).toBe('legacy');
  });

  it('returns undefined when there is no name at all', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div data-index="1"><span class="font-normal">just text</span></div>`;
    document.body.appendChild(host);
    expect(extractUsername(host.querySelector('div[data-index]')!)).toBeUndefined();
  });
});

describe('extractMessageText on the live Kick layout', () => {
  it('takes the body without the timestamp, the name or the separator', () => {
    expect(extractMessageText(liveRow('hola amigos'))).toBe('hola amigos');
  });

  it('treats an emote-only message as empty rather than as its alt text', () => {
    const row = liveRow(
      '<span class="relative" data-emote-name="Flowie"><img alt="Flowie" src="e.png"></span>',
    );
    expect(extractMessageText(row)).toBe('');
  });

  it('prefers 7TV tokens when that extension is present', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div data-index="1">
      <span class="font-normal">duplicated native text</span>
      <span class="seventv-text-token">hello</span>
      <span class="seventv-text-token">there</span>
    </div>`;
    document.body.appendChild(host);
    expect(extractMessageText(host.querySelector('div[data-index]')!)).toBe('hello there');
  });
});

describe('row and container selectors', () => {
  it('finds the row and its injection target', () => {
    const row = liveRow('hola');
    expect(matchesMessageRow(row)).toBe(true);
    expect(findAllRows(document.body)).toHaveLength(1);
    expect(pickInjectionTarget(row).className).toContain('w-full');
  });

  it('picks the first container selector that matches', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div id="channel-chatroom"><div class="no-scrollbar"></div></div>`;
    document.body.appendChild(host);
    expect(pickFirst(document, SELECTORS.containers)?.className).toBe('no-scrollbar');
  });
});

describe('findChatContainer', () => {
  // Reproduces the live Kick structure: several elements match the container
  // selector and only one of them is the message list.
  function threeCandidates(): void {
    const host = document.createElement('div');
    host.innerHTML = `
      <div id="channel-chatroom">
        <div class="no-scrollbar" data-which="empty-top"></div>
        <div class="no-scrollbar" data-which="messages">
          <div data-index="0"><span class="font-normal">hola</span></div>
          <div data-index="1"><span class="font-normal">que tal</span></div>
        </div>
        <div class="no-scrollbar" data-which="empty-bottom"></div>
      </div>`;
    document.body.appendChild(host);
  }

  it('picks the candidate that actually holds message rows', () => {
    threeCandidates();
    const found = findChatContainer(document);
    expect(found?.getAttribute('data-which')).toBe('messages');
    expect(found?.querySelectorAll('div[data-index]')).toHaveLength(2);
  });

  it('does not settle for the first match when it holds no rows', () => {
    threeCandidates();
    // This is exactly what the old first-match behaviour returned.
    expect(document.querySelector('#channel-chatroom .no-scrollbar')?.getAttribute('data-which')).toBe('empty-top');
    expect(findChatContainer(document)?.getAttribute('data-which')).not.toBe('empty-top');
  });

  // Chat not rendered yet: returning null keeps the caller polling instead of
  // binding to an element that will never receive a message.
  it('returns null while no candidate holds a row', () => {
    const host = document.createElement('div');
    host.innerHTML = `<div id="channel-chatroom"><div class="no-scrollbar"></div></div>`;
    document.body.appendChild(host);
    expect(findChatContainer(document)).toBeNull();
  });
});

// Measured on kick.com/ryu7z: the page held two elements with id
// channel-chatroom. React streaming had left the server-rendered copy inside a
// suspense placeholder (div#S:0, display none) holding no messages, and it came
// first in document order, so querySelector picked the dead one. The floating bar
// was mounted in there, invisible, while the panel on screen had none.
describe('findChatPanel', () => {
  it('skips the hidden copy and takes the panel holding the messages', () => {
    document.body.innerHTML = `
      <div id="S:0" style="display:none">
        <div id="channel-chatroom" data-which="dead"></div>
      </div>
      <div id="channel-chatroom" data-which="live">
        <div data-index="0">hello</div>
      </div>`;
    expect(findChatPanel(document)?.getAttribute('data-which')).toBe('live');
  });

  it('still finds the only panel when the chat has no messages yet', () => {
    document.body.innerHTML = `<div id="channel-chatroom" data-which="only"></div>`;
    expect(findChatPanel(document)?.getAttribute('data-which')).toBe('only');
  });

  it('returns null when there is no chat panel at all', () => {
    document.body.innerHTML = '<div></div>';
    expect(findChatPanel(document)).toBeNull();
  });
});
