import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { applyAccent, applyChatScheme, applyTypography } from './injector';
import { defaultSettings } from '~/shared/settings';

/**
 * La lisibilite de la ligne traduite, et la seule regle qui compte ici : un
 * lecteur qui n'ouvre jamais la section doit voir exactement ce qu'il voyait.
 *
 * Toute la mecanique tient sur trois proprietes personnalisees posees sur la
 * racine, lues par la feuille avec un repli EGAL a la valeur qu'elle portait
 * en dur. Ce fichier tient les deux bouts : les replis dans la feuille, et les
 * defauts du schema qui doivent leur correspondre.
 */

/** Le working tree est en CRLF sous Windows, le depot stocke du LF. */
function feuille(relatif: string): string {
  return readFileSync(relatif, 'utf8').replace(/\r\n/g, '\n');
}

describe('readability settings', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
  });

  // LE TEST QUI COMPTE. 1.35 n'est pas un chiffre rond choisi pour faire joli :
  // c'est la valeur que .kt-translation portait en dur avant que le reglage
  // existe. La proposition d'origine disait 1.45, ce qui aurait deplace la
  // ligne traduite de tous les lecteurs installes sans que personne demande.
  it('defaults to exactly what the sheet carried before the setting existed', () => {
    const d = defaultSettings();
    expect(d.translatedFontScale).toBe(1);
    expect(d.translatedLineHeight).toBe(1.35);
    expect(d.translatedFont).toBe('inherit');
  });

  // Le repli de la feuille doit etre le meme nombre, sinon le defaut du schema
  // et le defaut du CSS divergent et c'est celui qui arrive le premier qui
  // gagne, ce qui depend du moment ou le content script a pu lire le stockage.
  it('carries the same fallback in the sheet as the schema default', () => {
    const css = feuille('src/content/inject.css');
    expect(css).toContain('line-height: var(--kt-tr-leading, 1.35);');
    expect(css).toContain('var(--kt-tr-scale, 1)');
    expect(css).toContain('font-family: var(--kt-tr-font, inherit);');
  });

  it('writes the three properties on the document root', () => {
    applyTypography({
      translatedFontScale: 1.2,
      translatedLineHeight: 1.6,
      translatedFont: 'serif',
    });
    const s = document.documentElement.style;
    expect(s.getPropertyValue('--kt-tr-scale')).toBe('1.2');
    expect(s.getPropertyValue('--kt-tr-leading')).toBe('1.6');
    expect(s.getPropertyValue('--kt-tr-font')).toBe('var(--kt-tr-face-serif)');
  });

  // Revenir a la police de Kick doit RETIRER la propriete. Si elle etait posee
  // a une valeur quelconque, la face choisie resterait collee et le reglage
  // n'aurait pas de retour en arriere.
  it("removes the face for Kick's own, so the rule's own fallback wins", () => {
    applyTypography({
      translatedFontScale: 1,
      translatedLineHeight: 1.35,
      translatedFont: 'serif',
    });
    applyTypography({
      translatedFontScale: 1,
      translatedLineHeight: 1.35,
      translatedFont: 'inherit',
    });
    expect(document.documentElement.style.getPropertyValue('--kt-tr-font')).toBe('');
  });

  // Le pendant du garde des drapeaux : une option offerte dans la liste doit
  // etre dessinee quelque part, sinon elle se choisit et ne fait rien.
  it('draws a face for every value the schema offers', () => {
    const theme = feuille('src/shared/theme.css');
    const manquantes = ['system', 'serif', 'mono', 'readable'].filter(
      (v) => !theme.includes(`--kt-tr-face-${v}:`),
    );
    expect(manquantes).toEqual([]);
  });

  // L'echelle vaut pour les quatre styles d'affichage et pas seulement pour
  // below : trois declarations la portent, une par racine de traduction.
  it('scales every display style, not just the default one', () => {
    expect(feuille('src/content/inject.css').match(/--kt-tr-scale/g)).toHaveLength(3);
  });
});

/**
 * L'echelle typographique, et le garde qui empeche une valeur en dur de
 * revenir.
 *
 * La feuille en portait 29, dont 19 en pixels et 9 relatives, et la frontiere
 * entre les deux n'etait ecrite nulle part : elle se lisait en inspectant les
 * selecteurs. Elle l'est maintenant, en deux echelles nommees a part.
 */
describe('typography scale', () => {
  // Les seules valeurs qui ont le droit de rester litterales, chacune parce
  // qu'elle n'est pas une marche d'echelle mais une valeur structurelle.
  const TOLEREES = new Set([
    // Masque le texte d'origine dans les modes qui le remplacent.
    'font-size: 0',
    // Rend leur taille aux emotes d'une ligne dont le texte est masque.
    'font-size: 1rem',
    // La rangee et le champ du menu de la puce prennent la police du menu.
    'font-family: inherit',
  ]);

  it('keeps every size and face on a token', () => {
    const css = feuille('src/content/inject.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const enDur = [...css.matchAll(/(font-size|font-family)\s*:\s*([^;]+);/g)]
      .map((m) => `${m[1]}: ${m[2]!.trim().replace(/\s+/g, ' ')}`)
      .filter((d) => !d.includes('var(--kt-'))
      .filter((d) => !TOLEREES.has(d));
    expect(enDur).toEqual([]);
  });

  // Deux echelles et non une, parce que la frontiere est reelle : ce qui est
  // pose dans une ligne de Kick suit la taille de cette ligne, ce qui est a
  // nous ne la suit pas. Les melanger casserait l'un ou l'autre, et le seul
  // moyen de ne pas les melanger par accident est qu'elles ne se ressemblent
  // pas.
  it('keeps the chrome scale in pixels and the content scale relative', () => {
    const theme = feuille('src/shared/theme.css');
    const valeur = (nom: string) => new RegExp(`${nom}:\\s*([^;]+);`).exec(theme)?.[1]?.trim();
    for (const n of ['--kt-fs-xs', '--kt-fs-sm', '--kt-fs-md', '--kt-fs-lg']) {
      expect(valeur(n)).toMatch(/^\d+px$/);
    }
    for (const n of ['--kt-fc-xs', '--kt-fc-sm', '--kt-fc-md', '--kt-fc-lg', '--kt-fc-xl']) {
      expect(valeur(n)).toMatch(/^[\d.]+em$/);
    }
  });
});

/**
 * Les accents, verifies contre le fichier et non contre le script qui les a
 * ecrits.
 *
 * scratchpad/accents.py a calcule ces valeurs, mais un test qui le rejouerait
 * ne prouverait que sa propre coherence. Celui-ci relit les triplets DANS
 * theme.css et refait les ratios : si quelqu'un retouche un nombre a la main,
 * ou si un accent arrive sans avoir ete mesure, il rougit.
 */
describe('accents', () => {
  const theme = feuille('src/shared/theme.css');

  const canal = (v: number): number => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: number[]): number =>
    0.2126 * canal(c[0]!) + 0.7152 * canal(c[1]!) + 0.0722 * canal(c[2]!);
  const ratio = (a: number[], b: number[]): number => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };

  /**
   * Le triplet d'un jeton dans un bloc.
   *
   * Decoupe a la main plutot qu'avec un selecteur echappe en regex : ces
   * selecteurs portent des crochets et des apostrophes, et l'echappement est
   * exactement ce que le shell du depot abime en chemin.
   */
  function jeton(selecteur: string, nom: string): number[] {
    const i = theme.indexOf(selecteur);
    expect(i, `bloc absent : ${selecteur}`).toBeGreaterThan(-1);
    const bloc = theme.slice(i, theme.indexOf('}', i));
    const j = bloc.indexOf(`${nom}:`);
    expect(j, `${nom} absent de ${selecteur}`).toBeGreaterThan(-1);
    const brut = bloc.slice(j + nom.length + 1, bloc.indexOf(';', j)).trim();
    return brut.split(' ').map(Number);
  }

  const SOMBRE = [23, 26, 28];
  const BLANC = [255, 255, 255];
  const PAGE = [244, 244, 245];
  // 'kick' n'a pas de bloc : c'est l'absence d'attribut, donc :root.
  const ACCENTS = ['cyan', 'violet', 'amber'];

  it('gives every accent the schema offers a block in both schemes', () => {
    const manquants: string[] = [];
    for (const a of ACCENTS) {
      for (const s of ['dark', 'light']) {
        if (!theme.includes(`html[data-kt-scheme='${s}'][data-kt-accent='${a}']`)) {
          manquants.push(`${a}/${s}`);
        }
      }
    }
    expect(manquants).toEqual([]);
  });

  // Les barres sont celles que l'en-tete de theme.css pose : un bord de
  // controle tient 3:1, un mot 4.5:1. Le mot doit les tenir contre la surface,
  // contre la page ET contre le lit, qui est le fond sur lequel il est le plus
  // souvent pose. Ce dernier a ete oublie au premier calcul et faisait tomber
  // trois teintes sur quatre a 4.2 la ou ca compte.
  it.each(ACCENTS)('keeps %s above every bar it has to clear', (a) => {
    const sombre = `html[data-kt-scheme='dark'][data-kt-accent='${a}']`;
    const clair = `html[data-kt-scheme='light'][data-kt-accent='${a}']`;

    expect(ratio(jeton(sombre, '--kt-green-rgb'), SOMBRE)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(jeton(sombre, '--kt-green-edge-rgb'), SOMBRE)).toBeGreaterThanOrEqual(3);
    expect(ratio(BLANC, jeton(sombre, '--kt-green-bed-rgb'))).toBeGreaterThanOrEqual(4.5);

    const bordL = jeton(clair, '--kt-green-edge-rgb');
    const encreL = jeton(clair, '--kt-green-ink-rgb');
    const litL = jeton(clair, '--kt-green-bed-rgb');
    expect(ratio(bordL, BLANC)).toBeGreaterThanOrEqual(3);
    expect(ratio(bordL, PAGE)).toBeGreaterThanOrEqual(3);
    expect(ratio(encreL, BLANC)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(encreL, PAGE)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(encreL, litL)).toBeGreaterThanOrEqual(4.5);
  });

  it('writes the accent as an attribute, and clears it for Kick', () => {
    applyAccent('violet');
    expect(document.documentElement.getAttribute('data-kt-accent')).toBe('violet');
    applyAccent('kick');
    expect(document.documentElement.getAttribute('data-kt-accent')).toBeNull();
  });
});

/** La densite du bloc traduit, et le theme fige. */
describe('density and scheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-kt-density');
  });

  const base = { translatedFontScale: 1, translatedLineHeight: 1.35, translatedFont: 'inherit' };

  // 'normal' n'a pas de bloc : c'est l'absence d'attribut, donc les replis de
  // la regle, qui sont les marges que la feuille portait en dur. Lui donner un
  // bloc voudrait dire ecrire ces trois valeurs une seconde fois, et deux
  // copies d'un defaut finissent toujours par diverger.
  it('writes no attribute for the default density', () => {
    applyTypography({ ...base, translatedDensity: 'normal' });
    expect(document.documentElement.hasAttribute('data-kt-density')).toBe(false);
  });

  it.each(['compact', 'roomy'])('writes %s, and the sheet answers it', (d) => {
    applyTypography({ ...base, translatedDensity: d });
    expect(document.documentElement.getAttribute('data-kt-density')).toBe(d);
    expect(feuille('src/content/inject.css')).toContain(
      `html[data-kt-density='${d}'] .kt-translation`,
    );
  });

  it('keeps the untouched sheet on the values it used to hold', () => {
    const css = feuille('src/content/inject.css');
    expect(css).toContain('margin-top: var(--kt-tr-gap, 2px);');
    expect(css).toContain('padding-block: var(--kt-tr-pad-b, 2px);');
    expect(css).toContain('padding-inline: var(--kt-tr-pad-i, 8px) 6px;');
  });

  // Figer veut dire figer : la mesure du fond de Kick est court-circuitee et
  // non corrigee, sinon un changement de theme de la chaine reprendrait la
  // main sur un lecteur qui a justement demande le contraire.
  it('forces the scheme past what the chat actually looks like', () => {
    expect(applyChatScheme(document.body, 'light')).toBe('light');
    expect(document.documentElement.getAttribute('data-kt-scheme')).toBe('light');
    expect(applyChatScheme(document.body, 'dark')).toBe('dark');
    expect(document.documentElement.getAttribute('data-kt-scheme')).toBe('dark');
  });
});
