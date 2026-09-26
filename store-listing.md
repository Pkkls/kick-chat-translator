# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 3.0.0, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

NEW IN 3.0.0

Hide chat lines that contain a word you choose. Add keywords in the filter settings, one per line: a line containing one, in any case, disappears from the chat instead of being translated. Handy against bot commands like !fish that flood some channels.

Nine things the extension used to decide for you are yours now: text size, line spacing and typeface for the translated line, how much air its block gets, the accent colour out of four measured for contrast, the chat theme pinned dark or light instead of following the channel, a reading language remembered per channel, and two keyboard shortcuts. Every default is what the extension already did, so nothing moves until you move it.

Tab swaps what you typed for its translation. The key is taken only while the preview is on screen, so an empty box never loses it, and Shift+Tab always stays navigation.

The bar at the top of the chat translates what other viewers write; the chip at the bottom translates what you write. Nothing on screen said which was which, and an arrow on each says it now.

Flags instead of two-letter codes on every translated line, on both bars and in the language list. The language panel shows which language is selected, which it used to carry on a background you could not tell apart from hover. And "Chinese (Taiwan)" stopped rendering as "Chinese (...", which you could not tell from "Chinese".

The settings page shows what each setting is doing: the cache says how many entries it holds, the per-channel limit says whether it ever held anything back, and the language list shows how much each language actually represented.

SINCE 2.9.2

Cantonese is the 43rd language. The source language sent to the translator is right three times more often and wrong 97 percent less, measured on 5040 sentences across 43 languages, and no language is left undetected any more: twenty-six of them were. Cyrillic that could not be identified was called Russian and Arabic script was called Arabic; Bulgarian, Ukrainian and Persian are read as themselves now. Traditional Chinese was read as simplified every single time.

Open a Kick stream where the chat is in a language you don't read. Each message gets its translation right underneath, as it comes in. A green bar at the top of chat tells you it's running.

Type a reply and a preview shows it in the channel's language above the chat box. Click the preview or press Tab and that version replaces what you typed in the chat box, ready for you to send.

Nothing to set up. Incoming chat is translated into your browser's language, and what you write goes out in whatever the channel broadcasts in, read from Kick itself. Both are overridable in settings. Works on live streams and on VOD replays, and it handles 7TV emotes.

ENGINES

Google works out of the box, no key, no account. Add your own free DeepL key (their free tier covers 1 million characters a month without a card) and quality jumps on European languages. DeepL also receives the recent channel lines as context so the wording fits the conversation, and it's asked for the polite register where the language has one: keigo in Japanese, vous rather than tu in French. To make a free quota last, DeepL is spent only on the pairs where it actually beats the free engines. MyMemory and Lingva sit behind as fallbacks, and when one engine fails the next takes over. You set the order.

Chrome and Edge 138+ can also translate on-device, hardware permitting. The model downloads once per language pair, then everything runs locally: offline, unlimited, and no chat text leaves your machine. Brave and Firefox don't ship that API yet, so they use the engines above.

DISPLAY

Translation below the original, inline with it, after it in smaller italics, or only when you hover. Hover mode fetches nothing until you point at a message, which cuts usage by roughly 10x on a fast chat.

FILTERS

Skip bots, blocklist users or channels, or limit which source languages get translated at all. Emotes, mentions, links and emoji spam are stripped before anything is sent out, so you're not paying to translate "kkkkkk". Background tabs pause themselves.

43 languages, right-to-left included (Arabic, Hebrew, Persian), with regional variants kept apart (pt-BR, zh-TW). The extension's own interface comes in 10: English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese and Korean.

No account, no analytics, no server of mine. It asks for storage, for a wake-up timer so the translator stays ready while you watch, and for access to kick.com plus the translation engines it can call: Google, DeepL, MyMemory and Lingva. It also reads the GitHub releases page to tell you when a newer version exists, sending nothing with that request. Your chat text goes to the engine you picked and nowhere else, and on-device it doesn't even go there.

Open source, MIT: github.com/Pkkls/kick-chat-translator

## Description (FR)

Short summary: Chat Kick dans une langue que tu ne lis pas ? Traduit sous chaque message, en direct. Tes reponses partent dans celle de la chaine.

NOUVEAU EN 3.0.0

Masque les lignes du chat qui contiennent un mot de ton choix. Ajoute tes mots-clés dans les réglages des filtres, un par ligne : une ligne qui en contient un, en majuscules ou non, disparaît du chat au lieu d'être traduite. Pratique contre les commandes de bots comme !fish qui inondent certaines chaînes.

Neuf choses que l'extension décidait pour toi t'appartiennent : taille du texte, interligne et police de la ligne traduite, l'air autour de son bloc, la couleur d'accent parmi quatre mesurées pour leur contraste, le thème du chat figé en sombre ou en clair au lieu de suivre la chaîne, une langue de lecture retenue par chaîne, et deux raccourcis clavier. Chaque valeur par défaut est ce que l'extension faisait déjà : rien ne bouge tant que tu ne bouges rien.

Tab remplace ce que tu as tapé par sa traduction. La touche n'est prise que tant que l'aperçu est à l'écran, donc une boîte vide ne la perd jamais, et Shift+Tab reste toujours la navigation.

La barre en haut du chat traduit ce que les autres écrivent ; la puce en bas traduit ce que tu écris. Rien à l'écran ne les distinguait, une flèche sur chacune le dit maintenant.

Des drapeaux au lieu des codes à deux lettres sur chaque ligne traduite, sur les deux barres et dans la liste des langues. Le panneau des langues montre laquelle est choisie, ce qu'il portait avant sur un fond qu'on ne distinguait pas du survol. Et « Chinese (Taiwan) » ne s'affiche plus « Chinese (... », indécidable à côté de « Chinese ».

La page de réglages montre ce que chaque réglage fait : le cache dit combien d'entrées il contient, le plafond par chaîne dit s'il a déjà retenu quelque chose, et la liste des langues montre ce que chacune a représenté.

DEPUIS 2.9.2

Le cantonais est la 43e langue. La langue source envoyée au traducteur est juste trois fois plus souvent et fausse 97 pour cent moins, mesuré sur 5040 phrases dans 42 langues, et plus aucune langue ne reste non détectée : vingt-six l'étaient. Le cyrillique non identifié était appelé russe et l'écriture arabe était appelée arabe ; le bulgare, l'ukrainien et le persan sont lus pour eux-mêmes. Le chinois traditionnel était lu comme du simplifié à chaque fois.

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

3.0.0 İLE GELENLER

Seçtiğiniz bir kelimeyi içeren sohbet satırlarını gizleyin. Anahtar kelimeleri filtre ayarlarına her satıra bir tane olacak şekilde ekleyin: bunlardan birini içeren bir satır, büyük ya da küçük harfle yazılmış olsun, çevrilmek yerine sohbetten kaybolur. Bazı kanalları dolduran !fish gibi bot komutlarına karşı işe yarar.

Uzantının sizin yerinize karar verdiği dokuz şey artık sizin: çevrilen satırın yazı boyutu, satır aralığı ve yazı tipi, bloğunun aldığı boşluk, kontrast ölçülerek belirlenmiş dört vurgu renginden biri, kanalı izlemek yerine koyu ya da açığa sabitlenen sohbet teması, her kanal için hatırlanan bir okuma dili ve iki klavye kısayolu. Her varsayılan, uzantının zaten yaptığı şeydir: siz oynatana kadar hiçbir şey oynamaz.

Tab yazdığınızı çevirisiyle değiştirir. Tuş yalnızca önizleme ekrandayken alınır, boş bir kutu onu asla kaybetmez ve Shift+Tab her zaman gezinme kalır.

Sohbetin üstündeki çubuk başkalarının yazdığını çevirir; alttaki düğme sizin yazdığınızı çevirir. Ekranda hiçbir şey ikisini ayırmıyordu, artık her birinde bir ok bunu söylüyor.

Her çevrilen satırda, iki çubukta ve dil listesinde iki harfli kodlar yerine bayraklar. Dil paneli hangi dilin seçili olduğunu gösteriyor; önceden bunu, üzerine gelmekten ayırt edilemeyen bir zeminde taşıyordu. Ve "Chinese (Taiwan)" artık "Chinese (..." olarak görünmüyor, ki bu "Chinese"den ayırt edilemiyordu.

Ayarlar sayfası her ayarın ne yaptığını gösteriyor: önbellek kaç kayıt tuttuğunu, kanal başına sınır bir şey tutup tutmadığını, dil listesi de her dilin ne kadarını temsil ettiğini söylüyor.

2.9.2'DEN BERİ

Kantonca 43. dil. Çevirmene bildirilen kaynak dil üç kat daha sık doğru ve yüzde 97 daha az yanlış; 42 dilde 5040 cümle üzerinde ölçüldü, ve artık hiçbir dil tespit edilmeden kalmıyor: yirmi altı tanesi kalıyordu. Tanımlanamayan Kiril Rusça, Arap yazısı da Arapça sayılıyordu; Bulgarca, Ukraynaca ve Farsça kendileri olarak okunuyor. Geleneksel Çince her seferinde basitleştirilmiş okunuyordu.

Okuyamadığın bir dilde sohbet akan bir Kick yayını aç. Her mesaj, geldiği anda, hemen altında çevirisini alır. Sohbetin üstündeki yeşil çubuk çalıştığını gösterir.

Bir yanıt yaz, sohbet kutusunun üstünde kanalın dilinde bir önizleme belirir. Önizlemeye tıkla ya da Tab'a bas, o sürüm yazdığının yerine geçer ve göndermeye hazır olur.

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

الجديد في 3.0.0

أخفِ أسطر الدردشة التي تحتوي على كلمة تختارها. أضف كلماتك المفتاحية في إعدادات عوامل التصفية، كلمة في كل سطر: أي سطر يحتوي على إحداها، بأحرف كبيرة أو صغيرة، يختفي من الدردشة بدل أن يُترجم. مفيد ضد أوامر البوتات مثل !fish التي تغمر بعض القنوات.

تسعة أمور كانت الإضافة تقررها عنك صارت لك: حجم النص وتباعد الأسطر وخط السطر المترجم، والمساحة حول كتلته، ولون التمييز من بين أربعة مقيسة على التباين، وسمة الدردشة مثبّتة داكنة أو فاتحة بدل اتباع القناة، ولغة قراءة محفوظة لكل قناة، واختصاران للوحة المفاتيح. كل قيمة افتراضية هي ما كانت الإضافة تفعله أصلًا: لا شيء يتحرك حتى تحركه أنت.

Tab يستبدل ما كتبته بترجمته. لا يُؤخذ المفتاح إلا والمعاينة ظاهرة، فالحقل الفارغ لا يفقده أبدًا، وShift+Tab يبقى دائمًا للتنقل.

الشريط أعلى الدردشة يترجم ما يكتبه الآخرون، والزر أسفلها يترجم ما تكتبه أنت. لم يكن شيء على الشاشة يفرّق بينهما، والآن يقول ذلك سهم على كل منهما.

أعلام بدل الرموز المكوّنة من حرفين في كل سطر مترجم، وعلى الشريطين، وفي قائمة اللغات. لوحة اللغات تُظهر اللغة المختارة، وقد كانت تحمل ذلك على خلفية لا تُميّز عن حالة المرور بالمؤشر. ولم تعد "Chinese (Taiwan)" تظهر "...Chinese (" التي لا تُميّز عن "Chinese".

صفحة الإعدادات تُظهر ما يفعله كل إعداد: المخبأ يقول كم مدخلًا يحمل، وحد القناة يقول إن كان قد أوقف شيئًا، وقائمة اللغات تُظهر نصيب كل لغة.

منذ 2.9.2

الكانتونية هي اللغة الثالثة والأربعون. اللغة المصدر المرسلة للمترجم صحيحة ثلاثة أضعاف وخاطئة بنسبة أقل 97 بالمئة، مقيسة على 5040 جملة من 42 لغة، ولم تعد أي لغة بلا تعرّف: كانت ست وعشرون كذلك. السيريلية غير المعروفة كانت تُسمّى روسية والكتابة العربية تُسمّى عربية؛ البلغارية والأوكرانية والفارسية تُقرأ على حقيقتها. الصينية التقليدية كانت تُقرأ مبسّطة في كل مرة.

افتح بثاً على Kick تجري دردشته بلغة لا تقرأها. تحصل كل رسالة على ترجمتها أسفلها مباشرةً، فور وصولها. الشريط الأخضر أعلى الدردشة يخبرك أن الإضافة تعمل.

اكتب رداً، فتظهر معاينة له بلغة القناة فوق صندوق الدردشة. انقر المعاينة أو اضغط Tab، فتحل تلك النسخة محل ما كتبته، جاهزة للإرسال.

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

## Description (JA)

Paste into the Japanese listing in the developer dashboard. The body is the
Japanese AMO description with its Firefox paragraph swapped for Chrome's
on-device one, which is the only place the two stores disagree. No native
reader was available; same standard as the Turkish and Arabic blocks above.

Short summary: 読めない言語の Kick チャットが、届いたそばから各メッセージの下に翻訳されます。あなたの返信はチャンネルの言語で送れます。

3.0.0 の新機能

選んだ言葉を含むチャットの行を非表示にできます。フィルター設定にキーワードを一行に一つずつ追加すると、そのどれかを含む行は大文字小文字を問わず、翻訳される代わりにチャットから消えます。一部のチャンネルにあふれる !fish のようなボットのコマンドに便利です。

拡張機能が決めていた九つのことが、あなたのものになりました。訳文の文字サイズ、行間、書体、ブロックの余白、コントラストを測って決めた四色のアクセント、チャンネルに合わせる代わりに固定できるダークかライトのテーマ、チャンネルごとに覚える読む言語、そして二つのキーボードショートカット。どの初期値も拡張機能がすでにしていたことなので、あなたが動かすまで何も動きません。

Tab で入力した文をその訳に置き換えます。プレビューが表示されている間だけキーを取るので、空の入力欄で失われることはなく、Shift+Tab は常に移動のままです。

チャット上部のバーは他の視聴者が書いたものを訳し、下部のボタンはあなたが書くものを訳します。画面上に区別がありませんでしたが、今はそれぞれの矢印が示します。

訳された各行、両方のバー、言語一覧で、二文字のコードではなく国旗を表示します。言語パネルはどの言語を選んでいるかを示します。以前はカーソルを重ねた状態と見分けのつかない背景でそれを表していました。また「Chinese (Taiwan)」が「Chinese (...」と表示されて「Chinese」と区別できなかった問題もなくなりました。

設定ページは各設定の働きを示します。キャッシュは何件保持しているか、チャンネルごとの上限は実際に何かを止めたか、言語一覧は各言語がどれだけを占めたかを答えます。

2.9.2 以降

広東語が 43 番目の言語になりました。翻訳機に渡す元言語は 3 倍正しく、誤りは 97 パーセント減りました。42 言語 5040 文で測定しています。検出されないまま残る言語はなくなりました。以前は 26 ありました。判別できないキリル文字はロシア語、アラビア文字はアラビア語と呼ばれていましたが、ブルガリア語、ウクライナ語、ペルシア語はそれ自身として読まれます。繁体字中国語は毎回簡体字として読まれていました。

読めない言語でチャットが流れている Kick の配信を開いてください。届いたメッセージの真下に、その場で翻訳が付きます。チャット上部の緑のバーが、動いていることを示します。

返信を打つと、チャット欄の上に、チャンネルの言語での下書きが出ます。その下書きをクリックするか Tab を押すと、打った文章がその訳文に置き換わり、あとは自分で送るだけです。

設定は要りません。届くチャットはブラウザの言語に翻訳され、あなたが書いたものはチャンネルの配信言語で出ていきます。配信言語は Kick から読み取ります。どちらも設定で上書きできます。ライブ配信でも VOD の録画でも動き、7TV のエモートにも対応しています。

エンジン

Google は鍵もアカウントも要らず、そのまま動きます。無料の DeepL キーを自分で追加すると、ヨーロッパ言語の品質がはっきり上がります。無料枠はカード不要で月100万文字です。DeepL には直近のチャンネルの発言も文脈として渡すので、言い回しが会話に沿います。丁寧な言い方がある言語では、それを指定します。日本語なら敬語、フランス語なら tu ではなく vous です。無料枠を長持ちさせるため、DeepL は無料エンジンより実際に優れている言語ペアにだけ使われます。MyMemory と Lingva が後ろに控え、あるエンジンが失敗すると次が引き継ぎます。順番はあなたが決めます。

Chrome と Edge は 138 以降、端末内での翻訳もできます。ハードウェアが対応していればの話です。モデルは言語ペアごとに一度だけダウンロードされ、あとはすべて手元で動きます。オフラインで、上限なしで、チャットの文章は端末から出ません。Brave と Firefox はこの API をまだ搭載していないので、上のエンジンを使います。

表示

原文の下、原文と同じ行、原文のあとに小さめの斜体、あるいはカーソルを乗せたときだけ。カーソルを乗せるまで何も取りに行かない方式は、速いチャットで通信量をおよそ10分の1にします。

フィルター

ボットを飛ばす、ユーザーやチャンネルをブロックする、そもそも翻訳する元言語を絞る。エモート、メンション、リンク、絵文字の連投は送信前に取り除かれるので、「kkkkkk」を翻訳するために払うことはありません。バックグラウンドのタブは自分で止まります。

42言語。右から左に書く言語（アラビア語、ヘブライ語、ペルシア語）を含み、地域変種（pt-BR、zh-TW）も別のものとして扱います。拡張機能自身のインターフェースは10言語です。英語、スペイン語、フランス語、ポルトガル語、トルコ語、ロシア語、アラビア語、中国語、日本語、韓国語。

アカウントも、アクセス解析も、私のサーバーもありません。必要なのは保存領域、見ている間に翻訳機能を待機させておくためのタイマー、そして kick.com と、呼び出しうる翻訳エンジン（Google、DeepL、MyMemory、Lingva）へのアクセスです。新しいバージョンがあることを知らせるために GitHub のリリースページも読みますが、その通信には何も乗せません。あなたのチャットの文章は選んだエンジンにだけ送られ、端末内モードではそこにも行きません。

オープンソース、MIT: github.com/Pkkls/kick-chat-translator

## Description (ES)

Paste into the Spanish listing. Same standard as the other localised blocks:
no native reader.

Short summary: ¿Chat de Kick en un idioma que no lees? Se traduce bajo cada mensaje, en directo, y tus respuestas salen en el del canal.

NUEVO EN 3.0.0

Oculta las líneas del chat que contienen una palabra que tú eliges. Añade tus palabras clave en los ajustes de filtros, una por línea: una línea que contenga una, en mayúsculas o no, desaparece del chat en lugar de traducirse. Útil contra los comandos de bots como !fish que inundan algunos canales.

Nueve cosas que la extensión decidía por ti ahora son tuyas: tamaño del texto, interlineado y tipografía de la línea traducida, el aire alrededor de su bloque, el color de acento entre cuatro medidos por contraste, el tema del chat fijado en oscuro o claro en vez de seguir al canal, un idioma de lectura recordado por canal, y dos atajos de teclado. Cada valor por defecto es lo que la extensión ya hacía: nada se mueve hasta que tú lo muevas.

Tab cambia lo que escribiste por su traducción. Solo se toma mientras la vista previa está en pantalla, así que una caja vacía nunca la pierde, y Shift+Tab sigue siendo navegación siempre.

La barra de arriba del chat traduce lo que escriben los demás; el botón de abajo traduce lo que escribes tú. Nada en pantalla los separaba, y ahora una flecha en cada uno lo dice.

Banderas en vez de códigos de dos letras en cada línea traducida, en ambas barras y en la lista de idiomas. El panel de idiomas muestra cuál está seleccionado, algo que antes llevaba sobre un fondo que no se distinguía del cursor encima. Y "Chinese (Taiwan)" ya no aparece como "Chinese (...", indistinguible de "Chinese".

La página de ajustes muestra lo que hace cada ajuste: la caché dice cuántas entradas guarda, el límite por canal dice si alguna vez retuvo algo, y la lista de idiomas muestra cuánto representó cada uno.

DESDE 2.9.2

El cantonés es el idioma 43. El idioma de origen enviado al traductor acierta tres veces más y falla un 97 por ciento menos, medido en 5040 frases de 42 idiomas, y ningún idioma queda sin detectar: veintiséis lo estaban. El cirílico no identificado se llamaba ruso y la escritura árabe se llamaba árabe; el búlgaro, el ucraniano y el persa se leen como sí mismos. El chino tradicional se leía como simplificado siempre.

Abre un directo de Kick donde el chat esté en un idioma que no lees. Cada mensaje recibe su traducción justo debajo, según va llegando. Una barra verde en la parte superior del chat te dice que está funcionando.

Escribe una respuesta y una vista previa la muestra en el idioma del canal, encima de la caja de chat. Haz clic en la vista previa o pulsa Ctrl+Intro y esa versión sustituye lo que escribiste, lista para enviar.

Nada que configurar. El chat entrante se traduce al idioma de tu navegador, y lo que escribes sale en el idioma en el que emite el canal, leído del propio Kick. Ambos se pueden cambiar en los ajustes. Funciona en directos y en repeticiones VOD, y admite los emotes de 7TV.

MOTORES

Google funciona sin más, sin clave y sin cuenta. Añade tu propia clave gratuita de DeepL (su plan gratuito cubre un millón de caracteres al mes sin tarjeta) y la calidad sube claramente en los idiomas europeos. DeepL recibe además las líneas recientes del canal como contexto, así la redacción encaja con la conversación, y se le pide el registro formal donde el idioma lo tiene: keigo en japonés, vous en vez de tu en francés. Para que la cuota gratuita dure, DeepL solo se gasta en los pares donde de verdad supera a los motores gratuitos. MyMemory y Lingva quedan detrás como respaldo, y cuando un motor falla toma el relevo el siguiente. El orden lo pones tú.

Chrome y Edge 138+ también pueden traducir en el propio dispositivo, si el hardware lo permite. El modelo se descarga una vez por par de idiomas y a partir de ahí todo corre en local: sin conexión, sin límite, y ningún texto del chat sale de tu máquina. Brave y Firefox aún no incluyen esa API, así que usan los motores de arriba.

PRESENTACIÓN

Traducción debajo del original, en la misma línea, después en cursiva más pequeña, o solo al pasar el ratón. El modo al pasar el ratón no pide nada hasta que apuntas a un mensaje, lo que reduce el uso unas 10 veces en un chat rápido.

FILTROS

Saltarse los bots, bloquear usuarios o canales, o limitar qué idiomas de origen se traducen. Emotes, menciones, enlaces y avalanchas de emoji se quitan antes de enviar nada, así no pagas por traducir "kkkkkk". Las pestañas en segundo plano se pausan solas.

42 idiomas, incluida la escritura de derecha a izquierda (árabe, hebreo, persa), con las variantes regionales separadas (pt-BR, zh-TW). La interfaz de la extensión existe en 10: inglés, español, francés, portugués, turco, ruso, árabe, chino, japonés y coreano.

Sin cuenta, sin analíticas, sin servidor mío. Pide almacenamiento, un temporizador para que el traductor siga listo mientras miras, y acceso a kick.com más los motores de traducción que puede llamar: Google, DeepL, MyMemory y Lingva. También lee la página de versiones de GitHub para avisarte de que existe una más nueva, sin enviar nada con esa petición. El texto de tu chat va al motor que elegiste y a ningún otro sitio, y en modo local ni siquiera va ahí.

Código abierto, MIT: github.com/Pkkls/kick-chat-translator

## Description (PT-BR)

Paste into the Portuguese listing. Same standard as the other localised blocks:
no native reader.

Short summary: Chat da Kick num idioma que você não lê? Ele é traduzido embaixo de cada mensagem, ao vivo, e suas respostas saem no do canal.

NOVIDADES NA 3.0.0

Esconda as linhas do chat que contêm uma palavra que você escolher. Adicione suas palavras-chave nas configurações de filtros, uma por linha: uma linha que contenha uma delas, em maiúsculas ou não, some do chat em vez de ser traduzida. Útil contra comandos de bots como !fish que inundam alguns canais.

Nove coisas que a extensão decidia por você agora são suas: tamanho do texto, entrelinha e fonte da linha traduzida, o ar em volta do bloco, a cor de destaque entre quatro medidas por contraste, o tema do chat fixado em escuro ou claro em vez de seguir o canal, um idioma de leitura lembrado por canal, e dois atalhos de teclado. Cada padrão é o que a extensão já fazia: nada muda até você mudar.

Tab troca o que você digitou pela tradução. A tecla só é tomada enquanto a prévia está na tela, então uma caixa vazia nunca a perde, e Shift+Tab continua sempre sendo navegação.

A barra no topo do chat traduz o que os outros escrevem; o botão embaixo traduz o que você escreve. Nada na tela separava os dois, e agora uma seta em cada um diz isso.

Bandeiras em vez de códigos de duas letras em cada linha traduzida, nas duas barras e na lista de idiomas. O painel de idiomas mostra qual está selecionado, o que antes ficava num fundo que não dava para distinguir do cursor por cima. E "Chinese (Taiwan)" parou de aparecer como "Chinese (...", indistinguível de "Chinese".

A página de configurações mostra o que cada opção faz: o cache diz quantas entradas guarda, o limite por canal diz se já segurou alguma coisa, e a lista de idiomas mostra quanto cada um representou.

DESDE A 2.9.2

O cantonês é o 43º idioma. O idioma de origem enviado ao tradutor acerta três vezes mais e erra 97 por cento menos, medido em 5040 frases de 42 idiomas, e nenhum idioma fica sem detecção: vinte e seis ficavam. O cirílico não identificado era chamado de russo e a escrita árabe de árabe; búlgaro, ucraniano e persa são lidos como eles mesmos. O chinês tradicional era lido como simplificado sempre.

Abra uma transmissão na Kick onde o chat está num idioma que você não lê. Cada mensagem recebe sua tradução logo abaixo, conforme chega. Uma barra verde no topo do chat mostra que está funcionando.

Digite uma resposta e uma prévia a mostra no idioma do canal, acima da caixa de chat. Clique na prévia ou pressione Tab e essa versão substitui o que você digitou, pronta para enviar.

Nada para configurar. O chat que chega é traduzido para o idioma do seu navegador, e o que você escreve sai no idioma em que o canal transmite, lido da própria Kick. Os dois podem ser trocados nas configurações. Funciona em transmissões ao vivo e em replays VOD, e lida com os emotes do 7TV.

MOTORES

O Google funciona de cara, sem chave e sem conta. Adicione sua própria chave gratuita da DeepL (o plano gratuito cobre um milhão de caracteres por mês sem cartão) e a qualidade sobe bastante nos idiomas europeus. A DeepL também recebe as linhas recentes do canal como contexto, então o texto acompanha a conversa, e é pedido o registro formal onde o idioma tem um: keigo em japonês, vous em vez de tu em francês. Para a cota gratuita durar, a DeepL só é gasta nos pares em que ela realmente supera os motores gratuitos. MyMemory e Lingva ficam atrás como reserva, e quando um motor falha o seguinte assume. A ordem é sua.

Chrome e Edge 138+ também traduzem no próprio aparelho, se o hardware permitir. O modelo é baixado uma vez por par de idiomas e depois tudo roda localmente: sem conexão, sem limite, e nenhum texto de chat sai da sua máquina. Brave e Firefox ainda não trazem essa API, então usam os motores acima.

EXIBIÇÃO

Tradução abaixo do original, na mesma linha, depois dele em itálico menor, ou só ao passar o mouse. O modo ao passar o mouse não busca nada até você apontar para uma mensagem, o que corta o uso em cerca de 10 vezes num chat rápido.

FILTROS

Pular bots, bloquear usuários ou canais, ou limitar quais idiomas de origem são traduzidos. Emotes, menções, links e enxurradas de emoji são removidos antes de qualquer envio, então você não paga para traduzir "kkkkkk". Abas em segundo plano se pausam sozinhas.

42 idiomas, incluindo escrita da direita para a esquerda (árabe, hebraico, persa), com as variantes regionais mantidas separadas (pt-BR, zh-TW). A interface da extensão existe em 10: inglês, espanhol, francês, português, turco, russo, árabe, chinês, japonês e coreano.

Sem conta, sem analytics, sem servidor meu. Ela pede armazenamento, um temporizador para o tradutor ficar pronto enquanto você assiste, e acesso à kick.com mais os motores de tradução que pode chamar: Google, DeepL, MyMemory e Lingva. Também lê a página de versões do GitHub para avisar que existe uma mais nova, sem enviar nada nessa requisição. O texto do seu chat vai para o motor que você escolheu e para nenhum outro lugar, e no modo local nem para lá.

Código aberto, MIT: github.com/Pkkls/kick-chat-translator

## Description (RU)

Paste into the Russian listing. Same standard as the other localised blocks:
no native reader.

Short summary: Чат Kick на языке, который вы не читаете? Перевод появляется под каждым сообщением, а ваши ответы уходят на языке канала.

НОВОЕ В 3.0.0

Скрывайте строки чата, в которых есть выбранное вами слово. Добавьте ключевые слова в настройках фильтров, по одному в строке: строка, содержащая любое из них, в любом регистре, исчезает из чата, а не переводится. Удобно против команд ботов вроде !fish, которые заполоняют некоторые каналы.

Девять вещей, которые расширение решало за вас, теперь ваши: размер текста, межстрочный интервал и шрифт переведённой строки, воздух вокруг её блока, акцентный цвет из четырёх, измеренных на контраст, тема чата, закреплённая тёмной или светлой вместо следования каналу, язык чтения, запомненный для каждого канала, и два сочетания клавиш. Все значения по умолчанию совпадают с тем, что расширение уже делало: ничего не сдвинется, пока вы сами не сдвинете.

Tab заменяет набранное его переводом. Клавиша занята только пока предпросмотр на экране, поэтому пустое поле её никогда не теряет, а Shift+Tab всегда остаётся навигацией.

Панель вверху чата переводит то, что пишут другие; кнопка внизу переводит то, что пишете вы. Ничто на экране их не различало, теперь об этом говорит стрелка на каждой.

Флаги вместо двухбуквенных кодов в каждой переведённой строке, на обеих панелях и в списке языков. Панель языков показывает, какой язык выбран. Раньше она несла это на фоне, который нельзя было отличить от наведения. И "Chinese (Taiwan)" больше не отображается как "Chinese (...", что не отличить от "Chinese".

Страница настроек показывает, что делает каждая настройка: кэш говорит, сколько записей хранит, лимит на канал сообщает, задерживал ли он что-нибудь, а список языков показывает, сколько каждый из них составил.

С 2.9.2

Кантонский стал 43-м языком. Язык оригинала, сообщаемый переводчику, верен втрое чаще и ошибочен на 97 процентов реже, измерено на 5040 предложениях 42 языков, и ни один язык больше не остаётся неопознанным: двадцать шесть оставались. Неопознанная кириллица называлась русским, а арабское письмо называлось арабским; болгарский, украинский и персидский читаются как они есть. Традиционный китайский каждый раз читался как упрощённый.

Откройте трансляцию на Kick, где чат идёт на языке, который вы не читаете. Каждое сообщение получает перевод прямо под собой, по мере поступления. Зелёная полоса вверху чата показывает, что всё работает.

Наберите ответ, и над полем ввода появится его вариант на языке канала. Щёлкните по нему или нажмите Tab, и этот вариант заменит набранный текст, останется только отправить.

Настраивать нечего. Входящий чат переводится на язык вашего браузера, а то, что вы пишете, уходит на языке вещания канала, считанном у самого Kick. Оба меняются в настройках. Работает на прямых эфирах и на записях VOD, поддерживает эмоуты 7TV.

ДВИЖКИ

Google работает сразу, без ключа и без аккаунта. Добавьте свой бесплатный ключ DeepL (бесплатный тариф покрывает миллион символов в месяц без карты), и качество заметно вырастет на европейских языках. DeepL получает и недавние строки канала как контекст, поэтому формулировки ложатся в разговор, и у него запрашивается вежливый регистр там, где язык его имеет: кэйго в японском, vous вместо tu во французском. Чтобы бесплатной квоты хватало надолго, DeepL тратится только на те пары, где он действительно лучше бесплатных движков. MyMemory и Lingva стоят позади как запасные, и когда один движок отказывает, подхватывает следующий. Порядок задаёте вы.

Chrome и Edge 138 и новее умеют переводить и на самом устройстве, если позволяет железо. Модель скачивается один раз на пару языков, дальше всё считается локально: без сети, без лимита, и текст чата не покидает вашу машину. В Brave и Firefox этого API пока нет, они используют движки выше.

ОТОБРАЖЕНИЕ

Перевод под оригиналом, в одну строку с ним, после него мелким курсивом или только при наведении. Режим наведения ничего не запрашивает, пока вы не укажете на сообщение, что снижает расход примерно в 10 раз на быстром чате.

ФИЛЬТРЫ

Пропускать ботов, блокировать пользователей или каналы, ограничивать, какие исходные языки вообще переводятся. Эмоуты, упоминания, ссылки и лавины эмодзи вырезаются до отправки, так что вы не платите за перевод «kkkkkk». Фоновые вкладки останавливаются сами.

42 языка, включая письмо справа налево (арабский, иврит, персидский), с раздельными региональными вариантами (pt-BR, zh-TW). Интерфейс самого расширения есть на 10 языках: английский, испанский, французский, португальский, турецкий, русский, арабский, китайский, японский и корейский.

Ни аккаунта, ни аналитики, ни моего сервера. Расширение просит хранилище, таймер пробуждения, чтобы переводчик оставался наготове, пока вы смотрите, и доступ к kick.com плюс к движкам перевода, которые оно может вызвать: Google, DeepL, MyMemory и Lingva. Оно также читает страницу релизов на GitHub, чтобы сообщить о новой версии, и ничего не отправляет с этим запросом. Текст вашего чата уходит только выбранному движку и никуда больше, а в локальном режиме не уходит и туда.

Открытый исходный код, MIT: github.com/Pkkls/kick-chat-translator

## Description (ZH)

Paste into the Simplified Chinese listing. Same standard as the other localised
blocks: no native reader.

Short summary: Kick 的聊天是你读不懂的语言？每条消息下方都会实时出现译文，你的回复也会用频道的语言发出。

3.0.0 的新功能

隐藏包含你所选词语的聊天行。在过滤设置里添加关键词，每行一个：含有其中任何一个的行，不论大小写，都会从聊天中消失，而不是被翻译。对付 !fish 这类刷屏的机器人命令很方便。

扩展过去替你决定的九件事，现在归你了：译文的文字大小、行距、字体，它那一块留多少空白，四种测过对比度的强调色之一，固定为深色或浅色而不再跟随频道的聊天主题，按频道记住的阅读语言，以及两个键盘快捷键。每一项默认值都是扩展原本就在做的事：你不动，它就不动。

Tab 把你打的字换成它的译文。只有预览在屏幕上时才占用这个键，所以空输入框永远不会丢掉它，而 Shift+Tab 始终是导航。

聊天顶部的栏翻译别人写的内容，底部的按钮翻译你写的内容。屏幕上没有任何东西区分两者，现在各自的箭头说明了。

每一行译文、两条栏以及语言列表，都用国旗代替两个字母的代码。语言面板会显示当前选中的是哪一种语言，以前它把这个状态放在一个和鼠标悬停分不出来的底色上。另外 "Chinese (Taiwan)" 不再显示成 "Chinese (..."，那时它和 "Chinese" 无法区分。

设置页会显示每一项设置在做什么：缓存会说它存了多少条，按频道的上限会说它是否真的拦下过东西，语言列表会显示每种语言各占多少。

自 2.9.2 起

粤语是第 43 种语言。发给翻译引擎的源语言正确率提高到三倍，出错减少 97 个百分点，在 42 种语言的 5040 个句子上测得，而且不再有语言无法识别：以前有二十六种。无法辨认的西里尔文被当作俄语，阿拉伯字母被当作阿拉伯语；保加利亚语、乌克兰语和波斯语现在被读作它们自己。繁体中文过去每次都被读成简体。

打开一个聊天语言你读不懂的 Kick 直播。每条消息一到，正下方就会出现它的译文。聊天区顶部的绿色条表示正在运行。

输入回复时，聊天框上方会用频道的语言显示一份预览。点击预览或按 Tab，这个版本就会替换你输入的内容，直接发送即可。

无需设置。收到的聊天会翻译成你浏览器的语言，你写的内容会用频道的直播语言发出，该语言从 Kick 自身读取。两者都可以在设置里覆盖。直播和 VOD 回放都能用，并支持 7TV 表情。

引擎

Google 开箱即用，不需要密钥，也不需要账号。加上你自己的免费 DeepL 密钥（免费额度每月一百万字符，无需信用卡），欧洲语言的质量会明显提升。DeepL 还会收到频道最近的发言作为上下文，因此措辞贴合对话；在有敬语体系的语言中会要求礼貌语体：日语的敬语，法语的 vous 而非 tu。为了让免费额度用得久，只有在 DeepL 确实优于免费引擎的语言对上才会消耗它。MyMemory 和 Lingva 在后面待命，一个引擎失败时由下一个接手。顺序由你决定。

Chrome 和 Edge 138 及以上还能在设备端翻译，前提是硬件支持。模型按语言对下载一次，之后全部在本地运行：离线、无上限，聊天文本不会离开你的机器。Brave 和 Firefox 尚未提供该 API，因此使用上面的引擎。

显示

译文在原文下方、与原文同一行、在原文之后以更小的斜体显示，或者仅在鼠标悬停时显示。悬停模式在你指向某条消息之前不会发起任何请求，在快速滚动的聊天中大约能把用量降到十分之一。

过滤

跳过机器人，屏蔽用户或频道，或限制哪些源语言会被翻译。表情、提及、链接和刷屏 emoji 在发送前就会被剥离，所以你不会为翻译「kkkkkk」付费。后台标签页会自行暂停。

42 种语言，包含从右向左书写的语言（阿拉伯语、希伯来语、波斯语），并且区分地区变体（pt-BR、zh-TW）。扩展自身的界面有 10 种语言：英语、西班牙语、法语、葡萄牙语、土耳其语、俄语、阿拉伯语、中文、日语和韩语。

没有账号，没有分析统计，也没有我的服务器。它需要存储权限、一个唤醒定时器以便你观看时翻译器保持就绪，以及访问 kick.com 和它可能调用的翻译引擎：Google、DeepL、MyMemory 和 Lingva。它还会读取 GitHub 的发布页面来告知有新版本，该请求不携带任何内容。你的聊天文本只发送给你选择的引擎，不去别处；在设备端模式下连那里也不去。

开源，MIT: github.com/Pkkls/kick-chat-translator

## Description (KO)

Paste into the Korean listing. Same standard as the other localised blocks: no
native reader.

Short summary: 읽지 못하는 언어로 흐르는 Kick 채팅? 각 메시지 아래에 실시간으로 번역이 붙고, 답장은 채널의 언어로 나갑니다.

3.0.0의 새로운 기능

직접 고른 단어가 들어간 채팅 줄을 숨길 수 있습니다. 필터 설정에 키워드를 한 줄에 하나씩 추가하면, 그중 하나라도 들어간 줄은 대소문자와 상관없이 번역되는 대신 채팅에서 사라집니다. 일부 채널을 가득 채우는 !fish 같은 봇 명령어에 유용합니다.

확장 프로그램이 대신 정하던 아홉 가지가 이제 여러분의 것입니다. 번역된 줄의 글자 크기, 줄 간격, 글꼴, 그 블록이 갖는 여백, 대비를 측정해 고른 네 가지 강조색 중 하나, 채널을 따라가는 대신 어둡게 또는 밝게 고정하는 채팅 테마, 채널마다 기억되는 읽기 언어, 그리고 두 개의 단축키입니다. 모든 기본값은 확장 프로그램이 이미 하던 그대로라, 여러분이 바꾸기 전까지는 아무것도 달라지지 않습니다.

Tab이 입력한 글을 번역으로 바꿉니다. 미리보기가 보이는 동안에만 키를 가져가므로 빈 입력창이 이를 잃는 일은 없고, Shift+Tab은 언제나 이동으로 남습니다.

채팅 위쪽 막대는 다른 시청자가 쓴 것을 번역하고, 아래쪽 버튼은 여러분이 쓰는 것을 번역합니다. 화면에서 둘을 구분할 방법이 없었지만, 이제 각각의 화살표가 알려 줍니다.

번역된 각 줄, 두 막대, 언어 목록에서 두 글자 코드 대신 국기를 씁니다. 언어 패널이 어떤 언어가 선택되었는지 보여 줍니다. 예전에는 마우스를 올린 상태와 구별할 수 없는 배경으로 그것을 나타냈습니다. 또한 "Chinese (Taiwan)"이 "Chinese (..."로 표시되어 "Chinese"와 구별할 수 없던 문제도 없어졌습니다.

설정 페이지가 각 설정이 무엇을 하는지 보여 줍니다. 캐시는 몇 개를 담고 있는지, 채널별 한도는 실제로 무언가를 막은 적이 있는지, 언어 목록은 각 언어가 얼마나 차지했는지 답합니다.

2.9.2 이후

광둥어가 43번째 언어가 되었습니다. 번역기에 보내는 원본 언어가 세 배 더 자주 맞고 97퍼센트 덜 틀립니다. 42개 언어 5040개 문장에서 측정했습니다. 감지되지 않은 채 남는 언어도 없습니다. 예전에는 스물여섯 개였습니다. 식별할 수 없는 키릴 문자는 러시아어로, 아랍 문자는 아랍어로 불렸지만 불가리아어, 우크라이나어, 페르시아어는 그 자체로 읽힙니다. 번체 중국어는 매번 간체로 읽혔습니다.

읽지 못하는 언어로 채팅이 흐르는 Kick 방송을 열어 보세요. 도착하는 메시지 바로 아래에 번역이 붙습니다. 채팅 상단의 초록색 막대가 작동 중임을 알려 줍니다.

답장을 입력하면 채팅 입력창 위에 채널의 언어로 된 미리보기가 나타납니다. 미리보기를 클릭하거나 Tab를 누르면 입력한 내용이 그 번역으로 바뀌고, 보내기만 하면 됩니다.

설정할 것이 없습니다. 들어오는 채팅은 브라우저 언어로 번역되고, 작성한 내용은 채널의 방송 언어로 나갑니다. 방송 언어는 Kick에서 읽어 옵니다. 둘 다 설정에서 바꿀 수 있습니다. 라이브와 VOD 다시보기 모두에서 동작하며 7TV 이모트도 지원합니다.

엔진

Google은 키도 계정도 없이 바로 동작합니다. 무료 DeepL 키를 직접 추가하면(무료 요금제는 카드 없이 월 100만 자) 유럽 언어의 품질이 뚜렷하게 올라갑니다. DeepL에는 채널의 최근 발언도 문맥으로 전달되어 표현이 대화에 맞고, 존대 표현이 있는 언어에서는 그 말투를 요청합니다. 일본어의 경어, 프랑스어의 tu가 아닌 vous입니다. 무료 할당량을 오래 쓰기 위해 DeepL은 무료 엔진보다 실제로 나은 언어 쌍에서만 사용됩니다. MyMemory와 Lingva가 뒤에서 대기하고, 한 엔진이 실패하면 다음 엔진이 이어받습니다. 순서는 직접 정합니다.

Chrome과 Edge 138 이상은 기기 내 번역도 할 수 있습니다. 하드웨어가 받쳐 준다면 말입니다. 모델은 언어 쌍마다 한 번 내려받고, 그다음부터는 모두 로컬에서 돌아갑니다. 오프라인이고, 제한이 없으며, 채팅 문장이 기기를 떠나지 않습니다. Brave와 Firefox는 아직 이 API가 없어 위의 엔진을 사용합니다.

표시

원문 아래, 원문과 같은 줄, 원문 뒤에 더 작은 기울임꼴, 또는 마우스를 올렸을 때만. 마우스를 올릴 때까지 아무것도 요청하지 않는 방식은 빠른 채팅에서 사용량을 약 10분의 1로 줄입니다.

필터

봇 건너뛰기, 사용자나 채널 차단, 번역할 원본 언어 제한. 이모트, 멘션, 링크, 이모지 도배는 전송 전에 걸러지므로 "kkkkkk"를 번역하느라 비용을 쓰지 않습니다. 백그라운드 탭은 스스로 멈춥니다.

42개 언어. 오른쪽에서 왼쪽으로 쓰는 언어(아랍어, 히브리어, 페르시아어)를 포함하고 지역 변형(pt-BR, zh-TW)도 구분합니다. 확장 프로그램 자체의 인터페이스는 10개 언어입니다. 영어, 스페인어, 프랑스어, 포르투갈어, 터키어, 러시아어, 아랍어, 중국어, 일본어, 한국어.

계정도, 분석 도구도, 제 서버도 없습니다. 저장소 권한, 시청하는 동안 번역기가 준비 상태를 유지하도록 하는 알람, 그리고 kick.com과 호출할 수 있는 번역 엔진(Google, DeepL, MyMemory, Lingva)에 대한 접근을 요청합니다. 새 버전이 있는지 알리기 위해 GitHub 릴리스 페이지도 읽지만, 그 요청에는 아무것도 실려 가지 않습니다. 채팅 문장은 선택한 엔진에만 가고 다른 곳으로는 가지 않으며, 기기 내 모드에서는 거기에도 가지 않습니다.

오픈 소스, MIT: github.com/Pkkls/kick-chat-translator

## Description (CS)

Paste into the Czech listing. Chosen on measurement rather than inference: the
Czech listing page is the fourth most viewed of the localised ones, ahead of
four languages that already had text. Same standard as the other localised
blocks: no native reader.

Short summary: Chat na Kicku v jazyce, který neumíte přečíst? Překlad se objeví pod každou zprávou, živě.

NOVINKY VE VERZI 3.0.0

Skryjte řádky chatu, které obsahují slovo podle vaší volby. Přidejte klíčová slova do nastavení filtrů, jedno na řádek: řádek, který některé z nich obsahuje, bez ohledu na velikost písmen, z chatu zmizí, místo aby se překládal. Hodí se proti příkazům botů jako !fish, které zaplavují některé kanály.

Devět věcí, o kterých rozšíření rozhodovalo za vás, je teď vašich: velikost textu, řádkování a písmo přeložené řádky, vzduch kolem jejího bloku, barva zvýraznění ze čtyř měřených na kontrast, motiv chatu připnutý na tmavý nebo světlý místo sledování kanálu, jazyk čtení zapamatovaný pro každý kanál a dvě klávesové zkratky. Každá výchozí hodnota je to, co rozšíření dělalo už dřív: nic se nehne, dokud s tím nehnete vy.

Tab vymění to, co jste napsali, za překlad. Klávesa se bere jen dokud je náhled na obrazovce, takže prázdné pole ji nikdy neztratí, a Shift+Tab zůstává vždy navigací.

Lišta nahoře v chatu překládá to, co píší ostatní; tlačítko dole překládá to, co píšete vy. Nic na obrazovce je neodlišovalo, teď to říká šipka na každém z nich.

Vlajky místo dvoupísmenných kódů na každé přeložené řádce, na obou lištách i v seznamu jazyků. Panel jazyků ukazuje, který jazyk je vybraný, což dřív nesl na pozadí, které nešlo odlišit od najetí myší. A "Chinese (Taiwan)" už se nezobrazuje jako "Chinese (...", což nešlo odlišit od "Chinese".

Stránka nastavení ukazuje, co každé nastavení dělá: cache řekne, kolik záznamů drží, limit na kanál řekne, jestli už něco zadržel, a seznam jazyků ukáže, kolik každý z nich představoval.

OD VERZE 2.9.2

Kantonština je 43. jazyk. Zdrojový jazyk poslaný překladači je správně třikrát častěji a špatně o 97 procent méně, měřeno na 5040 větách ve 42 jazycích, a žádný jazyk už nezůstává nerozpoznaný: dvacet šest jich zůstávalo. Nerozpoznaná cyrilice se nazývala ruštinou a arabské písmo arabštinou; bulharština, ukrajinština a perština se čtou jako ony samy. Tradiční čínština se pokaždé četla jako zjednodušená.

Otevřete na Kicku vysílání, kde chat běží v jazyce, který neumíte přečíst. Každá zpráva dostane svůj překlad přímo pod sebou, jakmile dorazí. Zelený pruh nahoře v chatu ukazuje, že to běží.

Napíšete odpověď a nad polem chatu se objeví náhled v jazyce kanálu. Klikněte na náhled nebo stiskněte Tab a tato verze nahradí to, co jste napsali, připravená k odeslání.

Není co nastavovat. Příchozí chat se překládá do jazyka vašeho prohlížeče a to, co píšete, odchází v jazyce, ve kterém kanál vysílá, načteném přímo z Kicku. Obojí lze změnit v nastavení. Funguje na živých vysíláních i na záznamech VOD a zvládá emotikony 7TV.

ENGINY

Google funguje rovnou, bez klíče a bez účtu. Přidejte vlastní bezplatný klíč DeepL (bezplatný tarif pokrývá milion znaků měsíčně bez karty) a kvalita u evropských jazyků výrazně stoupne. DeepL navíc dostává poslední řádky kanálu jako kontext, takže formulace sedí do konverzace, a je požádán o zdvořilý registr tam, kde jej jazyk má: keigo v japonštině, vous místo tu ve francouzštině. Aby bezplatná kvóta vydržela, DeepL se spotřebovává jen na dvojicích, kde skutečně překonává bezplatné enginy. MyMemory a Lingva čekají vzadu jako záloha, a když jeden engine selže, převezme to další. Pořadí určujete vy.

Chrome a Edge 138 a novější umí překládat i přímo v zařízení, pokud to hardware dovolí. Model se stáhne jednou pro každou dvojici jazyků a pak vše běží lokálně: offline, bez limitu, a text chatu neopustí váš počítač. Brave a Firefox toto API zatím nemají, takže používají enginy výše.

ZOBRAZENÍ

Překlad pod originálem, na stejném řádku, za ním menší kurzívou, nebo jen při najetí myší. Režim najetí myší si nic nevyžádá, dokud na zprávu neukážete, což v rychlém chatu sníží spotřebu zhruba desetkrát.

FILTRY

Přeskočit boty, blokovat uživatele nebo kanály, nebo omezit, které zdrojové jazyky se vůbec překládají. Emotikony, zmínky, odkazy a záplavy emoji se odstraní před odesláním, takže neplatíte za překlad „kkkkkk“. Panely na pozadí se samy pozastaví.

42 jazyků, včetně písma zprava doleva (arabština, hebrejština, perština), s odděleně vedenými regionálními variantami (pt-BR, zh-TW). Rozhraní samotného rozšíření existuje v 10 jazycích: angličtina, španělština, francouzština, portugalština, turečtina, ruština, arabština, čínština, japonština a korejština.

Žádný účet, žádná analytika, žádný můj server. Rozšíření žádá o úložiště, o časovač, aby překladač zůstal připravený, zatímco se díváte, a o přístup ke kick.com a k překladovým enginům, které může volat: Google, DeepL, MyMemory a Lingva. Čte také stránku vydání na GitHubu, aby vám oznámilo, že existuje novější verze, a s tímto požadavkem neposílá nic. Text vašeho chatu jde jen do enginu, který jste zvolili, a nikam jinam; v režimu v zařízení ani tam.

Otevřený zdrojový kód, MIT: github.com/Pkkls/kick-chat-translator

## manifest.json description field (132 char limit)

Shipped value, already in public/_locales/en. It used to carry an em dash and
the word "pro", which said nothing; this replaced it and the note asking for the
replacement outlived the change. The eleven localised values run 35 to 98
characters, all inside the 132 the field allows.

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
Screenshots: five 1280x800 PNGs from test/e2e/store-fixture/,
  produced by store-shots-fixture.mjs. They are taken on a fabricated chat
  with invented handles and a locally answered engine, so no third party's
  channel, branding or viewers appear, while the shipped build does the
  actual translating in the image. test/e2e/store/ holds the older
  set taken on a live channel; do not submit those.

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

Type a reply and a preview shows it in the channel's language above the chat box. Click the preview or press Tab and that version replaces what you typed, ready for you to send.

Nothing to set up. Incoming chat is translated into your browser's language, and what you write goes out in whatever the channel broadcasts in, read from Kick itself. Both are overridable in settings. It handles 7TV emotes.

ENGINES

Google works out of the box, no key and no account. Add your own free DeepL key and quality jumps on European languages: their free tier covers a million characters a month without a card. DeepL also receives the recent channel lines as context so the wording fits the conversation, and it is asked for the polite register where the language has one, keigo in Japanese or vous rather than tu in French. To make a free quota last, DeepL is spent only on the pairs where it actually beats the free engines. MyMemory and Lingva sit behind as fallbacks, and when one engine fails the next takes over. You set the order.

DISPLAY

Translation below the original, inline with it, after it in smaller italics, or only when you hover. Hover mode fetches nothing until you point at a message, which cuts usage by roughly ten times on a fast chat.

FILTERS

Skip bots, block users or channels, or limit which source languages get translated at all. Emotes, mentions, links and emoji spam are stripped before anything is sent, so you are not paying to translate "kkkkkk". Background tabs pause themselves.

43 languages, right to left included (Arabic, Hebrew, Persian), with regional variants kept apart (pt-BR, zh-TW). The extension's own interface comes in 10: English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese and Korean.

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

## AMO reviewer notes (source code and build)

AMO asks for source when the submitted code is bundled or minified, which this
is. Paste this into the "Notes for reviewers" field.

Source: https://github.com/Pkkls/kick-chat-translator, public, MIT, tag v3.0.0.
The submitted zip is built from that tag with no patching in between.

Build:

  git clone https://github.com/Pkkls/kick-chat-translator
  cd kick-chat-translator
  git checkout v3.0.0
  npm ci
  npm run build:firefox
  npm run pack:firefox

The archive lands in release/kick-chat-translator-3.0.0-firefox.zip.

Toolchain actually used for the submitted build: Node v22.22.0, npm 10.9.4, on
Windows. The repository's .nvmrc pins 20 and package.json asks for node >= 20;
22 satisfies that, and the mismatch is stated here rather than rounded off.

The build is byte-reproducible. Two consecutive runs of build plus pack produced
the same archive, verified by SHA-256 rather than assumed:

  chromium  0c4a1a4b53be34db212e48ba0b716ec475955b3a0e3e38f195a5b235fd0c43a5  319652 bytes
  firefox   530c36048a6082f60920ffabfc8eab25f08e419ab5c3ecc66c158960fd809205  319581 bytes

The zip is written by scripts/pack.ts rather than by a platform tool, because
PowerShell's Compress-Archive on .NET Framework writes backslash separators into
entry names and produces an archive that is not a tree. Entry names are checked
to contain no backslash before release.

No remote code. Every line of JavaScript is inside the package: no eval, no new
Function on fetched text, no remote script tag, no hosted module. The only
network calls are the translation engines the user selects, kick.com, and one
GET to the project's own GitHub releases endpoint for the update notice.

Minification is esbuild and Vite defaults through @crxjs/vite-plugin. There is
no obfuscation step.

The source archive attached to this version is `git archive v3.0.0` of that tag.

The three UNSAFE_VAR_ASSIGNMENT warnings: two are the same line, src/content/langMenu.ts:95, which writes one of the fixed SVG strings of the ICONS constant declared in that file (line 80). No remote or user text reaches it. The third is the dangerouslySetInnerHTML path inside Preact's own renderer, which this code never uses.

## AMO data collection

The manifest declares this already, under browser_specific_settings, as
data_collection_permissions required: websiteContent. In the submission form:

Website content: yes. The text of a chat message, and only that, is sent to the
translation engine the user selected, to be translated. Not the username, not
the channel, not who said what. It is not stored, not logged and not sent
anywhere else.

Authentication information: yes, conditionally. If the user enters a DeepL API
key, it is kept in local storage, never synced, and sent only to DeepL to
authenticate that user's own request.

Everything else: no. No personally identifying information, no location, no
browsing history, no financial or health data, no user activity tracking, no
analytics, no accounts, and no server operated by the developer.

## AMO summary (ES)

¿Chat de Kick en un idioma que no lees? Se traduce bajo cada mensaje según va llegando, y tus respuestas salen en el idioma del canal. Sin cuenta y sin configurar nada. Funciona en directos y en repeticiones.

## AMO summary (PT-BR)

Chat da Kick num idioma que você não lê? Ele é traduzido embaixo de cada mensagem conforme chega, e suas respostas saem no idioma do canal. Sem conta e sem configurar nada. Funciona ao vivo e em replays.

## AMO summary (RU)

Чат Kick на языке, который вы не читаете? Перевод появляется под каждым сообщением по мере поступления, а ваши ответы уходят на языке канала. Без аккаунта и без настройки. Работает и на эфирах, и на записях.

## AMO summary (ZH)

Kick 的聊天是你读不懂的语言？每条消息一到，下方就出现译文，你的回复也会用频道的语言发出。无需账号，无需设置。直播和回放都能用。

## AMO summary (KO)

읽지 못하는 언어로 흐르는 Kick 채팅? 메시지가 도착하는 대로 그 아래에 번역이 붙고, 답장은 채널의 언어로 나갑니다. 계정도 설정도 필요 없습니다. 라이브와 다시보기 모두에서 동작합니다.

## AMO summary (CS)

Chat na Kicku v jazyce, který neumíte přečíst? Překlad se objeví pod každou zprávou, jak přicházejí, a vaše odpovědi odejdou v jazyce kanálu. Bez účtu a bez nastavování. Funguje živě i u záznamů.

## AMO description (CS)

Otevřete na Kicku vysílání, kde chat běží v jazyce, který neumíte přečíst. Každá zpráva dostane svůj překlad přímo pod sebou, jakmile dorazí. Zelený pruh nahoře v chatu ukazuje, že to běží.

Napíšete odpověď a nad polem chatu se objeví náhled v jazyce kanálu. Klikněte na náhled nebo stiskněte Tab a tato verze nahradí to, co jste napsali, připravená k odeslání.

Není co nastavovat. Příchozí chat se překládá do jazyka vašeho prohlížeče a to, co píšete, odchází v jazyce, ve kterém kanál vysílá, načteném přímo z Kicku. Obojí lze změnit v nastavení. Funguje na živých vysíláních i na záznamech VOD a zvládá emotikony 7TV.

ENGINY

Google funguje rovnou, bez klíče a bez účtu. Přidejte vlastní bezplatný klíč DeepL (bezplatný tarif pokrývá milion znaků měsíčně bez karty) a kvalita u evropských jazyků výrazně stoupne. DeepL navíc dostává poslední řádky kanálu jako kontext, takže formulace sedí do konverzace, a je požádán o zdvořilý registr tam, kde jej jazyk má: keigo v japonštině, vous místo tu ve francouzštině. Aby bezplatná kvóta vydržela, DeepL se spotřebovává jen na dvojicích, kde skutečně překonává bezplatné enginy. MyMemory a Lingva čekají vzadu jako záloha, a když jeden engine selže, převezme to další. Pořadí určujete vy.

ZOBRAZENÍ

Překlad pod originálem, na stejném řádku, za ním menší kurzívou, nebo jen při najetí myší. Režim najetí myší si nic nevyžádá, dokud na zprávu neukážete, což v rychlém chatu sníží spotřebu zhruba desetkrát.

FILTRY

Přeskočit boty, blokovat uživatele nebo kanály, nebo omezit, které zdrojové jazyky se vůbec překládají. Emotikony, zmínky, odkazy a záplavy emoji se odstraní před odesláním, takže neplatíte za překlad „kkkkkk“. Panely na pozadí se samy pozastaví.

42 jazyků, včetně písma zprava doleva (arabština, hebrejština, perština), s odděleně vedenými regionálními variantami (pt-BR, zh-TW). Rozhraní samotného rozšíření existuje v 10 jazycích: angličtina, španělština, francouzština, portugalština, turečtina, ruština, arabština, čínština, japonština a korejština.

CO OPOUŠTÍ VÁŠ PROHLÍŽEČ

Text zprávy z chatu, a nic jiného, jde do překladového enginu, který jste zvolili. Ne vaše uživatelské jméno, ne kanál, ne kdo co řekl. To je to, co znamená řádek „obsah webu“ v oprávněních výše, a je to vše, co znamená. Žádný účet, žádná analytika, žádný můj server: rozšíření komunikuje s Kickem, s enginem, který jste zvolili, a se stránkou vydání na GitHubu, aby oznámilo novější verzi, přičemž s tímto posledním požadavkem neposílá nic.

Firefox zatím nenabízí překladové API na úrovni prohlížeče, které mají Chrome a Edge 138 a novější, takže tato verze vždy používá enginy výše. Pokud jej Mozilla přidá, rozšíření už ví, jak jej použít, a bude překládat přímo ve vašem zařízení, offline a bez limitů.

Otevřený zdrojový kód, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (FR)

Tu ouvres un stream Kick où le chat est dans une langue que tu ne lis pas. Chaque message reçoit sa traduction juste en dessous, au fil de l'arrivée. Une barre verte en haut du chat indique que ça tourne.

Tu écris une réponse, un aperçu la montre dans la langue de la chaîne au-dessus de la barre de chat. Clic sur l'aperçu ou Ctrl+Entrée, et cette version remplace ce que tu as tapé dans la boîte de chat, prête à partir.

Rien à régler. Le chat entrant est traduit vers la langue de ton navigateur, ce que tu écris part dans la langue de diffusion de la chaîne, lue depuis Kick. Les deux se changent dans les réglages. Marche sur les lives comme sur les replays VOD, et gère les emotes 7TV.

MOTEURS

Google fonctionne d'emblée, sans clé, sans compte. Ajoute ta propre clé DeepL gratuite (leur offre gratuite couvre 1 million de caractères par mois, sans carte) et la qualité monte nettement sur les langues européennes. DeepL reçoit aussi les lignes récentes de la chaîne comme contexte, donc la formulation colle à la conversation, et on lui demande le registre poli quand la langue en a un : keigo en japonais, vouvoiement en français. Pour faire durer un quota gratuit, DeepL n'est dépensé que sur les paires où il bat vraiment les moteurs gratuits. MyMemory et Lingva restent derrière en secours, et quand un moteur tombe le suivant prend le relais. L'ordre est le tien.

AFFICHAGE

Traduction sous l'original, en ligne avec lui, après lui en italique plus petit, ou seulement au survol. Le mode survol ne demande rien tant que tu ne pointes pas un message, ce qui divise l'usage par dix environ sur un chat rapide.

FILTRES

Ignorer les bots, blacklister des utilisateurs ou des chaînes, ou limiter les langues source à traduire. Emotes, mentions, liens et murs d'emoji sont retirés avant tout envoi, tu ne paies pas pour traduire "kkkkkk". Les onglets en arrière-plan se mettent en pause seuls.

42 langues, écriture droite-gauche comprise (arabe, hébreu, persan), variantes régionales gardées distinctes (pt-BR, zh-TW). L'interface de l'extension existe en 10 langues : anglais, espagnol, français, portugais, turc, russe, arabe, chinois, japonais et coréen.

CE QUI SORT DE TON NAVIGATEUR

Le texte d'un message de chat, et rien d'autre, vers le moteur de traduction que tu as choisi. Pas ton pseudo, pas la chaîne, pas qui a dit quoi. C'est ce que désigne la ligne « contenu du site » dans les permissions ci-dessus, et c'est tout ce qu'elle désigne. Pas de compte, pas d'analytics, pas de serveur à moi : l'extension parle à Kick, au moteur que tu as choisi, et à la page des versions GitHub pour te signaler qu'une plus récente existe, sans rien envoyer avec cette dernière requête.

Firefox n'expose pas encore l'API de traduction intégrée au navigateur que Chrome et Edge 138+ proposent, donc cette version passe toujours par les moteurs ci-dessus. Si Mozilla la livre, l'extension sait déjà s'en servir et traduira sur ta machine, hors ligne et sans limite.

Code source ouvert, MIT : github.com/Pkkls/kick-chat-translator

## AMO description (TR)

Okuyamadığın bir dilde sohbet akan bir Kick yayını aç. Her mesaj, geldiği anda, hemen altında çevirisini alır. Sohbetin üstündeki yeşil çubuk çalıştığını gösterir.

Bir yanıt yaz, sohbet kutusunun üstünde kanalın dilinde bir önizleme belirir. Önizlemeye tıkla ya da Tab'a bas, o sürüm yazdığının yerine geçer ve göndermeye hazır olur.

Ayarlanacak bir şey yok. Gelen sohbet tarayıcının diline çevrilir, yazdıkların da kanalın yayın diline gider, bu bilgi doğrudan Kick'ten okunur. İkisi de ayarlardan değiştirilebilir. Canlı yayınlarda da VOD tekrarlarında da çalışır, 7TV emotelerini anlar.

MOTORLAR

Google kutudan çıktığı gibi çalışır, anahtar yok, hesap yok. Kendi ücretsiz DeepL anahtarını ekle (ücretsiz paketleri kart istemeden ayda 1 milyon karakter veriyor), Avrupa dillerinde kalite belirgin şekilde yükselir. DeepL ayrıca kanalın son satırlarını bağlam olarak alır, böylece ifade konuşmaya oturur, ve dilin nezaket kipi varsa o istenir: Japoncada keigo, Fransızcada tu yerine vous. Ücretsiz kotayı uzatmak için DeepL yalnızca ücretsiz motorları gerçekten geçtiği dil çiftlerinde harcanır. MyMemory ve Lingva arkada yedek bekler, bir motor düştüğünde sıradaki devralır. Sıralama senin.

GÖRÜNÜM

Çeviri orijinalin altında, onunla aynı satırda, ardında daha küçük italikle, ya da yalnızca üzerine gelince. Üzerine gelme modu sen bir mesajı işaret edene kadar hiçbir şey istemez, bu da hızlı bir sohbette kullanımı yaklaşık 10 kat azaltır.

FİLTRELER

Botları atla, kullanıcıları veya kanalları engelle, ya da hangi kaynak dillerin çevrileceğini sınırla. Emoteler, bahsetmeler, bağlantılar ve emoji yığınları dışarı gönderilmeden önce ayıklanır, yani "kkkkkk" çevirmek için ödeme yapmazsın. Arka plandaki sekmeler kendiliğinden duraklar.

42 dil, sağdan sola yazılanlar dahil (Arapça, İbranice, Farsça), bölgesel varyantlar ayrı tutulur (pt-BR, zh-TW). Eklentinin kendi arayüzü 10 dilde: İngilizce, İspanyolca, Fransızca, Portekizce, Türkçe, Rusça, Arapça, Çince, Japonca ve Korece.

TARAYICINDAN NE ÇIKIYOR

Bir sohbet mesajının metni, sadece o, seçtiğin çeviri motoruna gider. Kullanıcı adın değil, kanal değil, kimin ne dediği değil. Yukarıdaki izinlerdeki “site içeriği” satırı bunu kasteder ve kastettiği bundan ibarettir. Hesap yok, analitik yok, bana ait sunucu yok: eklenti Kick ile, seçtiğin motorla ve yeni bir sürüm olduğunu haber vermek için GitHub sürüm sayfasıyla konuşur, o son isteğe hiçbir şey koymadan.

Firefox, Chrome ve Edge 138+ tarafından sunulan tarayıcı düzeyindeki çeviri API'sini henüz sunmuyor, bu yüzden bu yapı her zaman yukarıdaki motorları kullanır. Mozilla eklerse eklenti onu nasıl kullanacağını zaten biliyor ve çeviriyi çevrimdışı, sınırsız olarak makinende yapacak.

Açık kaynak, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (AR)

افتح بثاً على Kick تجري دردشته بلغة لا تقرأها. تحصل كل رسالة على ترجمتها أسفلها مباشرةً، فور وصولها. الشريط الأخضر أعلى الدردشة يخبرك أن الإضافة تعمل.

اكتب رداً، فتظهر معاينة له بلغة القناة فوق صندوق الدردشة. انقر المعاينة أو اضغط Tab، فتحل تلك النسخة محل ما كتبته، جاهزة للإرسال.

لا شيء لتضبطه. تُترجم الدردشة الواردة إلى لغة متصفحك، ويخرج ما تكتبه بلغة بث القناة، وهي تُقرأ من Kick نفسه. كلاهما قابل للتغيير من الإعدادات. تعمل على البث المباشر وعلى إعادات VOD، وتتعامل مع رموز 7TV.

المحركات

يعمل Google مباشرةً، بلا مفتاح وبلا حساب. أضف مفتاح DeepL المجاني الخاص بك (باقتهم المجانية تغطي مليون حرف شهرياً دون بطاقة) فترتفع الجودة بوضوح في اللغات الأوروبية. يتلقى DeepL أيضاً أسطر القناة الأخيرة كسياق، فتستقر الصياغة على مجرى الحديث، ويُطلب منه صيغة التأدب حين تملكها اللغة: الكيغو في اليابانية، وvous بدل tu في الفرنسية. ولإطالة عمر الحصة المجانية، لا يُنفَق DeepL إلا على أزواج اللغات التي يتفوق فيها فعلاً على المحركات المجانية. يبقى MyMemory وLingva في الخلف كبديلين، وحين يسقط محرك يتولى الذي يليه. الترتيب ترتيبك أنت.

طريقة العرض

الترجمة أسفل النص الأصلي، أو في السطر نفسه، أو بعده بخط مائل أصغر، أو عند تمرير المؤشر فقط. لا يطلب وضع تمرير المؤشر شيئاً حتى تشير إلى رسالة، ما يخفض الاستهلاك نحو عشرة أضعاف على دردشة سريعة.

عوامل التصفية

تجاهل الروبوتات، احجب مستخدمين أو قنوات، أو حدد لغات المصدر التي تُترجم أصلاً. تُزال الرموز والإشارات والروابط وأكوام الإيموجي قبل إرسال أي شيء، فلا تدفع مقابل ترجمة "kkkkkk". وتتوقف علامات التبويب في الخلفية من تلقاء نفسها.

42 لغة، بما فيها الكتابة من اليمين إلى اليسار (العربية والعبرية والفارسية)، مع فصل المتغيرات الإقليمية (pt-BR وzh-TW). وواجهة الإضافة نفسها متوفرة بعشر لغات: الإنجليزية والإسبانية والفرنسية والبرتغالية والتركية والروسية والعربية والصينية واليابانية والكورية.

ما الذي يغادر متصفحك

نص رسالة الدردشة، وهو وحده، يذهب إلى محرك الترجمة الذي اخترته. لا اسم المستخدم، ولا القناة، ولا من قال ماذا. هذا ما يعنيه سطر « محتوى الموقع » في الأذونات أعلاه، وهذا كل ما يعنيه. لا حساب، ولا تحليلات، ولا خادم يخصني: الإضافة تتحدث إلى Kick، وإلى المحرك الذي اخترته، وإلى صفحة الإصدارات على GitHub لتخبرك بوجود نسخة أحدث، دون أن ترسل شيئاً مع ذلك الطلب الأخير.

لا يوفر Firefox بعد واجهة الترجمة المدمجة في المتصفح التي يوفرها Chrome وEdge 138 وما بعده، لذا تستخدم هذه النسخة المحركات أعلاه دائماً. وإن وفّرتها Mozilla فالإضافة تعرف كيف تستعملها بالفعل، وستترجم على جهازك دون اتصال ودون حدود.

مفتوح المصدر، رخصة MIT: github.com/Pkkls/kick-chat-translator

## AMO description (ES)

Abre un directo de Kick donde el chat esté en un idioma que no lees. Cada mensaje recibe su traducción justo debajo, según va llegando. Una barra verde en la parte superior del chat te dice que está funcionando.

Escribe una respuesta y una vista previa la muestra en el idioma del canal, encima de la caja de chat. Haz clic en la vista previa o pulsa Ctrl+Intro y esa versión sustituye lo que escribiste, lista para enviar.

Nada que configurar. El chat entrante se traduce al idioma de tu navegador, y lo que escribes sale en el idioma en el que emite el canal, leído del propio Kick. Ambos se pueden cambiar en los ajustes. Funciona en directos y en repeticiones VOD, y admite los emotes de 7TV.

MOTORES

Google funciona sin más, sin clave y sin cuenta. Añade tu propia clave gratuita de DeepL (su plan gratuito cubre un millón de caracteres al mes sin tarjeta) y la calidad sube claramente en los idiomas europeos. DeepL recibe además las líneas recientes del canal como contexto, así la redacción encaja con la conversación, y se le pide el registro formal donde el idioma lo tiene: keigo en japonés, vous en vez de tu en francés. Para que la cuota gratuita dure, DeepL solo se gasta en los pares donde de verdad supera a los motores gratuitos. MyMemory y Lingva quedan detrás como respaldo, y cuando un motor falla toma el relevo el siguiente. El orden lo pones tú.

PRESENTACIÓN

Traducción debajo del original, en la misma línea, después en cursiva más pequeña, o solo al pasar el ratón. El modo al pasar el ratón no pide nada hasta que apuntas a un mensaje, lo que reduce el uso unas 10 veces en un chat rápido.

FILTROS

Saltarse los bots, bloquear usuarios o canales, o limitar qué idiomas de origen se traducen. Emotes, menciones, enlaces y avalanchas de emoji se quitan antes de enviar nada, así no pagas por traducir "kkkkkk". Las pestañas en segundo plano se pausan solas.

42 idiomas, incluida la escritura de derecha a izquierda (árabe, hebreo, persa), con las variantes regionales separadas (pt-BR, zh-TW). La interfaz de la extensión existe en 10: inglés, español, francés, portugués, turco, ruso, árabe, chino, japonés y coreano.

QUÉ SALE DE TU NAVEGADOR

El texto de un mensaje de chat, y solo eso, al motor de traducción que elegiste. No tu nombre de usuario, no el canal, no quién dijo qué. Eso es lo que designa la línea «contenido del sitio» en los permisos de arriba, y es todo lo que designa. Sin cuenta, sin analíticas, sin servidor mío: la extensión habla con Kick, con el motor que elegiste, y con la página de versiones de GitHub para avisarte de que existe una más nueva, sin enviar nada con esa última petición.

Firefox todavía no expone la API de traducción a nivel de navegador que ofrecen Chrome y Edge 138+, así que esta versión siempre usa los motores de arriba. Si Mozilla la incorpora, la extensión ya sabe usarla y traducirá en tu máquina, sin conexión y sin límites.

Código abierto, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (PT-BR)

Abra uma transmissão na Kick onde o chat está num idioma que você não lê. Cada mensagem recebe sua tradução logo abaixo, conforme chega. Uma barra verde no topo do chat mostra que está funcionando.

Digite uma resposta e uma prévia a mostra no idioma do canal, acima da caixa de chat. Clique na prévia ou pressione Tab e essa versão substitui o que você digitou, pronta para enviar.

Nada para configurar. O chat que chega é traduzido para o idioma do seu navegador, e o que você escreve sai no idioma em que o canal transmite, lido da própria Kick. Os dois podem ser trocados nas configurações. Funciona em transmissões ao vivo e em replays VOD, e lida com os emotes do 7TV.

MOTORES

O Google funciona de cara, sem chave e sem conta. Adicione sua própria chave gratuita da DeepL (o plano gratuito cobre um milhão de caracteres por mês sem cartão) e a qualidade sobe bastante nos idiomas europeus. A DeepL também recebe as linhas recentes do canal como contexto, então o texto acompanha a conversa, e é pedido o registro formal onde o idioma tem um: keigo em japonês, vous em vez de tu em francês. Para a cota gratuita durar, a DeepL só é gasta nos pares em que ela realmente supera os motores gratuitos. MyMemory e Lingva ficam atrás como reserva, e quando um motor falha o seguinte assume. A ordem é sua.

EXIBIÇÃO

Tradução abaixo do original, na mesma linha, depois dele em itálico menor, ou só ao passar o mouse. O modo ao passar o mouse não busca nada até você apontar para uma mensagem, o que corta o uso em cerca de 10 vezes num chat rápido.

FILTROS

Pular bots, bloquear usuários ou canais, ou limitar quais idiomas de origem são traduzidos. Emotes, menções, links e enxurradas de emoji são removidos antes de qualquer envio, então você não paga para traduzir "kkkkkk". Abas em segundo plano se pausam sozinhas.

42 idiomas, incluindo escrita da direita para a esquerda (árabe, hebraico, persa), com as variantes regionais mantidas separadas (pt-BR, zh-TW). A interface da extensão existe em 10: inglês, espanhol, francês, português, turco, russo, árabe, chinês, japonês e coreano.

O QUE SAI DO SEU NAVEGADOR

O texto de uma mensagem do chat, e só isso, para o motor de tradução que você escolheu. Não o seu nome de usuário, não o canal, não quem disse o quê. É isso que a linha “conteúdo do site” nas permissões acima designa, e é tudo o que ela designa. Sem conta, sem analytics, sem servidor meu: a extensão fala com a Kick, com o motor que você escolheu, e com a página de versões do GitHub para avisar que existe uma mais nova, sem enviar nada nessa última requisição.

O Firefox ainda não expõe a API de tradução no nível do navegador que Chrome e Edge 138+ oferecem, então esta build sempre usa os motores acima. Se a Mozilla lançar uma, a extensão já sabe usá-la e vai traduzir na sua máquina, offline e sem limites.

Código aberto, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (RU)

Откройте трансляцию на Kick, где чат идёт на языке, который вы не читаете. Каждое сообщение получает перевод прямо под собой, по мере поступления. Зелёная полоса вверху чата показывает, что всё работает.

Наберите ответ, и над полем ввода появится его вариант на языке канала. Щёлкните по нему или нажмите Tab, и этот вариант заменит набранный текст, останется только отправить.

Настраивать нечего. Входящий чат переводится на язык вашего браузера, а то, что вы пишете, уходит на языке вещания канала, считанном у самого Kick. Оба меняются в настройках. Работает на прямых эфирах и на записях VOD, поддерживает эмоуты 7TV.

ДВИЖКИ

Google работает сразу, без ключа и без аккаунта. Добавьте свой бесплатный ключ DeepL (бесплатный тариф покрывает миллион символов в месяц без карты), и качество заметно вырастет на европейских языках. DeepL получает и недавние строки канала как контекст, поэтому формулировки ложатся в разговор, и у него запрашивается вежливый регистр там, где язык его имеет: кэйго в японском, vous вместо tu во французском. Чтобы бесплатной квоты хватало надолго, DeepL тратится только на те пары, где он действительно лучше бесплатных движков. MyMemory и Lingva стоят позади как запасные, и когда один движок отказывает, подхватывает следующий. Порядок задаёте вы.

ОТОБРАЖЕНИЕ

Перевод под оригиналом, в одну строку с ним, после него мелким курсивом или только при наведении. Режим наведения ничего не запрашивает, пока вы не укажете на сообщение, что снижает расход примерно в 10 раз на быстром чате.

ФИЛЬТРЫ

Пропускать ботов, блокировать пользователей или каналы, ограничивать, какие исходные языки вообще переводятся. Эмоуты, упоминания, ссылки и лавины эмодзи вырезаются до отправки, так что вы не платите за перевод «kkkkkk». Фоновые вкладки останавливаются сами.

42 языка, включая письмо справа налево (арабский, иврит, персидский), с раздельными региональными вариантами (pt-BR, zh-TW). Интерфейс самого расширения есть на 10 языках: английский, испанский, французский, португальский, турецкий, русский, арабский, китайский, японский и корейский.

ЧТО ПОКИДАЕТ ВАШ БРАУЗЕР

Текст сообщения из чата, и только он, уходит выбранному вами движку перевода. Не имя пользователя, не канал, не кто что сказал. Именно это означает строка «содержимое сайта» в разрешениях выше, и ничего кроме. Ни аккаунта, ни аналитики, ни моего сервера: расширение общается с Kick, с выбранным движком и со страницей релизов на GitHub, чтобы сообщить о новой версии, ничего не отправляя с этим последним запросом.

Firefox пока не предоставляет встроенный в браузер API перевода, который есть у Chrome и Edge 138 и новее, поэтому эта сборка всегда использует движки выше. Если Mozilla его добавит, расширение уже умеет им пользоваться и будет переводить на вашей машине, офлайн и без ограничений.

Открытый исходный код, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (ZH)

打开一个聊天语言你读不懂的 Kick 直播。每条消息一到，正下方就会出现它的译文。聊天区顶部的绿色条表示正在运行。

输入回复时，聊天框上方会用频道的语言显示一份预览。点击预览或按 Tab，这个版本就会替换你输入的内容，直接发送即可。

无需设置。收到的聊天会翻译成你浏览器的语言，你写的内容会用频道的直播语言发出，该语言从 Kick 自身读取。两者都可以在设置里覆盖。直播和 VOD 回放都能用，并支持 7TV 表情。

引擎

Google 开箱即用，不需要密钥，也不需要账号。加上你自己的免费 DeepL 密钥（免费额度每月一百万字符，无需信用卡），欧洲语言的质量会明显提升。DeepL 还会收到频道最近的发言作为上下文，因此措辞贴合对话；在有敬语体系的语言中会要求礼貌语体：日语的敬语，法语的 vous 而非 tu。为了让免费额度用得久，只有在 DeepL 确实优于免费引擎的语言对上才会消耗它。MyMemory 和 Lingva 在后面待命，一个引擎失败时由下一个接手。顺序由你决定。

显示

译文在原文下方、与原文同一行、在原文之后以更小的斜体显示，或者仅在鼠标悬停时显示。悬停模式在你指向某条消息之前不会发起任何请求，在快速滚动的聊天中大约能把用量降到十分之一。

过滤

跳过机器人，屏蔽用户或频道，或限制哪些源语言会被翻译。表情、提及、链接和刷屏 emoji 在发送前就会被剥离，所以你不会为翻译「kkkkkk」付费。后台标签页会自行暂停。

42 种语言，包含从右向左书写的语言（阿拉伯语、希伯来语、波斯语），并且区分地区变体（pt-BR、zh-TW）。扩展自身的界面有 10 种语言：英语、西班牙语、法语、葡萄牙语、土耳其语、俄语、阿拉伯语、中文、日语和韩语。

什么会离开你的浏览器

一条聊天消息的文本，仅此而已，发送给你选择的翻译引擎。不包括你的用户名，不包括频道，也不包括谁说了什么。这就是上面权限中“网站内容”一项的含义，也是它的全部含义。没有账号，没有分析统计，也没有我的服务器：扩展只与 Kick、你选择的引擎，以及用于告知有新版本的 GitHub 发布页面通信，而最后这个请求不携带任何内容。

Firefox 尚未提供 Chrome 和 Edge 138 及以上所暴露的浏览器级翻译 API，因此这个版本始终使用上面的引擎。如果 Mozilla 提供了，扩展已经知道如何使用它，并将在你的机器上离线且无限制地翻译。

开源，MIT: github.com/Pkkls/kick-chat-translator

## AMO description (KO)

읽지 못하는 언어로 채팅이 흐르는 Kick 방송을 열어 보세요. 도착하는 메시지 바로 아래에 번역이 붙습니다. 채팅 상단의 초록색 막대가 작동 중임을 알려 줍니다.

답장을 입력하면 채팅 입력창 위에 채널의 언어로 된 미리보기가 나타납니다. 미리보기를 클릭하거나 Tab를 누르면 입력한 내용이 그 번역으로 바뀌고, 보내기만 하면 됩니다.

설정할 것이 없습니다. 들어오는 채팅은 브라우저 언어로 번역되고, 작성한 내용은 채널의 방송 언어로 나갑니다. 방송 언어는 Kick에서 읽어 옵니다. 둘 다 설정에서 바꿀 수 있습니다. 라이브와 VOD 다시보기 모두에서 동작하며 7TV 이모트도 지원합니다.

엔진

Google은 키도 계정도 없이 바로 동작합니다. 무료 DeepL 키를 직접 추가하면(무료 요금제는 카드 없이 월 100만 자) 유럽 언어의 품질이 뚜렷하게 올라갑니다. DeepL에는 채널의 최근 발언도 문맥으로 전달되어 표현이 대화에 맞고, 존대 표현이 있는 언어에서는 그 말투를 요청합니다. 일본어의 경어, 프랑스어의 tu가 아닌 vous입니다. 무료 할당량을 오래 쓰기 위해 DeepL은 무료 엔진보다 실제로 나은 언어 쌍에서만 사용됩니다. MyMemory와 Lingva가 뒤에서 대기하고, 한 엔진이 실패하면 다음 엔진이 이어받습니다. 순서는 직접 정합니다.

표시

원문 아래, 원문과 같은 줄, 원문 뒤에 더 작은 기울임꼴, 또는 마우스를 올렸을 때만. 마우스를 올릴 때까지 아무것도 요청하지 않는 방식은 빠른 채팅에서 사용량을 약 10분의 1로 줄입니다.

필터

봇 건너뛰기, 사용자나 채널 차단, 번역할 원본 언어 제한. 이모트, 멘션, 링크, 이모지 도배는 전송 전에 걸러지므로 "kkkkkk"를 번역하느라 비용을 쓰지 않습니다. 백그라운드 탭은 스스로 멈춥니다.

42개 언어. 오른쪽에서 왼쪽으로 쓰는 언어(아랍어, 히브리어, 페르시아어)를 포함하고 지역 변형(pt-BR, zh-TW)도 구분합니다. 확장 프로그램 자체의 인터페이스는 10개 언어입니다. 영어, 스페인어, 프랑스어, 포르투갈어, 터키어, 러시아어, 아랍어, 중국어, 일본어, 한국어.

브라우저에서 무엇이 나가는가

채팅 메시지의 문장, 오직 그것만이 당신이 선택한 번역 엔진으로 갑니다. 사용자 이름도, 채널도, 누가 무엇을 말했는지도 아닙니다. 위 권한의 “웹사이트 콘텐츠” 항목이 가리키는 것이 이것이고, 그것이 전부입니다. 계정도, 분석 도구도, 제 서버도 없습니다. 확장 프로그램은 Kick, 당신이 고른 엔진, 그리고 새 버전이 있는지 알리기 위한 GitHub 릴리스 페이지하고만 통신하며, 마지막 요청에는 아무것도 실어 보내지 않습니다.

Firefox는 Chrome과 Edge 138 이상이 제공하는 브라우저 수준의 번역 API를 아직 제공하지 않으므로, 이 빌드는 항상 위의 엔진을 사용합니다. Mozilla가 제공하면 확장 프로그램은 이미 사용법을 알고 있으며, 기기에서 오프라인으로 제한 없이 번역하게 됩니다.

오픈 소스, MIT: github.com/Pkkls/kick-chat-translator

## AMO description (JA)

読めない言語でチャットが流れている Kick の配信を開いてください。届いたメッセージの真下に、その場で翻訳が付きます。チャット上部の緑のバーが、動いていることを示します。

返信を打つと、チャット欄の上に、チャンネルの言語での下書きが出ます。その下書きをクリックするか Tab を押すと、打った文章がその訳文に置き換わり、あとは自分で送るだけです。

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
