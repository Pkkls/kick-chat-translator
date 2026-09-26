// Grid: what the shipped provider actually returned on 90 short-message pairs,
// classified. The raw answers come from one run of translit-reel.mjs against
// the real Google web endpoint on 2026-08-31; they are frozen here so the
// judgement can be re-read and argued with without paying 90 more calls to an
// endpoint that soft-bans per IP.
//
// The three intentions are written before the counting, because a case with no
// written intent gets judged afterwards, and afterwards it always gets judged
// in favour of whatever the code already does.
//
//   TRANSLIT   The output spells the sounds of the input in the target's
//              script. A reader of the target language gets no meaning at all.
//              This is the only defect the rescued guard was built for.
//
//   HOMOGRAPHE The output is a real word of the target language carrying the
//              wrong sense of the input. Meaning is delivered and it is the
//              wrong meaning. A different defect; the guard's detection layer
//              cannot see it, and its dictionary repairs it by accident.
//
//   BON        The output carries the input's meaning. Register may differ from
//              the dictionary's choice, and a different register is not a
//              defect. An override on one of these buys a saved network call
//              and imposes one author's wording; it repairs nothing.
//
// Verdicts are mine, made by reading each line against the input. The point of
// freezing them is that a later pass can disagree with a specific row.

const GRID = [
  // ja
  ['ja', 'bonjour', 'ボンジュール', 'TRANSLIT'],
  ['ja', 'bonsoir', 'こんばんは', 'BON'],
  ['ja', 'merci', 'メルシー', 'TRANSLIT'],
  ['ja', 'salut', 'こんにちは', 'BON'],
  ['ja', 'coucou', 'カッコウ', 'HOMOGRAPHE'], // the cuckoo bird, katakana by convention
  ['ja', 'hola', 'こんにちは', 'BON'],
  ['ja', 'gracias', 'グラシアス', 'TRANSLIT'],
  ['ja', 'obrigado', 'ありがとう', 'BON'],
  ['ja', 'danke', 'ありがとう', 'BON'],
  ['ja', 'ciao', 'チャオ', 'TRANSLIT'],
  ['ja', 'grazie', 'ありがとう', 'BON'],
  ['ja', 'merhaba', 'こんにちは', 'BON'],
  ['ja', 'gg wp', 'ggwp', 'BON'], // left in Latin, which is what a JA chat writes
  ['ja', 'well played', 'よくやった', 'BON'],
  ['ja', 'good luck', '幸運を', 'BON'],
  ['ja', 'lets go', 'さあ行こう', 'BON'],
  ['ja', 'sugoi', 'すごい', 'BON'],
  ['ja', 'konnichiwa', 'こんにちは', 'BON'],
  // ko
  ['ko', 'bonjour', '봉쥬르', 'TRANSLIT'],
  ['ko', 'bonsoir', '좋은 저녁이에요', 'BON'],
  ['ko', 'merci', '자비', 'HOMOGRAPHE'], // mercy, the abstract noun
  ['ko', 'salut', '안녕하세요', 'BON'],
  ['ko', 'coucou', '뻐꾸기', 'HOMOGRAPHE'], // the cuckoo bird
  ['ko', 'hola', '안녕하세요', 'BON'],
  ['ko', 'gracias', '그라시아스', 'TRANSLIT'],
  ['ko', 'obrigado', '감사해요', 'BON'],
  ['ko', 'danke', '감사해요', 'BON'],
  ['ko', 'ciao', '챠오', 'TRANSLIT'],
  ['ko', 'grazie', '감사합니다', 'BON'],
  ['ko', 'merhaba', '안녕하세요', 'BON'],
  ['ko', 'gg wp', 'gg wp', 'BON'],
  ['ko', 'well played', '잘 놀았어', 'BON'],
  ['ko', 'good luck', '행운을 빌어요', 'BON'],
  ['ko', 'lets go', '갑시다', 'BON'],
  ['ko', 'sugoi', '스고이', 'TRANSLIT'],
  ['ko', 'konnichiwa', '곤니치와', 'TRANSLIT'],
  // zh
  ['zh', 'bonjour', '你好', 'BON'],
  ['zh', 'bonsoir', '晚上好', 'BON'],
  ['zh', 'merci', '谢谢', 'BON'],
  ['zh', 'salut', '你好', 'BON'],
  ['zh', 'coucou', '布谷鸟', 'HOMOGRAPHE'], // the cuckoo bird
  ['zh', 'hola', '你好', 'BON'],
  ['zh', 'gracias', '谢谢', 'BON'],
  ['zh', 'obrigado', '谢谢', 'BON'],
  ['zh', 'danke', '谢谢', 'BON'],
  ['zh', 'ciao', '再见', 'BON'], // ciao is both hello and goodbye; goodbye is a sense
  ['zh', 'grazie', '谢谢', 'BON'],
  ['zh', 'merhaba', '你好', 'BON'],
  ['zh', 'gg wp', 'ggwp', 'BON'],
  ['zh', 'well played', '打的好', 'BON'],
  ['zh', 'good luck', '祝你好运', 'BON'],
  ['zh', 'lets go', '我们走吧', 'BON'],
  ['zh', 'sugoi', '苏戈伊', 'TRANSLIT'],
  ['zh', 'konnichiwa', '康日瓦', 'TRANSLIT'],
  // ru
  ['ru', 'bonjour', 'здравствуйте', 'BON'],
  ['ru', 'bonsoir', 'Добрый вечер', 'BON'],
  ['ru', 'merci', 'мерси', 'TRANSLIT'],
  ['ru', 'salut', 'привет', 'BON'],
  ['ru', 'coucou', 'кукушка', 'HOMOGRAPHE'], // the cuckoo bird
  ['ru', 'hola', 'привет', 'BON'],
  ['ru', 'gracias', 'спасибо', 'BON'],
  ['ru', 'obrigado', 'Спасибо', 'BON'],
  ['ru', 'danke', 'Спасибо', 'BON'],
  ['ru', 'ciao', 'чао', 'TRANSLIT'],
  ['ru', 'grazie', 'Спасибо', 'BON'],
  ['ru', 'merhaba', 'Привет', 'BON'],
  ['ru', 'gg wp', 'гг вп', 'TRANSLIT'],
  ['ru', 'well played', 'отлично сработано', 'BON'],
  ['ru', 'good luck', 'удачи', 'BON'],
  ['ru', 'lets go', 'пойдем', 'BON'],
  ['ru', 'sugoi', 'сугой', 'TRANSLIT'],
  ['ru', 'konnichiwa', 'конничива', 'TRANSLIT'],
  // ar
  ['ar', 'bonjour', 'صباح الخير', 'BON'],
  ['ar', 'bonsoir', 'مساء الخير', 'BON'],
  ['ar', 'merci', 'رحمة', 'HOMOGRAPHE'], // mercy, the abstract noun
  ['ar', 'salut', 'مرحبًا', 'BON'],
  ['ar', 'coucou', 'الوقواق', 'HOMOGRAPHE'], // the cuckoo bird
  ['ar', 'hola', 'مرحبًا', 'BON'],
  ['ar', 'gracias', 'شكرا', 'BON'],
  ['ar', 'obrigado', 'شكرًا', 'BON'],
  ['ar', 'danke', 'شكرًا', 'BON'],
  ['ar', 'ciao', 'تشاو', 'TRANSLIT'],
  ['ar', 'grazie', 'شكرًا لك', 'BON'],
  ['ar', 'merhaba', 'مرحبًا', 'BON'],
  ['ar', 'gg wp', 'gg wp', 'BON'],
  ['ar', 'well played', 'لعبت بشكل جيد', 'BON'],
  ['ar', 'good luck', 'حظ سعيد', 'BON'],
  ['ar', 'lets go', 'دعنا نذهب', 'BON'],
  ['ar', 'sugoi', 'سوغوي', 'TRANSLIT'],
  ['ar', 'konnichiwa', 'konnichiwa', 'HOMOGRAPHE'], // untouched, not rendered at all
];

const { isTransliteration, getSemanticOverride } = await import(
  '../../src/shared/transliterationGuard.ts'
).catch(async () => import('./translit-guard-compiled.mjs'));

const TARGETS = ['ja', 'ko', 'zh', 'ru', 'ar'];
const KINDS = ['TRANSLIT', 'HOMOGRAPHE', 'BON'];

if (GRID.length !== 90) {
  console.error(`GRILLE INCOMPLETE: ${GRID.length} lignes au lieu de 90.`);
  process.exit(2);
}

console.log('## Ce que le fournisseur livre, par langue\n');
const totals = Object.fromEntries(KINDS.map((k) => [k, 0]));
for (const t of TARGETS) {
  const sub = GRID.filter((r) => r[0] === t);
  const counts = Object.fromEntries(KINDS.map((k) => [k, sub.filter((r) => r[3] === k).length]));
  for (const k of KINDS) totals[k] += counts[k];
  console.log(
    `  ${t}  translit ${counts.TRANSLIT}/18  homographe ${counts.HOMOGRAPHE}/18  bon ${counts.BON}/18`,
  );
}
console.log(
  `  TOTAL translit ${totals.TRANSLIT}/90  homographe ${totals.HOMOGRAPHE}/90  bon ${totals.BON}/90\n`,
);

console.log('## Ce que la couche 2 voit, par langue');
console.log('   (isTransliteration, la detection post-traduction)\n');
let seenTotal = 0;
let falsePosTotal = 0;
for (const t of TARGETS) {
  const sub = GRID.filter((r) => r[0] === t);
  const flagged = sub.filter((r) => isTransliteration(r[1], r[2], t));
  const seen = flagged.filter((r) => r[3] === 'TRANSLIT').length;
  const falsePos = flagged.filter((r) => r[3] !== 'TRANSLIT');
  const real = sub.filter((r) => r[3] === 'TRANSLIT').length;
  seenTotal += seen;
  falsePosTotal += falsePos.length;
  const fpNote = falsePos.length ? `  faux positifs: ${falsePos.map((r) => r[1]).join(', ')}` : '';
  console.log(`  ${t}  vues ${seen}/${real}${fpNote}`);
}
const realTotal = totals.TRANSLIT;
console.log(`  TOTAL vues ${seenTotal}/${realTotal}, faux positifs ${falsePosTotal}\n`);

console.log('## Ce que la couche 1 change, par langue');
console.log("   (getSemanticOverride, le dictionnaire, qui repond AVANT tout appel)\n");
let repairs = 0;
let regChanges = 0;
let identical = 0;
let noEntry = 0;
for (const t of TARGETS) {
  const sub = GRID.filter((r) => r[0] === t);
  let rep = 0;
  let reg = 0;
  let same = 0;
  let none = 0;
  for (const [, text, out, kind] of sub) {
    const ov = getSemanticOverride(text, t);
    if (ov === undefined) {
      none += 1;
      continue;
    }
    if (ov === out) same += 1;
    else if (kind === 'BON') reg += 1;
    else rep += 1;
  }
  repairs += rep;
  regChanges += reg;
  identical += same;
  noEntry += none;
  console.log(
    `  ${t}  repare ${rep}  change un bon en autre mot ${reg}  identique ${same}  pas d entree ${none}`,
  );
}
console.log(
  `  TOTAL repare ${repairs}  change ${regChanges}  identique ${identical}  absent ${noEntry}`,
);
console.log(
  `\n  Appels economises: ${repairs + regChanges + identical} sur 90, puisque le dictionnaire repond avant le reseau.`,
);
