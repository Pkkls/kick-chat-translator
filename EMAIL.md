# Presentation email — Kick Chat Translator → Kick (staff + engineering)

> Replace **[bracketed]** bits and attach the screenshots listed at the bottom.
> Written for two audiences: a friendly top half for anyone, a technical deep-dive
> for your engineers/reviewers.

---

## Subject

**Kick Chat Translator — free, open-source, real-time chat translation for Kick (feedback welcome)**

---

## Body

Hi Kick team,

I'm **[your name]**, an independent developer and Kick viewer. I built **Kick Chat Translator**, a browser extension that translates kick.com chat **in real time** so viewers can follow any stream regardless of language — and chatters in any language can be understood.

It's **free and open-source**, there's no business behind it, and I'd genuinely value your feedback. **I'm happy to receive any feedback from your team, and — if it's legally fine on your side — I'm glad to share the project with Kick** (code, design, or hand it over / collaborate, whatever works for you).

### See it in action (live, multiple languages → English)

- 🇯🇵 `バーテンって資格必要なの？` → **"Do you need a license to be a bartender?"**
- 🇪🇸 `no hay manera` → **"There's no way"**
- 🇸🇦 `أه` → **"Ah"** · `كيف حالك` → **"How are you doing?"**
- 🇫🇷 (mixed in an Arabic chat) `ils ont pas les droits fifa` → **"They don't have the FIFA rights"**

Each message keeps the original and shows the translation underneath, with a small source-language tag. (Screenshots attached.)

---

## Part 1 — For everyone (what it does, why it helps Kick)

- **Breaks the language barrier** between your global creators and viewers → more watch time, more chatting, more cross-region discovery.
- **Zero friction**: install, open a stream, done. A floating bar at the top of chat toggles it on/off.
- **Free, period**: no ads, no account, no paywall, no subscription. The best engine (DeepL) only needs the *viewer's own* **free** API key (1M characters/month, **0 €**); Google/MyMemory work with **no key at all**.
- **Private**: no tracking, no analytics, no backend — there is no server on my side.
- **Plays nice with 7TV**: auto-detects whether the viewer runs 7TV (which changes how chat is rendered) and reads messages correctly either way.

---

## Part 2 — Technical deep-dive (for your engineers / reviewers)

**Stack & packaging**
- Manifest V3. Built with Vite + `@crxjs/vite-plugin`, TypeScript (strict), Preact + Tailwind for popup/options. One source tree → **Chromium (Chrome, Brave, Edge)** and **Firefox** builds.
- 57 unit tests (Vitest), ESLint (0 warnings), GitHub Actions CI (typecheck + lint + test + build).

**How chat is read**
- Primary path is the rendered DOM of the chat panel (`#channel-chatroom` virtualised list). We also have a Pusher WebSocket client for `App\Events\ChatMessageEvent`; on the public web app it's rejected for anonymous clients (close code `4001`), so the DOM path is what runs today. **A virtual-scroll recycling guard** verifies a row still holds the same message before injecting, so translations never attach to the wrong message.
- **This is exactly where we'd love guidance** — see "One ask" below.

**Translation engines (multi-provider, automatic failover)**
- **On-device**: Chromium's built-in **Translator API** (`Translator.availability/create`) when present (Chrome today). Unlimited, on-device, no network, no key. Brave currently disables it → we fall back to cloud automatically.
- **Cloud chain** (user-ordered): **DeepL** (native batch, up to ~40 texts/request), **Google** (web endpoint), **MyMemory**, **Lingva**. Providers auto-detect source language (more reliable than client-side detection on short chat); a failing provider gets an **error-aware cooldown** (transient 429 → seconds; quota/auth → minutes) so we never hammer anyone.

**Performance & platform-friendliness**
- Request **coalescing** (≈180 ms window) + **batching**, an in-tab LRU memory cache **and** a persistent IndexedDB cache (cosmetically-normalised keys, so "wwww"/"WWWW" collapse) → very high cache-hit ratio on busy chat.
- **Per-channel token-bucket rate budget** caps outbound calls.
- **Auto-pause when the tab is hidden** (live `document.visibilityState`) → background tabs generate zero traffic and burn zero quota.
- **Noise filtering**: emotes, emoji-only, laughter (`kkkk`/`jaja`/`lol`/`rsrs`/…) and streaming slang are skipped before any network call.

**Security & privacy (permissions justified)**
- Permissions: `storage`, `alarms`, host access to `kick.com` + the chosen translation hosts only. **No** `tabs`, **no** `<all_urls>`, no cookie/history/credential access.
- A message's text is sent only to the translator the user selected, only to translate it. On-device mode sends nothing off the machine. No data is collected by me; there is no backend.
- See `SUBMISSION.md` (permission table + reviewer notes) and `PRIVACY.md`.

---

## One ask / offer

The only "gray area" is that I read chat from the DOM (and try the public Pusher feed). **If Kick has — or would point me to — an official, supported way to read chat events**, I'll switch to it immediately and drop DOM reading entirely. I want this to align with how you'd prefer third parties to integrate.

And again: **happy to hear your feedback, and to share the project with Kick if that's legal/agreeable on your end.**

- Source: **[https://github.com/Pkkls/kick-chat-translator]**
- User guide: `TUTORIAL.md` · Reviewer notes: `SUBMISSION.md` · Privacy: `PRIVACY.md`

Thanks for building a platform worth translating for — I'm happy to demo it live or answer anything.

Best,
**[your name]**
**[contact / GitHub handle]**

---

## Attachments (screenshots)

1. **Japanese → English** — chat with green translations under each message *(the cleanest "wow" shot)*.
2. **Spanish → English** — same, on a Spanish stream.
3. **Arabic → English** — shows it handles RTL + mixed-language (Arabic/French/romanized) chat.
4. **Options → Providers/Engine** — engine strategy, on-device toggle, provider chain, DeepL key.
5. **Popup** — target language, provider status pills, DeepL quota bar.

> Capture 1–3 by opening a JP/ES/AR stream and screenshotting the chat panel.
