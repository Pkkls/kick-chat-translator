# Chrome Web Store listing

Plain text. The store renders no markdown, so the CAPS headers are the only
structure available. Fact-checked against manifest 2.6.0, README, CHANGELOG.

## Short summary (132 char limit)

Kick chat in a language you don't read? It gets translated under each message, live, and your replies go out in the channel's.

## Description (EN)

NEW IN 2.6.0

Chat written in the Latin alphabet is translated again: Spanish, Turkish, French and Portuguese were being refused as though they were already English, while Japanese and Korean went through. The bar at the top of chat no longer disappears. The interface now comes in 10 languages, with Spanish, Turkish and Korean added. The glossary is editable at last, a Debug tab shows why a line was left alone, and the reading language and a pause button now sit on the bar itself.

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

NOUVEAU EN 2.6.0

Le chat écrit en alphabet latin est de nouveau traduit : l'espagnol, le turc, le français et le portugais étaient refusés comme s'ils étaient déjà en anglais, alors que le japonais et le coréen passaient. La barre en haut du chat ne disparaît plus. L'interface existe maintenant en 10 langues, avec l'espagnol, le turc et le coréen. Le glossaire est enfin modifiable, un onglet Debug montre pourquoi une ligne a été laissée de côté, et la langue de lecture ainsi qu'un bouton pause sont passés sur la barre elle-même.

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

## manifest.json description field (132 char limit)

Current value has an em dash and the meaningless word "pro". Replace with:

Translates Kick chat into your language as it scrolls, and your replies into the channel's.
