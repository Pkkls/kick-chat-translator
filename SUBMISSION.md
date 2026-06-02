# Store listing & reviewer notes — Kick Chat Translator

Copy/paste material for the Chrome Web Store listing and notes for Kick staff /
store reviewers.

## Short description (≤132 chars)

> Translate Kick.com chat in real time. On-device (unlimited, private) with
> DeepL/Google cloud fallback. No account, no tracking.

## Long description

Kick Chat Translator translates chat messages on kick.com into your language as
they arrive.

- **On-device first** — uses Chrome's built-in Translator API (Chromium ≥138):
  unlimited, instant, fully local, nothing leaves your machine. One-time model
  download per language (one click).
- **Cloud fallback** — for browsers without the on-device API (e.g. Brave) or
  language pairs not downloaded: DeepL (bring your own free key), Google, MyMemory,
  Lingva. Tried in order with automatic failover.
- **Built for busy chat** — request coalescing + batching, an LRU + IndexedDB
  cache, and a per-channel rate budget keep it fast and gentle on providers.
- **Ignores noise** — emotes, emoji spam, laughter (kkkk/jaja/lol), and
  streaming slang are skipped, so you only translate real messages.
- **Quiet by default** — auto-pauses in background tabs so it never works (or
  spends your DeepL quota) when you're not watching.
- **No account, no tracking, no telemetry.** Open-source (MIT).

## Permissions justification (for reviewers)

| Permission | Why |
|---|---|
| `storage` | Save your preferences + the local translation cache + a daily usage counter. All on-device. |
| `alarms` | A lightweight heartbeat so the MV3 service worker survives short idle gaps during bursts of chat. |
| host `https://kick.com/*` | Read chat messages and inject translations on the page. |
| host `translate.googleapis.com`, `api-free.deepl.com`, `api.deepl.com`, `api.mymemory.translated.net`, `lingva.lunar.icu`, `lingva.ml` | The translation providers the user can choose. A message's text is sent only to the selected provider, only to translate it. |

The extension requests **no** `tabs`, no `<all_urls>`, no cookie/history access,
and reads no data from other sites.

## Privacy

See [PRIVACY.md](PRIVACY.md). Nothing is collected by us — there is no backend.
Message text goes directly from the user's browser to the translation provider
they configured (or never leaves the device when on-device translation is used).

## Abuse / rate-limit safety (for Kick staff)

- Chat is read from the page DOM (and, where available, Kick's public Pusher
  stream). No private endpoints, no authentication scraping.
- Heavy caching + coalescing + a per-channel request budget minimise outbound
  calls. Failing providers get an exponential cooldown (short for transient
  429s, long for quota/auth) so we never hammer them.
- Background tabs are paused, so idle tabs generate zero traffic.

## Single purpose

Translate Kick.com chat messages — both incoming chat and what you type — in real
time. The extension runs only on `kick.com` and does nothing else.

## Build & package

```bash
npm ci
npm run release:check    # typecheck + lint + 116 unit tests + chromium build
npm run package:all      # release/…-chromium.zip  +  release/…-firefox.zip
# Load unpacked for review: dist/ (Chrome: chrome://extensions → Developer mode → Load unpacked)
```

`package:all` builds each target into `dist/` and zips it from its own build:

- `kick-chat-translator-<version>-chromium.zip` → Chrome / Brave / Edge (Chrome Web Store)
- `kick-chat-translator-<version>-firefox.zip` → Firefox (AMO)

Tagging `vX.Y.Z` runs the same flow in CI (`.github/workflows/release.yml`) and attaches
both zips to the GitHub release. Node ≥20.

## Privacy policy

<https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md> — nothing is
collected. Message text goes only to the translation provider the user selects; no
account, no telemetry, no backend.

## Screenshots (store listing)

- Chrome Web Store: 1280×800 or 640×400 PNG/JPG, at least one (up to five).
- AMO: at least one screenshot, any reasonable size.
- Suggested set: the **Options** page, the toolbar **popup**, and a live channel showing
  translated chat + the compose chip. Capture guidance in `screenshots/README.md`.

## Firefox / AMO notes

- The Firefox build sets `browser_specific_settings.gecko.id = kick-translator@pkkls.dev`,
  `strict_min_version = 109.0`, and declares **no data collection**
  (`data_collection_permissions: { required: ['none'] }`).
- AMO requires **source code + build instructions** for extensions with built/minified
  sources. Provide the repository URL and:

  ```bash
  npm ci
  npm run build:firefox     # emits dist/; the submitted zip is an archive of that folder
  ```

## Submission checklist

**Chrome Web Store** (one-time $5 developer registration):

1. Upload `…-chromium.zip`.
2. Paste the short + long description and the permission justifications above.
3. Add screenshots + the 128×128 icon (already in the zip).
4. Set the privacy-policy URL and the single-purpose statement.
5. Data-use disclosure: **no** data collected or sold; message text is sent to the
   user-selected translator solely to translate it.
6. Submit for review.

**Firefox AMO** (free):

1. Upload `…-firefox.zip`.
2. Paste the listing copy.
3. Attach source (repo URL + the build steps above).
4. Add screenshots.
5. Submit for review.
