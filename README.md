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

<img width="354" height="593" alt="Kick chat with a translation under each foreign-language message" src="https://github.com/user-attachments/assets/4f7ae414-6c2a-4ee5-b191-6af9e29d46ec" />


Runs on **Brave, Chrome, Edge and Firefox**, and understands 7TV emotes.

![Japanese chat translated to English](screenshots/japanese-chat.jpg)

**Zero config.** Incoming chat is translated into *your* browser's language. When you type, a live preview
shows your own message in the *channel's* language (auto-detected from Kick) just above the chat box; click
it or press **Ctrl/Cmd+Enter** to put that version in the chat box, then send it yourself. Both directions
work on their own, so you never have to
pick a language. (You still can, in settings.)

**42 languages**, right-to-left scripts included (Arabic, Hebrew, Persian) as well as regional variants
(Brazilian Portuguese, Traditional Chinese).

---

## What's new in [2.8.0](https://github.com/Pkkls/kick-chat-translator/releases/latest)

**A language button inside Kick's message box.** Switching the language you write in used to mean travelling to the bar at the top of the chat and back. The button sits with the chat controls instead, so the pointer never leaves the text field. A click swaps between the channel's language and your last pick, a click on the caret opens the full list, and the first language you choose becomes your favourite without any setting to fill in.

**Translations were invisible for anyone whose desktop is set to light while Kick is dark.** The injected text followed the operating system rather than the chat it sits in, so it painted dark text on Kick's dark ground: measured at 1.01:1, which is no contrast at all. It reads the chat's own background now, and follows Kick's theme switch without a reload.

**"Replace" replaces.** It had been a fourth setting that no control could reach, naming a style that rendered exactly like "Inline" with the original still beside it. It shows 12 messages where inline shows 9. "On hover" also stopped writing a label under every message whether or not you ever hovered one, which had been costing the chat a third of what it could show.

**The chat, the bar and every language menu now speak the language you chose**, not your browser's, in all ten interfaces.

Also: the chat mirrors properly for Arabic, a long URL or a wall of spam no longer pushes the chat sideways, a failed line no longer grows a row of its own, the retry button works from the keyboard and on touch, everything animated stops for anyone who asks their system to stop it, and the whole interface is keyboard-navigable with every control named. Full list in [CHANGELOG.md](CHANGELOG.md).
---

## Install

**[➥ Chrome / Brave / Edge · Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox · Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

One click to install. Open any Kick stream, and a green bar at the top of chat tells you it's live.
<img width="347" height="193" alt="The green status bar at the top of chat" src="https://github.com/user-attachments/assets/3973b7a0-4767-42a2-974c-7f94b2534595" />

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

- **Target language**: what everything is translated into (42 to choose from)
- **Provider order**: drag to reorder, paste your DeepL key
- **Engine mode**: on-device first, cloud first, or on-device only
- **Display**: translation below the message, inline with it, after it in smaller italics, or on hover; original text, source language and provider badges each optional. A sample line in the settings shows each style before you pick it
- **Language button**: a chip in Kick's message box, next to the emote icon. One click switches between the channel's language and your last pick, press-and-hold opens the list, and typing two letters filters it. It sits there so changing the language you write in never sends you to the top of the chat
- **Compose preview**: on or off, its target language, and whether clicking it fills the chat box or copies the translation instead
- **Filters**: skip bots, blocklist users or channels, restrict the source languages, or whitelist channels
- **Glossary**: find and replace pairs applied to the translation, for names and in-jokes that engines mangle
- **Budget**: DeepL quota share and smart routing, per-channel rate limit, cache size and lifetime, concurrency
- **Auto-pause**: background tabs stop translating (saves your DeepL quota)
- **UI language** for the extension's own interface, in English, Spanish, French, Portuguese, Turkish, Russian, Arabic, Chinese, Japanese or Korean, plus buttons to clear the cache or reset stats and settings
- **Debug**: the last decisions the translator made and why a line was left alone, kept in memory only

## Privacy

No account, no analytics, no server of mine. Messages go to the translation provider you picked and nowhere
else, and in on-device mode, not even there. [Details](PRIVACY.md)

## FAQ

**Q: The green bar disappeared / translation stopped working.**
**A:** 2.6.0 fixed the cause of this: Kick leaves a hidden second copy of the chat panel in the page and the bar was being mounted into that one, invisible from the start. Update first. If it still happens on 2.6.0 or later, refresh the page and open an issue, because that would be a new one.

**Q: Messages aren't being translated.**
**A:** Open the **Debug** tab in the settings and press "Read decisions": it lists the last 50 lines and says, for each one, why it was translated or left alone. That answers this faster than guessing.

Most lines that get skipped are skipped on purpose. Measured over one live session, out of 234 skipped lines: 213 were the same user repeating themselves, 9 were under the minimum length, 7 were emoji or laughter only, and 1 was already in the reading language. If the Debug tab shows nothing at all, then the extension is not seeing the chat, which is a different problem worth an issue.

**Q: Does it work on VOD replays?**
**A:** Yes. The extension translates chat on both live streams and VOD replays.

**Q: Which browsers are supported?**
**A:** Chrome, Brave, Edge and Firefox are all supported.

**Q: Is my data safe?**
**A:** There's no account system and no analytics. Chat messages are sent only to the translation provider you chose, and nowhere else.

**Q: How do I get better translation quality?**
**A:** Add a free DeepL API key in the settings. DeepL's free tier covers up to 1 million characters a month and consistently beats the default providers.

**Q: A stretched message like "muuuuy biennnn" stays untranslated.**
**A:** It should not, since 2.7.0. The translation services hand messages like that straight back unchanged, so the line is retried once on its flattened text. If you still see one, the Debug tab will say which of the two attempts gave up.

**Q: The extension broke after a Kick update.**
**A:** Kick sometimes changes its chat structure, which can break message detection. Open a [GitHub issue](https://github.com/Pkkls/kick-chat-translator/issues) and it'll be patched as soon as possible.

## Supported languages

English · French · Spanish · Portuguese · Portuguese (Brazil) · German · Italian · Dutch · Polish · Swedish · Czech · Slovak · Romanian · Russian · Ukrainian · Turkish · Arabic · Hebrew · Japanese · Korean · Chinese (Simplified) · Chinese (Traditional) · Thai · Vietnamese · Indonesian · Hindi · Finnish · Norwegian · Danish · Greek · Hungarian · Bulgarian · Catalan · Slovenian · Estonian · Lithuanian · Latvian · Persian · Bengali · Tamil · Malay · Filipino

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

## Related projects

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), blocks Kick's pre-roll and overlay ads
- [kick-core](https://github.com/Pkkls/kick-core), the realtime gateway client shared across these extensions
- [kickbus](https://github.com/Pkkls/kickbus), official Kick webhooks relayed to local bots over SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), Windows app that progresses Kick drop watch-time

## License

MIT. Not affiliated with Kick.
