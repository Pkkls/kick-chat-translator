/**
 * CE QUE LA LANGUE ECRIT ET QUE PERSONNE D'AUTRE N'ECRIT, tire de ses lignes
 * MUETTES.
 *
 * Les cribles existants tournent tous autour d'une paire : `paire-declencheur`
 * cherche ce que deux langues partagent, `paire-sequences` ce qui les separe.
 * Celui-ci pose la question a UNE langue contre les quarante et une autres, et
 * il la pose la ou elle se paie : sur les lignes que le detecteur laisse
 * muettes aujourd'hui. Un marqueur qui ne couvre que des lignes deja nommees
 * est du poids mort avant meme d'etre ecrit.
 *
 * Deux passes, parce que les deux mecanismes n'ont pas la meme valeur :
 *   MOTS       un token entier, borne des deux cotes
 *   SEQUENCES  deux a quatre lettres n'importe ou dans un mot
 * La sequence vaut mieux quand elle tient : elle porte sur les mots que le
 * corpus ne contient pas, ce que le mot ne fait jamais. Mesure sur la paire
 * nordique : quatre sequences valent sept lignes, onze mots en valent trois.
 *
 * LE SEUIL EST ZERO SUR LES QUARANTE ET UNE AUTRES LANGUES, parce que rien ne
 * protege une entree exclusive : elle repond en plein air, avant les portes.
 *
 * ET LE CORPUS NE PEUT PAS REFUSER CE QU'IL NE CONTIENT PAS. Ce script rend des
 * candidats, pas des reponses. `mano` mesurait propre et c'est un mot espagnol
 * et lituanien ; `-ijo` mesurait propre et c'est l'espagnol `dijo` ; `son`
 * mesurait propre pour le catalan et c'est le francais, l'italien et l'anglais.
 * Chaque candidat retenu doit pouvoir s'enoncer comme une regle de la langue.
 *
 *   node --import tsx scratchpad/harness/langue-candidats.mjs ca
 *   node --import tsx scratchpad/harness/langue-candidats.mjs ca 2   (seuil)
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { LANG_CHAT_DIX } from '../../src/content/langChatDixCorpus.ts';
import { LANG_CHAT_PAIRE } from '../../src/content/langChatPaireCorpus.ts';
import { LANG_CHAT_PAIRE_REGLAGE } from '../../src/content/langChatPaireReglageCorpus.ts';
import { LANG_MIXED } from '../../src/content/langMixedCorpus.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const source = readFileSync(new URL(import.meta.url), 'utf8');
if (!/\[\^\\{1,2}p\{L\}\]/.test(source)) {
  console.error('La borne de mot a ete mangee a l ecriture. Rien de ce qui suit ne vaut.');
  process.exit(1);
}

const CIBLE = process.argv[2] ?? 'ca';
const SEUIL = Number(process.argv[3] ?? 3);

/**
 * LES CORPUS QU'ON A LE DROIT DE LIRE, et c'est la moitie de ce script.
 *
 * Un crible propose des candidats en REGARDANT des lignes. Si ces lignes
 * viennent d'un corpus tenu a l'ecart, le corpus cesse d'etre tenu a l'ecart et
 * le chiffre qu'il rend cesse de mesurer quoi que ce soit. Protocole 4.4bis : un
 * banc qu'on a regarde cesse d'etre un banc.
 *
 * Les deux corpus AVEUGLES, `langChatCorpus2.ts` et `langChatPaireCorpus.ts`,
 * servent donc au BRUIT, jamais aux candidats. Le bruit ne les expose pas : on
 * leur demande si un mot y apparait, pas ce qu'ils contiennent.
 */
const OU_LIRE = [LANG_CORPUS, LANG_CHAT, LANG_CHAT3, LANG_CHAT_DIX, LANG_CHAT_PAIRE_REGLAGE];
const OU_COMPTER_LE_BRUIT = [...OU_LIRE, LANG_CHAT2, LANG_CHAT_PAIRE];

const corpus = {};
for (const c of OU_COMPTER_LE_BRUIT) {
  for (const [l, v] of Object.entries(c)) corpus[l] = [...(corpus[l] ?? []), ...v];
}

/** La source des candidats, aveugles exclus. */
const lisible = {};
for (const c of OU_LIRE) {
  for (const [l, v] of Object.entries(c)) lisible[l] = [...(lisible[l] ?? []), ...v];
}
if (!corpus[CIBLE]) {
  console.error(`langue inconnue : ${CIBLE}`);
  process.exit(1);
}

/** Les lignes melangees se lisent a l'envers : un marqueur qui y repond est mauvais. */
const melangees = LANG_MIXED.map((e) => e.text ?? e.texte ?? '');

const ailleurs = [];
for (const [l, v] of Object.entries(corpus)) {
  if (l === CIBLE) continue;
  for (const t of v) ailleurs.push([l, t]);
}

const muettes = (lisible[CIBLE] ?? []).filter((t) => confidentLanguage(t) === undefined);
console.log(
  `${CIBLE} : ${corpus[CIBLE].length} lignes, ${muettes.length} muettes. ` +
    `${ailleurs.length} lignes ailleurs, ${melangees.length} melangees. Seuil ${SEUIL}.`,
);

function rapporte(titre, candidats, fabrique) {
  const lignes = [];
  for (const [c, n] of candidats) {
    if (n < SEUIL) continue;
    const re = fabrique(c);
    const vus = new Map();
    for (const [l, t] of ailleurs) if (re.test(t)) vus.set(l, (vus.get(l) ?? 0) + 1);
    const mel = melangees.filter((t) => re.test(t)).length;
    lignes.push([c, n, [...vus.entries()].sort((a, b) => b[1] - a[1]), mel]);
  }
  const propres = lignes.filter(([, , v, m]) => !v.length && !m);
  propres.sort((a, b) => b[1] - a[1]);
  console.log(`\n=== ${titre} : ${propres.length} propres sur ${lignes.length} ===`);
  console.log('candidat     muettes prises');
  for (const [c, n] of propres.slice(0, 40)) console.log(`  ${c.padEnd(12)} ${String(n).padStart(3)}`);
  const sales = lignes
    .filter(([, , v, m]) => v.length || m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  if (sales.length) {
    console.log('\n  refuses, avec ce qui les refuse :');
    for (const [c, n, v, m] of sales) {
      const det = v.slice(0, 6).map(([l, k]) => `${l}=${k}`).join(' ') + (m ? ` MELANGE=${m}` : '');
      console.log(`  ${c.padEnd(12)} ${String(n).padStart(3)}   ${det}`);
    }
  }
}

/** Passe MOTS : les tokens entiers des lignes muettes. */
const mots = new Map();
for (const t of muettes) {
  for (const mot of new Set(t.toLowerCase().match(/\p{L}+/gu) ?? [])) {
    if (mot.length < 2) continue;
    mots.set(mot, (mots.get(mot) ?? 0) + 1);
  }
}
rapporte(
  'MOTS',
  mots,
  (m) => new RegExp(`(^|[^\\p{L}])${m}([^\\p{L}]|$)`, 'iu'),
);

/** Passe SEQUENCES : deux a quatre lettres, n'importe ou. */
const seqs = new Map();
for (const t of muettes) {
  const s = t.toLowerCase();
  const dedans = new Set();
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i + n <= s.length; i++) {
      const bout = s.slice(i, i + n);
      if (!/^\p{L}+$/u.test(bout)) continue;
      dedans.add(bout);
    }
  }
  for (const bout of dedans) seqs.set(bout, (seqs.get(bout) ?? 0) + 1);
}
rapporte('SEQUENCES', seqs, (c) => new RegExp(c, 'iu'));

/** Passe FINS DE MOT : la meme chose, bornee a droite seulement. */
const fins = new Map();
for (const t of muettes) {
  for (const mot of t.toLowerCase().match(/\p{L}+/gu) ?? []) {
    for (let n = 2; n <= 4; n++) {
      if (mot.length <= n) continue;
      const bout = mot.slice(-n);
      fins.set(bout, (fins.get(bout) ?? 0) + 1);
    }
  }
}
rapporte('FINS DE MOT', fins, (c) => new RegExp(`${c}([^\\p{L}]|$)`, 'iu'));
