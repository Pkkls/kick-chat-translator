# Store Submission — Kick Chat Translator v2.4.1

Paste-ready fields for Chrome Web Store and Firefox AMO.

---

## Chrome Web Store

**Item name**
Kick Chat Translator

**Short description** (≤132 chars)
Translate Kick.com chat in real time. On-device (unlimited, private) with DeepL/Google cloud fallback. No account, no tracking.

**Detailed description**
Kick Chat Translator translates chat messages on kick.com into your language as they arrive.

- **On-device first** — uses Chrome's built-in Translator API (Chromium ≥138): unlimited, instant, fully local, nothing leaves your machine. One-time model download per language (one click).
- **Cloud fallback** — for browsers without the on-device API (e.g. Brave) or language pairs not downloaded: DeepL (bring your own free key), Google, MyMemory, Lingva. Tried in order with automatic failover.
- **Built for busy chat** — request coalescing + batching, an LRU + IndexedDB cache, and a per-channel rate budget keep it fast and gentle on providers.
- **Ignores noise** — emotes, emoji spam, laughter (kkkk/jaja/lol), and streaming slang are skipped, so you only translate real messages.
- **Quiet by default** — auto-pauses in background tabs so it never works (or spends your DeepL quota) when you're not watching.
- **No account, no tracking, no telemetry.** Open-source (MIT).

Not affiliated with or endorsed by Kick.

**Category**
Social & Communication

**Default language**
English

**Single purpose statement**
Translate Kick.com chat messages — both incoming chat and what you type — in real time; the extension runs only on kick.com and does nothing else.

**Permission justifications**

| Permission | Justification |
|---|---|
| `storage` | Save user preferences (target language, provider, filters), the local translation cache, and a daily per-provider usage counter. All on-device only. |
| `alarms` | Keep the MV3 service worker alive during bursts of chat so translations are not dropped during short idle gaps. |
| host `https://kick.com/*` | Read chat messages from the page DOM and inject translated text on kick.com. |
| host `https://api.github.com/*` | Fetch the latest release metadata to notify users of available updates (version check only; no data is sent). |
| host `https://translate.googleapis.com/*` | Send chat text to Google Translate when the user selects Google as their provider. |
| host `https://api-free.deepl.com/*` | Send chat text to DeepL Free API when the user selects DeepL with a free-tier key. |
| host `https://api.deepl.com/*` | Send chat text to DeepL Pro API when the user selects DeepL with a Pro key. |
| host `https://api.mymemory.translated.net/*` | Send chat text to MyMemory when the user selects MyMemory as their provider. |
| host `https://lingva.lunar.icu/*` | Send chat text to the default Lingva instance when the user selects Lingva as their provider. |
| host `https://lingva.ml/*` | Send chat text to the lingva.ml Lingva instance (alternate/fallback endpoint). |

The extension requests no `tabs`, no `<all_urls>`, no cookie or history access, and reads no data from any site other than kick.com.

**Privacy policy URL**
https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md

**Data usage disclosure**

Chat message text (website content) is transmitted to the user-selected translation provider (Google, DeepL, MyMemory, or Lingva) solely to perform the translation. It is not collected, stored, sold, or used for any other purpose by this extension. In local-translation mode (Chrome/Edge built-in AI) nothing leaves the device.

In the CWS **Data Use** form, under "What user data do you collect?":
- **Tick "Website content"** (the chat text is transmitted to a third party to provide the feature).
- Leave all other data types unticked (no PII, no auth info, no location, no financial, no health, no web history, no user activity tracking).

Certification checkboxes to tick (all truthfully):
- [x] I do not sell or share data to third parties outside approved use cases.
- [x] I do not use or transfer data for purposes unrelated to my single purpose.
- [x] I do not use or transfer data to determine creditworthiness or for lending.

**Package to upload**
`kick-chat-translator-2.4.1-chromium.zip` (from the v2.4.1 GitHub release)

**Visibility**
Public

---

## Firefox AMO

**Add-on name**
Kick Chat Translator

**Summary** (≤250 chars)
Translate Kick.com chat in real time. On-device (unlimited, private) with DeepL/Google cloud fallback. No account, no tracking. Open-source (MIT).

**Description**
Kick Chat Translator translates chat messages on kick.com into your language as they arrive.

- **On-device first** — uses Chrome's built-in Translator API (Chromium ≥138): unlimited, instant, fully local, nothing leaves your machine. One-time model download per language (one click).
- **Cloud fallback** — for browsers without the on-device API or language pairs not downloaded: DeepL (bring your own free key), Google, MyMemory, Lingva. Tried in order with automatic failover.
- **Built for busy chat** — request coalescing + batching, an LRU + IndexedDB cache, and a per-channel rate budget keep it fast and gentle on providers.
- **Ignores noise** — emotes, emoji spam, laughter (kkkk/jaja/lol), and streaming slang are skipped.
- **Quiet by default** — auto-pauses in background tabs.
- **No account, no tracking, no telemetry.** Open-source (MIT).

Not affiliated with or endorsed by Kick.

Minimum Firefox version: 121.0 (required for ES-module background scripts and storage.session).

**Categories**
- Social & Communication
- Appearance (secondary)

**Package to upload**
`kick-chat-translator-2.4.1-firefox.zip` (from the v2.4.1 GitHub release)

**Source code submission**
AMO requires source code for extensions with built/minified sources.

- Repository: https://github.com/Pkkls/kick-chat-translator
- Build steps:
  ```
  npm ci
  npm run build:firefox
  ```
  Requires Node ≥20. The submitted zip is an archive of the `dist/` folder produced by the build.

**Data collection**
Chat message text (website content) is transmitted to the user-selected translation provider (Google, DeepL, MyMemory, or Lingva) solely to perform the translation. It is not collected, stored, sold, or used for any other purpose by this extension. In local-translation mode (Chrome/Edge built-in AI) nothing leaves the device. On the AMO data-collection question, declare that website content is transmitted to a third-party translation provider for the stated purpose. Do not declare `data_collection_permissions` in the manifest (it would force strict_min_version 140+); the AMO form declaration is sufficient.

**Screenshots**
At least one required. Suggested: the Options page, the toolbar popup, and a live channel showing translated chat. See `screenshots/README.md` for capture guidance.
