/**
 * Streaming / Twitch-Kick slang that should NOT be translated: it has no
 * meaningful target-language rendering ("poggers" → "poggers"). A message made
 * ONLY of these (+ noise) is skipped, saving provider quota and avoiding junk
 * like "copium" → some literal mistranslation.
 */
export const SLANG = new Set<string>([
  'pog', 'poggers', 'pogchamp', 'pogu', 'poggies', 'kekw', 'kek', 'lul', 'lulw',
  'omegalul', 'lmao', 'lmfao', 'rofl', 'copium', 'hopium', 'malding', 'mald',
  'based', 'cringe', 'ratio', 'sadge', 'aware', 'unaware', 'gigachad', 'chad',
  'sus', 'sheesh', 'kappa', 'monkas', 'monkaw', 'pepega', 'pepe', 'peepo',
  'widepeepohappy', 'ezclap', 'ez', 'gg', 'ggs', 'glhf', 'wp', 'gget',
  'pausechamp', 'catjam', 'modcheck', 'clap', 'pepelaugh', 'kekwait', 'hypers',
  'pog champ', 'd:', 'pepehands', 'sadcat', 'icant', 'plonk', 'gigachat',
  'yep', 'nope', 'copege', 'prayge', 'gambage', 'donowall', 'koncha',
  'w', 'l', 'dub', 'ws', 'ls', 'ratioed', 'gyatt', 'gyat', 'rizz', 'fr', 'frfr',
  'ong', 'ngl', 'tuff', 'aura', 'mewing', 'goon', 'goonin', 'edging',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.!?:;()"']+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** True when every token is streaming slang → no point translating. */
export function isSlangOnly(text: string): boolean {
  const tokens = tokenize(text);
  if (tokens.length === 0) return false;
  return tokens.every((t) => SLANG.has(t));
}
