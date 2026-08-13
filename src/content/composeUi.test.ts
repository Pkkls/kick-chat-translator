import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastSpy } = vi.hoisted(() => ({ toastSpy: vi.fn() }));
vi.mock('./injector', () => ({ showToast: toastSpy }));

import { insertIntoComposer, readComposerText } from './composeUi';

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  toastSpy.mockReset();
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('readComposerText', () => {
  it('reads a textarea value', () => {
    const el = document.createElement('textarea');
    el.value = 'bonjour';
    expect(readComposerText(el)).toBe('bonjour');
  });

  it('reads an input value', () => {
    const el = document.createElement('input');
    el.value = 'hola';
    expect(readComposerText(el)).toBe('hola');
  });

  it('reads a contenteditable as text', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = 'こんにちは';
    expect(readComposerText(el)).toBe('こんにちは');
  });

  it('returns empty string for an empty composer', () => {
    expect(readComposerText(document.createElement('div'))).toBe('');
  });
});

describe('insertIntoComposer', () => {
  it('copies without touching the composer in copy mode', () => {
    const el = document.createElement('textarea');
    el.value = 'salut';
    insertIntoComposer(el, 'hi', 'copy');

    expect(writeText).toHaveBeenCalledWith('hi');
    expect(el.value).toBe('salut');
    expect(toastSpy).toHaveBeenCalled();
  });

  // Kick's native textarea layouts: the value has to go through the prototype
  // setter or React's value tracker never sees the change.
  it('replaces a textarea value and fires input so the page notices', () => {
    const el = document.createElement('textarea');
    el.value = 'bonjour';
    document.body.appendChild(el);
    const seen = vi.fn();
    el.addEventListener('input', seen);

    insertIntoComposer(el, 'hello', 'insert');

    expect(el.value).toBe('hello');
    expect(seen).toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
  });

  // A rich contenteditable that ignores the synthetic insert is exactly what the
  // clipboard fallback exists for: the translation must not be silently lost.
  it('falls back to the clipboard when the editor ignores the insert', () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = 'bonjour';
    document.body.appendChild(el);

    insertIntoComposer(el, 'hello', 'insert');
    expect(writeText).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(toastSpy).toHaveBeenCalled();
  });

  // The "did it apply?" probe compares before and after, which cannot distinguish
  // success from failure when the translation equals what was typed. Guessing wrong
  // here overwrites the user's clipboard, so it must not guess.
  it('leaves the clipboard alone when the translation matches what was typed', () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = 'ok';
    document.body.appendChild(el);
    el.addEventListener('beforeinput', (e) => {
      el.textContent = (e as InputEvent).data ?? '';
    });

    insertIntoComposer(el, 'ok', 'insert');
    vi.advanceTimersByTime(200);

    expect(writeText).not.toHaveBeenCalled();
  });

  it('stays quiet when the editor did apply the insert', () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = 'bonjour';
    document.body.appendChild(el);
    // Stand in for Lexical honouring the synthetic beforeinput.
    el.addEventListener('beforeinput', (e) => {
      el.textContent = (e as InputEvent).data ?? '';
    });

    insertIntoComposer(el, 'hello', 'insert');
    vi.advanceTimersByTime(200);

    expect(el.textContent).toBe('hello');
    expect(writeText).not.toHaveBeenCalled();
  });
});
