/**
 * LE CRIBLE DES MARQUEURS CANTONAIS.
 *
 * La regle cantonaise est une regle de PRESENCE : un seul caractere suffit a
 * nommer la langue, parce que le cantonais ecrit est du chinois standard a 90 %
 * et qu'une regle de proportion ne verrait rien. Une regle de presence produit
 * des faux positifs par construction, donc chaque candidat se mesure des DEUX
 * cotes avant d'entrer.
 *
 * Ce script repond a la premiere des deux questions, celle du cout : le
 * candidat apparait-il dans du chinois standard, du japonais, ou n'importe
 * quelle autre langue des bancs. La seconde question, celle du gain, est
 * `canto-bench.mjs`, et elle se pose APRES.
 *
 * L'ORDRE COMPTE ET C'EST LE PROTOCOLE 4.6. Les candidats de la liste
 * ci-dessous sont choisis sur ce que le cantonais ecrit, pas sur les lignes que
 * le banc rate. Un marqueur choisi parce qu'il ferme une ligne du banc rend ce
 * banc incapable de le juger. La mesure est un veto, jamais le critere de
 * selection.
 *
 *   node --import tsx scratchpad/harness/canto-candidats.mjs
 */
import { readFileSync } from 'node:fs';
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT_NL } from '../../src/content/langChatNonLatin.ts';
import { LANG_MIXED } from '../../src/content/langMixedCorpus.ts';

/**
 * Chaque entree est `[marqueur, ce que le cantonais en fait, le risque connu]`.
 * Le troisieme champ n'est pas decoratif : un candidat sans risque ecrit est un
 * candidat que personne n'a verifie.
 */
const CANDIDATS = [
  ['瞓', 'dormir, 瞓覺', 'absent du chinois standard ecrit'],
  ['啱', 'juste, correct, 啱啱', 'absent du chinois standard ecrit'],
  ['嬲', 'fache', 'sens archaique en standard, jamais en prose moderne'],
  ['攞', 'prendre, 攞嚟', 'dialectal, rare hors cantonais'],
  ['搵', 'chercher, trouver', 'lecture archaique wen4 en standard, essuyer'],
  ['唞', 'se reposer, 唞下', 'absent du chinois standard ecrit'],
  ['嚿', 'morceau, 一嚿', 'absent du chinois standard ecrit'],
  ['冧', 'seduire, ou s ecrouler', 'absent du chinois standard ecrit'],
  ['揼', 'frapper, gaspiller', 'absent du chinois standard ecrit'],
  ['孭', 'porter sur le dos', 'absent du chinois standard ecrit'],
  ['喐', 'bouger', 'absent du chinois standard ecrit'],
  ['氹', 'amadouer, ou mare', 'toponymes, Taipa s ecrit 氹仔'],
  ['慳', 'economiser', 'existe en standard litteraire, 慳吝'],
  ['嗌', 'crier, se disputer', 'lecture archaique yi4 en standard, gorge'],
  ['靚', 'joli', 'en standard surtout dans des emprunts au cantonais'],
  ['傾', 'discuter, 傾計', 'standard courant : pencher, 傾向'],
  ['郁', 'bouger', 'standard courant : 濃郁, 郁金香'],
  ['掂', 'regle, ca marche', 'standard courant : 掂量'],
  ['嘈', 'bruyant', 'standard courant : 嘈雜'],
  ['收皮', 'degage', 'expression, aucun sens en standard'],
  ['唔該', 'merci, s il vous plait', 'contient 唔, deja couvert'],
  ['好耐', 'longtemps', 'bigramme, 耐 est standard'],
  ['細路', 'gamin', 'bigramme, 細 et 路 sont standard'],
];

const source = readFileSync('src/content/langDetect.ts', 'utf8');
const dejaLa = (m) =>
  new RegExp(`CARACTERES_CANTONAIS[^\\n]*${m}|MOTS_CANTONAIS[^\\n]*${m}`).test(source);

/** Tous les corpus etiquetes, aplatis en `[langue, ligne]`. */
const lignes = [];
for (const [lang, v] of Object.entries(LANG_CORPUS)) for (const t of v) lignes.push([lang, t]);
for (const [lang, v] of Object.entries(LANG_CHAT_NL)) for (const t of v) lignes.push([lang, t]);
for (const e of LANG_MIXED) lignes.push(['melange', e.text ?? e.texte ?? '']);

console.log(`${lignes.length} lignes etiquetees lues.\n`);
console.log('marqueur  deja  yue   zh  zh-tw   ja  autres        risque connu');

for (const [m, , risque] of CANDIDATS) {
  const hits = {};
  for (const [lang, t] of lignes) if (t.includes(m)) hits[lang] = (hits[lang] ?? 0) + 1;
  const autres = Object.entries(hits)
    .filter(([l]) => !['yue', 'zh', 'zh-tw', 'ja'].includes(l))
    .map(([l, n]) => `${l}=${n}`)
    .join(' ');
  const col = (l) => String(hits[l] ?? 0).padStart(4);
  console.log(
    `  ${m.padEnd(4)}   ${dejaLa(m) ? 'oui' : ' . '} ${col('yue')} ${col('zh')} ${col('zh-tw')} ${col('ja')}  ${(autres || '.').padEnd(12)}  ${risque}`,
  );
}

console.log(
  '\nLa colonne qui decide est zh, zh-tw et ja : un seul coup y suffit a refuser\n' +
    'le candidat, parce que ces trois langues marchent aujourd hui et qu un faux\n' +
    'positif y casse quelque chose qui est juste. La colonne yue ne prouve rien\n' +
    'toute seule : elle dit le gain sur CE corpus-ci, pas si le marqueur existe.',
);
