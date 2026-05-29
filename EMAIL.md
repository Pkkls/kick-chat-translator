# Presentation email — Kick Chat Translator → Kick staff

> Replace **[bracketed]** bits and attach the 3 screenshots described under "Attachments".

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
- **Plays nice with 7TV**: it auto-detects whether the viewer has the 7TV extension installed (7TV changes how chat is rendered) and reads messages correctly in both cases — no double text, emotes left untouched.

### It's completely free

- **100% free and open-source (MIT)** — no ads, no accounts, no paywall, no monetization. I'm not selling anything.
- **No tracking, no telemetry, no backend.** Nothing is collected; there's literally no server on my side. (Full privacy policy in the repo.)
- Where the browser exposes the built-in **Translator API** (Chrome today), it can translate **fully on-device** — unlimited, instant, private, **no key and no network at all**.
- Where that API isn't available (e.g. **Brave**), it falls back to cloud translators. The best one, **DeepL**, just needs a **free** API key the user grabs in ~2 minutes (DeepL Free = 1M characters/month, **0 €**). Google/MyMemory work with **no key** as well.

### Under the hood (for your reviewers)

- Manifest V3, **Chromium (Chrome, Brave, Edge) + Firefox**, minimal permissions (`storage`, `alarms`, and only the chat + chosen translation hosts). No `tabs`, no `<all_urls>`.
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
