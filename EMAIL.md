# Presentation email — Kick Chat Translator → Kick staff

> English (Kick staff). A French version is at the bottom. Replace **[bracketed]**
> bits and attach the 3 screenshots described under "Attachments".

---

## Subject

**Kick Chat Translator — a free, open-source real-time chat translator for Kick (looking for your feedback)**

---

## Body

Hi Kick team,

I'm **[your name]**, an independent developer and Kick viewer. I built **Kick Chat Translator**, a browser extension that translates kick.com chat **in real time**, so anyone can follow non-English streams (and non-English chatters can be understood on English streams).

I'd love your feedback — and, if you like it, any thoughts on making it official or featuring it for the community.

**See it in action** (Japanese stream → English, live):

> rein2052: やば → *Oh no*
> giyu_gun_ch: アブねぇー → *That was close!*
> edamame55: 中身なんてどうでもいいのか → *Does it even matter what's inside?*
> 44ka: しかもそれを放送するっていうね → *And they're actually going to air that, too.*

Each message keeps the original and shows the translation right underneath, with a source-language tag. (Screenshots attached.)

### Why it's good for Kick

- **Breaks the language barrier** between your global creators and viewers — more watch time, more chatting, more cross-region discovery.
- **Zero friction for viewers**: install, open a stream, done. A floating toggle turns it on/off per session.
- **Respectful of the platform**: it reads the public chat the same way the page renders it, caches aggressively, batches requests, applies a per-channel rate budget, and **auto-pauses in background tabs**. No private endpoints, no auth scraping, no spam.

### It's completely free

- **100% free and open-source (MIT)** — no ads, no accounts, no paywall, no monetization. I'm not selling anything.
- **No tracking, no telemetry, no backend.** Nothing is collected; there's literally no server on my side. (Full privacy policy in the repo.)
- On **Chrome** it can translate **fully on-device** (Chromium's built-in Translator API) — unlimited, instant, private, **no key and no network at all**.
- On browsers without that API (e.g. Brave), it falls back to cloud translators. The best one, **DeepL**, just needs a **free** API key the user grabs in ~2 minutes (DeepL Free = 1M characters/month, **0 €**). Google/MyMemory work with **no key** as well.

### Under the hood (for your reviewers)

- Manifest V3, Chrome + Firefox, minimal permissions (`storage`, `alarms`, and only the chat + chosen translation hosts). No `tabs`, no `<all_urls>`.
- Multi-provider chain with automatic failover, IndexedDB cache, on-device + cloud, spam/emote filtering, 57 unit tests, CI.
- Source: **[https://github.com/Pkkls/kick-chat-translator]**
- Permissions justification & privacy notes: `SUBMISSION.md` and `PRIVACY.md` in the repo.

### One ask / offer

If Kick exposed (or pointed me to) an **official way to read chat events**, I'd happily switch to it and drop the DOM-based reading entirely — happy to align with whatever you'd prefer. And if there's a path to listing it as a recommended/curated extension for the community, I'm in.

Thanks for building a platform worth translating for — happy to demo it live or answer anything.

Best,
**[your name]**
**[contact / GitHub handle]**

---

## Attachments (screenshots to include)

1. **Live translation** — a stream's chat with green translations under each foreign message (the Japanese→English view). *Best single "wow" shot.*
2. **The toolbar popup** — target language, provider status pills, and the DeepL quota bar.
3. **The options page** — the "Engine" card (on-device + cloud fallback) and the provider chain, to show how configurable/clean it is.

> Tip: open a busy non-English stream (e.g. a JP/ES/PT channel), let chat fill with
> translations, then screenshot the chat panel for #1.

---

## Version française (si tu préfères envoyer en FR)

**Objet : Kick Chat Translator — extension gratuite et open-source de traduction du chat en temps réel (vos retours ?)**

Bonjour l'équipe Kick,

Je suis **[ton nom]**, développeur indépendant et viewer Kick. J'ai créé **Kick Chat Translator**, une extension qui traduit le chat de kick.com **en temps réel**, pour suivre les streams dans n'importe quelle langue.

**Pourquoi c'est bien pour Kick :** ça casse la barrière de la langue entre vos créateurs et viewers internationaux (plus de watch time, plus d'échanges, plus de découverte cross-régions). Zéro friction : on installe, on ouvre un stream, c'est tout. Et c'est respectueux de la plateforme : lecture du chat public, cache + batching, budget par channel, **pause auto dans les onglets en arrière-plan**, aucun endpoint privé.

**C'est 100 % gratuit :** open-source (MIT), pas de pub, pas de compte, pas de tracking, aucun serveur de mon côté. Sur **Chrome**, traduction **on-device** (illimitée, locale, sans clé ni réseau). Sur les autres navigateurs (Brave), repli cloud : le meilleur moteur, **DeepL**, demande juste une **clé gratuite** à récupérer en 2 min (DeepL Free = 1M caractères/mois, **0 €**) ; Google/MyMemory marchent **sans clé**.

**Côté technique :** MV3, Chrome + Firefox, permissions minimales, multi-provider avec failover, 57 tests, open-source. Code : **[lien GitHub]** — justification des permissions et confidentialité dans `SUBMISSION.md` / `PRIVACY.md`.

**Une demande :** si Kick propose un moyen **officiel de lire les events du chat**, je bascule dessus avec plaisir. Et si une mise en avant communautaire est possible, je suis partant.

Merci, et dispo pour une démo live quand vous voulez.

**[ton nom]** — **[contact]**
