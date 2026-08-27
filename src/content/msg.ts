/**
 * A string from the extension's catalogue, for the content script.
 *
 * `chrome.i18n` reads `_locales/` without pulling the options-page translation
 * bundle into this script, which is deliberately free of it. Falls back to the
 * English source string outside an extension context, and under test.
 *
 * Lives on its own rather than inside langChip.ts, where it started. injector.ts
 * needed it for the hover placeholder and had been rendering that line in
 * English in all ten interface languages; copying the helper across would have
 * left two ways to read the same catalogue in the same directory, which is how
 * one of them ends up not being maintained.
 */
export function msg(key: string, fallback: string, subs?: string[]): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
      return chrome.i18n.getMessage(key, subs) || fallback;
    }
  } catch {
    /* not running as an extension */
  }
  // The fallback carries the same $LANG$ placeholder as the catalogue entry, so
  // the two cannot drift into saying different things.
  return subs?.length ? fallback.replace('$LANG$', subs[0]!) : fallback;
}
