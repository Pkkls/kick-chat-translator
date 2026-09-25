import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MIN_COL_W,
  PANEL_COLS,
  PANEL_COLUMN_SHARE,
  PANEL_MAX_W,
  PANEL_MIN_W,
  colsFor,
  panelGeometry,
  type PanelGeometryInput,
} from './langMenu';

/**
 * What opening the language panel is allowed to cost the chat.
 *
 * Reported from a real session: picking the reading language made the chat look
 * like it had gone. Measured on this repository's own bar-panel stage, with the
 * float bar at the top of a 340x890 chat column:
 *
 *   panel 408 x 401, left 8   ->  68px wider than the column it sits in
 *
 * A layer wider than the thing it covers has no visible relationship to it, so
 * it does not read as a layer. Nothing bounded it but the window, so on a short
 * window it took the whole column as well.
 *
 * The numbers below are that stage. They are here rather than in a browser gate
 * because happy-dom resolves no layout: a test that drove placeLangMenu would
 * measure zeros and pass on anything.
 */

/** The stage: a 340x890 chat column, the bar at its top, a 1280x1000 window. */
function stage(over: Partial<PanelGeometryInput> = {}): PanelGeometryInput {
  return {
    anchor: { top: 0, bottom: 37, right: 340 },
    column: { width: 340, height: 890 },
    viewport: { width: 1280, height: 1000 },
    // 408 wide it wants to be, 401 tall it comes out at.
    content: { width: 408, height: 401 },
    prefer: 'below',
    ...over,
  };
}

describe('the language panel stays inside the chat', () => {
  it('never draws wider than the column it sits in', () => {
    const g = panelGeometry(stage());
    expect(g.width).toBeLessThanOrEqual(340 - 16);
    expect(g.width).toBe(324);
  });

  // Control: the bound has to be the column and not a constant that happens to
  // match it. A wider column gets a wider panel, up to the readable maximum.
  it('takes the full readable width when the column allows it', () => {
    expect(panelGeometry(stage({ column: { width: 600, height: 890 } })).width).toBe(PANEL_MAX_W);
  });

  // ...and a column narrower than the floor does not squeeze it into a strip.
  it('stops shrinking at the floor', () => {
    expect(panelGeometry(stage({ column: { width: 200, height: 890 } })).width).toBe(PANEL_MIN_W);
  });

  it('keeps its right edge inside the window', () => {
    const g = panelGeometry(stage());
    expect(g.left).toBeGreaterThanOrEqual(8);
    expect(g.left + g.width).toBeLessThanOrEqual(1280 - 8);
  });
});

describe('the chat is still there behind it', () => {
  // The heart of the report. Four column heights, from a desktop to a laptop
  // with the video player taking most of the window.
  it.each([
    [890, 401],
    [620, 372],
    [480, 288],
    [360, 216],
  ])('on a %ipx column the panel is %ipx tall', (columnH, expected) => {
    const g = panelGeometry(stage({ column: { width: 340, height: columnH } }));
    expect(Math.round(g.maxHeight)).toBe(expected);
    expect(g.maxHeight).toBeLessThanOrEqual(columnH * PANEL_COLUMN_SHARE + 0.5);
  });

  it('always leaves a readable strip of chat showing', () => {
    for (const columnH of [360, 480, 620, 890, 1400]) {
      const g = panelGeometry(stage({ column: { width: 340, height: columnH } }));
      const left = columnH - g.maxHeight;
      expect(left, `${columnH}px column leaves ${left}px of chat`).toBeGreaterThanOrEqual(
        columnH * (1 - PANEL_COLUMN_SHARE) - 0.5,
      );
    }
  });

  // Control: with the cap removed the old behaviour comes back, so the
  // assertions above are pinning the cap and not an accident of the content
  // height. A 360px column with no cap would take the panel's full 401px, which
  // is taller than the column itself.
  it('would cover the whole of a short column without the cap', () => {
    const uncapped = panelGeometry(stage({ column: { width: 340, height: 0 } }));
    expect(uncapped.maxHeight).toBe(401);
    expect(uncapped.maxHeight).toBeGreaterThan(360);
  });
});

describe('the panel says it is a layer', () => {
  // Normalise les fins de ligne. Le depot stocke du LF, mais .gitattributes
  // et core.autocrlf rendent un working tree en CRLF sous Windows. Une
  // assertion dont le saut de ligne n'est pas en tete, comme celle du
  // selecteur groupe des drapeaux, ne matche alors rien, et l'echec
  // ressemble a une regle disparue plutot qu'a un retour chariot.
  const css = readFileSync('src/content/inject.css', 'utf8').replace(/\r\n/g, '\n');

  function ruleFor(selector: string): string {
    return (
      new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    );
  }

  // An opaque panel with a hairline over a near-black chat is what the report
  // describes. The house rule bans drop shadows because every other surface
  // sits in the flow; this one covers one. The exception is named in
  // scratchpad/audit_da.py, which keeps that gate honest rather than silent.
  it('carries the one drop shadow in the sheet', () => {
    expect(ruleFor('.kt-lang-panel')).toMatch(/box-shadow:\s*var\(--kt-shadow-panel\)/);
  });

  // The token, and its light-theme value, both live in the shared theme file
  // rather than in a second hand-written block on this rule.
  it('takes that shadow from the shared theme, in both schemes', () => {
    const theme = readFileSync('src/shared/theme.css', 'utf8');
    expect(theme.match(/--kt-shadow-panel:/g) ?? []).toHaveLength(2);
  });

  // The cap has to reach the stylesheet, or the JS clamp is overruled by a
  // max-inline-size the window decides.
  it('caps its width on what placeLangMenu measured, not on the window', () => {
    expect(ruleFor('.kt-lang-panel')).toMatch(/max-inline-size:\s*min\(var\(--kt-lp-max-w/);
  });
});

/**
 * Combien de colonnes, et pourquoi plus toujours trois.
 *
 * PANEL_COLS etait une constante : la largeur du panneau suivait la colonne de
 * chat, le nombre de colonnes non. Dans une colonne etroite les trois tenaient
 * quand meme, et chaque nom rendait six caracteres.
 *
 * Le budget de texte d'une colonne vaut sa largeur moins 40 : 8 et 8 de marges
 * de rangee, 16 de drapeau, 8 de gouttiere. MIN_COL_W en laisse 87, soit une
 * quinzaine de caracteres, ce qui suffit a separer "Chinese (Taiw..." de
 * "Chinese". Coupe plus tot, il devenait "Chinese (...", indecidable.
 */
describe('the grid follows the width it was given', () => {
  // Les deux seules valeurs que placeLangMenu peut produire, capW etant serre
  // entre ces bornes.
  it('keeps three columns at the widest the panel ever gets', () => {
    expect(colsFor(PANEL_MAX_W)).toBe(3);
  });

  it('drops to two in the narrowest column the panel accepts', () => {
    expect(colsFor(PANEL_MIN_W)).toBe(2);
  });

  // Le seuil se derive, il n'est pas choisi : trois colonnes demandent
  // 3 * MIN_COL_W, plus deux gouttieres de 2, plus les 8 de marge du panneau.
  it('switches exactly where three columns stop holding MIN_COL_W', () => {
    const seuil = 3 * MIN_COL_W + 2 * 2 + 8;
    expect(colsFor(seuil)).toBe(3);
    expect(colsFor(seuil - 1)).toBe(2);
  });

  it('never returns less than one or more than PANEL_COLS', () => {
    expect(colsFor(0)).toBe(1);
    expect(colsFor(10_000)).toBe(PANEL_COLS);
  });

  // Les trois tests ci-dessus se derivent tous de MIN_COL_W, donc aucun ne la
  // tient : passee a 100 ils restent verts et les noms retombent a douze
  // caracteres. MIN_COL_W est une mesure, pas un reglage, et celui-ci la tient
  // par ce qu'elle produit plutot que par sa valeur.
  it('leaves room for fifteen characters at every width it is given', () => {
    // La colonne moins ses 8 et 8 de marges, ses 16 de drapeau et ses 8 de
    // gouttiere. 87px est ce que quinze caracteres prennent a 12px.
    const HORS_TEXTE = 40;
    const QUINZE = 87;
    for (const capW of [PANEL_MIN_W, 340, PANEL_MAX_W]) {
      const n = colsFor(capW);
      const colonne = (capW - 8 - 2 * (n - 1)) / n;
      expect(colonne - HORS_TEXTE).toBeGreaterThanOrEqual(QUINZE);
    }
  });
});

/**
 * La selection est le seul etat qui reponde a la question que pose le panneau,
 * et c'etait le plus faible qu'il portait.
 *
 * Elle n'avait qu'un fond, mesure a 1.21:1 contre la surface quand le survol
 * est a 1.87 : les deux etats se ressemblaient. Pendant ce temps l'anneau de
 * focus, a 12.74, etait de loin l'element le plus vif d'un panneau dont il
 * n'est qu'un etat passager. 1.4.11 demande qu'un etat soit identifiable, donc
 * il faut un porteur qui ne soit pas qu'une nuance de fond.
 */
describe('the selected row is identifiable', () => {
  // Normalise les fins de ligne. Le depot stocke du LF, mais .gitattributes
  // et core.autocrlf rendent un working tree en CRLF sous Windows. Une
  // assertion dont le saut de ligne n'est pas en tete, comme celle du
  // selecteur groupe des drapeaux, ne matche alors rien, et l'echec
  // ressemble a une regle disparue plutot qu'a un retour chariot.
  const css = readFileSync('src/content/inject.css', 'utf8').replace(/\r\n/g, '\n');

  function ruleFor(selector: string): string {
    return (
      new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ??
      ''
    );
  }

  it('carries the word in the accent, not a bed alone', () => {
    expect(ruleFor(".kt-lang-row[aria-selected='true']")).toMatch(
      /color:\s*var\(--kt-lp-accent\)/,
    );
  });

  it('carries a non-text rail as well', () => {
    expect(ruleFor(".kt-lang-row[aria-selected='true']::before")).toMatch(
      /background:\s*var\(--kt-lp-accent\)/,
    );
  });

  // Logique et non physique : dans une interface arabe le rail passe a droite
  // avec le reste. C'est toute la raison du pseudo-element, un box-shadow inset
  // n'ayant pas de forme logique.
  it('puts that rail on the logical start edge', () => {
    const rail = ruleFor(".kt-lang-row[aria-selected='true']::before");
    expect(rail).toMatch(/inset-inline-start:/);
    expect(rail).not.toMatch(/\bleft:/);
  });

  // 15px d'etoile plus 8px de gouttiere sur 43 rangees, a opacity 0 : 17 % de
  // chaque colonne depense a ne rien montrer. Hors du flux, ils vont au nom.
  it('keeps the pin out of the row flow', () => {
    expect(ruleFor('.kt-lang-star')).toMatch(/position:\s*absolute/);
    expect(ruleFor('.kt-lang-star')).not.toMatch(/flex-shrink/);
  });

  // Ancre sur un debut de ligne : sans cela le selecteur du theme clair, qui
  // contient celui-ci, repondrait a sa place.
  it('spends full saturation only where it means something', () => {
    expect(css).toMatch(
      /\n\.kt-lang-panel \.kt-flag,\n\.kt-chip-menu \.kt-flag \{[^}]*filter:\s*saturate\(0\.5\)/,
    );
    expect(css).toMatch(/\.kt-lang-row\[aria-selected='true'\] \.kt-flag[^{]*\{[^}]*filter:\s*none/);
    expect(css).toMatch(/\.kt-chip-row\[aria-selected='true'\] \.kt-flag[^{]*\{[^}]*filter:\s*none/);
  });
});

/**
 * Le menu de la puce est la deuxieme liste des memes 43 langues, avec son
 * propre jeu de classes, et il portait les memes defauts.
 *
 * Son second porteur de selection etait mort : `.kt-chip-iso { color }`
 * coloriait deux lettres ISO, et le creneau tient un drapeau depuis. Une
 * couleur de texte sur un conteneur sans texte ne peint rien, donc la
 * selection y reposait sur un fond a 1.21:1, seul.
 */
describe('the chip menu carries the same state as the panel', () => {
  // Normalise les fins de ligne. Le depot stocke du LF, mais .gitattributes
  // et core.autocrlf rendent un working tree en CRLF sous Windows. Une
  // assertion dont le saut de ligne n'est pas en tete, comme celle du
  // selecteur groupe des drapeaux, ne matche alors rien, et l'echec
  // ressemble a une regle disparue plutot qu'a un retour chariot.
  const css = readFileSync('src/content/inject.css', 'utf8').replace(/\r\n/g, '\n');

  function ruleFor(selector: string): string {
    return (
      new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ??
      ''
    );
  }

  it('gives the selected row a word and a rail, not a bed alone', () => {
    expect(ruleFor(".kt-chip-row[aria-selected='true']")).toMatch(
      /color:\s*var\(--kt-green-ink\)/,
    );
    expect(ruleFor(".kt-chip-row[aria-selected='true']::before")).toMatch(
      /background:\s*var\(--kt-green-ink\)/,
    );
  });

  // Le porteur mort ne doit pas revenir : il a survecu a la disparition des
  // lettres qu'il coloriait, et c'est ce qui a fait croire que l'etat etait
  // porte deux fois.
  it('no longer paints a container that holds no text', () => {
    expect(css).not.toMatch(/\.kt-chip-iso\s*\{[^}]*\}[\s\S]{0,40}color:\s*var\(--kt-green\)/);
    expect(ruleFor(".kt-chip-row[aria-selected='true'] .kt-chip-iso")).toBe('');
  });

  // --kt-green-ink vaut la verte de la marque en sombre et 6.18:1 en clair,
  // donc un seul jeton couvre les deux themes et les blocs clairs qui
  // doublaient ces regles ont disparu.
  it('takes its focus ring from the token that switches by itself', () => {
    expect(ruleFor('.kt-chip-row:focus-visible')).toMatch(/var\(--kt-green-ink\)/);
    expect(ruleFor('.kt-chip-search:focus-visible')).toMatch(/var\(--kt-green-ink\)/);
    expect(css).not.toContain("html[data-kt-scheme='light'] .kt-chip-search");
    expect(css).not.toContain("html[data-kt-scheme='light'] .kt-chip-menu {");
  });
});
