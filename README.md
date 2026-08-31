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

## What's new in [2.10.0](https://github.com/Pkkls/kick-chat-translator/releases/latest)

**A release about reading the language right, because getting it wrong costs a message.** A line detected as
your own language is skipped as "already in your language", in silence, so a wrong answer is not a wrong
flag: it is a message you never see.

**Persian was read as Arabic, Mongolian and Ukrainian and Bulgarian as Russian, all with confidence.** A
writing system is not a language, and the code treated it as one. Twelve Persian lines of twelve, twenty
Mongolian of twenty. The engine was told the wrong source language, the flag was wrong on every line, and a
reader of the language it guessed lost the message entirely. Each is now separated by the letters that
actually differ, measured on lines written after the rule rather than the ones that built it.

**One emoji could erase a line's writing system**, and no chat is emoji-free. The script check counted every
non-ASCII character, and an emoji feeds no script while inflating the count, so "да" plus two emoji came out
as nothing at all and Arabic plus four emoji came out as Persian.

**Four writing systems typed on a Latin keyboard are recognised now**: arabizi, romanised Russian, Greek and
Japanese, and Bulgarian in Latin letters. All four were being read as some Latin language.

**Written laughter has a dictionary.** 45 forms across nine writing systems, jajaja, kkkk, mdr, wkwk, 555,
2333, ㅋㅋㅋ, хахаха. They are skipped before a translation is paid for, and the unambiguous ones say what
language the line is in, which no detector manages at five characters.

**Short greetings came back spelled out instead of translated.** bonjour aimed at Japanese returned the
French syllables in katakana rather than the Japanese word. Ninety common expressions now have an answer
that ships with the extension, so they are both correct and free.

**Three controls were too small to hit**, the pause button, the settings gear and the retry arrow on every
translated line, all under the 24 by 24 WCAG asks for.

And the injected script is smaller than it was in 2.9.2, despite all of the above.

## What's new in [2.9.2](https://github.com/Pkkls/kick-chat-translator/releases/tag/v2.9.2)

**The bar's language panel showed six entries out of forty.** 1200px of list inside a panel 281px tall, so
most of it was a scroll, and every row spent 17% of its width on an ISO code repeating what the flag and
the name already said. The code is gone, the list runs in three columns, and twenty-five entries are on
screen instead of six. Same shape as the chip's menu, because two lists of the same 42 languages should not
look like two different products.

## What's new in [2.9.1](https://github.com/Pkkls/kick-chat-translator/releases/tag/v2.9.1)

**The language list opens on a plain click.** It sat behind a caret of 10x6 CSS pixels on a 45x24 chip,
where WCAG asks 24x24 of a target, and missing it did something else: the click toggled between the
channel's language and your first favourite. The two other ways in were a 400ms press-and-hold and the Down
arrow. One click opens the list now, wherever on the chip it lands.

**Russian shows Russia's flag.** A flag in that list says which language a row is and nothing else.

## What's new in [2.9.0](https://github.com/Pkkls/kick-chat-translator/releases/tag/v2.9.0)

**The language list is a grid of flags.** It listed 43 languages one per line as two-letter codes, 894px
tall on a 950px window, so it ran the full height of the screen and each entry had to be read letter by
letter. Three columns of drawn flags fit the same 43 entries and their names into 518px, and the flags are
drawn in CSS because flag emoji do not render on Windows: the system falls back to the very letters being
replaced.

**Kick no longer paints over that menu.** It declared a z-index of 2147483000 and was still covered at five
of nine sampled points once the page was scrolled, because a z-index only ranks an element inside its own
stacking context. It hangs off the document body now, like the compose preview, and measures zero of nine
covered at three window sizes.

## What's new in [2.8.1](https://github.com/Pkkls/kick-chat-translator/releases/tag/v2.8.1)

**Translations arrive about twice as fast.** Lines were held for a batching window before being sent, and
that window only pays for itself if another line turns up while it is open. It almost never did: measured
on a live channel, twenty-four of twenty-seven dispatches went out carrying a single message, and the wait
was 186ms of a 217ms median while the translation call itself answered in 43ms. The median is 111ms now,
with no extra requests sent, and nothing changes on a fast chat where batching does pay.

## What's new in [2.8.0](https://github.com/Pkkls/kick-chat-translator/releases/tag/v2.8.0)

A pass over every surface the extension puts on screen: the chat, the bar above it, the popup and the six
settings tabs. Some of it is new, most of it is things that were quietly wrong.

**A language button, where your hand already is.** Changing the language you write in meant travelling to
the bar at the top of the chat and back. The button now sits in the chat's own action bar, just before the
gear, so the pointer never leaves the text field. A click swaps between the channel's language and your
last pick, the caret opens the full list, and typing two letters filters it. The first language you choose
becomes your favourite; there is nothing to configure.

**Translations were invisible for some of you, and had been for a long time.** The injected text followed
the *operating system's* light or dark setting rather than the chat it sits in. On a light desktop reading
a dark Kick, that painted dark text on Kick's dark background: measured at 1.01:1 against what it sat on,
which is no contrast at all. It reads the chat's own background now and follows Kick's theme switch without
a reload. Measured after: 10.98:1.

**"Replace" replaces.** It had been a fourth display setting that no control could reach, naming a style
that rendered exactly like "Inline" with the original still standing beside it. It now fits 12 messages on
screen where inline fits 9. "On hover" also stopped writing a label under every message whether or not you
ever hovered one, which had been costing the chat a third of what it could show. **Below is still the style
to use; the other three are being worked on, and the settings say so.**

**Everything speaks your language.** The chat, the bar and every language menu follow the interface language
you chose in the extension rather than your browser's, across all ten interfaces. Thirty-nine strings that
were English whatever you had selected now come from the catalogue, and the shipped locale files went from
three languages to ten.

**It works without a mouse, and mirrors for Arabic.** The settings tab bar was six unrelated buttons to a
screen reader and took five presses to cross; it is one stop now, with the arrows, Home and End. Every
control has a name, none share one, and no interactive edge is invisible any more. The chat, the popup and
the settings all mirror properly for right-to-left reading. Everything animated stops for anyone who has
asked their system to stop it, without touching Kick's own motion.

**And the small ruinous things.** A long URL or a wall of spam no longer pushes the chat sideways. A failed
line no longer takes a row of its own, which mattered because failures never arrive alone: with a provider
down, the chat went from 13 messages on screen to 8. The retry control works from the keyboard and on touch,
where it had answered to a mouse hover and nothing else. The settings page no longer scrolls sideways in a
narrow window.

All of it verified with the extension loaded in a real browser on a real channel, which is how the language
button turned out to be anchored in the wrong place to begin with.

Full list in [CHANGELOG.md](CHANGELOG.md).
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
- **Display**: four styles. Below the message on its own line, inline in a pill after it, in place of the original with the emotes left alone, or only on hover. **Below is the one to use for now; the other three are still being worked on.** Original text, source language and provider badges each optional. A sample line in the settings shows each style before you pick it
- **Language button**: a chip in the chat's action bar, just before the gear. One click switches between the channel's language and your last pick, press-and-hold opens the list, and typing two letters filters it. It sits there so changing the language you write in never sends you to the top of the chat
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
