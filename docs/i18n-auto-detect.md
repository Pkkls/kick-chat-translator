# International auto-language-detection

Goal: the extension works for **any** user on **any** channel with **zero configuration**
— no Japanese bias, no manual language picking. Both translation directions resolve
their target language automatically.

## Two directions, both automatic

| Direction | What it does | Target language | Source |
|-----------|--------------|-----------------|--------|
| **Incoming** (reading) | Foreign chat → *your* language | `targetLang: 'auto'` → browser language | `navigator.language` |
| **Outgoing** (compose) | What *you* type → the *channel's* language | `composeTargetLang: 'auto'` → channel language | Kick API `livestream.lang_iso` |

Both settings default to the `'auto'` sentinel. An explicit ISO code (set in options)
overrides auto for power users.

## Channel-language detection

`GET https://kick.com/api/v2/channels/{slug}` returns `livestream.lang_iso` — a clean
ISO-639-1 code (e.g. `en`, `es`, `ja`, `sk`) the streamer sets, present whenever the
channel is **live**. Verified live: xqc→`en`, sandraskins→`es`.

- `content/kickApi.ts` — `fetchChannelLangIso(slug)` reuses the same channel fetch as the
  chatroom-id lookup (one request, cached). 5-min TTL so it refreshes when a channel goes
  live. Offline / unknown → `undefined`.
- `content/index.ts` — on every route change, fetches the channel language and calls
  `compose.setChannelLang(lang)`.
- `content/compose.ts` — in `'auto'` mode the compose target = the channel language
  (fallback `en` when unknown). Shown as a read-only flag badge in the panel — **no picker**.
  When your typed language already equals the channel's, the preview stays hidden.

## User-language detection

`shared/languages.ts`:
- `resolveBrowserLang()` — `navigator.language` → supported ISO-2, fallback `en`.
- `resolveTargetLang(setting, autoValue?)` — resolves the `'auto'` sentinel.
- `content/pipeline.ts` resolves `targetLang: 'auto'` → browser language for incoming chat.

## Coverage

`LANGUAGES` carries 31 languages (added **Slovak**, previously missing). All handled
uniformly — no per-language special-casing.

## Merge-back

Developed in `Pkkls/kick-chat-translator-i18n` (branch `feat/compose-preview`), shares
history with `Pkkls/kick-chat-translator` for a clean merge once validated live.
