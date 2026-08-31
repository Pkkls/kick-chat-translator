// Layer 2 fires eight times across everything measured and repairs one. The
// seven that cost a round trip and returned nothing better split cleanly by one
// property, and the point of this probe is to check that property against the
// wire rather than assume it.
//
// Hypothesis: katakana output for an ENGLISH short input is usually the right
// answer, because English loanwords are written in katakana in ordinary
// Japanese (クラッチ is what a Japanese viewer writes for clutch). Katakana for
// a French, Spanish, Portuguese or Italian short input is usually a phonetic
// spelling with no meaning.
//
// The signal is free: the provider already returns the source language it
// detected, and google.ts parses it into `detectedLang` in the same object the
// cascade reads. Nothing has to be computed or stored.

const GOOGLE = 'https://translate.googleapis.com/translate_a/single';
const KATA = /[゠-ヿㇰ-ㇿ･-ﾟ]/u;

function katakanaRatio(text) {
  const s = text.replace(/[\s\p{P}\p{S}]/gu, '');
  if (!s.length) return 0;
  let k = 0;
  for (const ch of s) if (KATA.test(ch)) k += 1;
  return k / s.length;
}

// Every input measured to produce pure katakana, from both earlier probes,
// plus a control of English words whose katakana answer is correct Japanese.
const CASES = [
  ['bonjour', 'REPARER'],
  ['merci', 'REPARER'],
  ['gracias', 'REPARER'],
  ['ciao', 'REPARER'],
  ['lindo', 'REPARER'],
  ['coucou', 'REPARER'],
  ['clutch', 'LAISSER'],
  ['sheesh', 'LAISSER'],
  ['stream', 'LAISSER'],
  ['gaming', 'LAISSER'],
  ['highlight', 'LAISSER'],
  ['comeback', 'LAISSER'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function google(text) {
  const url = new URL(GOOGLE);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', 'ja');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const res = await fetch(url.toString(), { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('soft block');
  return {
    out: data[0].map((s) => s[0]).join(''),
    detected: typeof data[2] === 'string' ? data[2] : 'auto',
  };
}

const rows = [];
for (const [text, intent] of CASES) {
  try {
    const { out, detected } = await google(text);
    rows.push({ text, intent, out, detected, ratio: katakanaRatio(out) });
  } catch (err) {
    rows.push({ text, intent, out: null, err: String(err.message) });
  }
  await sleep(350);
}

const ok = rows.filter((r) => r.out !== null);
if (ok.length === 0) {
  console.error(`SONDE MUETTE: 0 appel abouti sur ${CASES.length}.`);
  process.exit(2);
}

console.log(`appels aboutis ${ok.length}/${CASES.length}\n`);
console.log('  intention  detecte  katakana  mot -> sortie');
for (const r of rows) {
  if (r.out === null) {
    console.log(`  ERREUR     ${r.text}: ${r.err}`);
    continue;
  }
  const kata = r.ratio > 0.8 ? 'PUR ' : '    ';
  console.log(
    `  ${r.intent.padEnd(9)}  ${r.detected.padEnd(7)}  ${kata}      ${r.text.padEnd(10)} -> ${r.out}`,
  );
}

// The rule under test: cascade only when the output is pure katakana AND the
// detected source is not English.
const fires = (r) => r.ratio > 0.8 && r.detected !== 'en';
const wanted = ok.filter((r) => r.intent === 'REPARER');
const control = ok.filter((r) => r.intent === 'LAISSER');
const keptNow = ok.filter((r) => r.ratio > 0.8);

console.log(`\n## Sans la regle (katakana pur seul)`);
console.log(`  declenche sur ${keptNow.filter((r) => r.intent === 'REPARER').length}/${wanted.length} a reparer`);
console.log(`  declenche sur ${keptNow.filter((r) => r.intent === 'LAISSER').length}/${control.length} a laisser`);

console.log(`\n## Avec la regle (katakana pur ET source detectee != en)`);
console.log(`  declenche sur ${wanted.filter(fires).length}/${wanted.length} a reparer`);
console.log(`  declenche sur ${control.filter(fires).length}/${control.length} a laisser`);
