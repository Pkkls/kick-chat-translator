/**
 * Does the Cantonese rule read Cantonese, and does it leave standard Chinese alone?
 *
 *   node test/e2e/canto-bench.mjs
 *   node test/e2e/canto-bench.mjs --live      (also hits the real engine)
 *
 * Why a synthetic corpus. The collector in this folder harvests real lines from a
 * live channel, and that is the right instrument for every other language. It does
 * not work here: Kick has next to no Hong Kong channels, and waiting for one to
 * exist is not a plan. So the lines below are written, not harvested, and the
 * honesty of the number depends entirely on how they were written.
 *
 * How they were written, and this is the part that makes the second number worth
 * reading: the HOLDOUT half was written FIRST, before any rule existed, as "what
 * would a Hong Kong chat actually say". The TUNING half was written after, and the
 * rule was built against it. The rule has therefore never seen the holdout, and the
 * holdout deliberately keeps the cases the tuning half is thin on: lines whose
 * Cantonese is carried by grammar rather than by a distinctive character, English
 * code-mixing, and slang made only of characters standard Chinese also uses.
 *
 * The four buckets and what each one measures:
 *   yue    recall. Cantonese vernacular, the thing we want caught.
 *   zhtw   the number that protects. Standard written Chinese in traditional
 *          characters, which is what Hong Kong writes formally and what Taiwan
 *          writes always. A hit here is a regression: those lines work today.
 *   zhcn   same, simplified. Cheaper to get right, still counted.
 *   mix    English plus Cantonese in one line, the normal register of a Hong Kong
 *          chat. Counted as recall, separately, because it is the case a
 *          character-majority rule is most likely to drop.
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// The rule, read out of the source rather than copied.
//
// A bench carrying its own copy of the thing it measures is a bench that passes
// after the source stops matching it. These two are parsed from langDetect.ts, so
// the file cannot drift away from the number printed below.
// ---------------------------------------------------------------------------
const source = readFileSync(new URL('../../src/content/langDetect.ts', import.meta.url), 'utf8');

function ruleFrom(name) {
  const m = source.match(new RegExp(`const ${name} =\\s*(/[\\s\\S]*?/[a-z]*);`));
  if (!m) throw new Error(`${name} not found in langDetect.ts`);
  // eslint-disable-next-line no-eval
  return (0, eval)(m[1]);
}

const CARACTERES_CANTONAIS = ruleFrom('CARACTERES_CANTONAIS');
const MOTS_CANTONAIS = ruleFrom('MOTS_CANTONAIS');

const isCantonese = (text) => CARACTERES_CANTONAIS.test(text) || MOTS_CANTONAIS.test(text);

// ---------------------------------------------------------------------------
// HOLDOUT. Written first, never used to build the rule. This is the number that
// counts.
// ---------------------------------------------------------------------------
const HOLDOUT = {
  yue: [
    '收皮啦你',
    '呢舖實輸架啦',
    '邊個教佢玩㗎',
    '佢個反應快到飛起',
    '唔好再送頭啦',
    '我而家先睇返',
    '講嘢細聲咗好多',
    '搞乜鬼嘢',
    '屋企人嗌我食飯',
    '得閒睇下你個channel',
    '點解要咁做',
    '呢個位好陰公',
    '我哋撐你',
    '佢真係好搞笑㗎',
    '睇到我眼瞓',
    '有冇人喺度',
    '唔使急慢慢嚟',
    '你哋兩個都癲嘅',
    '頂唔順啦',
    '咁都俾佢贏',
    '幾時再開台',
    '唔該晒老細',
    '嗰個位我試過',
    '我諗住瞓覺先',
    '好L攰',
    '佢又死咗',
    '呢啲咪就係人生囉',
    '咩事啊大佬',
    '成日都係咁',
    '唔知講乜',
    '正嘢',
    '邊度買到',
    '睇住佢玩就得',
    '冇嘢啦收工',
    '你估我唔知咩',
  ],
  zhtw: [
    '這個位置真的很好',
    '他們去哪裡了',
    '我現在真的很累',
    '為什麼不開槍',
    '誰贏了這一局',
    '這張地圖很難',
    '主播今天狀態不錯',
    '我看了一整個晚上',
    '有人在嗎',
    '請問什麼時候開台',
    '謝謝老闆',
    '他的反應非常快',
    '不要再送人頭了',
    '這樣也可以贏',
    '我覺得應該先拿資源',
    '剛剛那波操作太神了',
    '明天還會直播嗎',
    '聲音有點小',
    '畫質好像有問題',
    '恭喜達成目標',
    '晚安大家',
    '第一次看這個台',
    '這個遊戲我也有玩',
    '笑死我了',
    '真的假的',
  ],
  zhcn: [
    '这个位置真的很好',
    '他们去哪里了',
    '我现在真的很累',
    '为什么不开枪',
    '谁赢了这一局',
    '这张地图很难',
    '主播今天状态不错',
    '我看了一整个晚上',
    '有人在吗',
    '请问什么时候开播',
    '谢谢老板',
    '他的反应非常快',
    '不要再送人头了',
    '这样也可以赢',
    '声音有点小',
  ],
  mix: [
    'push 啦唔好等',
    '呢個 combo 太犀利',
    'gg 佢玩到我唔想睇',
    'stream 好卡喎',
    '個 mic 好細聲呀',
    'clutch 到癲咗',
    '唔該 mod 幫手 ban 佢',
    'chat 慢咗好多喎',
    '呢個 skin 幾靚喎',
    'nice shot 但係佢好彩啫',
    'lag 到我唔想玩',
    '你個 setup 幾錢㗎',
  ],
};

// ---------------------------------------------------------------------------
// TUNING. Written second, the rule was built against these. The number this
// produces measures the fit, not the rule.
// ---------------------------------------------------------------------------
const TUNING = {
  yue: [
    '佢哋去咗邊度呀',
    '你唔好玩啦',
    '我哋而家真係好攰',
    '呢個位好正',
    '咩事啊',
    '邊個贏咗',
    '好嘢',
    '佢玩得好差',
    '睇住佢',
    '點解唔開槍',
    '咁都得',
    '唔知點講',
    '喺邊度買',
    '有啲嘢想講',
    '佢係咪癲咗',
    '冇人理我',
    '嗰陣時好好玩',
    '嚟啦快啲',
    '唔該',
    '我睇咗成晚',
    '食飯未',
    '依家幾點',
    '傾偈啦',
    '靚仔加油',
    '佢個樣好攰',
    '嘥氣',
    '噉又係',
    '好喎',
    '知道嘞',
    '畀個機會佢',
    '我諗唔到',
    '呢度好多人',
    '點樣先贏到',
    '屋企好靜',
    '得閒傾',
  ],
  zhtw: [
    '這一局打得不錯',
    '他在做什麼',
    '我也想玩這個',
    '可以換一張地圖嗎',
    '今天觀眾好多',
    '剛剛沒看到發生什麼事',
    '主播加油',
    '這個角色很強',
    '我要去睡了',
    '大家晚安',
    '什麼時候結束',
    '真的很厲害',
    '沒有人回答我',
    '我第一次來',
    '好久不見',
    // Adversarial. Standard Chinese that happens to contain a sequence the word
    // list looks for. Chinese has no spaces, so a two-character marker can be
    // straddled by two unrelated words: 反而 + 家裡 produces 而家, 依 + 家長
    // produces 依家. These are in the protective bucket on purpose, and if the
    // rule trips on them the marker comes out.
    '反而家裡更安靜',
    '我依家長的意思去做',
    '大家一起食飯吧',
    '小羊咩咩叫',
    '這件衣服很靚麗',
    '他的家人反而更緊張',
  ],
  zhcn: [
    '这一局打得不错',
    '他在做什么',
    '我也想玩这个',
    '可以换一张地图吗',
    '今天观众好多',
    '主播加油',
    '这个角色很强',
    '我要去睡了',
    '大家晚安',
    '真的很厉害',
  ],
  mix: [
    'aim 好准喎',
    '呢個 build 得唔得',
    'ez 啦佢哋好差',
    '個 stream 好靚',
    '唔該晒 thanks',
    'gg wp 唔錯',
  ],
};

// ---------------------------------------------------------------------------

function score(bucket, lines, expectHit) {
  let hits = 0;
  const wrong = [];
  for (const line of lines) {
    const hit = isCantonese(line);
    if (hit) hits += 1;
    if (hit !== expectHit) wrong.push(line);
  }
  return { bucket, total: lines.length, hits, wrong };
}

function report(title, set) {
  console.log(`\n### ${title}`);
  const rows = [
    score('yue  (recall)', set.yue, true),
    score('mix  (recall)', set.mix, true),
    score('zhtw (must be 0)', set.zhtw, false),
    score('zhcn (must be 0)', set.zhcn, false),
  ];
  for (const r of rows) {
    const pct = ((r.hits / r.total) * 100).toFixed(0);
    console.log(`  ${r.bucket.padEnd(18)} ${String(r.hits).padStart(3)} / ${r.total}   (${pct}%)`);
  }
  const missed = [...rows[0].wrong, ...rows[1].wrong];
  const falsePos = [...rows[2].wrong, ...rows[3].wrong];
  if (missed.length) console.log(`  missed:        ${missed.join(' | ')}`);
  if (falsePos.length) console.log(`  FALSE POSITIVE: ${falsePos.join(' | ')}`);
  else console.log('  false positives: none');
  return { missed: missed.length, falsePos: falsePos.length };
}

console.log('Cantonese detection bench');
console.log('rule read from src/content/langDetect.ts');
const t = report('TUNING (measures the fit, not the rule)', TUNING);
const h = report('HOLDOUT (the number that counts)', HOLDOUT);

console.log(`
Read it this way: the holdout recall is what the rule is worth, and the holdout
false-positive count is what it costs. A false positive on zhtw or zhcn breaks a
language that works today, so that column is the one with a hard zero.`);

if (process.argv.includes('--live')) {
  // Same lines through the real engine, once as yue and once as the traditional
  // Chinese the extension picks today, so the gain is a comparison and not a claim.
  const g = async (sl, tl, q) => {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex` +
      `&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131.0' } });
    if (!r.ok) return `HTTP ${r.status}`;
    const d = JSON.parse((await r.text()).replace(/,(?=,)/g, ',null'));
    return (d[0] ?? []).map((s) => (Array.isArray(s) ? s[0] : '')).join('');
  };
  console.log('\n### live: same line, sl=yue against sl=zh-TW\n');
  for (const line of HOLDOUT.yue.slice(0, 12)) {
    const [asYue, asZh] = [await g('yue', 'en', line), await g('zh-TW', 'en', line)];
    const same = asYue === asZh ? ' (identical)' : '';
    console.log(`  ${line}`);
    console.log(`    yue   ${asYue}`);
    console.log(`    zh-TW ${asZh}${same}`);
    await new Promise((r) => setTimeout(r, 1200));
  }
}
