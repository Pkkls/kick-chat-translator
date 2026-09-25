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

  // CE TEST TENAIT L'INVERSE, et c'est le point. Il exigeait que les langues
  // vues remontent en tete, ce qui a ete construit puis retire : deux ou trois
  // langues passaient devant, l'alphabet reprenait au milieu, et on ne pouvait
  // plus trouver une langue ni par usage ni par ordre. L'alphabet est le seul
  // ordre dans lequel on CHERCHE. Le compte signale ce qui a ete vu sans
  // deplacer quoi que ce soit.
  it('keeps the alphabet, whatever has been seen', () => {
    const avec = mount(stats({ byLang: { ko: 12, es: 400, ja: 90 } }));
    const ordre = ordreLangues(avec.el);
    expect(ordre).toEqual([...ordre].sort((a, b) => a.localeCompare(b)));
    render(null, host!);
    host!.remove();

    const sans = mount(undefined);
    expect(ordreLangues(sans.el)).toEqual(ordre);
  });

  it('shows how much each language represented, without moving it', () => {
    const { el } = mount(stats({ byLang: { es: 400 } }));
    expect(el.textContent).toContain('400');
  });

  // Les 43 drapeaux etaient dessines dans la feuille du chat et la page
  // d'options ne pouvait pas les atteindre, donc elle affichait les deux
  // lettres du code. Ils vivent dans src/shared/flags.css maintenant.
  it('draws the flag rather than the ISO code', () => {
    const { el } = mount(stats());
    expect(el.querySelector('.kt-flag-es')).not.toBeNull();
    expect(el.querySelector('.kt-flag-jp')).not.toBeNull();
  });

  // Le repli en deux lettres existe dans le code parce qu'un drapeau nomme un
  // pays et pas une langue. Mesure : les 43 langues offertes en ont toutes un,
  // donc il ne se declenche jamais aujourd'hui. Ce test tient l'invariant par
  // l'autre bout : une 44e langue ajoutee sans drapeau se verra ici plutot que
  // sur une capture d'ecran.
  it('has a flag for every language it offers', () => {
    const { el } = mount(stats());
    const rangees = el.querySelectorAll('.grid .truncate').length;
    const drapeaux = el.querySelectorAll('.grid .kt-flag').length;
    expect(drapeaux).toBe(rangees);
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
