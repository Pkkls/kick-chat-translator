# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 2.9.1, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

NEW IN 2.9.1

The language list is a grid of flags instead of a column of two-letter codes, and one click opens it. It used to run the full height of the screen, 43 entries one per line, each of them read letter by letter, and it sat behind a caret of 10 by 6 pixels on a chip of 45 by 24: miss that and the click did something else entirely. Three columns of drawn flags fit the same list into 42 percent less height, a click anywhere on the chip opens it, and Kick's own interface no longer paints over it. The flags are drawn in CSS rather than shipped as emoji, because flag emoji do not render on Windows, where the system falls back to the very letters being replaced.

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

Short summary: Chat Kick dans une langue que tu ne lis pas ? Traduit sous chaque message, en direct. Tes reponses partent dans celle de la chaine.

NOUVEAU EN 2.9.1

La liste des langues est une grille de drapeaux au lieu d'une colonne de codes a deux lettres, et un clic l'ouvre. Elle occupait toute la hauteur de l'ecran, 43 entrees une par ligne, chacune a dechiffrer lettre par lettre, et elle se cachait derriere un chevron de 10 sur 6 pixels dans une puce de 45 sur 24 : a cote, le clic faisait tout autre chose. Trois colonnes de drapeaux dessines y logent la meme liste avec 42 pour cent de hauteur en moins, un clic n'importe ou sur la puce l'ouvre, et l'interface de Kick ne passe plus par-dessus. Les drapeaux sont dessines en CSS et non livres en emoji, parce que les emoji de drapeaux ne s'affichent pas sous Windows : le systeme y retombe sur les deux lettres qu'il s'agissait justement de remplacer.

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

2.9.1 İLE GELENLER

Dil listesi artık iki harfli kodlardan oluşan bir sütun değil, bayraklardan oluşan bir ızgara, ve tek tıklamayla açılıyor. Eskiden ekranın tüm yüksekliğini kaplıyordu: her satırda bir tane olmak üzere 43 giriş, her biri harf harf okunuyordu, ve liste 45 x 24 boyutundaki bir düğmenin içindeki 10 x 6 piksellik bir okun arkasındaydı; ıskalarsanız tıklama bambaşka bir şey yapıyordu. Üç sütun hâlinde çizilmiş bayraklar aynı listeyi yüzde 42 daha az yükseklikte gösteriyor, düğmenin herhangi bir yerine tıklamak listeyi açıyor ve Kick'in kendi arayüzü artık listenin üzerine çizmiyor. Bayraklar emoji olarak değil CSS ile çiziliyor, çünkü bayrak emojileri Windows'ta görünmüyor: sistem tam da değiştirmek istediğimiz iki harfe geri dönüyor.

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

الجديد في 2.9.1

صارت قائمة اللغات شبكة من الأعلام بدل عمود من رموز من حرفين، وتُفتح بنقرة واحدة. كانت تشغل ارتفاع الشاشة كله، بـ 43 مدخلاً في سطر لكل منها، ويُقرأ كل واحد حرفاً حرفاً، وكانت خلف سهم بمقاس 10 في 6 بكسل داخل زر بمقاس 45 في 24: وإن أخطأته فعلت النقرة شيئاً آخر تماماً. ثلاثة أعمدة من الأعلام المرسومة تضع القائمة نفسها في ارتفاع أقل بنسبة 42 بالمئة، والنقر في أي مكان من الزر يفتحها، وواجهة Kick نفسها لم تعد ترسم فوقها. والأعلام مرسومة بـ CSS لا مُرسلة كرموز تعبيرية، لأن رموز الأعلام لا تظهر على ويندوز، فيعود النظام إلى الحرفين اللذين أردنا استبدالهما.

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

## Description (JA)

Paste into the Japanese listing in the developer dashboard. The body is the
Japanese AMO description with its Firefox paragraph swapped for Chrome's
on-device one, which is the only place the two stores disagree. No native
reader was available; same standard as the Turkish and Arabic blocks above.

Short summary: 読めない言語の Kick チャットが、届いたそばから各メッセージの下に翻訳されます。あなたの返信はチャンネルの言語で送れます。

2.9.1 の新機能

言語リストが2文字コードの縦一列ではなく、旗のグリッドになりました。クリック一回で開きます。以前は画面の高さいっぱいに43項目が一行ずつ並び、どれも一文字ずつ読む必要があり、しかもリスト自体は45×24のボタンの中にある10×6ピクセルの矢印の奥にありました。そこを外すと、クリックはまったく別のことをしていました。3列に描かれた旗が同じリストを42パーセント低い高さに収め、ボタンのどこをクリックしても開き、Kick 自身の画面がその上に重なることもなくなりました。旗は絵文字ではなく CSS で描いています。旗の絵文字は Windows では表示されず、置き換えたかったはずの2文字に戻ってしまうからです。

読めない言語でチャットが流れている Kick の配信を開いてください。届いたメッセージの真下に、その場で翻訳が付きます。チャット上部の緑のバーが、動いていることを示します。

返信を打つと、チャット欄の上に、チャンネルの言語での下書きが出ます。その下書きをクリックするか Ctrl+Enter を押すと、打った文章がその訳文に置き換わり、あとは自分で送るだけです。

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

NUEVO EN 2.9.1

La lista de idiomas es una cuadrícula de banderas en vez de una columna de códigos de dos letras, y se abre con un clic. Antes ocupaba toda la altura de la pantalla, 43 entradas una por línea, cada una leída letra a letra, y estaba detrás de una flecha de 10 por 6 píxeles dentro de un botón de 45 por 24: si fallabas, el clic hacía otra cosa completamente distinta. Tres columnas de banderas dibujadas meten la misma lista en un 42 por ciento menos de altura, un clic en cualquier parte del botón la abre, y la interfaz de Kick ya no se pinta por encima. Las banderas se dibujan en CSS y no se envían como emoji, porque los emoji de bandera no se muestran en Windows: el sistema vuelve justo a las dos letras que queríamos sustituir.

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

NOVIDADES NA 2.9.1

A lista de idiomas é uma grade de bandeiras em vez de uma coluna de códigos de duas letras, e abre com um clique. Antes ela ocupava a altura inteira da tela, 43 entradas uma por linha, cada uma lida letra por letra, e ficava atrás de uma seta de 10 por 6 pixels dentro de um botão de 45 por 24: se você errasse, o clique fazia outra coisa completamente diferente. Três colunas de bandeiras desenhadas colocam a mesma lista em 42 por cento menos altura, um clique em qualquer ponto do botão a abre, e a interface da própria Kick não passa mais por cima. As bandeiras são desenhadas em CSS e não enviadas como emoji, porque emoji de bandeira não aparece no Windows: o sistema volta justamente para as duas letras que se queria substituir.

Abra uma transmissão na Kick onde o chat está num idioma que você não lê. Cada mensagem recebe sua tradução logo abaixo, conforme chega. Uma barra verde no topo do chat mostra que está funcionando.

Digite uma resposta e uma prévia a mostra no idioma do canal, acima da caixa de chat. Clique na prévia ou pressione Ctrl+Enter e essa versão substitui o que você digitou, pronta para enviar.

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

НОВОЕ В 2.9.1

Список языков теперь сетка флагов, а не столбец двухбуквенных кодов, и открывается одним щелчком. Раньше он занимал всю высоту экрана: 43 строки по одной записи, каждую нужно было читать по буквам, а сам список прятался за стрелкой размером 10 на 6 пикселей внутри кнопки 45 на 24. Промахнулись, и щелчок делал совсем другое. Три колонки нарисованных флагов вмещают тот же список в высоту на 42 процента меньше, щелчок в любом месте кнопки открывает его, и интерфейс самого Kick больше не перекрывает его сверху. Флаги нарисованы средствами CSS, а не отправлены эмодзи: флаговые эмодзи не отображаются в Windows, и система возвращает те самые две буквы, которые мы и хотели заменить.

Откройте трансляцию на Kick, где чат идёт на языке, который вы не читаете. Каждое сообщение получает перевод прямо под собой, по мере поступления. Зелёная полоса вверху чата показывает, что всё работает.

Наберите ответ, и над полем ввода появится его вариант на языке канала. Щёлкните по нему или нажмите Ctrl+Enter, и этот вариант заменит набранный текст, останется только отправить.

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

2.9.1 的新功能

语言列表现在是旗帜网格，而不是两个字母代码的竖排列表，点一下就打开。它以前占满整个屏幕高度，43 个条目每行一个，每一个都要逐字母去读，而且列表藏在 45×24 按钮里一个 10×6 像素的箭头后面：点偏了，这一下就做了完全不同的事。三列绘制的旗帜把同一份列表放进少 42% 的高度里，点按钮任意位置都能打开，Kick 自己的界面也不再盖在它上面。旗帜用 CSS 绘制而不是用 emoji，因为旗帜 emoji 在 Windows 上根本不显示，系统会退回到我们本想替换掉的那两个字母。

打开一个聊天语言你读不懂的 Kick 直播。每条消息一到，正下方就会出现它的译文。聊天区顶部的绿色条表示正在运行。

输入回复时，聊天框上方会用频道的语言显示一份预览。点击预览或按 Ctrl+Enter，这个版本就会替换你输入的内容，直接发送即可。

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

2.9.1의 새로운 기능

언어 목록이 두 글자 코드의 세로 목록이 아니라 국기 그리드가 되었고, 한 번 클릭하면 열립니다. 예전에는 화면 높이를 가득 채워 43개 항목이 한 줄에 하나씩 놓였고, 하나하나 글자로 읽어야 했으며, 목록 자체는 45×24 버튼 안의 10×6 픽셀짜리 화살표 뒤에 있었습니다. 빗나가면 클릭은 전혀 다른 일을 했습니다. 세 열로 그려진 국기가 같은 목록을 42퍼센트 낮은 높이에 담고, 버튼 어디를 클릭해도 열리며, Kick 자체 화면이 그 위를 덮는 일도 없어졌습니다. 국기는 이모지가 아니라 CSS로 그립니다. 국기 이모지는 Windows에서 표시되지 않고, 시스템이 바로 그 두 글자로 되돌아가기 때문입니다.

읽지 못하는 언어로 채팅이 흐르는 Kick 방송을 열어 보세요. 도착하는 메시지 바로 아래에 번역이 붙습니다. 채팅 상단의 초록색 막대가 작동 중임을 알려 줍니다.

답장을 입력하면 채팅 입력창 위에 채널의 언어로 된 미리보기가 나타납니다. 미리보기를 클릭하거나 Ctrl+Enter를 누르면 입력한 내용이 그 번역으로 바뀌고, 보내기만 하면 됩니다.

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

## manifest.json description field (132 char limit)

Shipped value, already in public/_locales/en. It used to carry an em dash and
the word "pro", which said nothing; this replaced it and the note asking for the
replacement outlived the change. The ten localised values run 35 to 98
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
