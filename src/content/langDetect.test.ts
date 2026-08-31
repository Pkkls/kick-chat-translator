import { describe, expect, it } from 'vitest';
import { confidentLanguage, detectLanguage, isLikelyEnglish } from './langDetect';

describe('detectLanguage', () => {
  it('returns en for short chat tokens like lol/gg', () => {
    expect(detectLanguage('gg ez')).toBe('en');
    expect(detectLanguage('lol')).toBe('en');
  });

  it('detects French in a clear sentence', () => {
    expect(detectLanguage('Bonjour, comment ça va aujourd’hui ?')).toBe('fr');
  });

  it('detects Japanese script', () => {
    expect(detectLanguage('こんにちは、元気ですか？')).toBe('ja');
  });

  it('detects Korean script', () => {
    expect(detectLanguage('안녕하세요 만나서 반갑습니다')).toBe('ko');
  });

  it('detects Chinese (pure Han) as zh, not Japanese', () => {
    const r = detectLanguage('我们今天天气很好一起出去玩吧朋友们');
    expect(r).not.toBe('ja');
    expect(['zh', undefined]).toContain(r);
  });

  it('keeps Japanese with kana as ja', () => {
    expect(detectLanguage('これはテストです')).toBe('ja');
  });

  it('identifies short foreign chat words instead of calling them English', () => {
    expect(detectLanguage('hola')).toBe('es');
    expect(detectLanguage('gracias')).toBe('es');
    expect(detectLanguage('merci')).toBe('fr');
    expect(detectLanguage('danke')).toBe('de');
    expect(detectLanguage('grazie')).toBe('it');
    expect(detectLanguage('obrigado')).toBe('pt');
    expect(detectLanguage('tamam')).toBe('tr');
  });

  it('stays unsure when short words disagree rather than guessing', () => {
    expect(detectLanguage('merci danke')).not.toBe('fr');
    expect(detectLanguage('merci danke')).not.toBe('de');
  });

  it('still resolves a short message mixing English filler with a foreign word', () => {
    expect(detectLanguage('ok merci')).toBe('fr');
  });

  it('leaves long messages to franc', () => {
    expect(detectLanguage('hello, how are you doing today my friend')).toBe('en');
  });

  it('falls back to English only for ASCII-only text franc cannot place', () => {
    expect(detectLanguage('...!!')).toBe('en');
    expect(detectLanguage('9 9 9')).toBe('en');
    // Same fallback, non-ASCII input: must not be claimed as English.
    expect(detectLanguage('日本')).toBeUndefined();
  });

  it('returns undefined or en for empty/very ambiguous inputs', () => {
    const r = detectLanguage('xx');
    expect([undefined, 'en']).toContain(r);
  });
});

describe('isLikelyEnglish', () => {
  it('flags clear English', () => {
    expect(isLikelyEnglish('hello, how are you doing today my friend')).toBe(true);
  });
  it('does not flag clear Japanese', () => {
    expect(isLikelyEnglish('今日は良い天気ですね')).toBe(false);
  });
});

// Korean chat writes laughter and short replies with bare jamo. They live in a
// different Unicode block from syllables, so counting only syllables let two
// jamo cancel out two syllables and drop the line below the majority threshold.
describe('bare Korean letters count as Korean', () => {
  it.each(['시발 ㅋㅋ', 'ㅇㅇ 안녕', 'ㅠㅠ 진짜'])('reads %s off its writing system', (line) => {
    expect(confidentLanguage(line)).toBe('ko');
  });

  it('leaves a Latin line to the guesser', () => {
    expect(confidentLanguage('Ese que te dijo eso es ateo')).toBeUndefined();
  });

  it('still reads Japanese off its writing system', () => {
    expect(confidentLanguage('これはテストメッセージです')).toBe('ja');
  });
});

describe('les langues proposees que rien ne detectait', () => {
  // Deux des 42 langues du produit rentraient en "langue inconnue" et le
  // pipeline ecartait le message. Mesure avant correction, sur une phrase
  // complete de chaque : malais, franc rend `zlm` et la table ne connaissait que
  // `msa` et `zsm`, donc undefined ; hebreu, franc-min ne le couvre pas du tout
  // et rend `und`, et le pre-controle par ecriture n'avait pas sa plage alors
  // qu'il a celle de l'arabe.
  it('detecte le malais, dont franc emet le code zlm', () => {
    expect(detectLanguage('selamat petang semua apa khabar hari ini di siaran ini')).toBe('ms');
  });

  it('detecte l hebreu par son ecriture, que franc-min ne couvre pas', () => {
    expect(detectLanguage('ערב טוב לכולם מה שלומכם היום בשידור החי הזה')).toBe('he');
  });

  // Le temoin de la plage : le bloc hebreu s'arrete a U+05FF, l'arabe commence a
  // U+0600. Elargir l'un jusqu'a manger l'autre passerait les deux tests
  // ci-dessus et casserait celui-ci.
  it('ne prend pas l arabe pour de l hebreu', () => {
    expect(detectLanguage('مساء الخير للجميع كيف حالكم اليوم في هذا البث')).toBe('ar');
  });
});

describe('l arabizi dans la detection ordinaire', () => {
  // La fonction `isArabizi` a sa propre batterie. Ce bloc teste la REPARATION,
  // qui est autre chose : sans lui, retirer le cablage de langDetect ne cassait
  // aucun test, et une regle qu on peut retirer sans rien casser ne sert a rien.
  it('rend ar pour un message ecrit en lettres latines', () => {
    expect(detectLanguage('ya 3ammi shu hal 7aki')).toBe('ar');
    expect(detectLanguage('kifak ya 7abibi kif el 7al')).toBe('ar');
  });

  // Le point qui compte : `confidentLanguage` alimente le `sl` envoye au moteur,
  // et annoncer l arabe sur du texte latin n a pas ete mesure. L arabizi doit
  // donc rester en dehors de la reponse sure, pour que le moteur continue de
  // deviner seul.
  it('ne devient pas une langue source sure, le moteur garde la main', () => {
    expect(confidentLanguage('ya 3ammi shu hal 7aki')).toBeUndefined();
  });

  it('ne touche pas au texte latin ordinaire', () => {
    expect(detectLanguage('hola amigos como estan todos')).toBe('es');
    expect(detectLanguage('c9 andy')).not.toBe('ar');
    expect(detectLanguage('that was gr8')).not.toBe('ar');
  });
});

// L'ecriture arabe n'est pas une langue. Mesure avant correction : douze lignes
// persanes sur douze rendues `ar`, et rendues comme langue source SURE, donc
// envoyees au moteur en `sl=ar`. Le persan est une des 42 langues proposees et
// la fiche des stores vend le sens droite-a-gauche par "arabe, hebreu, persan".
describe('l ecriture arabe se partage entre plusieurs langues', () => {
  it('lit le persan a ses lettres propres', () => {
    expect(detectLanguage('چه خبر')).toBe('fa');
    expect(detectLanguage('این بازی خیلی سخته')).toBe('fa');
    expect(confidentLanguage('ممنون از استریم')).toBe('fa');
  });

  // Le temoin de frontiere : l'arabe ne doit rien perdre. Aucune de ces lignes
  // ne porte de lettre persane, et douze sur douze restent `ar` a la mesure.
  it('ne prend pas l arabe pour du persan', () => {
    expect(detectLanguage('ما هذا يا رجل')).toBe('ar');
    expect(detectLanguage('شكرا على الاشتراك')).toBe('ar');
    expect(confidentLanguage('مساء الخير للجميع')).toBe('ar');
  });

  // L'ourdou porte les lettres persanes PLUS les siennes, donc il se teste en
  // premier. Il n'est pas dans les 42 langues du produit : ce qui compte est
  // qu'il cesse d'etre annonce comme arabe, pas qu'il recoive un code.
  it('n annonce pas l ourdou comme de l arabe', () => {
    expect(detectLanguage('یہ کیا ہو رہا ہے')).not.toBe('ar');
    expect(detectLanguage('بہت اچھا کھیل')).not.toBe('ar');
  });

  // La limite, ecrite plutot que cachee : une ligne persane qui n'emploie que
  // des lettres du jeu arabe reste indiscernable. Une sur douze a la mesure.
  it('rend arabe une ligne persane sans lettre persane, et c est la limite', () => {
    expect(detectLanguage('سلام به همه')).toBe('ar');
  });
});

// Le pre-controle par ecriture est le seul mecanisme qui sert ar, ja, ko, ru et
// zh, soit cinq des dix langues que le produit parle. Il decidait a la majorite
// de TOUT le non-ASCII, emoji compris, et un emoji ne nourrit aucune ecriture.
describe('un emoji ne dilue pas l ecriture d une ligne', () => {
  // Mesure avant correction : "да" plus deux emoji tombait a 2 sur 4, donc pas
  // de majorite stricte, donc undefined ; "رائع" plus quatre emoji tombait pareil
  // et franc reprenait la main pour repondre PERSAN sur de l'arabe. Rendre son
  // ancien denominateur a `detectByScript` rend ces deux lignes rouges.
  it('lit une ligne courte noyee sous les emoji', () => {
    expect(detectLanguage('да 😂😂')).toBe('ru');
    expect(detectLanguage('やばい 😂😂😂😂')).toBe('ja');
    expect(detectLanguage('대박 😂😂😂😂')).toBe('ko');
    expect(detectLanguage('رائع 😂😂😂😂')).toBe('ar');
  });

  // Le plancher de deux caracteres d'ecriture reste, et voici ce qu'il paie.
  // Mesure a un caractere : "Amazing play" ecrit avec un A cyrillique devient
  // russe, et "so good" avec un o cyrillique aussi. L'homoglyphe est du
  // quotidien dans un chat. Le prix accepte en face est juste en dessous.
  it('ne laisse pas un seul caractere etranger voler une ligne latine', () => {
    expect(detectLanguage('Аmazing play')).not.toBe('ru');
    expect(detectLanguage('sо good')).not.toBe('ru');
  });

  it('et paie ce plancher par le message CJK d un seul caractere', () => {
    expect(detectLanguage('は')).toBeUndefined();
    expect(detectLanguage('네')).toBeUndefined();
  });
});

describe('la portee de la table de mots courts s arrete a 20 caracteres', () => {
  // Ce test est le temoin d'une mesure, pas d'une intuition. Monter
  // SHORT_TEXT_MAX a 30 fait gagner deux lignes etrangeres sur treize et coute
  // le message qui change de langue : sur huit lignes melangees, les lignes
  // tuees avant l'appel passent de 3 a 6 et les `sl` declares sur une seule
  // moitie de 0 a 4. Ces deux-la sont a 25 et 21 caracteres : un seul mot
  // etranger dans une phrase anglaise, ce que le vote a l'unanimite ne peut pas
  // voir puisque l'anglais n'est pas dans la table.
  //
  // Le `sl` est ce qui rend le cas grave : "merci bro that was insane" partirait
  // au moteur en `sl=fr` et disparaitrait pour un lecteur francophone.
  it('ne declare pas une langue sure sur un seul mot etranger', () => {
    expect(confidentLanguage('merci bro that was insane')).toBeUndefined();
    expect(confidentLanguage('tamam kanka good game')).toBeUndefined();
  });
});

describe('les langues romanisees dans la detection ordinaire', () => {
  // La fonction a sa propre batterie. Ce bloc teste la REPARATION, sans quoi
  // retirer le cablage ne casserait rien, et une regle qu on peut retirer sans
  // rien casser ne sert a rien.
  it('rend la langue au lieu d une devinette latine', () => {
    // Avant : id pour le russe, rien pour le grec et le japonais.
    expect(detectLanguage('privet kak dela segodnya')).toBe('ru');
    expect(detectLanguage('ti kaneis re file einai kalo')).toBe('el');
    expect(detectLanguage('konnichiwa minna genki desu ka')).toBe('ja');
  });

  it('ne devient pas une langue source sure, le moteur garde la main', () => {
    expect(confidentLanguage('privet kak dela segodnya')).toBeUndefined();
  });
});
