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

## Test build

```bash
npm ci && npm run release:check   # typecheck + lint + 57 unit tests + build
# load dist/ as an unpacked extension (Chrome: chrome://extensions)
```
