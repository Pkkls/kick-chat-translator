# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Real-time translation for Kick.com chat, on live streams and VOD replays. Open a stream, and any
message in another language gets its translation rendered right underneath. Nothing to set up.

Runs on **Brave, Chrome, Edge and Firefox**, and understands 7TV emotes.

| Chat, translated as it scrolls | The toolbar popup |
|---|---|
| <img src="screenshots/chat.png" alt="Kick chat where each Spanish message carries an English translation underneath, with the extension's status bar above the list" width="360"> | <img src="screenshots/popup.png" alt="The extension popup with target language, display mode, provider list and the day's request counts" width="360"> |

| What you type, before you send it | Pick a language, or let it pick |
|---|---|
| <img src="screenshots/compose.png" alt="The compose box holding an English message, with a preview above it showing the Spanish version that will be sent" width="360"> | <img src="screenshots/languages.png" alt="A searchable grid of language flags and names, with the channel's own language first" width="360"> |

<sub>Taken from the shipping build by
<code>scratchpad/harness/store-shots-fixture.mjs</code>, in a chat room this
repository makes up. The usernames and messages are invented, the translations
are answered locally, and nothing leaves the machine, so no real person's handle
ends up on this page. What the images show of the product is real: it is
<code>dist/</code> running, reading that room the way it reads any other.</sub>

**Zero config.** Incoming chat is translated into *your* browser's language. When you type, a live preview
shows your own message in the *channel's* language (auto-detected from Kick) just above the chat box; click
it or press **Tab** to swap what you typed for the translation, then send it yourself. Both directions
work on their own, so you never have to pick a language. (You still can, in settings.)

**43 languages**, right-to-left scripts included (Arabic, Hebrew, Persian) as well as regional variants
(Brazilian Portuguese, Traditional Chinese).

---

## What's new in [2.12.3](https://github.com/Pkkls/kick-chat-translator/releases/latest)

**Nine things the extension used to decide for you are yours now.** Text size, line spacing and typeface for
the translated line, how much air its block gets, the accent colour, the chat theme, a reading language
remembered per channel, and two keyboard shortcuts. Each default is exactly what the stylesheet carried
before, so a reader who never opens the settings sees no change at all.

**Tab swaps what you typed for its translation.** Accepting the compose preview meant Ctrl/Cmd+Enter, a
two-handed chord in the middle of typing. Tab is taken only while the preview is on screen, so an empty box
never loses it, and Shift+Tab is left alone in every case so walking backwards out of the message box always
works. A setting gives Tab back entirely to anyone who navigates by keyboard.

**The two bars say which is which.** The bar at the top of the chat translates what other viewers write; the
chip at the bottom translates what you write. Nothing on screen separated them, and the information lived in
tooltips nobody hovers. A down arrow on one, an up arrow on the other, vertical so they do not lie in an
Arabic interface where the whole bar mirrors.

**Flags instead of two letters, everywhere.** The language table carried the string `JA` in a field named
`flag`, while the stylesheet has drawn 43 real flags all along, used only by one picker. Every surface draws
them now: each translated line, both bars, the compose preview and the language list.

**The language panel shows which language is selected.** It carried that state on a background measured at
1.21:1 against its own surface, where hover sits at 1.87, so the two were indistinguishable while the focus
ring at 12.74 was the brightest thing in a panel it only passes through. Tint, the word in the accent, and a
rail. Flags rest desaturated and come back to full under the pointer, so colour is a signal rather than a
wall of 43 saturated rectangles.

**Long names stopped being cut.** The pin icon sat invisible in every row of the picker, spending 17 percent
of each column to show nothing, and the grid kept three columns whatever the chat width. `Chinese (Taiwan)`
was rendering as `Chinese (...`, which you could not tell from `Chinese`.

**The settings page shows what it is doing.** Eleven settings, and for nine of them the number that answers
"what is this doing" already existed and was not shown. The cache says how many entries it holds, the
per-channel budget says whether it ever held anything back, and the language list shows how much each
language actually represented. The tab called Debug is called Activity, because a total of messages
translated is not debugging.

Control borders inside the language panel sat at 1.80:1 on dark and 1.42:1 on light, against the 3:1 the
theme file states for a control's own boundary.

Every release before this one is in [CHANGELOG.md](CHANGELOG.md), with the
measurement behind each entry.

---

## Install

**[➥ Chrome / Brave / Edge · Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox · Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

One click to install. Open any Kick stream, and the green bar at the top of chat tells you it's live.

<details>
<summary>Or install manually (unpacked / dev build)</summary>

Grab the right zip from [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) and unzip it.

- **Chrome / Brave / Edge** (`…-chromium.zip`): open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, pick the folder.
- **Firefox 121+** (`…-firefox.zip`): open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, pick `manifest.json`.

</details>

## Translation engines

Four providers chained together. If one fails, the next takes over:

| Provider | Key needed? | Note |
|---|---|---|
| Google | No | Default, works out of the box |
| DeepL | Yes (free) | Best quality. [Get a free key](https://www.deepl.com/pro-api) (1M chars/month, €0) |
| MyMemory | No | Fallback |
| Lingva | No | Fallback. Uses a public instance out of the box; point it at your own in the settings if you'd rather |

The order is yours to set in the settings.

### On-device translation

Chromium's built-in translator, where it is available, is the fastest path by a wide margin. Measured on
a live channel: **22 ms** from a message appearing to its translation being on screen, against **1618 ms**
through the cloud chain. No network, no quota, and the text never leaves your machine.

Two things gate it, and both are worth knowing before you count on it.

The API has to be there at all. Firefox does not ship it. Chrome and Edge 138+ are supposed to, but it is
not guaranteed: on the same machine, one Chrome 151 exposed it and another did not. If yours does not,
everything falls back to the cloud chain above and nothing breaks.

And the model for your language pair has to be downloaded, once, with one click from the bar. Until then
that pair goes to the cloud too, even though the pairs you already downloaded stay local.

## Settings

Click the gear on the chat bar, or right-click the extension icon → Options.

- **Target language**: what everything is translated into (43 to choose from)
- **Provider order**: drag to reorder, paste your DeepL key
- **Engine mode**: on-device first, cloud first, or on-device only
- **Display**: four styles. Below the message on its own line, inline in a pill after it, in place of the original with the emotes left alone, or only on hover. **Below is the one to use for now; the other three are still being worked on.** Original text, source language and provider badges each optional. A sample line in the settings shows each style before you pick it
- **Language button**: a chip in the chat's action bar, just before the gear. One click switches between the channel's language and your last pick, press-and-hold opens the list, and typing two letters filters it. It sits there so changing the language you write in never sends you to the top of the chat
- **Compose preview**: on or off, its target language, and whether clicking it fills the chat box or copies the translation instead
- **Filters**: skip bots, blocklist users or channels, restrict the source languages, or whitelist channels
- **Glossary**: find and replace pairs applied to the translation, for names and in-jokes that engines mangle
- **Budget**: DeepL quota share and smart routing, per-channel rate limit, cache size and lifetime, concurrency
- **Auto-pause**: background tabs stop translating (saves your DeepL quota)
- **UI language** for the extension's own interface, in English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese or Korean, plus buttons to clear the cache or reset stats and settings
- **Readability**: text size, line spacing and typeface for the translated line, plus how much air the block gets. The size multiplies whatever Kick gives the chat, so if you already enlarged Kick's own chat your choice is kept and this one adds to it
- **Appearance**: accent colour out of four, each one measured for contrast rather than picked, and the chat theme pinned dark or light instead of following the channel
- **Per-channel language**: off by default. Turned on, a channel you have already read restores the language you read it in
- **Keyboard**: Alt+T turns chat translation on or off, Alt+W the compose preview. Both are changed in `chrome://extensions/shortcuts`
- **Activity**: what the extension actually did. Messages translated, how many were served from the cache, and every language seen in chat with its count, which is what the source-language allowlist decides between

## Privacy

No account, no analytics, no server of mine. Messages go to the translation provider you picked and nowhere
else, and in on-device mode, not even there. [Details](PRIVACY.md)

## FAQ

**Q: The green bar disappeared / translation stopped working.**
**A:** 2.6.0 fixed the cause of this: Kick leaves a hidden second copy of the chat panel in the page and the bar was being mounted into that one, invisible from the start. Update first. If it still happens on 2.6.0 or later, refresh the page and open an issue, because that would be a new one.

**Q: Messages aren't being translated.**
**A:** Open the **Activity** tab in the settings and press "Read decisions": it lists the last 50 lines and says, for each one, why it was translated or left alone. That answers this faster than guessing.

Most lines that get skipped are skipped on purpose. Measured over one live session, out of 234 skipped lines: 213 were the same user repeating themselves, 9 were under the minimum length, 7 were emoji or laughter only, and 1 was already in the reading language. If the Activity tab shows nothing at all, then the extension is not seeing the chat, which is a different problem worth an issue.

**Q: Which display style should I use?**
**A:** Below. The other three work, but they are still being adjusted and the settings mark Below as the recommended one. If you switch and something reads oddly, that is why.

**Q: Does it work on VOD replays?**
**A:** Yes. The extension translates chat on both live streams and VOD replays.

**Q: Which browsers are supported?**
**A:** Chrome, Brave, Edge and Firefox are all supported.

**Q: Is my data safe?**
**A:** There's no account system and no analytics. Chat messages are sent only to the translation provider you chose, and nowhere else.

**Q: How do I get better translation quality?**
**A:** Add a free DeepL API key in the settings. DeepL's free tier covers up to 1 million characters a month and consistently beats the default providers.

**Q: A stretched message like "muuuuy biennnn" stays untranslated.**
**A:** It should not, since 2.7.0. The translation services hand messages like that straight back unchanged, so the line is retried once on its flattened text. If you still see one, the Activity tab will say which of the two attempts gave up.

**Q: The extension broke after a Kick update.**
**A:** Kick sometimes changes its chat structure, which can break message detection. Open a [GitHub issue](https://github.com/Pkkls/kick-chat-translator/issues) and it'll be patched as soon as possible.

## Supported languages

English · French · Spanish · Portuguese · Portuguese (Brazil) · German · Italian · Dutch · Polish · Swedish · Czech · Slovak · Romanian · Russian · Ukrainian · Turkish · Arabic · Hebrew · Japanese · Korean · Chinese (Simplified) · Chinese (Traditional) · Thai · Vietnamese · Indonesian · Hindi · Finnish · Norwegian · Danish · Greek · Hungarian · Bulgarian · Catalan · Slovenian · Estonian · Lithuanian · Latvian · Persian · Bengali · Tamil · Malay · Filipino · Cantonese

## How it works

1. A content script watches the Kick chat DOM and catches each new message.
2. The message is handed to the background service worker, which tries providers in order until one succeeds.
3. The translation is injected back into the DOM, beneath the original message.
4. For outgoing messages, the channel's language is auto-detected through the Kick API and a live preview appears above the chat input.

The extension never intercepts or modifies Kick's own network requests.

It asks for `storage` and `alarms`, and for host access to kick.com, to each translation provider it can call (Google, DeepL, MyMemory, the two Lingva instances), and to `api.github.com`. That last one is the update check: it reads the latest release tag, throttled and cached, and the popup offers a link when a newer version exists. Nothing is sent with that request and nothing auto-updates.

---

## Build from source

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build            # Chromium, output in dist/
npm run build:firefox    # Firefox, same output directory
npm run pack             # zip into release/
npm run pack:firefox
```

`npm run release:check` is the gate the packages go through: typecheck, lint, tests
and build, in that order. Run it rather than its parts, since running only three of
the four is how three lint errors once reached a release branch unnoticed.

Other commands: `npm run dev` (HMR), `npm run test`, `npm run test:watch`.

**Builds are reproducible.** `.gitattributes` pins line endings and `scripts/pack.ts`
fixes entry order and timestamps, so the same commit yields a byte-identical zip on
any machine. Verified by extracting a `git archive` of the tag into an empty
directory, building there, and comparing hashes. Worth repeating before any store
submission that asks for source.

Stack: MV3, Vite, TypeScript, Preact, Tailwind. The content script ships as
a classic IIFE for reliable injection on Brave.

`scripts/check-strip.ts` runs at the end of every build. The repository carries a
development-only instrumentation module, and this fails the build if any part of it,
or even one of its measurement key strings, survives into a release bundle. It
checks both directions, so an instrumented build that lost the code fails too.

## Tests

```bash
npm run release:check    # typecheck, lint, 1032 unit tests, build
```

Run it rather than its parts. Running only three of the four is how three lint
errors once reached a release branch unnoticed.

Beyond the unit tests there are 39 offline gates. They load the built extension
into a real browser, drive it, and assert what it does: a chat row gets its
translation, the fallback chain takes over when the first engine rate-limits, a
recycled row is re-translated, the language change reaches the page without a
reload, the compose preview targets the channel's language and not the reader's.
None of them touches the network or kick.com. The page is served locally and the
translation engine is answered locally, so the assertions are exact rather than
dependent on what some server felt like returning.

```bash
node scratchpad/harness/run-gates.mjs --headless            # all 39, no window
node scratchpad/harness/run-gates.mjs --headless --jobs 8   # 50s on 8 workers
node scratchpad/harness/run-gates.mjs --only translate-offline,extension-load
```

Playwright is deliberately not a dependency of this project: CI installs with
`npm ci` on two jobs and never runs these gates, so adding it would pull browser
binaries into both for nothing. Point the harness at an existing install with
`UX_KIT=<dir containing node_modules/playwright>`, or `npm i -D playwright` in
the clone. Without it the runner exits 2 and says so, because a missing
prerequisite is not a failed test.

**On `--headless`, since the obvious version of it does not work.** Playwright's
own `headless: true` does not load an MV3 extension at all: no content script, no
service worker. Chromium's `--headless=new` does, which is what this flag passes.
Measured on the same build and the same page:

| mode | content script | service worker |
|---|---|---|
| windowed, pushed off screen | injected | started |
| `--headless=new` | injected | started |
| Playwright `headless: true` | absent | absent |

All 39 gates pass either way, pixel assertions included, so the flag costs
nothing and buys a run with no window and no stolen focus.

The screenshots in this README are generated, not collected:

```bash
node scratchpad/harness/store-shots-fixture.mjs   # writes to scratchpad/harness/readme/
```

Every image is checked for the thing it is supposed to show before it counts as
taken, so a redesign that empties a panel fails the run instead of shipping a
picture of nothing.

## Related projects

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), blocks Kick's pre-roll and overlay ads
- [kick-core](https://github.com/Pkkls/kick-core), the realtime gateway client shared across these extensions
- [kickbus](https://github.com/Pkkls/kickbus), official Kick webhooks relayed to local bots over SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), Windows app that progresses Kick drop watch-time

## License

MIT. Not affiliated with Kick.
