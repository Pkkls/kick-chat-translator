# Kick Chat Translator — Full Project Context

Hand this file to a new Claude session to resume work with full context.

## What it is

Browser extension (MV3) that translates Kick.com chat in real time. Foreign messages get a green translation underneath. Works on **Brave, Chrome, Edge**. Open source, MIT, repo: `Pkkls/kick-chat-translator`.

## Repo layout

Single repo: `C:\Users\kil\Downloads\kick-chat-translator` (branch: `master` only, `v2-rewrite` deleted).

```
src/
├── background/           # Service worker
│   ├── index.ts          # Message router, DeepL usage, settings, cache
│   ├── translator/       # Provider chain
│   │   ├── index.ts      # eligibleOrder, health, sticky provider, DeepL budget pacing
│   │   ├── deepl.ts      # DeepL Free/Pro, native batch
│   │   ├── google.ts     # Google web endpoint, smart client rotation, batch via \n
│   │   ├── mymemory.ts   # MyMemory, email param for 50k/day
│   │   ├── lingva.ts     # Lingva/LibreTranslate
│   │   └── types.ts      # ProviderContext, ProviderError
│   ├── cache.ts          # IndexedDB + in-memory LRU (idb-keyval)
│   ├── coalescer.ts      # Request batching with adaptive window (50-300ms)
│   ├── queue.ts          # ConcurrencyQueue + TokenBucket
│   ├── stats.ts          # Daily stats in chrome.storage.local (byProvider, byLang, byChannel)
│   └── keepalive.ts      # chrome.alarms heartbeat
├── content/              # Content script (kick.com) — ships as classic IIFE
│   ├── index.ts          # SPA-aware boot, bar mount/guard, retry-on-focus, scroll prefetch
│   ├── pipeline.ts       # Message flow: prepare→detect→cache→local→cloud→apply
│   ├── observer.ts       # MutationObserver on virtual-scroll chat, self-healing re-attach
│   ├── pusher.ts         # WebSocket client (Pusher), 4001 terminal close
│   ├── selectors.ts      # DOM selectors, extractMessageText, 7TV-aware, img-alt filter
│   ├── emoteParser.ts    # [emote:id:name] + inline emote name stripping
│   ├── langDetect.ts     # Hybrid: Unicode script pre-check + franc-min
│   ├── filters.ts        # isNoise, shouldDrop, isSameLanguageAsTarget
│   ├── injector.ts       # DOM injection, floating bar, toast, click-to-copy, hover placeholder
│   ├── localEngine.ts    # On-device Chromium Translator API (Chrome only, not Brave)
│   ├── memcache.ts       # In-tab LRU (1500 entries)
│   ├── inject.css        # All injected styles (dark/light, compact, hover, toast)
│   ├── kickApi.ts        # Chatroom ID lookup
│   └── platform.ts       # 7TV detection, platform logging
├── popup/                # Toolbar popup (Preact + Tailwind)
├── options/              # Options page (Preact + Tailwind)
└── shared/
    ├── settings.ts       # Zod schema, load/save/watch/export/import/reset
    ├── types.ts          # TranslationRequest, TranslationOutcome, UsageStats, ProviderStatus
    ├── constants.ts      # Endpoints, Pusher key, batch config, bot list
    ├── normalize.ts      # Cache key normalization (NFKC, collapse repeats, strip punct)
    ├── glossary.ts       # SLANG set + isSlangOnly + applyUserGlossary
    ├── languages.ts      # 30 languages, franc→ISO2 mapping
    ├── messages.ts       # Chrome runtime message types
    ├── logger.ts         # Prefixed console logger
    └── decode.ts         # HTML entity decoder
```

## Stack

- **Build**: Vite + `@crxjs/vite-plugin`, then `scripts/bundle-content.ts` re-bundles content script as classic IIFE (fixes Brave ESM loader race)
- **UI**: Preact + Tailwind (popup + options)
- **Test**: Vitest (57 tests), ESLint (0 warnings), GitHub Actions CI
- **Types**: TypeScript strict

## Key architecture decisions

1. **Content script = classic IIFE** (not crxjs ESM loader). Root cause fix for "extension doesn't launch on Brave, need several F5". `scripts/bundle-content.ts` does Vite lib-mode rebuild post-build.

2. **On-device first on Chrome** (`engineMode: local-first`). Chromium Translator API = free/unlimited/offline. Brave disables it → auto-fallback to cloud.

3. **Cloud chain with failover**: DeepL (batch) → Google (batch via \n) → MyMemory → Lingva. Error-aware cooldowns (rate_limit = seconds, quota = 5 min). Provider sticky (stay on last success).

4. **DeepL auto-promote**: when a key is configured but DeepL is missing from `providerOrder`, auto-insert at #1 and persist.

5. **DeepL budget pacing**: `deeplBudgetPct` setting → stop using DeepL at N% of monthly quota. `deeplUsagePct` fed from `/v2/usage` every 5 min.

6. **Virtual scroll handling**: Kick uses `div[data-index]` recycled rows. Observer marks rows with `data-kt-id`. Recycled-row rescue: if translation arrives after row recycled, scan visible rows for matching text.

7. **Pause when hidden**: live `document.hidden` check per message. Retry-on-focus sweeps untranslated rows on `visibilitychange`.

8. **Floating bar self-heal**: MutationObserver on body re-mounts bar when Kick's SPA wipes the chat subtree (500ms debounce).

## Settings (Zod schema, chrome.storage.sync)

Key fields: `enabled`, `targetLang` (default 'en'), `displayStyle` ('below'|'inline'|'replace'|'hover'), `engineMode` ('local-first'|'cloud-first'|'local-only'), `providerOrder`, `deeplApiKey`, `deeplPlan`, `deeplBudgetPct`, `myMemoryEmail`, `glossary` (user custom replacements), `pauseWhenHidden`, `cacheMaxEntries` (15k), `cacheTtlHours` (72h), `perChannelBudgetPerMin` (200).

## Features implemented (this session, ~30 total)

### Reliability
- Classic IIFE content script (Brave injection fix)
- Floating bar self-heal on SPA re-render
- Retry on tab focus (pauseWhenHidden catch-up)
- Recycled-row rescue (translation → find matching visible row)
- Prefetch on scroll-stop (old messages on demand)

### Quota optimization
- DeepL budget pacing (spread across month)
- DeepL auto-promote to #1 when key configured
- MyMemory email param (5k→50k words/day)
- Same-language short-circuit (skip EN→EN, ~100 calls/day saved)
- Google smart client rotation (retry alternate client on 429)
- Google batch (join via \n, 2-3x fewer requests)
- Adaptive batch window (50ms slow / 180ms normal / 300ms fast chat)
- Per-user message dedup (skip identical consecutive spam)
- Aggressive cache key normalization (strip all punct, NFKC)
- Cache 15k entries / 72h TTL (was 5k/24h)
- Provider sticky (avoid ping-pong switching)

### Quality
- Hybrid language detection (Unicode script + franc-min)
- Emote name stripping (namedarumajankiss2 etc. removed before translation)
- User glossary (custom post-translation replacements)
- DeepL context as "username: message" dialogue format
- Source-lang hint passed to providers (Google faster with sl=ja vs sl=auto)

### UX
- Provider badge on floating bar (shows DEEPL/GOOGLE/etc.)
- Toast notifications (provider down, quota reached, provider switch)
- Click-to-copy translation
- Hover-to-translate mode (10x quota savings)
- Throttle indicator (⏳ on bar when budget limits)
- Stats by channel
- Settings export/import helpers

## Docs in repo

- `README.md` — EN, user-first, real screenshot
- `README.ja.md` / `README.es.md` / `README.pt-BR.md` — native translations
- `presentation.html` — bilingual EN/JA landing page with live chat demos
- `TUTORIAL.md` — user guide
- `EMAIL.md` — pitch email for Kick staff (EN, two-audience)
- `SUBMISSION.md` — store listing + permission justification
- `PRIVACY.md` — privacy policy
- `screenshots/japanese-chat.jpg` — real screenshot from live stream

## User's setup

- **Primary browser**: Brave (on-device disabled, cloud only)
- **Also testing on**: Chrome (on-device available, needs model download)
- **DeepL key**: configured (Free plan, `:fx` suffix). Key is NOT in the repo (verified).
- **Heavy JP usage**: ~3700 translations/day, 90% Japanese streams
- **pauseWhenHidden**: OFF on both browsers (needed for MCP background testing)
- **7TV**: installed

## Build commands

```bash
npm ci
npm run build          # tsc + vite + bundle-content.ts (classic IIFE)
npm run test           # 57 tests
npm run lint           # 0 warnings
npm run pack           # → release/kick-chat-translator-2.0.0-chromium.zip
npm run release:check  # typecheck + lint + test + build
```

## Git

- Single branch: `master`
- Remote: `https://github.com/Pkkls/kick-chat-translator.git`
- CI: GitHub Actions (typecheck + lint + test + build chrome/firefox)
- Latest commit: `a887b2a`
- `dist/` loaded as unpacked extension on both Brave and Chrome

## Known issues / next steps

- Chrome on-device needs manual model download (click "⬇ Local (JA)" chip)
- No Firefox testing done yet (build exists: `npm run build:firefox`)
- Options page doesn't yet expose: glossary editor, DeepL budget slider, MyMemory email field, settings export/import buttons, hover-to-translate toggle
- No GitHub Release published yet (user's action: `gh release create v2.0.0 ...`)
- Repo is public but no release zip uploaded

## Important constraints

- NEVER commit the DeepL API key (hard red flag, verified clean)
- NEVER make the repo public/private (access-control = user's action)
- User preference: no useless feature suggestions, stay focused
- User preference: no hardcoded streamer names in code/placeholders
- Brave is primary target, Chrome secondary
