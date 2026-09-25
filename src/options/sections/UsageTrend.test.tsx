import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';
import type { UsageStats } from '~/shared/types';
import { UsageTrend } from './UsageTrend';

function makeStats(over: Partial<UsageStats> = {}): UsageStats {
  return {
    totalRequests: 0,
    totalCacheHits: 0,
    totalErrors: 0,
    byProvider: {},
    byLang: {},
    byChannel: {},
    charsSent: 0,
    todayKey: '2026-08-13',
    ...over,
  };
}

let host: HTMLDivElement | undefined;

function mount(stats: UsageStats): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  render(<UsageTrend stats={stats} />, host);
  return host;
}

/** Les barres, par leur reserve : le seul element a hauteur fixe de la serie. */
function bars(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll('.h-24 > div')] as HTMLElement[];
}

/** Les pourcentages TELS QU'ILS SONT ECRITS, pas tels qu'ils sont dessines. */
function pourcents(el: HTMLElement): string[] {
  return [...el.querySelectorAll('.h-24')].map(
    (b) => b.parentElement?.querySelector('.tabular-nums')?.textContent ?? '',
  );
}

/**
 * CE QUE CES TESTS TIENNENT A CHANGE.
 *
 * Ils lisaient l'attribut `title` des barres, c'est-a-dire qu'ils
 * asservissaient le defaut : la valeur n'existait QUE la, invisible au
 * clavier, au lecteur d'ecran et au doigt. Ils verifient maintenant que le
 * nombre est ecrit dans le document.
 */
describe('UsageTrend', () => {
  afterEach(() => {
    if (host) {
      render(null, host);
      host.remove();
      host = undefined;
    }
  });

  // Les trois nombres de tete repondent a la question qu'on se pose en ouvrant
  // la page. Ils ne se deduisent pas d'une serie de barres.
  it('leads with the totals, in words', () => {
    const el = mount(makeStats({ totalRequests: 100, totalCacheHits: 75 }));
    expect(el.textContent).toContain('100');
    expect(el.textContent).toContain('75%');
    // 100 - 75 : ce qui est reellement parti sur le reseau.
    expect(el.textContent).toContain('25');
  });

  it('writes each day hit rate as text, not only as a bar', () => {
    const el = mount(
      makeStats({
        totalRequests: 4,
        totalCacheHits: 1,
        history: [
          { day: '2026-08-11', requests: 10, cacheHits: 5 },
          { day: '2026-08-12', requests: 20, cacheHits: 19 },
        ],
      }),
    );
    expect(pourcents(el)).toEqual(['50%', '95%', '25%']);
  });

  it('sizes each bar by that day hit rate', () => {
    const el = mount(
      makeStats({
        totalRequests: 4,
        totalCacheHits: 3,
        history: [{ day: '2026-08-12', requests: 10, cacheHits: 1 }],
      }),
    );
    expect(bars(el).map((b) => b.style.height)).toEqual(['10%', '75%']);
  });

  it('skips days with no traffic rather than drawing them as 0%', () => {
    const el = mount(
      makeStats({
        totalRequests: 6,
        totalCacheHits: 3,
        history: [
          { day: '2026-08-10', requests: 8, cacheHits: 4 },
          { day: '2026-08-11', requests: 0, cacheHits: 0 },
        ],
      }),
    );
    expect(pourcents(el)).toEqual(['50%', '50%']);
  });

  it('keeps a real 0% day visible instead of collapsing it', () => {
    const el = mount(
      makeStats({
        totalRequests: 5,
        totalCacheHits: 0,
        history: [{ day: '2026-08-12', requests: 9, cacheHits: 9 }],
      }),
    );
    expect(pourcents(el).at(-1)).toBe('0%');
    expect(bars(el).at(-1)!.className).toContain('min-h-');
  });

  it('shows at most seven days', () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      day: `2026-07-${String(i + 1).padStart(2, '0')}`,
      requests: 10,
      cacheHits: i,
    }));
    const el = mount(makeStats({ totalRequests: 2, totalCacheHits: 1, history }));
    expect(bars(el)).toHaveLength(7);
  });

  // ET C'EST L'INVERSE DE CE QUI ETAIT TENU ICI. Le premier jour etait cache
  // au motif qu'une barre seule n'est pas une tendance. C'etait vrai tant que
  // la valeur vivait dans une infobulle : une barre muette isolee ne dit rien.
  // Ecrite, elle dit "aujourd'hui, 33 %", ce qui est precisement ce que
  // quelqu'un qui vient d'installer l'extension veut savoir.
  it('shows the very first day, now that the number is written', () => {
    const el = mount(makeStats({ totalRequests: 3, totalCacheHits: 1 }));
    expect(pourcents(el)).toEqual(['33%']);
  });

  it('renders nothing at all when nothing has happened', () => {
    const el = mount(makeStats());
    expect(el.textContent?.trim()).toBe('');
  });

  // Les codes ISO etaient le seul nom affiche, sur une page qui sait les
  // traduire depuis toujours.
  it('names the languages instead of showing their ISO code alone', () => {
    const el = mount(makeStats({ totalRequests: 3, totalCacheHits: 1, byLang: { ko: 12 } }));
    expect(el.textContent).toContain('Korean');
    expect(el.textContent).toContain('12');
  });
});
