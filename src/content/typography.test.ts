import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTypography } from './injector';
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
