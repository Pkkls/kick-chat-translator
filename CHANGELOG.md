# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Export / import your settings** from the Advanced tab. Export writes a JSON backup, import
  restores it and reloads the page. A backup from an older build still imports: missing fields
  fall back to their defaults and unknown ones are dropped, so the file never breaks storage.
- **Minimum message length is now a setting** (Filters tab). The floor below which a message is
  left untranslated used to be fixed at 2 characters; raise it to spend less provider quota on a
  busy chat. Existing installs keep the old value, so nothing changes until you move it.
- **Common chat words are now recognised directly.** Below about 20 characters the statistical
  language detector often gives up or answers confidently wrong ("ok merci" came back as
  Hungarian, and that wrong code was passed to the translation service as the source language).
  A short list of everyday words in Spanish, French, Portuguese, German, Italian and Turkish is
  now checked first, and words that disagree with each other leave the message unlabelled rather
  than guessing. This covers the words on that list; it is not a general accuracy improvement.
- **Cache hit rate trend in the popup.** Usage stats now retain the last 7 days instead of being
  wiped at midnight, and the popup draws them as a small bar chart under the counters. Days with
  no traffic are skipped rather than drawn as 0%. The trend appears once two days have been
  recorded, so it stays empty on a fresh install until history builds up.

### Changed
- **Very long non-Latin messages no longer stall on Lingva.** Lingva receives the message inside
  the URL, where non-Latin text expands to roughly nine times its size, so a long Japanese or
  Chinese line could produce a request too large for some servers to accept. Those messages now go
  straight to the next translation service instead. Lingva keeps its place in the chain for
  everything else.
- **The cache now warms the languages you actually use.** On startup the worker pulled the first
  200 stored translations into memory, but stored keys are ordered by target language, so it
  loaded whichever language happened to sort first and often skipped yours entirely. It now warms
  the language you read first, then the ones seen most in chat, so repeated lines are answered
  from memory right away instead of going back to storage.
- The ASCII check in language detection now uses `\p{ASCII}` instead of a literal control-character
  range. Same behaviour, but the source file no longer contains a NUL byte, so Git treats it as text
  and changes to it show up as readable diffs.

### Fixed
- **A line the translation services gave up on can now be retried.** It used to lose its translation
  and, with it, the retry button that lived inside, so it looked exactly like a line that was never
  meant to be translated and there was nothing left to click. Such a line now keeps a small marker
  naming the reason, with the retry button on it. A retry that fails again keeps the button instead
  of deleting it. Lines skipped on purpose, by the glossary, by the same language check or by the
  identical text check, stay silent as before.
- **Hiding the original now works when a chat emote extension is running.** With "Keep original
  text visible" turned off, the original stayed on screen for anyone using 7TV. That extension hides
  the text Kick writes and renders its own copy next to it, and only Kick's copy was being hidden,
  so the setting did nothing at all. Both are hidden now, emotes included.
- **Hiding the original now works on replies too.** With "Keep original text visible" turned off, a
  reply kept showing its original text while every other line hid it. Kick nests the message of a
  reply one level deeper than a plain line, and the rule only reached text sitting directly beside
  the translation. It now keys on the element holding the translation, which reaches both shapes.
  The quoted message a reply points at stays readable, as it should.
- **"Keep original text visible" now does something.** The switch was offered in both the options
  page and the popup and was saved correctly, but no part of the extension ever read it, so turning
  it off left the chat exactly as it was. Turning it off now hides Kick's own text on the lines that
  carry a translation, and only on those lines: a line that was never translated, or one the chat's
  virtual scrolling reused, keeps its text.
- **The Replace display style paid for the same translation over and over.** Three checks asking
  "has this line already been translated?" listed the Below and Inline classes but not the separate
  class Replace uses, so on that style every translated line still read as untranslated. Coming
  back to the tab, and every pause after scrolling, re-submitted every visible line to a translation
  service. The same blind spot let the recycled-row rescue overwrite a line's translation with a
  different message's. All three now share one selector built from the display styles themselves.
- **The Replace display style described itself wrongly.** Its card in the options page said the
  translation appears below the message. It appears on the same line, right after it, in smaller
  italics. Corrected in English and in all six translated interfaces.
- **The Replace display style was unreadable.** Its translation had no green tint, no copy cursor
  and a re-translate button that could never be revealed, because those three CSS rules named
  `.kt-translation` and `.kt-translation-inline` but not the separate `.kt-translation-compact`
  class that Replace actually uses. It now carries the same cue as the other styles, keeping its
  smaller italic text, and it reads correctly on a light OS theme too. Inline gains the green
  left edge that Below already had; Below and Hover are unchanged.
- **The extension could bind to the wrong part of the chat page.** It picked the first element
  matching its chat-container selector. Kick's layout has three matching elements, and the first is
  a horizontal scroller that holds no messages: on the three channels checked, one offline and two
  live, that element contained none of the chat. It now picks the candidate that actually holds
  chat messages, and keeps looking while the chat is still empty instead of settling on the wrong
  one.
- **Switching channels no longer leaves background watchers behind.** Each channel switch started a
  page-wide DOM watcher without dropping the previous one, so they piled up and every one of them
  ran on every change anywhere on the page. Long sessions hopping between channels should feel
  lighter.
- **Compact display no longer stacks duplicate translations.** In the compact display style, a
  re-translation (the retry button, or the same message being processed again) added a second
  translation under the message instead of replacing the first, and they piled up. The other
  display styles were unaffected.
- **The compose preview no longer overwrites your clipboard for nothing.** When a translation came
  back identical to what you had typed, inserting it left the box looking unchanged, which the
  extension read as "the editor rejected it" and fell back to copying the text over whatever you
  had on your clipboard. It now only falls back when the translation would actually have changed
  the box.
- **Glossary entries with non-Latin text now work.** Every rule whose source term was not plain
  ASCII was silently ignored, including the documented `草→lol` example, along with Cyrillic and
  accented words like `café`. Rules on ASCII words still match whole words only.
- **Turkish names and words are now matched regardless of capitalisation.** Lowercasing a Turkish
  capital İ leaves an extra invisible mark behind, so the same name written in a different case no
  longer looked like the same name: a blacklisted Turkish user kept coming through, and the same
  Turkish word in two capitalisations was translated and paid for twice instead of being reused
  from cache. Dotted and dotless i stay distinct, as they are genuinely different letters.
- **Username detection was broken by a Kick layout change, which silently disabled the user
  filters.** Kick now renders the sender's name directly on a button instead of inside a span, so
  the extension read every message as having no author: blacklisted users were still translated,
  the bot filter had nothing to match on, and the "same user repeated themselves" check never
  fired, so spam was re-translated at your providers' expense. Checked against live chat, where
  none of the previous detection paths matched a single message.

## [2.5.0] — 2026-06-04

### Added
- **The extension UI is now available in 7 languages** — English, Japanese, French, Chinese,
  Arabic, Russian, and Portuguese. The options page and popup auto-detect your browser language
  and can be switched live from a picker in the options header; Arabic renders right-to-left.
  Missing strings fall back to English, so the UI is never blank.

### Fixed
- **Firefox (AMO) data-consent.** Added the now-required
  `browser_specific_settings.gecko.data_collection_permissions` key, declaring that the extension
  transmits chat message text (website content) to the user-selected translation provider and
  nothing else. This unblocks Firefox Add-ons validation.

## [2.4.1] — 2026-06-03

### Fixed
- **Firefox build compatibility.** `strict_min_version` is now `121.0` (the version that supports
  ES-module background scripts and `storage.session`) instead of an incorrect `109.0` that left the
  background non-functional on Firefox 109–120 and failed `web-ext lint`. The keepalive now guards
  `storage.session`. `web-ext lint` → 0 errors. (Promise-based `chrome.*` works natively on Firefox MV3,
  so no polyfill is needed.)

## [2.4.0] — 2026-06-03

### Improved
- **Outgoing (compose) quality, especially into Japanese.** The compose translation now feeds DeepL
  the recent channel lines as `context` (free — DeepL doesn't bill context characters) so the wording
  fits the conversation, and requests the **polite register** (`formality: prefer_more` → keigo for
  Japanese) where DeepL supports it. Compose also **remembers a channel's broadcast language**, so an
  offline Japanese channel still targets Japanese instead of defaulting to English.

## [2.3.1] — 2026-06-03

### Fixed
- **Compose preview stayed up after you cleared the chat box.** Kick's Lexical composer never fires a
  catchable `input` event on delete-to-empty (only `beforeinput`/`keyup`), so clearing your draft left
  the translation panel visible. It now also re-evaluates on `keyup`, so an empty box hides the panel.

## [2.3.0] — 2026-06-03

### Added
- **"Update available" indicator** — the popup checks the latest GitHub release (cached 6h) and shows
  a one-click banner linking to the release when a newer version is published; the header now shows the
  installed version. New read-only host permission: `https://api.github.com/*`.

## [2.2.1] — 2026-06-03

### Fixed
- **Critical: incoming chat translation was completely broken** (v2.1.0–v2.2.0). The pipeline's
  `effTarget` getter referenced itself instead of `settings.targetLang`, causing infinite recursion
  (`RangeError`) on every incoming message — `prepare()` threw and the rejection was swallowed by the
  observer, so messages were marked seen but never translated (0 requests reached the service worker).
  Compose ("translate what I type") was unaffected. Added a regression test (`pipeline.test.ts`) and a
  postmortem (`docs/postmortem-2026-06-03-efftarget-recursion.md`).

## [2.2.0] — 2026-06-02

Quality + reach polish, and a correct two-store release pipeline.

### Added
- **Budget-aware DeepL routing** (`deeplSmartRouting`, default on): DeepL is spent only
  on the European language pairs where it measurably beats the free engines; other
  targets (Japanese, Korean, Chinese, Arabic, Hindi, Thai…) demote it to a last-resort
  fallback — stretching the Free **1,000,000 chars/month** quota much further. Toggle in
  Options → Providers → DeepL.

### Changed / Fixed
- **Compose panel placement** now tracks the **visual viewport**, so it rides above the
  on-screen keyboard instead of hiding behind it, and lifts clear of Kick's emote / emoji
  picker when one opens over the composer.
- **MyMemory** regional codes: variants are sent as RFC-3066 (`pt-BR`, `zh-CN`, `zh-TW`,
  `no`) instead of a bare 2-letter code, improving 3rd-tier fallback quality.
- **Release pipeline**: the Chrome and Firefox bundles are now packed from their *own*
  builds — previously the published `-chromium` asset actually contained the Firefox
  build and no correct Firefox zip was produced. `build:firefox` is now cross-platform
  (`cross-env`); new `package:all` produces both store zips locally.
- Corrected the stale DeepL Free quota copy (500k → 1,000,000 chars/month).

### Tests
- 116 unit tests (was 91): budget routing, MyMemory code mapping, compose-panel geometry.

## [2.1.0] — 2026-06-02

International auto-detection + a compose preview. Works for any user on any channel
with zero configuration.

### Added
- **Compose preview** — translate what *you* type, live, in a floating panel above the
  chat box; click or **Ctrl/Cmd+Enter** to insert, **Esc** to dismiss.
- **Zero-config language detection, both directions:** reading target defaults to your
  **browser language** (`targetLang: 'auto'`); compose target is the **channel's
  language**, auto-detected from Kick's API (`livestream.lang_iso`) — no manual picking.
- **+11 languages** (31 total): Catalan, Slovenian, Estonian, Lithuanian, Latvian,
  Persian, Bengali, Tamil, Malay, Filipino, Slovak; plus **Brazilian Portuguese**.
- **RTL rendering** (`dir="auto"`) for Arabic / Hebrew / Persian.

### Changed / Fixed
- Chinese is no longer mislabelled as Japanese (kana-vs-Han script detection).
- Regional variants kept distinct (pt-BR, zh-TW); base-language comparison avoids
  pointless self-translation.
- DeepL: correct `PT-BR` / `ZH-HANS` / `ZH-HANT` / `NB` targets, valid base-code
  `source_lang` (was sending an invalid `EN-US`), and unsupported targets skip cleanly
  to Google without cooling DeepL down. Google: regional `tl` codes.
- Channel-meta fetches de-duplicated and tolerant of Cloudflare 403/503; invalid
  language settings coerced back to `auto`.
- Floating bar showed the literal `AUTO` sentinel instead of the resolved language.
- Compose was blocked for ASCII source languages (bonjour → "good") by the background's
  English-only same-language heuristic.

### Tests
- 91 unit tests (was 57).

## [2.0.0] — 2026-05-28

Complete rewrite. Not backwards-compatible with 1.x settings.

### Added
- **WebSocket-first ingestion** via Kick's Pusher endpoint
  (`App\Events\ChatMessageEvent`), with a DOM observer fallback.
- **Multi-provider chain**: Google Translate (free, no key), DeepL Free/Pro,
  MyMemory, and any Lingva / LibreTranslate instance.
- **Auto-failover** with per-provider exponential cooldown.
- **IndexedDB cache** with TTL + LRU + in-memory front layer.
- **Per-channel token-bucket rate limiter** to protect provider quotas.
- **Dedicated options page** (Preact + Tailwind) with tabs:
  Providers, Display, Filters, Advanced, About.
- **Hover-to-translate** display mode (on-demand, zero passive cost).
- **Source-language allowlist** to translate only specific languages.
- **Bot/user/channel filters** with whitelist + blacklist support.
- **`franc-min`-based language detection** replacing the naive heuristic.
- **Kick `[emote:id:name]` parser** + `@mention` / URL stripping before
  translation, so we don't ship emote text to the provider.
- **Daily usage stats**: requests, cache hit rate, errors, top languages.
- **Firefox MV3 build target** alongside Chrome.
- **Vitest test suite** and **GitHub Actions CI**.
- **Privacy policy** (`PRIVACY.md`) and **LICENSE** (MIT).

### Changed
- Build: Webpack → **Vite 5 + @crxjs/vite-plugin v2** + TypeScript strict.
- UI: vanilla TS → **Preact + Tailwind** for popup + options.
- Service worker: keepalive via `chrome.alarms` (instead of dying mid-burst).

### Removed
- The promised-but-never-implemented DeepL backend from v1 (now real).
- The dead `libretranslate.com` public endpoint (replaced by configurable
  Lingva, which still proxies LibreTranslate engines).
- Inline styles scattered across the codebase (now in `inject.css`).

### Fixed
- XSS surface in injection (no more `innerHTML` on untrusted content).
- Cache lost on every service-worker idle (now persisted to IndexedDB).
- Identical-text "translations" pollute the chat (now suppressed).
