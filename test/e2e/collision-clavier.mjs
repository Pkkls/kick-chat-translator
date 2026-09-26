/**
 * LES COLLISIONS DE CLAVIER : quel marqueur NON ACCENTUE est rejoint par la
 * forme accentuee d'une autre langue une fois les diacritiques tombees ?
 *
 * LE DEFAUT, paye une fois. `aqui` est portugais et propre sur les 5490
 * lignes. L'espagnol et le catalan ecrivent `aquí`. Diacritiques tombees c'est
 * la MEME CHAINE, et il prenait `que esta pasando aqui` et `primer cop aqui`.
 * Meme chose pour `lai` letton contre le vietnamien `lại`.
 *
 * LE SENS DE LA COLLISION COMPTE, et c'est ce qui rend l'audit etroit :
 *
 *   un marqueur ACCENTUE, `för` suedois, ne matche jamais du texte nu. Il se
 *   tait, ce qui est l'issue sure. Aucun risque.
 *
 *   un marqueur NU, `aqui`, matche du texte nu ET du texte accentue d'une autre
 *   langue une fois celui-ci depouille. C'est la seule direction dangereuse.
 *
 * Le banc `chat1-SANS-DIACRITIQUES` attrape ces collisions mais seulement sur
 * les 390 lignes qu'il contient. Celui-ci les cherche sur les 5950 lignes des
 * six corpus, ce qui est la seule facon de voir celles que le chat ne porte pas.
 *
 *   node --import tsx test/e2e/collision-clavier.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';

/** Le meme depouillement que `langChat.test.ts` et que `porte-diff.mjs`. */
const MARQUES = /[̀-ͯ]/g;
const nu = (t) =>
  t
    .normalize('NFD')
    .replace(MARQUES, '')
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/đ/g, 'd')
    .replace(/ı/g, 'i')
    .toLowerCase();

const SRC = readFileSync('src/content/langDetect.ts', 'utf8');

/**
 * Les marqueurs de `LETTRES_EXCLUSIVES`, avec leur langue. Deux formes :
 * une alternance de mots bornee, et une sequence nue.
 */
const marqueurs = [];
for (const m of SRC.matchAll(/\[\/\(\^\|\[\^\\p\{L\}\]\)\(([^)]+)\)\(\[\^\\p\{L\}\]\|\$\)\/[a-z]*, '([a-z-]+)'\],/g)) {
  for (const mot of m[1].split('|')) marqueurs.push({ forme: mot, lang: m[2], type: 'mot' });
}
for (const m of SRC.matchAll(/\[\/([^/[(\]]+)\/[a-z]*, '([a-z-]+)'\],/g)) {
  marqueurs.push({ forme: m[1], lang: m[2], type: 'sequence' });
}

// Seuls les marqueurs deja NUS peuvent etre rejoints. Un marqueur accentue se
// tait sur du texte depouille, ce qui est sans danger.
const nus = marqueurs.filter((x) => nu(x.forme) === x.forme.toLowerCase());
console.log(`${marqueurs.length} marqueurs lus, dont ${nus.length} deja sans diacritiques.\n`);

const corpora = [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3, LANG_CHAT_PAIRE, LANG_CHAT_PAIRE_REGLAGE];

let trouve = 0;
for (const { forme, lang, type } of nus) {
  const motif =
    type === 'mot'
      ? new RegExp(`(^|[^\\p{L}])${forme}([^\\p{L}]|$)`, 'iu')
      : new RegExp(forme, 'iu');
  const coupables = new Map();
  for (const corpus of corpora) {
    for (const [autre, lignes] of Object.entries(corpus)) {
      if (autre === lang) continue;
      for (const t of lignes) {
        // La ligne telle quelle ne doit PAS matcher, sinon ce n'est pas une
        // collision de clavier, c'est un marqueur simplement faux et les autres
        // bancs l'ont deja dit.
        if (motif.test(t)) continue;
        if (motif.test(nu(t))) coupables.set(autre, (coupables.get(autre) ?? 0) + 1);
      }
    }
  }
  if (coupables.size === 0) continue;
  trouve += 1;
  const total = [...coupables.values()].reduce((a, b) => a + b, 0);
  console.log(
    `  ${forme.padEnd(10)} ${lang}  ${type.padEnd(9)} rejoint par ${total} ligne(s) : ` +
      [...coupables.entries()].map(([l, n]) => `${l}=${n}`).join(' '),
  );
}
console.log(trouve === 0 ? '\nAucune collision de clavier.' : `\n${trouve} marqueur(s) a revoir.`);
