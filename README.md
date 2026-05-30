# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🌐 Language:** English · [日本語](README.ja.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md)

> Read every Kick.com chat in **your** language — live. Free, open-source, private.

A browser extension (**Brave · Chrome · Edge**) that translates kick.com chat in real
time. Open a stream and messages in other languages get a translation right
underneath — in whatever language you choose.

🎬 **Visual overview:** open [`presentation.html`](presentation.html) (EN / 日本語) ·
🆕 **Step-by-step:** [User Guide → TUTORIAL.md](TUTORIAL.md)

## See it in action

| In chat | Translation |
|---|---|
| 🇯🇵 バーテンって資格必要なの？ | Do you need a license to be a bartender? |
| 🇪🇸 ¿alguien sabe cuándo empieza? | does anyone know when it starts? |
| 🇧🇷 que jogada absurda mano | what an absurd play, dude |
| 🇸🇦 كيف حالك؟ | How are you? |

You always keep the original; the translation appears below with a language tag.

## Why you'll like it

- ⚡ **Real-time**, under each message.
- 🌍 **Any language, any direction** — pick your target (English, 日本語, Español, Português…). A Japanese viewer sees everything in Japanese.
- 🔁 **Multi-engine with auto-failover** — DeepL, Google, MyMemory, Lingva. It never runs dry.
- 🖥️ **On-device on Chrome / Edge** — free, unlimited, offline (Brave uses the cloud automatically).
- 🧩 **7TV-aware** — reads chat correctly whether or not you run 7TV.
- 🔒 **Private** — no account, no tracking, no server.

## Install in 2 minutes (no build, no command line)

1. **Download** `kick-chat-translator-…-chromium.zip` from the [Releases page][releases].
2. **Unzip** it — you get a folder containing `manifest.json`.
3. Open `brave://extensions` · `chrome://extensions` · `edge://extensions`.
4. Turn on **Developer mode** (top-right).
5. Click **Load unpacked** and select the **unzipped folder**.
6. Open any Kick stream — a green **Translating → EN** bar appears at the top of chat. ✅

## Choose your language

Click the **⚙** on the chat bar (or the toolbar icon → Options) → **Display → Target
language**. 30 languages including Japanese (日本語), Spanish, Portuguese, Arabic,
Korean, Chinese… Everything then translates into that language.

## Best quality (optional): a free DeepL key

It works out of the box with Google & MyMemory (no key). For the nicest results, add
a **free** DeepL key (€0, 1,000,000 characters/month):

1. Sign up for **DeepL API Free** at <https://www.deepl.com/pro-api>.
2. Copy your key (it ends with `:fx`).
3. **Options → Providers**: paste it, set **Plan = Free**, and move **DeepL** to the top.

## Privacy

No account, no analytics, no server on our side. A message's text goes only to the
translator you chose, only to translate it. On-device mode sends nothing off your
machine. See [PRIVACY.md](PRIVACY.md).

## For developers

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build          # → dist/  (then "Load unpacked" the dist folder)
```

`npm run dev` for HMR · `npm run release:check` (typecheck + lint + test + build) ·
`npm run pack` builds the Chromium zip. Stack: **MV3, Vite + `@crxjs/vite-plugin`,
TypeScript (strict), Preact + Tailwind**; the content script is shipped as a classic
IIFE for reliable injection. Reviewer notes & permission table: [SUBMISSION.md](SUBMISSION.md).

## License

[MIT](LICENSE) · Not affiliated with Kick. "Kick" and "7TV" belong to their respective owners.

[releases]: https://github.com/Pkkls/kick-chat-translator/releases/latest
