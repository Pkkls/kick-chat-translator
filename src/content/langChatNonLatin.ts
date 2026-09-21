/**
 * Le registre chat pour les onze langues non latines que personne n'avait mesurees.
 *
 * Test-only module, meme garde statique que les autres corpus.
 *
 * LE TROU QU'IL COMBLE. `langDetect.dix.test.ts` couvre cinq langues non latines
 * a la main, ar ja ko ru zh, parce que ce sont celles dont le produit PARLE la
 * langue. Les onze autres ecritures n'avaient aucune ligne de chat nulle part :
 * he hi th bn ta el fa yue zh-tw uk bg. Ce sont pourtant celles que le
 * pre-controle d'ecriture sert le mieux, 120 sur 120 chez Tatoeba pour la
 * plupart, et personne ne savait ce que le detecteur fait d'une ligne de chat
 * grecque, hebraique ou bengalie.
 *
 * CE QU'IL MESURE, et c'est different des trois corpus latins. Les regles qui
 * servent ces langues sont des regles d'ECRITURE, donc elles ne dependent ni du
 * lexique ni de la longueur. L'hypothese est qu'elles tiennent aussi bien sur du
 * chat que sur de la prose. Ce corpus est la pour la verifier, et surtout pour
 * attraper ce qui pourrait la faire tomber :
 *   - une ligne courte sous le plancher de deux caracteres d'ecriture ;
 *   - une ligne qui melange chiffres, pseudo latin et ecriture ;
 *   - les paires que l'ecriture seule ne separe pas, `uk` contre `bg`, `yue`
 *     contre `zh-tw`, `fa` contre `ar`.
 *
 * USAGE : corpus de MESURE. Rien n'a ete choisi en le regardant, et il vaut
 * mieux que ca reste vrai. S'il faut un jour regler dessus, en ecrire un autre,
 * meme regle qu'en section 2ter du handoff.
 *
 * Pas d'emoji ici non plus : la dilution par emoji a son propre test dans
 * `langDetect.test.ts` et melanger les deux sujets rendrait les deux illisibles.
 */
export const LANG_CHAT_NL: Record<string, readonly string[]> = {
  he: [
    'מה קורה כאן',
    'מישהו מישראל',
    'תגביר את הקול',
    'הוא משחק מעולה היום',
    'רק עכשיו הגעתי',
    'אני לא מאמין',
    'השידור נתקע',
    'כמה זמן נשאר',
    'איזה מזל רע',
    'שוב אותו דבר',
  ],
  hi: [
    'यहाँ क्या हो रहा है',
    'कोई भारत से है',
    'आवाज़ तेज़ करो',
    'आज बहुत अच्छा खेल रहा है',
    'मैं अभी आया हूँ',
    'मुझे यकीन नहीं होता',
    'स्ट्रीम रुक रही है',
    'और कितना बाकी है',
    'कितनी बदकिस्मती',
    'फिर वही बात',
  ],
  th: [
    'เกิดอะไรขึ้นที่นี่',
    'มีคนไทยไหม',
    'เพิ่มเสียงหน่อย',
    'วันนี้เล่นดีมาก',
    'เพิ่งเข้ามา',
    'ไม่อยากเชื่อเลย',
    'สตรีมกระตุก',
    'อีกนานไหม',
    'โชคร้ายจัง',
    'เหมือนเดิมอีกแล้ว',
  ],
  bn: [
    'এখানে কী হচ্ছে',
    'কেউ কি বাংলাদেশ থেকে',
    'শব্দ বাড়াও',
    'আজ খুব ভালো খেলছে',
    'এইমাত্র এলাম',
    'বিশ্বাস হচ্ছে না',
    'স্ট্রিম আটকে যাচ্ছে',
    'আর কতক্ষণ',
    'কী দুর্ভাগ্য',
    'আবার সেই একই',
  ],
  ta: [
    'இங்கே என்ன நடக்கிறது',
    'யாராவது தமிழ்நாட்டில் இருந்து',
    'ஒலியை கூட்டுங்கள்',
    'இன்று நன்றாக விளையாடுகிறார்',
    'இப்போதுதான் வந்தேன்',
    'என்னால் நம்ப முடியவில்லை',
    'ஸ்ட்ரீம் நிற்கிறது',
    'இன்னும் எவ்வளவு நேரம்',
    'என்ன துரதிர்ஷ்டம்',
    'மீண்டும் அதே',
  ],
  el: [
    'τι γίνεται εδώ',
    'κανείς από Ελλάδα',
    'ανέβασε την ένταση',
    'παίζει πολύ καλά σήμερα',
    'μόλις ήρθα',
    'δεν το πιστεύω',
    'κολλάει το στριμ',
    'πόση ώρα ακόμα',
    'τι ατυχία',
    'πάλι τα ίδια',
  ],
  fa: [
    'اینجا چه خبره',
    'کسی از ایران هست',
    'صدا رو زیاد کن',
    'امروز خیلی خوب بازی می کنه',
    'تازه اومدم',
    'باورم نمی شه',
    'استریم قطع می شه',
    'چقدر مونده',
    'چه بدشانسی',
    'بازم همون',
  ],
  yue: [
    '呢度發生咩事',
    '有冇香港人',
    '大聲啲啦',
    '今日打得好好',
    '我啱啱先入嚟',
    '我唔信',
    '串流卡住咗',
    '仲有幾耐',
    '咁黑仔嘅',
    '又係噉',
  ],
  'zh-tw': [
    '這裡發生什麼事',
    '有台灣人嗎',
    '聲音大一點',
    '今天玩得很好',
    '我剛剛才進來',
    '真的假的',
    '直播卡住了',
    '還要多久',
    '運氣真差',
    '又是一樣',
  ],
  uk: [
    'що тут відбувається',
    'хтось з України',
    'зроби гучніше',
    'сьогодні грає чудово',
    'я щойно прийшов',
    'не можу повірити',
    'стрім зависає',
    'скільки ще',
    'яке невезіння',
    'знову те саме',
  ],
  bg: [
    'какво става тук',
    'има ли някой от българия',
    'усили звука',
    'днес играе много добре',
    'току що дойдох',
    'не мога да повярвам',
    'стриймът засича',
    'колко още',
    'какъв лош късмет',
    'пак същото',
  ],
};
