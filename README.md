# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A pro browser extension that translates [Kick.com](https://kick.com) chat in
real time. Multi-provider, WebSocket-native, fast, and private.

## Highlights

- **WebSocket-first** — listens directly to Kick's Pusher chat stream
  (`App\Events\ChatMessageEvent`), with a DOM observer fallback. No
  selector-fragility, no polling, near-zero CPU.
- **Multi-provider chain with auto-failover** — Google Translate
  (free, no key), DeepL (best quality, optional key), MyMemory, and any
  Lingva / LibreTranslate instance. Re-order them in the options page.
- **IndexedDB cache** — translations survive service-worker idles, with TTL
  and an LRU cap. Big cache-hit ratio on busy channels.
- **Smart skipping** — `franc-min` language detection, common-bot allowlist,
  per-channel allow / blocklist, source-language allowlist.
- **Per-channel rate budget** — token-bucket caps how many provider calls
  per minute per channel so a giga-chat doesn't burn your DeepL quota.
- **Multiple display modes** — below, inline, replace, or hover-to-translate
  (cheap mode).
- **No tracking, no telemetry, no account.** See [PRIVACY.md](PRIVACY.md).
- **Chrome + Firefox MV3** from one source tree.

## Install

### From source (dev)

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build        # → dist/
```

Then load `dist/` as an unpacked extension:

- **Chrome**: `chrome://extensions` → enable Developer mode → "Load
  unpacked" → pick `dist/`.
- **Firefox**: build with `npm run build:firefox`, then
  `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" →
  pick `dist/manifest.json`.

### Dev mode (HMR)

```bash
npm run dev
```

Load `dist/` once; Vite watches and rebuilds on save, the popup and options
page hot-reload.

## Configuration

Right-click the toolbar icon → **Options**, or use the popup's **Options**
button.

| Tab | Purpose |
|---|---|
| **Providers** | Order providers, paste your DeepL key, set a custom Lingva instance. |
| **Display** | Target language, where the translation appears, badges. |
| **Filters** | Skip bots, blacklist users/channels, restrict source languages. |
| **Advanced** | Cache size, TTL, concurrency, per-channel budget, connection mode, debug. |

### DeepL key (recommended for best quality)

1. Sign up at <https://www.deepl.com/pro#developer> — the **Free** plan
   gives you 500k chars/month.
2. Copy the API key (it ends with `:fx`).
3. Paste it in **Options → Providers → DeepL**.

Without a DeepL key, the chain defaults to **Google** (free, no key) +
**MyMemory** fallback.

## Architecture

```
src/
├── background/                # Service worker
│   ├── index.ts               # message router + lifecycle
│   ├── translator/            # provider strategies + dispatcher
│   │   ├── google.ts          # translate.googleapis.com (no key)
│   │   ├── deepl.ts           # DeepL Free/Pro
│   │   ├── mymemory.ts        # MyMemory
│   │   └── lingva.ts          # Lingva / LibreTranslate
│   ├── cache.ts               # IndexedDB cache with mem-LRU front
│   ├── queue.ts               # ConcurrencyQueue + TokenBucket
│   ├── stats.ts               # Daily usage tracker
│   └── keepalive.ts           # chrome.alarms heartbeat
├── content/                   # Content script (kick.com)
│   ├── index.ts               # SPA-aware bootstrapper
│   ├── pusher.ts              # WebSocket client for Kick's Pusher
│   ├── kickApi.ts             # chatroom id lookup
│   ├── observer.ts            # MutationObserver fallback
│   ├── emoteParser.ts         # [emote:id:name] / @mentions / URLs
│   ├── langDetect.ts          # franc-min wrapper
│   ├── filters.ts             # bot / channel / lang rules
│   ├── injector.ts            # DOM injection (4 display modes)
│   ├── selectors.ts           # Kick DOM selectors with fallbacks
│   └── pipeline.ts            # message → translate → inject
├── popup/                     # Toolbar popup (Preact + Tailwind)
├── options/                   # Options page (Preact + Tailwind)
└── shared/                    # types, settings, messages, languages, logger
```

### Why this architecture?

- **Background = stateless dispatcher.** Translates, caches, tracks
  usage. Everything important survives a service-worker idle through
  IndexedDB and chrome.storage.
- **Content script holds the WebSocket.** Service workers can't keep a
  WS alive reliably under MV3, so the WS lives in the content script
  (one per kick.com tab, dies with the tab — fine).
- **WebSocket warms the cache; the DOM observer triggers injection.**
  This makes the pipeline robust to either side stalling and dedups
  through the cache key (`text :: targetLang`).
- **Provider strategy pattern** with per-provider cooldowns prevents
  one dead backend (e.g. quota'd DeepL) from blocking everyone else.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev mode with HMR. |
| `npm run build` | Production build. |
| `npm run build:firefox` | Production build with Firefox manifest. |
| `npm run typecheck` | `tsc --noEmit` over the whole tree. |
| `npm run lint` | ESLint, zero warnings tolerated. |
| `npm run test` | Vitest unit suite. |
| `npm run test:cov` | With coverage. |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg`. |
| `npm run pack` | Produce a Chrome Web Store `.zip` in `release/`. |
| `npm run release:check` | typecheck + lint + test + build. |

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version: nothing is collected.
Translation requests go straight to the provider you picked, never
through us. There is no "us" — no backend exists.

## License

[MIT](LICENSE)
