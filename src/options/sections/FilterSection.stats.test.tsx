import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import type { Settings } from '~/shared/settings';
import { defaultSettings } from '~/shared/settings';
import type { UsageStats } from '~/shared/types';
import { FilterSection } from './FilterSection';

function stats(over: Partial<UsageStats> = {}): UsageStats {
  return {
    totalRequests: 0,
    totalCacheHits: 0,
    totalErrors: 0,
    byProvider: {},
    byLang: {},
    byChannel: {},
    charsSent: 0,
    todayKey: '2026-09-25',
    ...over,
  };
}

let host: HTMLDivElement | undefined;

function mount(s: UsageStats | undefined, over: Partial<Settings> = {}, onPatch = vi.fn()) {
  host = document.createElement('div');
  document.body.appendChild(host);
  render(
    <FilterSection settings={{ ...defaultSettings(), ...over }} onPatch={onPatch} stats={s} />,
    host,
  );
  return { el: host, onPatch };
}

/** Les libelles des langues, dans l'ordre ou la grille les pose. */
function ordreLangues(el: HTMLElement): string[] {
  return [...el.querySelectorAll('.grid .truncate')].map((n) => n.textContent ?? '');
}

/**
 * Les filtres, branches sur ce que l'extension a deja vu.
 *
 * byLang et byChannel etaient deja collectes : le premier n'apparaissait qu'en
 * codes ISO dans un onglet nomme Debug, le second etait rempli par quatre
 * appels du worker et lu par personne. Cocher une case ou taper un nom de
 * chaine etait donc un pari, et c'est ce que ces tests empechent de revenir.
 */
describe('FilterSection, wired to what was actually seen', () => {
  afterEach(() => {
    if (host) {
      render(null, host);
      host.remove();
      host = undefined;
    }
  });

  it('puts the languages actually seen at the top, most frequent first', () => {
    const { el } = mount(stats({ byLang: { ko: 12, es: 400, ja: 90 } }));
    expect(ordreLangues(el).slice(0, 3)).toEqual(['Spanish', 'Japanese', 'Korean']);
  });

  it('shows how much each language represented', () => {
    const { el } = mount(stats({ byLang: { es: 400 } }));
    expect(el.textContent).toContain('400');
  });

  // Sans stats, l'ordre alphabetique reste : la page ne doit pas se casser
  // parce que le worker n'a pas encore repondu.
  it('falls back on the alphabet when nothing has been seen', () => {
    const { el } = mount(undefined);
    expect(ordreLangues(el).length).toBeGreaterThan(0);
  });

  // Une liste vide et une liste de trois se ressemblent quand rien ne dit ce
  // que chacune donne.
  it('says in words what the current allowlist does', () => {
    const vide = mount(stats());
    expect(vide.el.textContent).toContain('every language is translated');
    render(null, host!);
    host!.remove();

    const pleine = mount(stats(), { sourceLangAllowlist: ['ja', 'ko'] });
    expect(pleine.el.textContent).toContain('2');
    expect(pleine.el.textContent).toContain('left alone');
  });

  it('lists the channels watched, with what each one cost', () => {
    const { el } = mount(stats({ byChannel: { 'un-canal': 2100, autre: 40 } }));
    expect(el.textContent).toContain('un-canal');
    expect(el.textContent).toContain('2100');
  });

  it('adds a channel to a list with one click', () => {
    const { el, onPatch } = mount(stats({ byChannel: { 'un-canal': 5 } }));
    const boutons = [...el.querySelectorAll('.kt-chip-toggle')] as HTMLElement[];
    boutons[0]!.click();
    expect(onPatch).toHaveBeenCalledWith({ whitelistChannels: ['un-canal'] });
  });

  // Le meme geste ajoute et retire. Une liste ou l'on ajoute d'un clic et
  // retire en editant du texte est pire que deux fois du texte.
  it('removes it again with the same click', () => {
    const { el, onPatch } = mount(stats({ byChannel: { 'un-canal': 5 } }), {
      whitelistChannels: ['un-canal'],
    });
    const boutons = [...el.querySelectorAll('.kt-chip-toggle')] as HTMLElement[];
    expect(boutons[0]!.getAttribute('aria-pressed')).toBe('true');
    boutons[0]!.click();
    expect(onPatch).toHaveBeenCalledWith({ whitelistChannels: [] });
  });

  it('draws no channel list before anything has been watched', () => {
    const { el } = mount(stats());
    expect(el.querySelectorAll('.kt-chip-toggle')).toHaveLength(0);
  });

  // "some-channel" et "another-channel" se lisaient comme du contenu et
  // n'apprenaient rien que la premiere ligne ne disait deja.
  it('invents no example data in the channel boxes', () => {
    const { el } = mount(stats());
    const placeholders = [...el.querySelectorAll('textarea')].map((n) => n.placeholder);
    expect(placeholders.some((p) => p.includes('some-channel'))).toBe(false);
    expect(placeholders.some((p) => p.includes('some-user'))).toBe(false);
  });
});
