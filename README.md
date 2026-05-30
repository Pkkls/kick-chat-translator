# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Translates Kick.com chat in real time. You open a stream, foreign messages get
a translation underneath. That's it.

Works on **Brave, Chrome and Edge**. Handles 7TV.

![Japanese chat translated to English](screenshots/japanese-chat.jpg)

Target language is configurable — a Japanese viewer can set it to Japanese
and read everything in Japanese. 30 languages supported.

---

## Install

Download the zip from [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest),
unzip, then:

1. Go to `brave://extensions` (or `chrome://extensions`, `edge://extensions`)
2. Enable **Developer mode**
3. **Load unpacked** → select the unzipped folder

Open a Kick stream. Green bar at the top of chat = working.

## Translation engines

Four providers in a chain — if one fails, the next picks up:

| Provider | Key needed? | Note |
|---|---|---|
| Google | No | Default, works out of the box |
| DeepL | Yes (free) | Best quality. [Get a free key](https://www.deepl.com/pro-api) (1M chars/month, €0) |
| MyMemory | No | Fallback |
| Lingva | No | Fallback |

On Chrome/Edge, there's also on-device translation (no network, no limit).
Brave doesn't support it yet, so it uses the cloud chain.

You pick the order in the settings.

## Settings

Click the gear icon on the chat bar, or right-click the extension icon → Options.

- **Target language** — what to translate into (30 languages)
- **Provider order** — drag to reorder, paste your DeepL key
- **Filters** — skip bots, blocklist users/channels, restrict source languages
- **Auto-pause** — background tabs don't translate (saves your DeepL quota)

## Privacy

No account, no analytics, no server. Messages go to the translation provider
you picked and nowhere else. On-device mode doesn't even do that.
[Details](PRIVACY.md)

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
