# Kick Chat Translator — Full Project Context (v2.1.0)

Hand this file to a new Claude session to resume with full context.

## What it is

MV3 browser extension that translates Kick.com chat **in both directions, automatically**:

- **Incoming (reading)** — foreign chat gets a translation under each message, in *your* language.
- **Outgoing (compose)** — what *you* type gets a live preview in the *channel's* language, in a floating chip above the chat box; click it or press **Ctrl/⌘+Enter** to insert.

Zero config — both languages are auto-detected. Works on **Brave, Chrome, Edge** (+ a Firefox build). Open source, MIT. Repo: `Pkkls/kick-chat-translator`. Main clone: `C:\Users\kil\Downloads\kick-chat-translator`. Branch `master` = **v2.1.0**.

## Two directions (the headline)

- **Reading target** = `targetLang` (default `'auto'` → browser language via `resolveBrowserLang`).
- **Writing target** = `composeTargetLang` (default `'auto'` → the channel's language from Kick's API `livestream.lang_iso`).
- **31 languages**, incl. RTL (ar/he/fa) and regional variants (pt-BR, zh-TW).

## Repo layout (key files)

```
src/background/   service worker
  index.ts        handleTranslate, looksLikeTargetLang guard (skipSameLangGuard opt-out), DeepL usage
  coalescer.ts    batch window; translator/ dispatches the chain
  translator/     index.ts (chain + health + cooldowns), deepl.ts, google.ts, mymemory.ts, lingva.ts
  cache.ts stats.ts keepalive.ts queue.ts
src/content/      content script (classic IIFE)
  index.ts        boot, route attach, compose+observer wiring, DOM-health toast (#5)
  pipeline.ts     incoming flow; dynamic context (6 lines) for subject-dropping langs
  observer.ts     virtual-scroll MutationObserver; pusher.ts (WS); selectors.ts (+ findComposer)
  langDetect.ts   Unicode-script pre-check + franc-min
  filters.ts injector.ts (incoming inject + floating bar)
  compose.ts      controller; composeUi.ts (épuré chip + Lexical insertion); composeLogic.ts (pure)
  localEngine.ts  on-device Chromium Translator API; memcache.ts
src/shared/
  settings.ts     Zod schema, 'auto' sentinels, langSetting coercion
  languages.ts    31 langs, resolveBrowserLang, normalizeLang (regional), isRtl
  langTiers.ts    isContextCritical (wrong-person set) + DEEPL_PREMIUM (European)
  glossary.ts (isSlangOnly), normalize.ts, types.ts (skipSameLangGuard), messages.ts
src/popup/ src/options/   Preact + Tailwind UI (Auto options exposed)
```

## Key architecture decisions

1. **Content script = classic IIFE** (`scripts/bundle-content.ts`) — fixes the Brave ESM-loader race.
2. **Provider chain** DeepL → Google → MyMemory → Lingva, per-provider error cooldowns; DeepL auto-promoted to #1 when a key is set. **On-device** (Chromium Translator API) on Chrome via `localEngine`; Brave falls back to cloud.
3. **Ingestion**: Pusher WS (`App\Events\ChatMessageEvent`, key `3437aaddcdf6922d623e`, cluster us2, channels `chatrooms.{id}.v2`) + DOM observer fallback.
4. **Compose**: finds the Lexical composer, passive `input` listener, 320 ms debounce, seq-guard (no flicker), in-tab cache, masks @handles/URLs, skips slang. Inserts via synthetic `beforeinput`.
5. **Translation quality**: subject-dropping sources (`ja ko zh zh-tw vi th ar`) get **6 context lines** (vs 2) fed into DeepL's `context` param → fixes the wrong-person bug. See `src/shared/langTiers.ts` + `docs/translation-quality.md`.

## Build / test

```
npm ci
npm run build          # tsc -b + vite + bundle-content.ts (classic IIFE)
npm run test           # 99 tests (vitest)
npm run lint           # 0 warnings
npm run release:check  # typecheck + lint + test + build
```
Pushing a `v*` tag triggers `.github/workflows/release.yml` → build + pack + publish a GitHub Release.

## State

- `master` = **v2.1.0**, pushed. **Release v2.1.0** published (chromium zip).
- **Presentation** (EN / 日本語 / ES / PT): `presentation.html`, **live on GitHub Pages** → <https://pkkls.github.io/kick-chat-translator/presentation.html>
- The i18n dev repo (`Pkkls/kick-chat-translator-i18n`) + the "KCT i18n" loaded extension are now **redundant** (everything merged into main).

## Gotchas (hard-won — read before touching the DOM)

1. **Kick composer = Lexical** (`#channel-chatroom div[contenteditable="true"][data-testid="chat-input"].editor-input`). `document.execCommand` is **silently ignored**; insert via a synthetic `InputEvent('beforeinput', {inputType:'insertText'|'deleteContentBackward', data})` over a Range select-all. Lexical reconciles **async** (~1 frame → verify after ~150 ms). To fire the content script's `input` listener you need **real keystrokes** (a synthetic beforeinput inserts but doesn't trigger it).
2. Background `looksLikeTargetLang` (>85% ASCII ⇒ "English") blocked compose for Latin source langs → compose sets `skipSameLangGuard: true`.
3. franc CJK split: kana ⇒ `ja`; pure Han ⇒ undefined → franc ⇒ `zh` (don't mislabel Chinese as Japanese).
4. **Cloudflare blocks Node `fetch` of kick.com/api (403)** → inspect the API only from a logged-in browser. `lang_iso` lives in `livestream.lang_iso` and only when the channel is **live**.
5. **MCP Claude-in-Chrome forces `https://`** → can't open `chrome://`/`file://`, can't reload extensions, can't save a screenshot to a file. Pages https URLs DO work.
6. **Cache**: after a push, hard-refresh (Ctrl+Shift+R) or add `?cb=`; GitHub Pages rebuild ~1 min.
7. **No engine recovers a dropped subject** — context is the only lever, and the `context` param only helps **DeepL** (Google's web endpoint ignores it). DeepL's measurable edge is **European pairs**, not Asian.
8. `dist/` (gitignored) and `.github/` (dotdir) are **invisible to Glob/Grep** → use `ls`/Read.

## Settings (Zod, `chrome.storage.sync`)

`enabled`, `targetLang` (`'auto'`|code), `composeEnabled`, `composeTargetLang` (`'auto'`|code), `composeInsertMode` (`insert`|`copy`), `displayStyle`, `engineMode`, `providerOrder`, `deeplApiKey`/`deeplPlan`/`deeplBudgetPct`, `myMemoryEmail`, `glossary`, `pauseWhenHidden`, `debug`, …

## Constraints

- **NEVER commit the DeepL API key** (verified clean).
- Terse, anti-slop, **international** (no Japanese bias), **no hardcoded streamer names** in code/placeholders, DeepL-first, no useless feature suggestions.
- Making the repo public/private and store-account creation are the **user's** actions.

## Next / deferred (user-ranked)

- **#1 Publish to the Chrome Web Store / Firefox AMO / Edge Add-ons** (assets ready: `SUBMISSION.md`, `PRIVACY.md`) — *later, but yes*.
- **#3 Compose on-device** on Chrome (route compose through `localEngine` to save DeepL budget) — *later*.
- **#6 IRLToolkit chat reader** (streamers read translated chat on a 2nd screen) — *not now*.
- Also open: budget-aware per-language provider routing (`langTiers.ts` ready), MyMemory regional codes, lazy-load franc-min.
