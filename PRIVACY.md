# Privacy Policy — Kick Chat Translator

_Last updated: 2026-05-28_

## What we collect

**Nothing.** The extension does not collect, store, or transmit any personal
data to any server we control. We don't have a server. There's no account, no
login, no analytics, no telemetry.

## What gets sent off-device

To translate a chat message, its **text content** (after we strip emotes,
URLs, and `@mentions`) is sent to the translation provider you configure:

| Provider | Endpoint | Sends |
|---|---|---|
| Google Translate | `translate.googleapis.com` | text only |
| DeepL | `api-free.deepl.com` or `api.deepl.com` | text + your DeepL API key |
| MyMemory | `api.mymemory.translated.net` | text only |
| Lingva (configurable) | `lingva.lunar.icu` (or your instance) | text only |

We never send: usernames, channel names, badges, timestamps, your IP (beyond
what the browser sends to any HTTP endpoint), or any other metadata.

## What we store locally

These pieces of data live **only** on your device, in your browser's
extension storage:

- Your preferences (target language, display style, providers, filters).
- A cache of recent translations (text + translation pair), keyed by text.
- A daily counter of how many requests you made, broken down by provider
  and detected language. This is shown in the popup and you can reset it.

You can wipe everything from the extension's options page ("Clear cache",
"Reset usage stats") or by removing the extension.

## Third-party providers

Each provider has its own privacy policy. We are not affiliated with any of
them. Read theirs if you care:

- DeepL: <https://www.deepl.com/privacy>
- Google: <https://policies.google.com/privacy>
- MyMemory: <https://mymemory.translated.net/doc/usagelimits.php>
- Lingva: depends on the instance you pick (default is community-run).

## Permissions

- `storage` — to save your preferences and cache.
- `alarms` — to keep the service worker alive briefly during bursts of chat.
- `host_permissions` for kick.com and the translation provider endpoints
  above — to read chat and call the translators.

We do not request the `tabs` or `<all_urls>` permission.

## Contact

Open an issue at <https://github.com/Pkkls/kick-chat-translator/issues>.
