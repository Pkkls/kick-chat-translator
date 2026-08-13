# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 2.5.0, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

Open a Kick stream where the chat is in a language you don't read. Each message gets its translation right underneath, as it comes in. A green bar at the top of chat tells you it's running.

Type a reply and a preview shows it in the channel's language above the chat box. Click the preview or press Ctrl+Enter and that's the version that gets sent.

Nothing to set up. Incoming chat is translated into your browser's language, and what you write goes out in whatever the channel broadcasts in, read from Kick itself. Both are overridable in settings. Works on live streams and on VOD replays, and it handles 7TV emotes.

ENGINES

Google works out of the box, no key, no account. Add your own free DeepL key (their free tier covers 1 million characters a month without a card) and quality jumps on European languages. DeepL also receives the recent channel lines as context so the wording fits the conversation, and it's asked for the polite register where the language has one: keigo in Japanese, vous rather than tu in French. To make a free quota last, DeepL is spent only on the pairs where it actually beats the free engines. MyMemory and Lingva sit behind as fallbacks, and when one engine fails the next takes over. You set the order.

Chrome and Edge 138+ can also translate on-device, hardware permitting. The model downloads once per language pair, then everything runs locally: offline, unlimited, and no chat text leaves your machine. Brave and Firefox don't ship that API yet, so they use the engines above.

DISPLAY

Translation below the original, inline with it, in place of it, or only when you hover. Hover mode fetches nothing until you point at a message, which cuts usage by roughly 10x on a fast chat.

FILTERS

Skip bots, blocklist users or channels, or limit which source languages get translated at all. Emotes, mentions, links and emoji spam are stripped before anything is sent out, so you're not paying to translate "kkkkkk". Background tabs pause themselves.

42 languages, right-to-left included (Arabic, Hebrew, Persian), with regional variants kept apart (pt-BR, zh-TW). The extension's own interface comes in 7.

No account, no analytics, no server of mine. It asks for storage and access to kick.com, nothing else. Your chat text goes to the engine you picked and nowhere else, and on-device it doesn't even go there.

Open source, MIT: github.com/Pkkls/kick-chat-translator

## Description (FR)

Tu ouvres un stream Kick où le chat est dans une langue que tu ne lis pas. Chaque message reçoit sa traduction juste en dessous, au fil de l'arrivée. Une barre verte en haut du chat indique que ça tourne.

Tu écris une réponse, un aperçu la montre dans la langue de la chaîne au-dessus de la barre de chat. Clic sur l'aperçu ou Ctrl+Entrée, et c'est cette version qui part.

Rien à régler. Le chat entrant est traduit vers la langue de ton navigateur, ce que tu écris part dans la langue de diffusion de la chaîne, lue depuis Kick. Les deux se changent dans les réglages. Marche sur les lives comme sur les replays VOD, et gère les emotes 7TV.

MOTEURS

Google fonctionne d'emblée, sans clé, sans compte. Ajoute ta propre clé DeepL gratuite (leur offre gratuite couvre 1 million de caractères par mois, sans carte) et la qualité monte nettement sur les langues européennes. DeepL reçoit aussi les lignes récentes de la chaîne comme contexte, donc la formulation colle à la conversation, et on lui demande le registre poli quand la langue en a un : keigo en japonais, vouvoiement en français. Pour faire durer un quota gratuit, DeepL n'est dépensé que sur les paires où il bat vraiment les moteurs gratuits. MyMemory et Lingva restent derrière en secours, et quand un moteur tombe le suivant prend le relais. L'ordre est le tien.

Chrome et Edge 138+ savent aussi traduire en local, si la machine suit. Le modèle se télécharge une fois par paire de langues, puis tout tourne sur ta machine : hors ligne, sans limite, et aucun texte de chat ne sort. Brave et Firefox n'ont pas encore cette API, ils passent par les moteurs ci-dessus.

AFFICHAGE

Traduction sous l'original, en ligne avec lui, à sa place, ou seulement au survol. Le mode survol ne demande rien tant que tu ne pointes pas un message, ce qui divise l'usage par dix environ sur un chat rapide.

FILTRES

Ignorer les bots, blacklister des utilisateurs ou des chaînes, ou limiter les langues source à traduire. Emotes, mentions, liens et murs d'emoji sont retirés avant tout envoi, tu ne paies pas pour traduire "kkkkkk". Les onglets en arrière-plan se mettent en pause seuls.

42 langues, écriture droite-gauche comprise (arabe, hébreu, persan), variantes régionales gardées distinctes (pt-BR, zh-TW). L'interface de l'extension existe en 7 langues.

Pas de compte, pas d'analytics, pas de serveur à moi. Elle demande le stockage et l'accès à kick.com, rien d'autre. Ton texte va au moteur que tu as choisi et nulle part ailleurs, et en local il n'y va même pas.

Code source ouvert, MIT : github.com/Pkkls/kick-chat-translator

## manifest.json description field (132 char limit)

Current value has an em dash and the meaningless word "pro". Replace with:

Translates Kick chat into your language as it scrolls, and your replies into the channel's.
