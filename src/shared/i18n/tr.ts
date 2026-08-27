// Turkish UI translations. Keys = verbatim English source strings.
export const tr: Record<string, string> = {
  'v2 · options & preferences': 'v2 · seçenekler ve tercihler',
  saved: 'kaydedildi',
  ready: 'hazır',
  Providers: 'Sağlayıcılar',
  Display: 'Görünüm',
  Filters: 'Filtreler',
  Advanced: 'Gelişmiş',
  About: 'Hakkında',
  'Kick Chat Translator listens to chat in real time and translates non-English (or non-target-language) messages right under the original. No tracking, no account, fully open-source.':
    'Kick Chat Translator sohbeti gerçek zamanlı dinler ve İngilizce olmayan (veya hedef dilde olmayan) mesajları orijinalin hemen altında çevirir. Takip yok, hesap yok, tamamen açık kaynak.',
  Links: 'Bağlantılar',
  'GitHub repository': 'GitHub deposu',
  'Privacy policy': 'Gizlilik politikası',
  'Report an issue': 'Sorun bildir',
  'How translation happens': 'Çeviri nasıl çalışır',
  'The extension reads each chat message from the page as it appears.':
    'Uzantı, sayfada göründükçe her sohbet mesajını okur.',
  'Each chat message is parsed; emotes and links are stripped before translation.':
    'Her sohbet mesajı ayrıştırılır; çeviriden önce emoteler ve bağlantılar kaldırılır.',
  'The extension picks the first available provider in your chain.':
    'Uzantı, zincirindeki ilk kullanılabilir sağlayıcıyı seçer.',
  'Translations are cached locally in IndexedDB to avoid duplicate calls.':
    "Tekrarlanan istekleri önlemek için çeviriler yerel olarak IndexedDB'de önbelleğe alınır.",
  Connection: 'Bağlantı',
  'Cache & performance': 'Önbellek ve performans',
  Debugging: 'Hata ayıklama',
  'Pause when tab is hidden': 'Sekme gizliyken duraklat',
  "Background Kick tabs won't translate (saves DeepL quota while you're away).":
    'Arka plandaki Kick sekmeleri çeviri yapmaz (sen yokken DeepL kotasını korur).',
  'Verbose console logs': 'Ayrıntılı konsol kayıtları',
  'Cache max entries': 'Maksimum önbellek girişi',
  'Larger = more hits across sessions, more disk space.':
    'Daha büyük değer, oturumlar arasında daha fazla isabet ve daha fazla disk alanı demektir.',
  'Cache TTL (hours)': 'Önbellek TTL (saat)',
  'After this, entries expire.': 'Bu sürenin sonunda girişlerin süresi dolar.',
  'Concurrent translations': 'Eşzamanlı çeviriler',
  'In-flight provider requests.': 'Devam eden sağlayıcı istekleri.',
  'Per-channel budget (req/min)': 'Kanal başına bütçe (istek/dk)',
  'Hard cap to avoid hammering providers on fast chats.':
    'Hızlı sohbetlerde sağlayıcıları yormamak için katı bir üst sınır.',
  'Clear translation cache': 'Çeviri önbelleğini temizle',
  'Reset usage stats': 'Kullanım istatistiklerini sıfırla',
  'Reset all settings to defaults': 'Tüm ayarları varsayılana sıfırla',
  'click again to confirm': 'onaylamak için tekrar tıkla',
  '"Reset all settings" restores defaults — use it if translations stop appearing because a filter (whitelist / source-language allowlist) was left active.':
    '"Tüm ayarları sıfırla" varsayılanları geri yükler. Bir filtre (beyaz liste / kaynak dili izin listesi) açık kaldığı için çeviriler görünmeyi kestiyse bunu kullan.',
  'Translation target': 'Çeviri hedefi',
  'Display style': 'Görünüm stili',
  'Compose preview': 'Yazma önizlemesi',
  'Translate everything to': 'Her şeyi şu dile çevir',
  'Auto — your browser language': 'Otomatik (tarayıcının dili)',
  'Auto reads incoming chat in your own language, detected from the browser.':
    'Otomatik, gelen sohbeti tarayıcından algılanan kendi dilinde gösterir.',
  'Write my messages in': 'Mesajlarımı şu dilde yaz',
  "Auto — the channel's language": 'Otomatik (kanalın dili)',
  "Auto detects the channel's broadcast language from Kick — no manual picking.":
    'Kanalın yayın dilini Kick üzerinden otomatik algılar, elle seçim gerekmez.',
  Below: 'Altında',
  'On a new line under the message.': 'Mesajın altında yeni bir satırda.',
  Inline: 'Satır içi',
  'In a pill after the original text.': 'Orijinal metnin ardından bir etiket içinde.',
  Replace: 'Değiştir',
  'Show floating bar at top of chat (toggle live)':
    'Sohbetin üstünde yüzen bir çubuk göster (anlık aç/kapat)',
  'Keep original text visible': 'Orijinal metni görünür tut',
  'Show source language badge': 'Kaynak dil rozetini göster',
  'Show which provider was used': 'Hangi sağlayıcının kullanıldığını göster',
  'Enable compose preview': 'Yazma önizlemesini etkinleştir',
  'Click inserts into the chat box (off = copy to clipboard instead)':
    'Tıklama, çeviriyi sohbet kutusuna ekler (kapalıysa panoya kopyalanır)',
  'Translate what you type before sending. A live preview appears above the chat box; click it to drop the translation in. Uses the same DeepL-first chain as incoming chat.':
    'Göndermeden önce yazdıklarını çevirir. Sohbet kutusunun üstünde canlı bir önizleme belirir; çeviriyi eklemek için üzerine tıkla. Gelen sohbetle aynı, önce DeepL denenen zinciri kullanır.',
  Engine: 'Motor',
  'on-device:': 'cihaz üzerinde:',
  'available ✓': 'kullanılabilir ✓',
  'not supported in this browser': 'bu tarayıcıda desteklenmiyor',
  Strategy: 'Strateji',
  'On-device first, cloud fallback (recommended)':
    'Önce cihaz üzerinde, bulut yedek olarak (önerilen)',
  'Cloud first, on-device fallback': 'Önce bulut, cihaz üzerinde yedek olarak',
  'On-device only (no network, no cloud)': 'Yalnızca cihaz üzerinde (ağ yok, bulut yok)',
  'On-device = local Chromium models: unlimited, instant, private, no rate-limit. Each language needs a one-time model download (click a flag below, or the "Local" chip in chat).':
    'Cihaz üzerinde = yerel Chromium modelleri: sınırsız, anında, özel, istek sınırı yok. Her dil için bir kereye mahsus model indirmesi gerekir (aşağıdan bir bayrağa tıkla veya sohbetteki "Yerel" etiketine).',
  'Enable on-device translation': 'Cihaz üzerinde çeviriyi etkinleştir',
  'Download models →': 'Modelleri indir →',
  General: 'Genel',
  'Source languages allowlist': 'Kaynak dilleri izin listesi',
  'Channels & users': 'Kanallar ve kullanıcılar',
  'Leave empty to translate every detected language. Pick specific ones to ONLY translate those (e.g. only JA + KO).':
    'Algılanan tüm dilleri çevirmek için boş bırak. Yalnızca belirli dilleri çevirmek için onları seç (örneğin sadece JA + KO).',
  'Skip messages already in target language': 'Zaten hedef dilde olan mesajları atla',
  'Ignore common bot accounts (StreamElements, Nightbot, …)':
    'Yaygın bot hesaplarını yoksay (StreamElements, Nightbot, …)',
  'Whitelist channels (only translate on these)':
    'Beyaz listedeki kanallar (yalnızca bunlarda çevir)',
  'Blacklist channels': 'Kara listedeki kanallar',
  'Blacklist users': 'Kara listedeki kullanıcılar',
  'Cloud fallback chain': 'Bulut yedek zinciri',
  "Used when on-device is off or a language pair isn't downloaded. Providers are tried in order; failing ones are temporarily skipped (exponential cooldown).":
    'Cihaz üzerinde çeviri kapalıyken veya bir dil çifti indirilmemişken kullanılır. Sağlayıcılar sırayla denenir; başarısız olanlar geçici olarak atlanır (üstel bekleme süresi).',
  ok: 'ok',
  down: 'çevrimdışı',
  'Google Translate (free, no key)': 'Google Translate (ücretsiz, anahtar gerekmez)',
  'DeepL (best quality, needs key)': 'DeepL (en iyi kalite, anahtar gerekir)',
  'MyMemory (free, ~1000/day)': 'MyMemory (ücretsiz, ~1000/gün)',
  'Lingva (LibreTranslate front, configurable)':
    'Lingva (LibreTranslate arayüzü, yapılandırılabilir)',
  'API key': 'API anahtarı',
  Plan: 'Plan',
  'Free (api-free.deepl.com)': 'Ücretsiz (api-free.deepl.com)',
  'Pro (api.deepl.com)': 'Pro (api.deepl.com)',
  'Smart budget routing': 'Akıllı bütçe yönlendirme',
  'Spend DeepL only on the European languages it clearly wins at; other targets (Japanese, Arabic, Hindi…) use the free engines first, so your DeepL quota lasts much longer.':
    "DeepL'i yalnızca açıkça daha iyi olduğu Avrupa dilleri için kullan; diğer hedef diller (Japonca, Arapça, Hintçe…) önce ücretsiz motorları kullanır, böylece DeepL kotan çok daha uzun sürer.",
  'Lingva instance': 'Lingva sunucusu',
  'Custom URL (optional)': 'Özel URL (isteğe bağlı)',
  'Leave blank to use the default public instance.':
    'Varsayılan genel sunucuyu kullanmak için boş bırak.',
  '⬆ Update available': '⬆ Güncelleme mevcut',
  'Target language': 'Hedef dil',
  'Translate what I type': 'Yazdıklarımı çevir',
  Today: 'Bugün',
  'Auto — your language': 'Otomatik (dilin)',
  'Below original': 'Orijinalin altında',
  'Auto — channel language': 'Otomatik (kanal dili)',
  "Auto-detects the channel's language. Preview shows above the chat box — click it to insert.":
    'Kanalın dilini otomatik algılar. Önizleme sohbet kutusunun üstünde görünür, eklemek için tıkla.',
  'order in options': 'seçeneklerdeki sıra',
  'DeepL quota': 'DeepL kotası',
  enable: 'etkinleştir',
  'keep original': 'orijinali koru',
  'lang badge': 'dil rozeti',
  'Clear cache': 'Önbelleği temizle',
  Options: 'Seçenekler',
  requests: 'istekler',
  cache: 'önbellek',
  errors: 'hatalar',
  available: 'kullanılabilir',
  unavailable: 'kullanılamıyor',
  Backup: 'Yedekleme',
  'Save your configuration to a JSON file, or restore it on another browser.':
    'Yapılandırmanı bir JSON dosyasına kaydet veya başka bir tarayıcıda geri yükle.',
  'Export settings': 'Ayarları dışa aktar',
  'Import settings': 'Ayarları içe aktar',
  'Invalid settings file': 'Geçersiz ayar dosyası',
  'cache hit rate, last 7 days': 'önbellek isabet oranı, son 7 gün',
  'Minimum message length': 'Minimum mesaj uzunluğu',
  'Shorter messages are left alone. Raise it to spend less provider quota on busy chats.':
    'Daha kısa mesajlara dokunulmaz. Yoğun sohbetlerde sağlayıcı kotasından tasarruf etmek için değerini yükselt.',
  Preview: 'Önizleme',
  'is anyone else seeing this?': 'bunu gören başka biri var mı?',
  'Whether a Kick tab keeps translating once you look away.':
    'Başka bir yere baktığında Kick sekmesinin çevirmeye devam edip etmeyeceği.',
  'Reusing past translations, and how hard the engines are pushed on a busy chat. The defaults suit most channels.':
    'Geçmiş çevirilerin yeniden kullanımı ve yoğun bir sohbette motorların ne kadar zorlandığı. Varsayılan değerler çoğu kanal için uygundur.',
  'one channel name per line': 'satır başına bir kanal adı',
  'one username per line': 'satır başına bir kullanıcı adı',
  Glossary: 'Sözlük',
  'Words the engines keep getting wrong for your channels. Each line replaces the left side with the right side, after translating.':
    'Motorların kanalların için sürekli yanlış çevirdiği kelimeler. Her satır, çeviriden sonra sol taraftakini sağ taraftakiyle değiştirir.',
  'one rule per line, in the form word→replacement':
    'satır başına bir kural, kelime→değişim biçiminde',
  Debug: 'Hata ayıklama',
  'Last decisions': 'Son kararlar',
  'Why each recent message was translated or left alone. Read from an open Kick tab, kept in memory there, never saved to disk.':
    'Her son mesajın neden çevrildiği ya da dokunulmadan bırakıldığı. Açık bir Kick sekmesinden okunur, orada bellekte tutulur, diske asla kaydedilmez.',
  'Read decisions': 'Kararları oku',
  'No Kick tab is open. Open a channel, let the chat run, then read again.':
    'Açık bir Kick sekmesi yok. Bir kanal aç, sohbetin akmasına izin ver, sonra tekrar oku.',
  'The open Kick tab has not loaded the extension yet. Reload the tab, then read again.':
    'Açık olan Kick sekmesi uzantıyı henüz yüklemedi. Sekmeyi yeniden yükle, sonra tekrar oku.',
  'Nothing recorded yet. Let a chat run for a moment, then read again.':
    'Henüz hiçbir şey kaydedilmedi. Sohbetin bir süre akmasına izin ver, sonra tekrar oku.',
  'Filter languages': 'Dilleri filtrele',
  'No language matches': 'Eşleşen dil yok',
  'Move up': 'Yukarı taşı',
  'Move down': 'Aşağı taşı',
  Remove: 'Kaldır',
  'Settings sections': 'Ayar bölümleri',
  'Show the quick language button in chat': 'Sohbette hızlı dil düğmesini göster',
  Usage: 'Kullanım',
  'most translated languages': 'en çok çevrilen diller',
  'Translate the chat': 'Sohbeti cevir',
  "In place of the original text. Emotes stay.": "Orijinal metnin yerinde. Emoteler kalır.",
  "The Replace style always hides it.": "Değiştir stili onu her zaman gizler.",
};
