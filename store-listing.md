# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 2.7.0, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

NEW IN 2.7.0

Changing the reading language now changes what is already on screen. It used to affect only messages arriving afterwards, so everything already visible kept the previous language until you reloaded the page, and the same held for the display style and the badges. A stretched message like "muuuuy biennnn", which the translation services hand straight back untouched, is now tried once more on its flattened text. Your DeepL key stays on the machine you typed it on instead of syncing to every Chrome signed into your account, and it moves across by itself. And every Kick page carries 15% less script.

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

NOUVEAU EN 2.7.0

Changer la langue de lecture change maintenant ce qui est déjà à l'écran. Seuls les messages arrivés ensuite étaient concernés, tout ce qui était visible gardait la langue précédente jusqu'au rechargement de la page, et il en allait de même pour le style d'affichage et les badges. Un message étiré comme "muuuuy biennnn", que les services de traduction renvoient tel quel, est désormais retenté une fois sur son texte aplati. Ta clé DeepL reste sur la machine où tu l'as tapée au lieu de se synchroniser vers tous les Chrome de ton compte, et elle s'y déplace toute seule. Et chaque page Kick porte 15% de script en moins.

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

2.7.0 İLE GELENLER

Okuma dilini değiştirmek artık ekranda hâlihazırda bulunanı da değiştiriyor. Önceden yalnızca sonradan gelen mesajları etkiliyordu, görünen her şey sayfayı yenileyene kadar önceki dilde kalıyordu; aynısı gösterim biçimi ve rozetler için de geçerliydi. Çeviri servislerinin olduğu gibi geri verdiği "muuuuy biennnn" gibi uzatılmış bir mesaj, artık sadeleştirilmiş metniyle bir kez daha deneniyor. DeepL anahtarın, hesabındaki bütün Chrome tarayıcılarına eşitlenmek yerine yazdığın makinede kalıyor ve oraya kendiliğinden taşınıyor. Ayrıca her Kick sayfası %15 daha az betik taşıyor.

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

الجديد في 2.7.0

تغيير لغة القراءة صار يغيّر ما هو معروض على الشاشة بالفعل. كان يؤثر في الرسائل الواردة بعده فقط، فيبقى كل ما هو ظاهر باللغة السابقة حتى تعيد تحميل الصفحة، والأمر نفسه ينطبق على طريقة العرض والشارات. والرسالة الممطوطة مثل "muuuuy biennnn"، التي تعيدها خدمات الترجمة كما هي دون تغيير، تُجرَّب الآن مرة أخرى بنصها المبسّط. ومفتاح DeepL يبقى على الجهاز الذي كتبته عليه بدل أن يُزامَن إلى كل متصفح Chrome في حسابك، وينتقل إليه تلقائياً. وكل صفحة Kick تحمل نصوصاً برمجية أقل بنسبة 15%.

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
