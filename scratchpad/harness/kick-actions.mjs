/**
 * Gestures a live harness performs on the extension, in one place.
 *
 * Written after the same defect was found in three harnesses at once. All three
 * "set the reading language" like this:
 *
 *   const s = document.querySelector('#kt-floating-bar .kt-float-lang');
 *   s.value = 'fr';
 *   s.dispatchEvent(new Event('change', { bubbles: true }));
 *
 * That control was a `<select>` once. It is a `<button>` opening a shared panel
 * now, and on a button those two lines do nothing whatsoever. So the target was
 * never changed, and every count taken afterwards measured the default target.
 * Two of the three reported green while proving nothing, and the third flapped
 * with the language of whichever channel the directory happened to serve, which
 * got filed as the live gates being non-deterministic.
 *
 * Both of those files carried a comment saying why the target had to change:
 * "or nothing is ever translated and every check below passes on an empty set".
 * The author knew the trap. The code still walked into it, three times, because
 * the gesture was copied rather than shared.
 *
 * So it lives here. When the control changes shape again, one file breaks and
 * says so, instead of three going quietly green.
 */

/**
 * Set the reading language through the interface a person uses.
 *
 * Returns `{ ok, etiquette, raison }` rather than throwing: a harness needs to
 * tell "I could not set the target" apart from "the pipeline is broken", and
 * those are the same zero if this only reported failure by absence.
 *
 * @param page  Playwright page, already on a channel with the bar mounted.
 * @param code  ISO code of the language to read in.
 */
export async function poserLangueCible(page, code = 'fr') {
  return page.evaluate(async (code) => {
    const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

    const bouton = document.querySelector('#kt-floating-bar .kt-float-lang');
    if (!bouton) return { ok: false, raison: 'pas de bouton de langue dans la barre' };

    bouton.click();
    await attendre(600);

    // The panel hangs off the body, so a stale hidden one can come first in
    // document order: take the visible one, never the first one.
    const panneau = [...document.querySelectorAll('.kt-lang-panel')].find((p) => !p.hidden);
    if (!panneau) return { ok: false, raison: 'le bouton de langue n ouvre pas le panneau' };

    const rangee = panneau.querySelector(`.kt-lang-row[data-code="${code}"]`);
    if (!rangee) {
      const dispo = [...panneau.querySelectorAll('.kt-lang-row')].length;
      return { ok: false, raison: `pas de rangee ${code} dans le panneau (${dispo} rangees)` };
    }

    rangee.click();
    await attendre(600);

    // Read the control back. A panel that opens and sets nothing produces the
    // same zero downstream as a broken pipeline, and only this tells them
    // apart.
    const etiquette = (bouton.textContent ?? '').trim().toUpperCase();
    if (!etiquette.includes(code.toUpperCase())) {
      return { ok: false, etiquette, raison: `cible non posee : le bouton affiche "${etiquette}"` };
    }
    return { ok: true, etiquette };
  }, code);
}

/** Rendered translations on the page, by the three display styles. */
export const SELECTEUR_TRADUCTIONS =
  '.kt-translation, .kt-translation-inline, .kt-translation-replace';
