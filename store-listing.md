# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 2.9.0, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

NEW IN 2.9.0

The language list is a grid of flags instead of a column of two-letter codes. It used to run the full height of the screen, 43 entries one per line, each of them read letter by letter; three columns of drawn flags fit the same list into 42 percent less height. The flags are drawn in CSS rather than shipped as emoji, because flag emoji do not render on Windows, where the system falls back to the very letters being replaced. And Kick's own interface no longer paints over that menu, which it did at five of nine sampled points once the page was scrolled.

Open a Kick stream where the chat is in a language you don't read. Each message gets its translation right underneath, as it comes in. A green bar at the top of chat tells you it's running.

Type a reply and a preview shows it in the channel's language above the chat box. Click the preview or press Ctrl+Enter and that version replaces what you typed in the chat box, ready for you to send.

Nothing to set up. Incoming chat is translated into your browser's language, and what you write goes out in whatever the channel broadcasts in, read from Kick itself. Both are overridable in settings. Works on live streams and on VOD replays, and it handles 7TV emotes.

ENGINES

Google works out of the box, no key, no account. Add your own free DeepL key (their free tier covers 1 million characters a month without a card) and quality jumps on European languages. DeepL also receives the recent channel lines as context so the wording fits the conversation, and it's asked for the polite register where the language has one: keigo in Japanese, vous rather than tu in French. To make a free quota last, DeepL is spent only on the pairs where it actually beats the free engines. MyMemory and Lingva sit behind as fallbacks, and when one engine fails the next takes over. You set the order.

Chrome and Edge 138+ can also translate on-device, hardware permitting. The model downloads once per language pair, then everything runs locally: offline, unlimited, and no chat text leaves your machine. Brave and Firefox don't ship that API yet, so they use the engines above.

DISPLAY

Translation below the original, inline with it, after it in smaller italics, or only when you hover. Hover mode fetches nothing until you point at a message, which cuts usage by roughly 10x on a fast chat.

FILTERS

Skip bots, blocklist users or channels, or limit which source languages get translated at all. Emotes, mentions, links and emoji spam are stripped before anything is sent out, so you're not paying to translate "kkkkkk". Background tabs pause themselves.

42 languages, right-to-left included (Arabic, Hebrew, Persian), with regional variants kept apart (pt-BR, zh-TW). The extension's own interface comes in 10: English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese and Korean.

No account, no analytics, no server of mine. It asks for storage, for a wake-up timer so the translator stays ready while you watch, and for access to kick.com plus the translation engines it can call: Google, DeepL, MyMemory and Lingva. It also reads the GitHub releases page to tell you when a newer version exists, sending nothing with that request. Your chat text goes to the engine you picked and nowhere else, and on-device it doesn't even go there.

Open source, MIT: github.com/Pkkls/kick-chat-translator

## Description (FR)

NOUVEAU EN 2.9.0

La liste des langues est une grille de drapeaux, au lieu d'une colonne de codes a deux lettres. Elle occupait toute la hauteur de l'ecran, 43 entrees une par ligne, chacune a dechiffrer lettre par lettre ; trois colonnes de drapeaux dessines y logent la meme liste avec 42 pour cent de hauteur en moins. Les drapeaux sont dessines en CSS et non livres en emoji, parce que les emoji de drapeaux ne s'affichent pas sous Windows : le systeme y retombe sur les deux lettres qu'il s'agissait justement de remplacer. Et l'interface de Kick ne passe plus par-dessus ce menu, ce qu'elle faisait sur cinq points sur neuf une fois la page defilee.

Tu ouvres un stream Kick où le chat est dans une langue que tu ne lis pas. Chaque message reçoit sa traduction juste en dessous, au fil de l'arrivée. Une barre verte en haut du chat indique que ça tourne.

Tu écris une réponse, un aperçu la montre dans la langue de la chaîne au-dessus de la barre de chat. Clic sur l'aperçu ou Ctrl+Entrée, et cette version remplace ce que tu as tapé dans la boîte de chat, prête à partir.

Rien à régler. Le chat entrant est traduit vers la langue de ton navigateur, ce que tu écris part dans la langue de diffusion de la chaîne, lue depuis Kick. Les deux se changent dans les réglages. Marche sur les lives comme sur les replays VOD, et gère les emotes 7TV.

MOTEURS

Google fonctionne d'emblée, sans clé, sans compte. Ajoute ta propre clé DeepL gratuite (leur offre gratuite couvre 1 million de caractères par mois, sans carte) et la qualité monte nettement sur les langues européennes. DeepL reçoit aussi les lignes récentes de la chaîne comme contexte, donc la formulation colle à la conversation, et on lui demande le registre poli quand la langue en a un : keigo en japonais, vouvoiement en français. Pour faire durer un quota gratuit, DeepL n'est dépensé que sur les paires où il bat vraiment les moteurs gratuits. MyMemory et Lingva restent derrière en secours, et quand un moteur tombe le suivant prend le relais. L'ordre est le tien.

Chrome et Edge 138+ savent aussi traduire en local, si la machine suit. Le modèle se télécharge une fois par paire de langues, puis tout tourne sur ta machine : hors ligne, sans limite, et aucun texte de chat ne sort. Brave et Firefox n'ont pas encore cette API, ils passent par les moteurs ci-dessus.

AFFICHAGE

Traduction sous l'original, en ligne avec lui, après lui en italique plus petit, ou seulement au survol. Le mode survol ne demande rien tant que tu ne pointes pas un message, ce qui divise l'usage par dix environ sur un chat rapide.

FILTRES

Ignorer les bots, blacklister des utilisateurs ou des chaînes, ou limiter les langues source à traduire. Emotes, mentions, liens et murs d'emoji sont retirés avant tout envoi, tu ne paies pas pour traduire "kkkkkk". Les onglets en arrière-plan se mettent en pause seuls.

42 langues, écriture droite-gauche comprise (arabe, hébreu, persan), variantes régionales gardées distinctes (pt-BR, zh-TW). L'interface de l'extension existe en 10 langues : anglais, espagnol, français, portugais, turc, russe, arabe, chinois, japonais et coréen.

Pas de compte, pas d'analytics, pas de serveur à moi. Elle demande le stockage, un minuteur de réveil pour que le traducteur reste prêt pendant que tu regardes, et l'accès à kick.com plus les moteurs de traduction qu'elle peut appeler : Google, DeepL, MyMemory et Lingva. Elle lit aussi la page des versions GitHub pour te signaler qu'une plus récente existe, sans rien envoyer avec cette requête. Ton texte va au moteur que tu as choisi et nulle part ailleurs, et en local il n'y va même pas.

Code source ouvert, MIT : github.com/Pkkls/kick-chat-translator

## Description (TR)

Paste into the Turkish listing in the developer dashboard. Turkey is the second
country by users after the United States, and 21 of 200 listing views came from
the Turkish store. No native reader was available; verified by round-tripping each paragraph back to English.

Short summary: Okuyamadığın bir dilde Kick sohbeti mi? Her mesajın altına canlı çeviri gelir, yanıtların da kanalın dilinde gider.

2.9.0 İLE GELENLER

Dil listesi artık iki harfli kodlardan oluşan bir sütun değil, bayraklardan oluşan bir ızgara. Eskiden ekranın tüm yüksekliğini kaplıyordu: her satırda bir tane olmak üzere 43 giriş, her biri harf harf okunuyordu. Üç sütun hâlinde çizilmiş bayraklar aynı listeyi yüzde 42 daha az yükseklikte gösteriyor. Bayraklar emoji olarak değil CSS ile çiziliyor, çünkü bayrak emojileri Windows'ta görünmüyor: sistem tam da değiştirmek istediğimiz iki harfe geri dönüyor. Ayrıca Kick'in kendi arayüzü artık bu menünün üzerine çizmiyor.

Okuyamadığın bir dilde sohbet akan bir Kick yayını aç. Her mesaj, geldiği anda, hemen altında çevirisini alır. Sohbetin üstündeki yeşil çubuk çalıştığını gösterir.

Bir yanıt yaz, sohbet kutusunun üstünde kanalın dilinde bir önizleme belirir. Önizlemeye tıkla ya da Ctrl+Enter'a bas, o sürüm yazdığının yerine geçer ve göndermeye hazır olur.

Ayarlanacak bir şey yok. Gelen sohbet tarayıcının diline çevrilir, yazdıkların da kanalın yayın diline gider, bu bilgi doğrudan Kick'ten okunur. İkisi de ayarlardan değiştirilebilir. Canlı yayınlarda da VOD tekrarlarında da çalışır, 7TV emotelerini anlar.

MOTORLAR

Google kutudan çıktığı gibi çalışır, anahtar yok, hesap yok. Kendi ücretsiz DeepL anahtarını ekle (ücretsiz paketleri kart istemeden ayda 1 milyon karakter veriyor), Avrupa dillerinde kalite belirgin şekilde yükselir. DeepL ayrıca kanalın son satırlarını bağlam olarak alır, böylece ifade konuşmaya oturur, ve dilin nezaket kipi varsa o istenir: Japoncada keigo, Fransızcada tu yerine vous. Ücretsiz kotayı uzatmak için DeepL yalnızca ücretsiz motorları gerçekten geçtiği dil çiftlerinde harcanır. MyMemory ve Lingva arkada yedek bekler, bir motor düştüğünde sıradaki devralır. Sıralama senin.

Chrome ve Edge 138+ ayrıca cihaz üzerinde çeviri yapabilir, donanım elverirse. Model her dil çifti için bir kez iner, sonra her şey yerelde çalışır: çevrimdışı, sınırsız, ve hiçbir sohbet metni makineni terk etmez. Brave ve Firefox bu API'yi henüz sunmuyor, onlar yukarıdaki motorları kullanır.

GÖRÜNÜM

Çeviri orijinalin altında, onunla aynı satırda, ardında daha küçük italikle, ya da yalnızca üzerine gelince. Üzerine gelme modu sen bir mesajı işaret edene kadar hiçbir şey istemez, bu da hızlı bir sohbette kullanımı yaklaşık 10 kat azaltır.

FİLTRELER

Botları atla, kullanıcıları veya kanalları engelle, ya da hangi kaynak dillerin çevrileceğini sınırla. Emoteler, bahsetmeler, bağlantılar ve emoji yığınları dışarı gönderilmeden önce ayıklanır, yani "kkkkkk" çevirmek için ödeme yapmazsın. Arka plandaki sekmeler kendiliğinden duraklar.

42 dil, sağdan sola yazılanlar dahil (Arapça, İbranice, Farsça), bölgesel varyantlar ayrı tutulur (pt-BR, zh-TW). Eklentinin kendi arayüzü 10 dilde: İngilizce, İspanyolca, Fransızca, Portekizce, Türkçe, Rusça, Arapça, Çince, Japonca ve Korece.

Hesap yok, analitik yok, bana ait sunucu yok. Depolama izni ister, sen izlerken çevirmenin hazır kalması için bir uyandırma zamanlayıcısı, ve kick.com ile çağırabileceği çeviri motorlarına erişim: Google, DeepL, MyMemory ve Lingva. Ayrıca daha yeni bir sürüm çıktığını söylemek için GitHub sürümler sayfasını okur, bu istekle hiçbir şey göndermez. Sohbet metnin seçtiğin motora gider, başka hiçbir yere, cihaz üzerinde çalışırken oraya bile gitmez.

Açık kaynak, MIT: github.com/Pkkls/kick-chat-translator

## Description (AR)

Paste into the Arabic listing. 17 of 200 listing views came from the Arabic store,
third after English and Turkish. The extension already ships an Arabic interface
and handles right-to-left text. No native reader was available; verified by round-tripping each paragraph back to English.

Short summary: دردشة Kick بلغة لا تقرأها؟ تظهر الترجمة أسفل كل رسالة مباشرةً، وردودك تخرج بلغة القناة.

الجديد في 2.9.0

صارت قائمة اللغات شبكة من الأعلام بدل عمود من رموز من حرفين. كانت تشغل ارتفاع الشاشة كله، بـ 43 مدخلاً في سطر لكل منها، ويُقرأ كل واحد حرفاً حرفاً. ثلاثة أعمدة من الأعلام المرسومة تضع القائمة نفسها في ارتفاع أقل بنسبة 42 بالمئة. والأعلام مرسومة بـ CSS لا مُرسلة كرموز تعبيرية، لأن رموز الأعلام لا تظهر على ويندوز، فيعود النظام إلى الحرفين اللذين أردنا استبدالهما. كما أن واجهة Kick نفسها لم تعد ترسم فوق هذه القائمة.

افتح بثاً على Kick تجري دردشته بلغة لا تقرأها. تحصل كل رسالة على ترجمتها أسفلها مباشرةً، فور وصولها. الشريط الأخضر أعلى الدردشة يخبرك أن الإضافة تعمل.

اكتب رداً، فتظهر معاينة له بلغة القناة فوق صندوق الدردشة. انقر المعاينة أو اضغط Ctrl+Enter، فتحل تلك النسخة محل ما كتبته، جاهزة للإرسال.

لا شيء لتضبطه. تُترجم الدردشة الواردة إلى لغة متصفحك، ويخرج ما تكتبه بلغة بث القناة، وهي تُقرأ من Kick نفسه. كلاهما قابل للتغيير من الإعدادات. تعمل على البث المباشر وعلى إعادات VOD، وتتعامل مع رموز 7TV.

المحركات

يعمل Google مباشرةً، بلا مفتاح وبلا حساب. أضف مفتاح DeepL المجاني الخاص بك (باقتهم المجانية تغطي مليون حرف شهرياً دون بطاقة) فترتفع الجودة بوضوح في اللغات الأوروبية. يتلقى DeepL أيضاً أسطر القناة الأخيرة كسياق، فتستقر الصياغة على مجرى الحديث، ويُطلب منه صيغة التأدب حين تملكها اللغة: الكيغو في اليابانية، وvous بدل tu في الفرنسية. ولإطالة عمر الحصة المجانية، لا يُنفَق DeepL إلا على أزواج اللغات التي يتفوق فيها فعلاً على المحركات المجانية. يبقى MyMemory وLingva في الخلف كبديلين، وحين يسقط محرك يتولى الذي يليه. الترتيب ترتيبك أنت.

يستطيع Chrome وEdge 138+ الترجمة على الجهاز أيضاً، إن سمح العتاد. يُنزَّل النموذج مرة واحدة لكل زوج لغات، ثم يجري كل شيء محلياً: دون اتصال، وبلا حدود، ولا يغادر أي نص دردشة جهازك. لا يوفر Brave وFirefox هذه الواجهة بعد، فيستخدمان المحركات أعلاه.

طريقة العرض

الترجمة أسفل النص الأصلي، أو في السطر نفسه، أو بعده بخط مائل أصغر، أو عند تمرير المؤشر فقط. لا يطلب وضع تمرير المؤشر شيئاً حتى تشير إلى رسالة، ما يخفض الاستهلاك نحو عشرة أضعاف على دردشة سريعة.

عوامل التصفية

تجاهل الروبوتات، احجب مستخدمين أو قنوات، أو حدد لغات المصدر التي تُترجم أصلاً. تُزال الرموز والإشارات والروابط وأكوام الإيموجي قبل إرسال أي شيء، فلا تدفع مقابل ترجمة "kkkkkk". وتتوقف علامات التبويب في الخلفية من تلقاء نفسها.

42 لغة، بما فيها الكتابة من اليمين إلى اليسار (العربية والعبرية والفارسية)، مع فصل المتغيرات الإقليمية (pt-BR وzh-TW). وواجهة الإضافة نفسها متوفرة بعشر لغات: الإنجليزية والإسبانية والفرنسية والبرتغالية والتركية والروسية والعربية والصينية واليابانية والكورية.

لا حساب، ولا تحليلات، ولا خادم يخصني. تطلب الإضافة إذن التخزين، ومؤقت تنبيه كي يبقى المترجم جاهزاً وأنت تشاهد، والوصول إلى kick.com وإلى محركات الترجمة التي قد تستدعيها: Google وDeepL وMyMemory وLingva. وتقرأ أيضاً صفحة إصدارات GitHub لتخبرك بوجود نسخة أحدث، دون أن ترسل شيئاً مع ذلك الطلب. يذهب نص دردشتك إلى المحرك الذي اخترته ولا يذهب إلى أي مكان آخر، وفي وضع الجهاز لا يذهب إلى هناك أصلاً.

مفتوح المصدر، رخصة MIT: github.com/Pkkls/kick-chat-translator

## manifest.json description field (132 char limit)

Current value has an em dash and the meaningless word "pro". Replace with:

Translates Kick chat into your language as it scrolls, and your replies into the channel's.

---

## Chrome dashboard: single purpose

Kick Chat Translator does one thing: it translates chat on kick.com. Incoming
messages get their translation rendered under, inside or after the original, and
the message the user is typing gets a preview in the language the channel
broadcasts in. Every permission below exists to serve that, and the extension is
inert on every other site.

## Chrome dashboard: permission justifications

Paste each one into the matching field. Every claim here is checkable in the
source at github.com/Pkkls/kick-chat-translator.

storage
Keeps the user's own settings and nothing else: reading language, display style,
provider order, filters, and the per-day counters the popup shows
(kt.settings.v2, kt.stats.v1, kt.update.v1). A DeepL API key, if the user
chooses to add one, is held in local storage (kt.deeplKey.v1) rather than synced
storage, so it stays on the machine it was typed on instead of travelling to
every Chrome signed into the same account. None of it is transmitted anywhere.

alarms
One periodic alarm, kt.keepalive, which touches chrome.storage.session so the
MV3 service worker is not evicted between bursts of chat. Without it the first
messages after an idle gap wait for the worker to cold-start. The alarm makes no
network request and carries no data.

Host permission: https://kick.com/*
The only site the extension acts on. The content script reads chat messages
there, renders their translations in place, and adds the language control to the
chat's own action bar.

Host permission: https://api.github.com/*
A single GET to the project's own releases/latest, so the user can be told a
newer version exists. No query parameters, no body, no header identifying the
user, and nothing about their browsing is sent with it.

Host permissions: translate.googleapis.com, api.deepl.com, api-free.deepl.com,
api.mymemory.translated.net, lingva.ml, lingva.lunar.icu
The five translation engines the user picks between. Only the chat text being
translated is sent, and only to the engine selected at that moment. On Chrome
138 and later the built-in on-device translator can be used instead, in which
case no text leaves the machine at all.

Remote code
None. All JavaScript ships inside the package. Nothing is fetched and executed
at runtime, and there is no eval, no remote script tag and no hosted module.

## Chrome dashboard: data usage

Answer the privacy form as follows.

Personally identifiable information: No.
Health information: No.
Financial and payment information: No.
Location: No.
Web history: No.
User activity (clicks, mouse position, scroll): No.

Authentication information: Yes. If, and only if, the user enters a DeepL API
key, that key is stored locally and sent to DeepL to authenticate their own
requests. It is never sent anywhere else and never leaves the machine it was
entered on.

Personal communications: Yes. The text of chat messages is sent to the
translation engine the user selected, for the sole purpose of translating it. It
is not stored, not logged and not sent anywhere else. In on-device mode nothing
is sent at all.

Website content: Yes, the same chat text described above.

The three certifications all apply: the data is not sold to third parties, it is
not used or transferred for any purpose unrelated to translating chat, and it is
not used or transferred to determine creditworthiness or for lending.

## Chrome dashboard: metadata

Name: Kick Chat Translator (20 of 45 characters)
Category: Social & Communication
Language: English, with the localised listings above pasted into their own
  language tabs
Privacy policy URL: https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md
Support / homepage URL: https://github.com/Pkkls/kick-chat-translator
Screenshots: five 1280x800 PNGs, see scratchpad/harness/store/

# AMO listing (Firefox)

Separate from the Chrome copy above, and not a translation of it. The Chrome
listing leads with on-device translation; Firefox has no Translator API, so on AMO
that lead tells the reader the main feature is not for them. This one leads with
what a Firefox user actually gets and mentions on-device once, honestly, near the
end.

The listing this replaces carried the submission notes in the public description
(gecko.id, strict_min_version, "declare it in the AMO submission form", "web-ext
lint 0 errors") and claimed "Data collection: none" directly above a metadata block
reading "Collecte de données nécessaire : Contenu des sites web". Both are gone.

AMO limits: name 50 characters, summary 250, description rich text.

## AMO summary (EN, 250 char limit)

Kick chat in a language you don't read gets translated under each message as it arrives, and your replies go out in the channel's language. No account, no setup. Works on live streams and VOD.

## AMO description (EN)

Open a Kick stream where the chat is in a language you don't read. Each message gets its translation right underneath, as it comes in. A green bar at the top of chat tells you it's running.

Type a reply and a preview shows it in the channel's language above the chat box. Click the preview or press Ctrl+Enter and that version replaces what you typed, ready for you to send.

Nothing to set up. Incoming chat is translated into your browser's language, and what you write goes out in whatever the channel broadcasts in, read from Kick itself. Both are overridable in settings. It handles 7TV emotes.

ENGINES

Google works out of the box, no key and no account. Add your own free DeepL key and quality jumps on European languages: their free tier covers a million characters a month without a card. DeepL also receives the recent channel lines as context so the wording fits the conversation, and it is asked for the polite register where the language has one, keigo in Japanese or vous rather than tu in French. To make a free quota last, DeepL is spent only on the pairs where it actually beats the free engines. MyMemory and Lingva sit behind as fallbacks, and when one engine fails the next takes over. You set the order.

DISPLAY

Translation below the original, inline with it, after it in smaller italics, or only when you hover. Hover mode fetches nothing until you point at a message, which cuts usage by roughly ten times on a fast chat.

FILTERS

Skip bots, block users or channels, or limit which source languages get translated at all. Emotes, mentions, links and emoji spam are stripped before anything is sent, so you are not paying to translate "kkkkkk". Background tabs pause themselves.

42 languages, right to left included (Arabic, Hebrew, Persian), with regional variants kept apart (pt-BR, zh-TW). The extension's own interface comes in 10: English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese and Korean.

WHAT LEAVES YOUR BROWSER

The text of a chat message, and only that, to the translation engine you picked. Not your username, not the channel, not who said what. That is what the "website content" line in the permissions above refers to, and it is the whole of it. There is no account, no analytics and no server of mine: the extension talks to Kick, to the engine you chose, and to the GitHub releases page to tell you when a newer version exists, sending nothing with that last request.

Firefox does not yet ship the browser-level translation API that Chrome and Edge 138+ expose, so this build always uses the engines above. If Mozilla ships one, the extension already knows how to use it and will translate on your machine, offline and without limits.

Open source, MIT: github.com/Pkkls/kick-chat-translator

## AMO summary (FR)

Le chat Kick dans une langue que tu ne lis pas est traduit sous chaque message, au fil de l'arrivée, et tes réponses partent dans la langue de la chaîne. Sans compte, sans réglage. Marche sur les lives et les VOD.

## AMO summary (TR)

Okuyamadığın bir dildeki Kick sohbeti, her mesajın altında geldiği anda çevrilir; yanıtların da kanalın dilinde gider. Hesap gerekmez, ayar gerekmez. Canlı yayınlarda ve VOD'larda çalışır.

## AMO summary (AR)

دردشة Kick بلغة لا تقرأها تُترجم أسفل كل رسالة فور وصولها، وردودك تخرج بلغة القناة. بلا حساب وبلا إعدادات. تعمل على البث المباشر وعلى التسجيلات.

## AMO summary (JA)

読めない言語の Kick チャットが、届いたそばから各メッセージの下に翻訳されます。あなたの返信はチャンネルの言語で送れます。アカウント不要、設定不要。ライブ配信でも VOD でも動きます。

## AMO description (JA)

読めない言語でチャットが流れている Kick の配信を開いてください。届いたメッセージの真下に、その場で翻訳が付きます。チャット上部の緑のバーが、動いていることを示します。

返信を打つと、チャット欄の上に、チャンネルの言語での下書きが出ます。その下書きをクリックするか Ctrl+Enter を押すと、打った文章がその訳文に置き換わり、あとは自分で送るだけです。

設定は要りません。届くチャットはブラウザの言語に翻訳され、あなたが書いたものはチャンネルの配信言語で出ていきます。配信言語は Kick から読み取ります。どちらも設定で上書きできます。7TV のエモートにも対応しています。

エンジン

Google は鍵もアカウントも要らず、そのまま動きます。無料の DeepL キーを自分で追加すると、ヨーロッパ言語の品質がはっきり上がります。無料枠はカード不要で月100万文字です。DeepL には直近のチャンネルの発言も文脈として渡すので、言い回しが会話に沿います。丁寧な言い方がある言語では、それを指定します。日本語なら敬語、フランス語なら tu ではなく vous です。無料枠を長持ちさせるため、DeepL は無料エンジンより実際に優れている言語ペアにだけ使われます。MyMemory と Lingva が後ろに控え、あるエンジンが失敗すると次が引き継ぎます。順番はあなたが決めます。

表示

原文の下、原文と同じ行、原文のあとに小さめの斜体、あるいはカーソルを乗せたときだけ。カーソルを乗せるまで何も取りに行かない方式は、速いチャットで通信量をおよそ10分の1にします。

フィルター

ボットを飛ばす、ユーザーやチャンネルをブロックする、そもそも翻訳する元言語を絞る。エモート、メンション、リンク、絵文字の連投は送信前に取り除かれるので、「kkkkkk」を翻訳するために払うことはありません。バックグラウンドのタブは自分で止まります。

42言語。右から左に書く言語（アラビア語、ヘブライ語、ペルシア語）を含み、地域変種（pt-BR、zh-TW）も別のものとして扱います。拡張機能自身のインターフェースは10言語です。英語、スペイン語、フランス語、ポルトガル語、トルコ語、ロシア語、アラビア語、中国語、日本語、韓国語。

ブラウザから出ていくもの

チャットメッセージの本文だけが、あなたが選んだ翻訳エンジンへ送られます。ユーザー名も、チャンネル名も、誰が言ったかも送りません。上の権限にある「ウェブサイトのコンテンツ」とはこのことであり、これがそのすべてです。アカウントも、アクセス解析も、私のサーバーもありません。この拡張機能が通信する相手は Kick、あなたが選んだエンジン、そして新しいバージョンの有無を知らせるための GitHub のリリースページだけで、最後のものには何も送りません。

Firefox には、Chrome や Edge 138 以降が備えるブラウザ内蔵の翻訳 API がまだありません。そのためこのビルドは常に上のエンジンを使います。Mozilla が搭載すれば、拡張機能側はすでに使い方を知っているので、通信なし・上限なしで端末内翻訳に切り替わります。

オープンソース、MIT: github.com/Pkkls/kick-chat-translator
