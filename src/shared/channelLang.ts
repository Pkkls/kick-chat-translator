import { CHANNEL_LANG_MAX } from './constants';

/**
 * Ranger une langue pour une chaine, sans laisser l'objet grossir sans fin.
 *
 * Reecrit la cle meme quand elle existe deja, pour qu'elle reparte en fin de
 * file : l'ordre d'insertion d'un objet JavaScript est celui dans lequel les
 * cles ont ete posees, donc reposer une cle la rajeunit et c'est la plus
 * ancienne VRAIMENT inutilisee qui part.
 */
export function memoriserLangueChaine(
  memoire: Record<string, string>,
  slug: string,
  lang: string,
): Record<string, string> {
  const suite: Record<string, string> = {};
  for (const [k, v] of Object.entries(memoire)) if (k !== slug) suite[k] = v;
  suite[slug] = lang;
  const cles = Object.keys(suite);
  for (const vieille of cles.slice(0, Math.max(0, cles.length - CHANNEL_LANG_MAX))) {
    delete suite[vieille];
  }
  return suite;
}
