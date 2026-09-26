// Probe: does a real provider return a phonetic transliteration instead of a
// translation, for short Latin-script chat input aimed at a non-Latin target?
//
// The claim under test comes from an untracked file found on this machine. It
// has to be verified against the shipped provider before any of it is wired in,
// because eleven probes before this one accused healthy code.
//
// Read-only GET against the same undocumented endpoint the product uses. No
// credential. Paced so it cannot look like a burst.

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const GOOGLE_CODES = { zh: 'zh-CN', 'zh-tw': 'zh-TW', 'pt-br': 'pt' };

const KATA = /[゠-ヿㇰ-ㇿ･-ﾟ]/u;
const HIRA = /[぀-ゟ]/u;
const HAN = /[一-鿿]/u;

function katakanaRatio(text) {
  const s = text.replace(/[\s\p{P}\p{S}]/gu, '');
  if (!s.length) return 0;
  let k = 0;
  for (const ch of s) if (KATA.test(ch)) k += 1;
  return k / s.length;
}

// Short Latin chat input, one per row, with the semantic answer a human would
// give. The semantic column is what makes a wrong answer visible for targets
// whose script cannot tell a transliteration from a translation.
const CASES = [
  ['bonjour', 'fr', { ja: 'こんにちは', ko: '안녕하세요', zh: '你好', ru: 'Привет', ar: 'مرحبا' }],
  ['bonsoir', 'fr', { ja: 'こんばんは', ko: '안녕하세요', zh: '晚上好', ru: 'Добрый вечер', ar: 'مساء الخير' }],
  ['merci', 'fr', { ja: 'ありがとう', ko: '감사합니다', zh: '谢谢', ru: 'Спасибо', ar: 'شكرا' }],
  ['salut', 'fr', { ja: 'やあ', ko: '안녕', zh: '嗨', ru: 'Привет', ar: 'مرحبا' }],
  ['coucou', 'fr', { ja: 'やっほー', ko: '안녕', zh: '嘿', ru: 'Привет', ar: 'مرحبا' }],
  ['hola', 'es', { ja: 'こんにちは', ko: '안녕하세요', zh: '你好', ru: 'Привет', ar: 'مرحبا' }],
  ['gracias', 'es', { ja: 'ありがとう', ko: '감사합니다', zh: '谢谢', ru: 'Спасибо', ar: 'شكرا' }],
  ['obrigado', 'pt', { ja: 'ありがとう', ko: '감사합니다', zh: '谢谢', ru: 'Спасибо', ar: 'شكرا' }],
  ['danke', 'de', { ja: 'ありがとう', ko: '감사합니다', zh: '谢谢', ru: 'Спасибо', ar: 'شكرا' }],
  ['ciao', 'it', { ja: 'こんにちは', ko: '안녕하세요', zh: '你好', ru: 'Привет', ar: 'مرحبا' }],
  ['grazie', 'it', { ja: 'ありがとう', ko: '감사합니다', zh: '谢谢', ru: 'Спасибо', ar: 'شكرا' }],
  ['merhaba', 'tr', { ja: 'こんにちは', ko: '안녕하세요', zh: '你好', ru: 'Привет', ar: 'مرحبا' }],
  ['gg wp', 'en', { ja: 'お疲れ様', ko: '수고했어', zh: '打得好', ru: 'Хорошая игра', ar: 'لعبة جيدة' }],
  ['well played', 'en', { ja: 'お見事', ko: '잘했어', zh: '打得好', ru: 'Отлично сыграно', ar: 'أحسنت' }],
  ['good luck', 'en', { ja: '頑張って', ko: '행운을 빌어요', zh: '祝你好运', ru: 'Удачи', ar: 'حظا سعيدا' }],
  ['lets go', 'en', { ja: '行くぞ', ko: '가자', zh: '走吧', ru: 'Погнали', ar: 'هيا بنا' }],
  ['sugoi', 'ja-romaji', { ja: 'すごい', ko: '대단해', zh: '厉害', ru: 'Круто', ar: 'رائع' }],
  ['konnichiwa', 'ja-romaji', { ja: 'こんにちは', ko: '안녕하세요', zh: '你好', ru: 'Привет', ar: 'مرحبا' }],
];

const TARGETS = ['ja', 'ko', 'zh', 'ru', 'ar'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translate(text, target) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', GOOGLE_CODES[target] ?? target);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const res = await fetch(url.toString(), { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('soft block');
  return data[0].map((s) => s[0]).join('');
}

const rows = [];
let calls = 0;
let errors = 0;

for (const target of TARGETS) {
  for (const [text, srcLabel, expected] of CASES) {
    let out = null;
    try {
      out = await translate(text, target);
      calls += 1;
    } catch (err) {
      errors += 1;
      rows.push({ target, text, srcLabel, out: null, err: String(err.message) });
      await sleep(600);
      continue;
    }
    rows.push({ target, text, srcLabel, out, expected: expected[target] });
    await sleep(350);
  }
}

// A probe that measured nothing must fail, not pass.
if (calls === 0) {
  console.error(`SONDE MUETTE: 0 appel abouti sur ${rows.length} essais, ${errors} erreurs.`);
  process.exit(2);
}

console.log(`appels aboutis ${calls}/${rows.length}, erreurs ${errors}\n`);

for (const target of TARGETS) {
  const sub = rows.filter((r) => r.target === target && r.out !== null);
  if (sub.length === 0) {
    console.log(`--- ${target}: aucun appel abouti ---\n`);
    continue;
  }
  let exact = 0;
  let kataPure = 0;
  console.log(`--- ${target} (${sub.length} lignes) ---`);
  for (const r of sub) {
    const same = r.out === r.expected;
    if (same) exact += 1;
    const kr = target === 'ja' ? katakanaRatio(r.out) : null;
    const pure = kr !== null && kr > 0.8;
    if (pure) kataPure += 1;
    const marks = [same ? 'OK ' : 'DIFF', pure ? 'KATA-PUR' : '        '].join(' ');
    console.log(
      `  ${marks}  ${r.text.padEnd(12)} -> ${String(r.out).padEnd(16)} attendu ${r.expected}`,
    );
  }
  const kataLine = target === 'ja' ? `, katakana pur ${kataPure}/${sub.length}` : '';
  console.log(`  identique au semantique attendu ${exact}/${sub.length}${kataLine}\n`);
}
