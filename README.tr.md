<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Kick için canlı sohbet çevirici. Herhangi bir yayının sohbetini kendi dilinde oku, kanalın dilinde yanıt ver.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome kullanıcıları](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=kullan%C4%B1c%C4%B1lar&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [中文](README.zh-CN.md) · [Čeština](README.cs.md)

<img src="screenshots/demo.gif" alt="İspanyolca sohbet mesajları tek tek geliyor, her birinin altında İngilizce çevirisi var; sonra İngilizce bir yanıt yazılıyor, sohbet kutusunun üstünde İspanyolca bir önizleme beliriyor ve Tab onu yerine geçiriyor" width="360">

[Gerçek bir sohbette izle](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## Ne yapar

Sohbeti okumadığın bir dilde akan bir Kick yayını aç. Her mesaj, geldiği anda, hemen altında çevirisini alır;
canlı yayınlarda da VOD tekrarlarında da. Bir yanıt yaz, sohbet kutusunun üstünde kanalın dilinde bir önizleme
belirir: Tab'a bas ya da önizlemeye tıkla, o sürüm yazdığının yerine geçer.

Ayarlanacak bir şey yok. Gelen sohbet tarayıcının diline çevrilir, yazdıkların da kanalın yayın diline gider,
bu bilgi doğrudan Kick'ten okunur. İkisi de ayarlardan değiştirilebilir.

- Sağdan sola yazılanlar (Arapça, İbranice, Farsça) ve bölgesel varyantlar (Brezilya Portekizcesi,
  Geleneksel Çince, Kantonca) dahil 43 dil
- Kutudan çıktığı gibi Google, anahtar yok, hesap yok. Daha iyi kalite için kendi ücretsiz DeepL anahtarın,
  yedek olarak MyMemory ve Lingva
- Tarayıcı sunuyorsa Chrome ve Edge'de cihaz üzerinde çeviri: 1,6 sn yerine 22 ms, ve metin makineni hiç
  terk etmez
- 7TV emoteleri, bot ve kullanıcı filtreleri, anahtar kelime filtresi, motorların bozduğu adlar için sözlük
- Sohbet çubuğundan tek bir kanalı duraklat, diğerleri durmaz. Kanal değiştirmek ya da uzantıyı güncellemek
  açık sekmelerin çevirmeye devam etmesini sağlar, yeniden yüklemek gerekmez
- Chrome, Brave, Edge ve Firefox

| Sohbet, aktıkça çevrilir | Araç çubuğu açılır penceresi |
|---|---|
| <img src="screenshots/chat.png" alt="Her İspanyolca mesajın altında İngilizce çevirisinin durduğu Kick sohbeti, listenin üstünde uzantının durum çubuğu" width="360"> | <img src="screenshots/popup.png" alt="Hedef dil, görüntüleme modu, sağlayıcı listesi ve günlük istek sayılarını gösteren uzantı açılır penceresi" width="360"> |

| Yazdığın, göndermeden önce | Bir dil seç, ya da kendisi seçsin |
|---|---|
| <img src="screenshots/compose.png" alt="İçinde İngilizce bir mesaj bulunan yazma kutusu ve üstünde gönderilecek İspanyolca sürümü gösteren bir önizleme" width="360"> | <img src="screenshots/languages.png" alt="Dil bayraklarının ve adlarının aranabilir ızgarası, kanalın kendi dili en başta" width="360"> |

<sub>Görüntüler, bu deponun kendi uydurduğu bir sohbet odasında yayınlanan sürümden alındı: kullanıcı adları ve
mesajlar uydurmadır, çeviriler yerelde yanıtlanır, bu yüzden bu sayfada gerçek hiç kimsenin adı yer almaz.</sub>

## Kurulum

[Chrome, Brave, Edge: Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox: Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

Herhangi bir Kick yayını aç: sohbetin üstündeki yeşil çubuk çalıştığını gösterir. Mağaza kopyaları kendiliğinden
güncellenir.

<details>
<summary>Elle kurulum, bir release zip'inden</summary>

Tarayıcın için zip'i [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) sayfasından indir ve aç.

- Chrome, Brave, Edge (`…-chromium.zip`): `chrome://extensions` aç, Geliştirici modunu etkinleştir, Paketlenmemiş öğe yükle'ye tıkla, klasörü seç.
- Firefox 121+ (`…-firefox.zip`): `about:debugging#/runtime/this-firefox` aç, Geçici Eklenti Yükle'ye tıkla, `manifest.json` dosyasını seç.

Bu şekilde kurulan bir kopya kendiliğinden güncellenmez. Daha yeni bir sürüm varsa simgesinde bir rozet çıkar
ve açılır pencere mağazaya bağlantı verir.

</details>

## Çeviri motorları

Zincirlenmiş dört sağlayıcı: biri başarısız olursa sıradaki devralır. Sıralamayı sen belirlersin.

| Sağlayıcı | Anahtar | Not |
|---|---|---|
| Google | yok | varsayılan, kutudan çıktığı gibi çalışır |
| DeepL | ücretsiz | en iyi kalite, ayda 1 milyon karakter için [ücretsiz anahtar](https://www.deepl.com/pro-api) |
| MyMemory | yok | yedek |
| Lingva | yok | yedek, kendi örneğine yönlendirmedikçe herkese açık bir örnekte |

Chromium'un yerleşik çevirmeni hepsinden hızlıdır. Canlı bir kanalda ölçüldü: bir mesajın görünmesinden
çevirisinin ekranda belirmesine 22 ms, bulut zincirinde ise 1618 ms; ağ yok, kota yok. Chrome ve Edge 138 ve
sonrası bunu sunabilir, ancak her kopya sunmaz, ve her dil çiftinin modeli bir kez indirilmelidir, çubuktan tek
tıkla. Firefox'ta yok. Bulunmadığı yerde bulut zinciri devralır ve hiçbir şey bozulmaz.

## Ayarlar

Sohbet çubuğundaki dişliye tıkla, ya da uzantı simgesine sağ tıklayıp Seçenekler'i seç.

- Hedef dil, ve açarsan kanal başına hatırlanan bir okuma dili
- Sağlayıcı sırası, DeepL anahtarın ve motor modu: önce cihaz üzerinde, önce bulut, ya da yalnızca cihaz üzerinde
- Görünüm: mesajın altında (önerilen), ardından aynı satırda, yerine ya da üzerine gelince; özgün metin ve
  kaynak dil rozeti isteğe bağlı
- Sohbetin eylem çubuğundaki dil düğmesi: tek tık kanalın dili ile son seçimin arasında geçiş yapar, basılı
  tutmak listeyi açar, iki harf yazmak listeyi süzer
- Yazma önizlemesi: açık ya da kapalı, hedef dili, ve tıklamanın sohbet kutusunu doldurup doldurmayacağı ya da
  kopyalayıp kopyalamayacağı
- Filtreler: botları atla, kullanıcıları, kanalları veya anahtar kelimeleri engelle, kaynak dilleri sınırla
- Sözlük: çevirilere uygulanan bul ve değiştir çiftleri
- Bütçe: DeepL kotası payı, kanal başına hız sınırı, önbellek boyutu ve ömrü
- Okunabilirlik ve görünüm: yazı boyutu, satır aralığı, yazı tipi, vurgu rengi, sohbet teması
- Klavye: Alt+T sohbet çevirisini açar ya da kapatır, Alt+W yazma önizlemesini
- Etkinlik: çevrilen mesajlar, önbellek isabetleri, sohbette görülen her dil, ve son 50 satırın her biri neden
  çevrildi ya da bırakıldı
- Uzantının kendi arayüzü İngilizce, İspanyolca, Fransızca, Portekizce, Türkçe, Rusça, Arapça, Çince,
  Japonca veya Korece

## Desteklenen diller

İngilizce · Fransızca · İspanyolca · Portekizce · Portekizce (Brezilya) · Almanca · İtalyanca · Felemenkçe · Lehçe · İsveççe · Çekçe · Slovakça · Romence · Rusça · Ukraynaca · Türkçe · Arapça · İbranice · Japonca · Korece · Çince (Basitleştirilmiş) · Çince (Geleneksel) · Tayca · Vietnamca · Endonezce · Hintçe · Fince · Norveççe · Danca · Yunanca · Macarca · Bulgarca · Katalanca · Slovence · Estonca · Litvanca · Letonca · Farsça · Bengalce · Tamilce · Malayca · Filipince · Kantonca

## Gizlilik

Hesap yok, analitik yok, bana ait sunucu yok. Sohbet mesajları seçtiğin çeviri sağlayıcısına gider, başka hiçbir
yere, cihaz üzerinde modda oraya bile gitmez. Bir mağazadan kurulan kopya başka hiçbir istek yapmaz. Elle
kurulan kopya, güncelleme rozetini gösterip göstermeyeceğini bilmek için GitHub'dan son release etiketini
en fazla altı saatte bir sorar. [Ayrıntılar](PRIVACY.md)

## SSS

**Mesajlar çevrilmiyor.**
Ayarlardaki Etkinlik sekmesini aç ve "Kararları oku"ya bas: son 50 satırı ve her birinin neden çevrildiğini
ya da bırakıldığını listeler. Atlanan satırların çoğu bilerek atlanır. Tek bir canlı oturumda 234 satırın 213'ü
aynı kullanıcının kendini tekrar etmesiydi, 9'u çok kısaydı, 7'si yalnızca emoji ya da kahkahaydı, 1'i zaten
okuma dilindeydi. Sekme hiçbir şey göstermiyorsa uzantı sohbeti görmüyor demektir: lütfen bir issue aç.

**Yeşil çubuk kayboldu.**
Sayfayı yenile. Tekrar olursa kanalı ve öncesinde ne yaptığını yazarak bir [issue](https://github.com/Pkkls/kick-chat-translator/issues)
aç.

**Daha iyi çeviriyi nasıl alırım?**
Ayarlara ücretsiz bir DeepL anahtarı ekle. Ücretsiz paket ayda bir milyon karakteri kapsar, ve DeepL yalnızca
ücretsiz motorları geçtiği dil çiftlerinde harcanır.

**Hangi görüntüleme stilini kullanmalıyım?**
Mesajın altında. Diğer üçü çalışıyor, ancak hâlâ ayarlanıyor.

**VOD tekrarlarında çalışıyor mu?**
Evet, canlı yayınlardaki gibi.

**Kick güncellemesinden sonra bozuldu.**
Kick bazen sohbetinin yapısını değiştirir. Bir [issue](https://github.com/Pkkls/kick-chat-translator/issues)
aç, yamalanır.

**Bunu Kick mi yapıyor?**
Hayır. Bağımsız bir açık kaynak projesi, Kick ile bağlantısı yok.

## Yenilikler

### 3.0.2

Sohbet çubuğundaki duraklatma düğmesi artık yalnızca izlediğiniz kanalı duraklatıyor. Önceden çeviriyi tüm kanallarda ve tüm sekmelerde, siz açılır pencereden yeniden açana kadar kapatıyordu.

Geçerli sekmedeki kanal duraklatılmışsa açılır pencere bunu belirtir ve bir Devam et düğmesi sunar.

Uzantı yüklenirken veya güncellenirken zaten açık olan bir Kick sekmesi çevirmeye devam ediyor. Önceden sayfayı yeniden yükleyene kadar duruyordu.

Sayfayı yenilemeden başka bir kanala geçtiğinizde çeviri, sayfayı yenileyene kadar duruyordu. Artık ekrandaki sohbeti takip ediyor.

İlk çevirinizi yapana kadar, Kick dışında açılan açılır pencere bir kanal açmayı önerir ve bunun için bir düğme sunar.

Sohbet, çubuk, açılır pencere ve ayarlardaki metinler Türkçe, Fransızca, İspanyolca ve Portekizcede yeniden doğru harflerle yazılıyor.

Her sürüm, nelerin değiştiği ve arkasındaki ölçümle birlikte:
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) ve [CHANGELOG.md](CHANGELOG.md).

## Geliştirme

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, unit tests, build: the gate every package goes through
npm run build:firefox    # Firefox build, same dist/ folder
npm run package:all      # both zips, in release/
npm run dev              # HMR
```

Derlemeler yeniden üretilebilir: aynı commit, herhangi bir makinede bayt bayt aynı zip'leri verir; bu,
etiketin bir `git archive`'ini boş bir klasörde derleyip hash'leri karşılaştırarak doğrulanır.

Birim testlerinin ötesinde, 41 çevrimdışı kapı derlenmiş uzantıyı gerçek bir tarayıcıya yükler, onu çalıştırır
ve yaptığını doğrular; sayfa yerelde sunulur ve çeviri motoru yerelde yanıtlanır. Playwright gerekir, ve bu
bilerek bir bağımlılık değildir: `UX_KIT`'i `node_modules` klasöründe Playwright bulunan bir klasöre yönlendir
ya da `npm i -D playwright` çalıştır.

```bash
node test/e2e/run-gates.mjs --headless                  # all 41, no window
node test/e2e/store-shots-fixture.mjs --lang=ja         # the store screenshots, in one listing language
node test/e2e/store-shots-fixture.mjs --gif             # English store screenshots, the README images and this GIF
```

Yığın: Manifest V3, Vite, TypeScript, Preact, Tailwind. Mağaza metinleri [store/](store/) içinde durur, ve bir
release bir sürüm etiketidir: CI onu derler, denetler ve iki mağazada da yayınlar.

## İlgili projeler

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), Kick'in pre-roll ve bindirme reklamlarını engeller
- [kick-core](https://github.com/Pkkls/kick-core), bu uzantıların ortak kullandığı gerçek zamanlı ağ geçidi istemcisi
- [kickbus](https://github.com/Pkkls/kickbus), resmi Kick webhook'larını SSE ile yerel botlara aktarır
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), Kick drop izleme süresini ilerleten Windows uygulaması

## Lisans

MIT. Kick ile bağlantısı yok.
