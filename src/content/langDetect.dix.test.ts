import { describe, expect, it } from 'vitest';
import { confidentLanguage, detectLanguage } from './langDetect';

/**
 * Le banc des cinq langues majoritaires qui ne s'ecrivent pas en latin.
 *
 * Le produit traduit vers 42 langues et il en PARLE dix : son interface et sa
 * fiche de stores existent en en, ar, es, fr, ja, ko, pt, ru, tr et zh. Le banc
 * de detection construit une passe plus tot en couvrait cinq, et les cinq
 * absentes etaient exactement les non latines, si bien que tous les chiffres
 * publies sur la detection etaient des chiffres latins.
 *
 * Ce fichier est ici et pas dans un scratchpad ignore par git parce que c'est
 * exactement ce qui est arrive a la grille des 41 cas : mesuree, jamais
 * commitee, perdue, puis remesuree. Un fichier de tests ne pese rien dans le
 * bundle livre, `audit-poids` le verifie a chaque passe.
 *
 * La moitie non latine est decidee par l'ECRITURE et pas par franc, donc elle se
 * tient a un plancher net : vingt-cinq sur vingt-cinq. La moitie latine, decidee
 * par franc, vaut entre 1 sur 4 et 4 sur 5 selon la langue, et un plancher y
 * serait du bruit ; elle est couverte cas par cas dans `langDetect.test.ts`.
 */
const BANC: Record<string, string[]> = {
  ar: [
    'ما هذا يا رجل',
    'لعب رائع اليوم',
    'لا أصدق ما حدث',
    'من يشاهد الآن',
    'هذا البث ممتع جدا',
    'يا سلام على هذه اللقطة',
    'أخيرا فاز',
    'الصوت منخفض جدا',
    'هل يوجد أحد هنا',
    'ضحكت كثيرا',
    'هذا أفضل بث اليوم',
    'متى يبدأ اللعب',
    'لا أفهم شيئا',
    'عاش يا بطل',
    'الخريطة صعبة جدا',
    'شكرا على الاشتراك',
    'ماذا يحدث هنا',
    'هيا يمكنك الفوز',
    'ما هذا',
    'رائع',
    'أحسنت',
    'مين هنا',
    'الله يعطيك العافية',
    'من أي بلد أنت',
    'لم أر شيئا مثل هذا',
  ],
  ja: [
    'これはやばい',
    '今日も配信ありがとう',
    'うますぎるでしょ',
    '何が起きたの',
    '誰か見てる',
    '音が小さいです',
    '初見です よろしく',
    'さすがだね',
    'それは無理だろ',
    '面白すぎる',
    'がんばれー',
    '今のプレイすごい',
    'もう一回見たい',
    '日本語わかる人いる',
    'お疲れ様でした',
    'マジで',
    'かわいい',
    'なるほどね',
    '待ってた',
    'これは勝てる',
    '配信画面が固まってる',
    'どこの国の人',
    '全然見えない',
    'ありがとうございます',
    '本当にすごかった',
  ],
  ko: [
    '이거 진짜 대박이다',
    '오늘도 방송 감사합니다',
    '방금 뭐야',
    '소리가 너무 작아요',
    '누구 보고 있어요',
    '진짜 잘한다',
    '이해가 안 되네',
    '처음 왔어요',
    '화면 멈췄어요',
    '대박 클립이다',
    '형 화이팅',
    '한국 사람 있어요',
    '너무 웃겨요',
    '다시 보고 싶다',
    '수고하셨습니다',
    '진짜요',
    '개웃김',
    '아 진짜',
    'ㅇㅇ 맞아요',
    '이번 판 이기자',
    '어디 사세요',
    '잘 안 보여요',
    '감사합니다',
    '시작했어요',
    '와 이거 진짜 미쳤다',
  ],
  ru: [
    'что тут происходит',
    'спасибо за стрим',
    'он играет очень плохо',
    'кто нибудь видел это',
    'звук очень тихий',
    'я тут первый раз',
    'это невозможно',
    'давай ты сможешь',
    'очень смешно',
    'хочу ещё раз посмотреть',
    'кто из России',
    'не вижу ничего',
    'экран завис',
    'отличная игра',
    'серьёзно',
    'ага понятно',
    'спасибо большое',
    'когда начнётся',
    'лучший стрим сегодня',
    'это было круто',
    'ничего не понял',
    'молодец',
    'так держать',
    'давайте выиграем',
    'я смотрю уже час',
  ],
};

describe('les cinq langues majoritaires que l ecriture decide', () => {
  it.each(Object.keys(BANC))('lit %s sur vingt-cinq lignes de chat', (langue) => {
    const lignes = BANC[langue]!;
    expect(lignes).toHaveLength(25);
    const rates = lignes.filter((t) => detectLanguage(t) !== langue);
    expect(rates).toEqual([]);
  });

  // Ces quatre-la sortent d'une table, donc elles partent au moteur comme langue
  // source. C'est ce qui les separe du chinois juste en dessous.
  it.each(Object.keys(BANC))('declare %s comme langue source sure', (langue) => {
    const lignes = BANC[langue]!;
    const sansSl = lignes.filter((t) => confidentLanguage(t) !== langue);
    expect(sansSl).toEqual([]);
  });
});

/**
 * Le chinois est a part, et volontairement.
 *
 * `detectByScript` renvoie le han pur a franc plutot que de trancher, parce que
 * du han sans kana peut etre japonais. Consequence mesuree : 24 lignes sur 25
 * sont identifiees zh, et ZERO ne devient une langue source sure, la reponse
 * venant de franc et non d'une table. Les quatre langues ci-dessus sont a 25 sur
 * 25 sur les deux. L'asymetrie est une decision, ce test est la pour qu'elle
 * reste visible si quelqu'un touche a la regle du han.
 */
const CHINOIS = [
  '这是什么情况',
  '谢谢主播',
  '打得太好了',
  '有人在看吗',
  '声音太小了',
  '我第一次来',
  '这不可能吧',
  '太搞笑了',
  '想再看一遍',
  '中国人有吗',
  '画面卡住了',
  '加油你可以的',
  '今天玩得不错',
  '什么时候开始',
  '完全看不懂',
  '真的假的',
  '太厉害了',
  '我也这么觉得',
  '这局能赢',
  '你是哪里人',
  '谢谢分享',
  '好久不见',
  '别走啊',
  '我已经看了一个小时了',
];

describe('le chinois passe par franc, pas par la table', () => {
  it('est identifie sur chaque ligne', () => {
    expect(CHINOIS.filter((t) => detectLanguage(t) !== 'zh')).toEqual([]);
  });

  it('mais ne devient jamais une langue source sure', () => {
    expect(CHINOIS.filter((t) => confidentLanguage(t) !== undefined)).toEqual([]);
  });

  // Le prix du renvoi a franc : sous trois caracteres han, plus personne ne
  // repond. Deux caracteres est une phrase entiere en chinois.
  it('et se tait sous trois caracteres', () => {
    expect(detectLanguage('稳了')).toBeUndefined();
  });
});
