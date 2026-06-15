# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Translates Kick.com chat in real time — live streams and VOD replays. You open a stream, foreign messages get
a translation underneath. That's it.

<img width="354" height="593" alt="image" src="https://github.com/user-attachments/assets/4f7ae414-6c2a-4ee5-b191-6af9e29d46ec" />


Works on **Brave, Chrome, Edge and Firefox**. Handles 7TV.

![Japanese chat translated to English](screenshots/japanese-chat.jpg)

**Zero config.** It reads incoming chat in *your* browser language, and when you
type, a live preview shows your message in the *channel's* language — auto-detected
from Kick — above the chat box. Click it or press **Ctrl/Cmd+Enter** to insert. Both
directions are automatic; you never pick a language (you still can, in settings).

**42 languages**, including right-to-left (Arabic, Hebrew, Persian) and regional
variants (Brazilian Portuguese, Traditional Chinese).

---

## Install

**[➥ Chrome / Brave / Edge — Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox — Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

One click to install, then open a Kick stream — a green bar at the top of chat means it's working.
<img width="347" height="193" alt="image" src="https://github.com/user-attachments/assets/3973b7a0-4767-42a2-974c-7f94b2534595" />

<details>
<summary>Or install manually (unpacked / dev build)</summary>

Download the right zip from [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) and unzip it.

- **Chrome / Brave / Edge** (`…-chromium.zip`): open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the folder.
- **Firefox 121+** (`…-firefox.zip`): open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → select `manifest.json`.

</details>

## Translation engines

Four providers in a chain — if one fails, the next picks up:

| Provider | Key needed? | Note |
|---|---|---|
| Google | No | Default, works out of the box |
| DeepL | Yes (free) | Best quality. [Get a free key](https://www.deepl.com/pro-api) (1M chars/month, €0) |
| MyMemory | No | Fallback |
| Lingva | No | Fallback (self-hosted only — ~2 GB RAM, not recommended unless you run your own instance) |

On Chrome/Edge, there's also on-device translation (no network, no limit).
Brave and Firefox don't support it yet, so they use the cloud chain.

You pick the order in the settings.

## Settings

Click the gear icon on the chat bar, or right-click the extension icon → Options.

- **Target language** — what to translate into (42 languages)
- **Provider order** — drag to reorder, paste your DeepL key
- **Filters** — skip bots, blocklist users/channels, restrict source languages
- **Auto-pause** — background tabs don't translate (saves your DeepL quota)

## Privacy

No account, no analytics, no server. Messages go to the translation provider
you picked and nowhere else. On-device mode doesn't even do that.
[Details](PRIVACY.md)

## Supported languages

English · French · Spanish · Portuguese · Portuguese (Brazil) · German · Italian · Dutch · Polish · Swedish · Czech · Slovak · Romanian · Russian · Ukrainian · Turkish · Arabic · Hebrew · Japanese · Korean · Chinese (Simplified) · Chinese (Traditional) · Thai · Vietnamese · Indonesian · Hindi · Finnish · Norwegian · Danish · Greek · Hungarian · Bulgarian · Catalan · Slovenian · Estonian · Lithuanian · Latvian · Persian · Bengali · Tamil · Malay · Filipino

## How it works

1. A content script observes the Kick chat DOM and intercepts new messages.
2. Each message is sent to the background service worker, which tries providers in order until one succeeds.
3. The translated text is injected back into the DOM below the original message.
4. For outgoing messages, the channel language is auto-detected via the Kick API, and a live preview is shown above the chat input.

The extension never modifies the Kick page's own network requests and requires only `storage` and `host` permissions for kick.com.

---

## Build from source

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build     # output in dist/
```

Other commands: `npm run dev` (HMR), `npm run test`, `npm run lint`,
`npm run pack` (zip for distribution).

Stack: MV3, Vite, TypeScript, Preact, Tailwind. Content script ships as
a classic IIFE for reliable injection on Brave.

## License

MIT. Not affiliated with Kick.
