# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-05-28

Complete rewrite. Not backwards-compatible with 1.x settings.

### Added
- **WebSocket-first ingestion** via Kick's Pusher endpoint
  (`App\Events\ChatMessageEvent`), with a DOM observer fallback.
- **Multi-provider chain**: Google Translate (free, no key), DeepL Free/Pro,
  MyMemory, and any Lingva / LibreTranslate instance.
- **Auto-failover** with per-provider exponential cooldown.
- **IndexedDB cache** with TTL + LRU + in-memory front layer.
- **Per-channel token-bucket rate limiter** to protect provider quotas.
- **Dedicated options page** (Preact + Tailwind) with tabs:
  Providers, Display, Filters, Advanced, About.
- **Hover-to-translate** display mode (on-demand, zero passive cost).
- **Source-language allowlist** to translate only specific languages.
- **Bot/user/channel filters** with whitelist + blacklist support.
- **`franc-min`-based language detection** replacing the naive heuristic.
- **Kick `[emote:id:name]` parser** + `@mention` / URL stripping before
  translation, so we don't ship emote text to the provider.
- **Daily usage stats**: requests, cache hit rate, errors, top languages.
- **Firefox MV3 build target** alongside Chrome.
- **Vitest test suite** and **GitHub Actions CI**.
- **Privacy policy** (`PRIVACY.md`) and **LICENSE** (MIT).

### Changed
- Build: Webpack → **Vite 5 + @crxjs/vite-plugin v2** + TypeScript strict.
- UI: vanilla TS → **Preact + Tailwind** for popup + options.
- Service worker: keepalive via `chrome.alarms` (instead of dying mid-burst).

### Removed
- The promised-but-never-implemented DeepL backend from v1 (now real).
- The dead `libretranslate.com` public endpoint (replaced by configurable
  Lingva, which still proxies LibreTranslate engines).
- Inline styles scattered across the codebase (now in `inject.css`).

### Fixed
- XSS surface in injection (no more `innerHTML` on untrusted content).
- Cache lost on every service-worker idle (now persisted to IndexedDB).
- Identical-text "translations" pollute the chat (now suppressed).
