/**
 * Transliteration guard — detects when a translation provider returned a
 * phonetic transliteration instead of a semantic translation, and provides
 * instant overrides for common expressions.
 *
 * Problem: "bonjour" (FR) targeted to JA returns "ボンジュール" (katakana
 * phonetic spelling) instead of "こんにちは" (semantic: "hello").  This is a
 * known limitation of ALL MT engines on short, single-word inputs for distant
 * language pairs (Latin script -> CJK / Arabic / Cyrillic).
 *
 * Three-layer defense:
 * 1. **Override dictionary** — instant, zero-network lookup for ~50 common
 *    chat greetings/expressions across 6 target scripts.
 * 2. **Transliteration detection** — post-translation check; when detected,
 *    the translator chain skips to the next provider (different engines
 *    handle edge cases differently).
 * 3. **Context enhancement** — for DeepL, injects a disambiguation hint in
 *    the free `context` parameter on short inputs.
 */

// ─── Detection ──────────────────────────────────────────────────────────────

const NON_LATIN_TARGETS = new Set([
  'ja', 'zh', 'zh-tw', 'ko', 'ar', 'ru', 'th', 'hi',
]);

function isLatinInput(text: string): boolean {
  const stripped = text.replace(/[\s\p{P}\p{S}\d]/gu, '');
  if (stripped.length === 0) return false;
  // Basic Latin + Latin Extended-A/B + Latin Extended Additional
  return /^[A-zÀ-ɏḀ-ỿ]+$/u.test(stripped);
}

function katakanaRatio(text: string): number {
  const stripped = text.replace(/[\s\p{P}\p{S}]/gu, '');
  if (stripped.length === 0) return 0;
  let katakana = 0;
  for (const ch of stripped) {
    const c = ch.codePointAt(0)!;
    // Katakana (30A0-30FF), Katakana Phonetic Ext (31F0-31FF),
    // Half-width Katakana (FF65-FF9F)
    if (
      (c >= 0x30a0 && c <= 0x30ff) ||
      (c >= 0x31f0 && c <= 0x31ff) ||
      (c >= 0xff65 && c <= 0xff9f)
    ) {
      katakana++;
    }
  }
  return katakana / stripped.length;
}

/**
 * Returns true when the output is likely a phonetic transliteration of the
 * Latin-script input rather than a semantic translation.
 *
 * Current coverage:
 * - **Japanese**: pure katakana output for Latin input (very reliable).
 * - Other non-Latin targets are harder to detect and left to the override
 *   dictionary + provider cascade.
 */
export function isTransliteration(
  input: string,
  output: string,
  targetLang: string,
): boolean {
  const target = targetLang.toLowerCase();
  if (!NON_LATIN_TARGETS.has(target)) return false;
  if (!isLatinInput(input)) return false;

  // Short input heuristic: transliteration is almost exclusively a short-input
  // problem. For inputs > 6 words the provider almost always translates
  // semantically, and we'd risk false positives on legitimate katakana loanwords.
  const wordCount = input.trim().split(/\s+/).length;
  if (wordCount > 4) return false;

  if (target === 'ja') {
    // Pure katakana (> 80%) = transliteration.  A real translation would
    // contain kanji and/or hiragana.
    return katakanaRatio(output) > 0.8;
  }

  return false;
}

// ─── Semantic override dictionary ───────────────────────────────────────────
// Common chat greetings and expressions that providers consistently
// transliterate instead of translating on distant language pairs.
//
// Maintained by hand — only add entries that are CONFIRMED to fail on at
// least one major provider (Google, DeepL).  Each value is the natural
// chat-register translation, not the formal/dictionary form.

/* eslint-disable @typescript-eslint/naming-convention */
const OVERRIDES: Record<string, Record<string, string>> = {
  // ── French ────────────────────────────────────────────────────────────────
  'bonjour':          { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'bonsoir':          { ja: 'こんばんは', zh: '晚上好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый вечер', th: 'สวัสดีตอนเย็น', hi: 'शुभ संध्या' },
  'salut':            { ja: 'やあ', zh: '嗨', ko: '안녕', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'coucou':           { ja: 'やっほー', zh: '嘿', ko: '안녕', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'merci':            { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'au revoir':        { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'bonne nuit':       { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'oui':              { ja: 'はい', zh: '是', ko: '네', ar: 'نعم', ru: 'Да', th: 'ใช่', hi: 'हां' },
  'non':              { ja: 'いいえ', zh: '不', ko: '아니요', ar: 'لا', ru: 'Нет', th: 'ไม่', hi: 'नहीं' },
  "d'accord":         { ja: 'わかった', zh: '好的', ko: '알겠어', ar: 'حسنا', ru: 'Ладно', th: 'ตกลง', hi: 'ठीक है' },
  'bien joue':        { ja: 'お見事', zh: '干得好', ko: '잘했어', ar: 'أحسنت', ru: 'Отлично сыграно', th: 'เล่นดีมาก', hi: 'बहुत अच्छा' },
  'bien sur':         { ja: 'もちろん', zh: '当然', ko: '물론이지', ar: 'بالطبع', ru: 'Конечно', th: 'แน่นอน', hi: 'बिल्कुल' },
  'pas mal':          { ja: '悪くない', zh: '不错', ko: '괜찮네', ar: 'ليس سيئا', ru: 'Неплохо', th: 'ไม่เลว', hi: 'बुरा नहीं' },
  'bravo':            { ja: 'すごい', zh: '太棒了', ko: '대단해', ar: 'أحسنت', ru: 'Браво', th: 'เก่งมาก', hi: 'शाबाश' },
  'genial':           { ja: 'すごい', zh: '太好了', ko: '대박', ar: 'رائع', ru: 'Отлично', th: 'เยี่ยม', hi: 'बढ़िया' },
  'bisous':           { ja: 'チュッ', zh: '亲亲', ko: '뽀뽀', ar: 'بوسة', ru: 'Целую', th: 'จุ๊บ', hi: 'प्यार' },
  'allez':            { ja: 'がんばれ', zh: '加油', ko: '파이팅', ar: 'يلا', ru: 'Давай', th: 'สู้ๆ', hi: 'चलो' },
  'je rigole':        { ja: '冗談だよ', zh: '我开玩笑的', ko: '농담이야', ar: 'أمزح', ru: 'Я шучу', th: 'ล้อเล่น', hi: 'मजाक कर रहा हूं' },

  // ── Spanish ───────────────────────────────────────────────────────────────
  'hola':             { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'gracias':          { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'adios':            { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'buenos dias':      { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'buenas noches':    { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'buenas tardes':    { ja: 'こんにちは', zh: '下午好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый день', th: 'สวัสดีตอนบ่าย', hi: 'शुभ दोपहर' },
  'por favor':        { ja: 'お願いします', zh: '拜托', ko: '부탁해요', ar: 'من فضلك', ru: 'Пожалуйста', th: 'ได้โปรด', hi: 'कृपया' },
  'de nada':          { ja: 'どういたしまして', zh: '不客气', ko: '천만에요', ar: 'على الرحب والسعة', ru: 'Не за что', th: 'ไม่เป็นไร', hi: 'कोई बात नहीं' },
  'lo siento':        { ja: 'ごめんなさい', zh: '对不起', ko: '미안해요', ar: 'آسف', ru: 'Извините', th: 'ขอโทษ', hi: 'माफ़ कीजिए' },
  'vamos':            { ja: '行こう', zh: '走吧', ko: '가자', ar: 'هيا بنا', ru: 'Пойдём', th: 'ไปกันเถอะ', hi: 'चलो' },

  // ── English ───────────────────────────────────────────────────────────────
  'hello':            { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'goodbye':          { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'bye':              { ja: 'さようなら', zh: '再见', ko: '안녕', ar: 'مع السلامة', ru: 'Пока', th: 'บาย', hi: 'अलविदा' },
  'thanks':           { ja: 'ありがとう', zh: '谢谢', ko: '고마워', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'thank you':        { ja: 'ありがとうございます', zh: '谢谢你', ko: '감사합니다', ar: 'شكرا لك', ru: 'Спасибо', th: 'ขอบคุณครับ', hi: 'धन्यवाद' },
  'please':           { ja: 'お願いします', zh: '拜托', ko: '부탁해요', ar: 'من فضلك', ru: 'Пожалуйста', th: 'ได้โปรด', hi: 'कृपया' },
  'sorry':            { ja: 'ごめんなさい', zh: '对不起', ko: '미안해요', ar: 'آسف', ru: 'Извините', th: 'ขอโทษ', hi: 'माफ़ कीजिए' },
  'good morning':     { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'good night':       { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'good evening':     { ja: 'こんばんは', zh: '晚上好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый вечер', th: 'สวัสดีตอนเย็น', hi: 'शुभ संध्या' },
  'welcome':          { ja: 'ようこそ', zh: '欢迎', ko: '환영합니다', ar: 'مرحبا بك', ru: 'Добро пожаловать', th: 'ยินดีต้อนรับ', hi: 'स्वागत है' },
  'congratulations':  { ja: 'おめでとうございます', zh: '恭喜', ko: '축하합니다', ar: 'تهانينا', ru: 'Поздравляю', th: 'ยินดีด้วย', hi: 'बधाई हो' },
  'good luck':        { ja: '頑張って', zh: '祝你好运', ko: '행운을 빌어요', ar: 'حظا سعيدا', ru: 'Удачи', th: 'โชคดี', hi: 'शुभकामनाएं' },
  'have fun':         { ja: '楽しんで', zh: '玩得开心', ko: '즐겨', ar: 'استمتع', ru: 'Веселись', th: 'สนุกนะ', hi: 'मज़े करो' },
  'well played':      { ja: 'お見事', zh: '打得好', ko: '잘했어', ar: 'أحسنت', ru: 'Отлично сыграно', th: 'เล่นดีมาก', hi: 'बहुत अच्छा' },
  'good game':        { ja: 'いい試合だった', zh: '打得好', ko: '좋은 게임이었어', ar: 'لعبة جيدة', ru: 'Хорошая игра', th: 'เกมดีมาก', hi: 'अच्छा खेल' },
  'lets go':          { ja: '行くぞ', zh: '走吧', ko: '가자', ar: 'هيا بنا', ru: 'Погнали', th: 'ไปกันเถอะ', hi: 'चलो' },
  "let's go":         { ja: '行くぞ', zh: '走吧', ko: '가자', ar: 'هيا بنا', ru: 'Погнали', th: 'ไปกันเถอะ', hi: 'चलो' },
  'come on':          { ja: '頑張れ', zh: '加油', ko: '파이팅', ar: 'هيا', ru: 'Давай', th: 'สู้ๆ', hi: 'चलो' },

  // ── Portuguese ────────────────────────────────────────────────────────────
  'obrigado':         { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'obrigada':         { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'tchau':            { ja: 'さようなら', zh: '再见', ko: '안녕', ar: 'مع السلامة', ru: 'Пока', th: 'บาย', hi: 'अलविदा' },
  'bom dia':          { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'boa noite':        { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'boa tarde':        { ja: 'こんにちは', zh: '下午好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый день', th: 'สวัสดีตอนบ่าย', hi: 'शुभ दोपहर' },
  'valeu':            { ja: 'ありがとう', zh: '谢啦', ko: '고마워', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'fala':             { ja: 'やあ', zh: '嗨', ko: '안녕', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },

  // ── German ────────────────────────────────────────────────────────────────
  'danke':            { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'hallo':            { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'guten morgen':     { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'guten abend':      { ja: 'こんばんは', zh: '晚上好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый вечер', th: 'สวัสดีตอนเย็น', hi: 'शुभ संध्या' },
  'gute nacht':       { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'bitte':            { ja: 'お願いします', zh: '拜托', ko: '부탁해요', ar: 'من فضلك', ru: 'Пожалуйста', th: 'ได้โปรด', hi: 'कृपया' },
  'auf wiedersehen':  { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'tschuss':          { ja: 'さようなら', zh: '再见', ko: '안녕', ar: 'مع السلامة', ru: 'Пока', th: 'บาย', hi: 'अलविदा' },
  'gut gemacht':      { ja: 'よくやった', zh: '干得好', ko: '잘했어', ar: 'أحسنت', ru: 'Молодец', th: 'ทำได้ดีมาก', hi: 'बहुत अच्छा' },

  // ── Italian ───────────────────────────────────────────────────────────────
  'ciao':             { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'grazie':           { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'arrivederci':      { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'buongiorno':       { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'buonasera':        { ja: 'こんばんは', zh: '晚上好', ko: '안녕하세요', ar: 'مساء الخير', ru: 'Добрый вечер', th: 'สวัสดีตอนเย็น', hi: 'शुभ संध्या' },
  'buonanotte':       { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },
  'prego':            { ja: 'どういたしまして', zh: '不客气', ko: '천만에요', ar: 'على الرحب والسعة', ru: 'Не за что', th: 'ไม่เป็นไร', hi: 'कोई बात नहीं' },
  'scusa':            { ja: 'ごめん', zh: '对不起', ko: '미안해', ar: 'آسف', ru: 'Извини', th: 'ขอโทษ', hi: 'माफ़ कीजिए' },
  'forza':            { ja: 'がんばれ', zh: '加油', ko: '파이팅', ar: 'هيا', ru: 'Давай', th: 'สู้ๆ', hi: 'चलो' },

  // ── Turkish ───────────────────────────────────────────────────────────────
  'merhaba':          { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'tesekkurler':      { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'hosgeldiniz':      { ja: 'ようこそ', zh: '欢迎', ko: '환영합니다', ar: 'مرحبا بك', ru: 'Добро пожаловать', th: 'ยินดีต้อนรับ', hi: 'स्वागत है' },
  'iyi geceler':      { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },

  // ── Dutch ─────────────────────────────────────────────────────────────────
  'bedankt':          { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'goedemorgen':      { ja: 'おはようございます', zh: '早上好', ko: '좋은 아침이에요', ar: 'صباح الخير', ru: 'Доброе утро', th: 'สวัสดีตอนเช้า', hi: 'सुप्रभात' },
  'goedenacht':       { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },

  // ── Polish ────────────────────────────────────────────────────────────────
  'dziekuje':         { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'czesc':            { ja: 'やあ', zh: '嗨', ko: '안녕', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'dobranoc':         { ja: 'おやすみなさい', zh: '晚安', ko: '잘 자요', ar: 'تصبح على خير', ru: 'Спокойной ночи', th: 'ราตรีสวัสดิ์', hi: 'शुभ रात्रि' },

  // ── Common romanized greetings (non-Latin origin, typed in Latin) ────────
  'konnichiwa':       { ja: 'こんにちは', zh: '你好', ko: '안녕하세요', ar: 'مرحبا', ru: 'Привет', th: 'สวัสดี', hi: 'नमस्ते' },
  'sayonara':         { ja: 'さようなら', zh: '再见', ko: '안녕히 가세요', ar: 'مع السلامة', ru: 'До свидания', th: 'ลาก่อน', hi: 'अलविदा' },
  'arigatou':         { ja: 'ありがとう', zh: '谢谢', ko: '감사합니다', ar: 'شكرا', ru: 'Спасибо', th: 'ขอบคุณ', hi: 'धन्यवाद' },
  'ganbatte':         { ja: '頑張って', zh: '加油', ko: '파이팅', ar: 'حظا سعيدا', ru: 'Удачи', th: 'สู้ๆ', hi: 'शुभकामनाएं' },
  'kawaii':           { ja: 'かわいい', zh: '可爱', ko: '귀여워', ar: 'جميل', ru: 'Милый', th: 'น่ารัก', hi: 'प्यारा' },
  'sugoi':            { ja: 'すごい', zh: '厉害', ko: '대단해', ar: 'رائع', ru: 'Круто', th: 'เจ๋ง', hi: 'बहुत अच्छा' },
  'umai':             { ja: 'うまい', zh: '厉害', ko: '잘한다', ar: 'ممتاز', ru: 'Круто', th: 'เก่ง', hi: 'अच्छा' },
  'yatta':            { ja: 'やった', zh: '太好了', ko: '해냈다', ar: 'نجحت', ru: 'Ура', th: 'สำเร็จ', hi: 'कर दिखाया' },

  // ── Chat / gaming ──────────────────────────────────────────────────────────
  'gg wp':            { ja: 'お疲れ様', zh: '打得好', ko: '수고했어', ar: 'لعبة جيدة', ru: 'Хорошая игра', th: 'เล่นดีมาก', hi: 'बहुत अच्छा' },
  'nice shot':        { ja: 'ナイスショット', zh: '好球', ko: '나이스 샷', ar: 'رمية جيدة', ru: 'Отличный удар', th: 'ยิงเก่ง', hi: 'अच्छा शॉट' },
  'well done':        { ja: 'よくやった', zh: '干得好', ko: '잘했어', ar: 'أحسنت', ru: 'Молодец', th: 'ทำได้ดี', hi: 'बहुत अच्छा' },
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Normalize an input string for override lookup: lowercase, strip accents,
 * collapse whitespace.
 */
function normalizeForLookup(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Strip common accents so "merci" matches "mercì" etc.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Look up a semantic override for a short expression that providers are
 * known to transliterate.  Returns the correct translation or undefined.
 *
 * Tries the full target code first ('zh-tw'), then the base code ('zh').
 */
export function getSemanticOverride(
  text: string,
  targetLang: string,
): string | undefined {
  const key = normalizeForLookup(text);
  const target = targetLang.toLowerCase();
  const base = target.split('-')[0] ?? target;
  return OVERRIDES[key]?.[target] ?? OVERRIDES[key]?.[base];
}

// ─── Context enhancement ────────────────────────────────────────────────────

/**
 * Returns an enhanced context string for DeepL when the input is short
 * (1-3 words) and targeting a non-Latin language.  The hint nudges DeepL
 * toward semantic translation.  DeepL's `context` parameter is free — it
 * is not billed and does not consume quota.
 */
export function enhanceContextForShortInput(
  text: string,
  targetLang: string,
  existingContext?: string,
): string | undefined {
  if (!NON_LATIN_TARGETS.has(targetLang.toLowerCase())) return existingContext;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 3) return existingContext;

  const hint =
    'This is a live chat message. Translate the meaning into the target language. ' +
    'Do not transliterate phonetically into katakana, hangul, or any phonetic script.';
  return existingContext ? `${existingContext}\n${hint}` : hint;
}
