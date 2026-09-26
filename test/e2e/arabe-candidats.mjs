/**
 * Le crible des mots pour les langues en ECRITURE ARABE.
 *
 * `porte-candidats.mjs` est borne a l'ecriture latine, et pour une bonne raison
 * : sans cette borne il rendait les lettres arabes des lignes jawi comme des
 * marqueurs malais. Mais du coup personne n'a jamais cherche de ce cote, alors
 * que dix des treize erreurs restantes du chemin sur y sont.
 *
 * LE PROBLEME, chiffre : sept lignes persanes du banc ne portent AUCUNE des six
 * lettres persanes `پ چ ژ گ ک ی`, parce qu'elles s'ecrivent entierement avec le
 * jeu arabe. `تشنه ام.` et `اعتراض!` en sont. La lettre ne peut rien pour
 * elles, et c'est exactement la situation ou un MOT a servi ailleurs.
 *
 * Meme forme que la passe a mots du crible latin : un token qu'une seule de ces
 * langues ecrit est un marqueur candidat, et le seuil de bruit est le meme.
 *
 *   node --import tsx test/e2e/arabe-candidats.mjs
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT_NL } from '../../src/content/langChatNonLatin.ts';

/** Les langues que le corpus ecrit en alphabet arabe. */
const ARABES = new Set(['ar', 'fa', 'ms', 'ur']);
const SEUIL = 2;

const vu = new Map();
for (const corpus of [LANG_CORPUS, LANG_CHAT_NL]) {
  for (const [lang, lignes] of Object.entries(corpus)) {
    if (!ARABES.has(lang)) continue;
    for (const ligne of lignes) {
      for (const mot of new Set(ligne.split(/[^\p{L}]+/u))) {
        if (mot.length < 2) continue;
        if (!/^\p{Script=Arabic}+$/u.test(mot)) continue;
        if (!vu.has(mot)) vu.set(mot, new Map());
        const m = vu.get(mot);
        m.set(lang, (m.get(lang) ?? 0) + 1);
      }
    }
  }
}

const solo = [];
for (const [mot, m] of vu) {
  const fortes = [...m.entries()].filter(([, n]) => n >= SEUIL).sort((a, b) => b[1] - a[1]);
  if (fortes.length !== 1) continue;
  const bruit = [...m.entries()].filter(([, n]) => n < SEUIL);
  solo.push({ mot, lang: fortes[0][0], total: fortes[0][1], bruit });
}
solo.sort((a, b) => b.total - a.total);

console.log(`MOTS QU'UNE SEULE LANGUE EN ECRITURE ARABE ECRIT (>= ${SEUIL} lignes) :`);
for (const { mot, lang, total, bruit } of solo.slice(0, 40)) {
  console.log(
    `  ${mot.padEnd(12)} ${lang}=${String(total).padStart(3)}  ` +
      `${bruit.length ? 'bruit ' + bruit.map(([l, n]) => `${l}=${n}`).join(' ') : 'bruit ZERO'}`,
  );
}

console.log('\nCE QUE CA COUVRIRAIT des sept lignes persanes sans lettre persane :');
const LETTRES_PERSANES = /[پچژگکی]/u;
const orphelines = (LANG_CORPUS.fa ?? []).filter((t) => !LETTRES_PERSANES.test(t));
const propres = solo.filter((s) => s.lang === 'fa' && s.bruit.length === 0).map((s) => s.mot);
for (const t of orphelines) {
  const couvrent = propres.filter((m) => new RegExp(`(^|[^\\p{L}])${m}([^\\p{L}]|$)`, 'u').test(t));
  console.log(`  ${couvrent.length ? '[' + couvrent.join(' ') + ']' : 'AUCUN MOT'}  ${t}`);
}
