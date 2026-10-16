# Privacy Policy: Kick Chat Translator

_Last updated: 2026-10-16_

## What we collect

**Nothing, unless you say yes.** There is no account, no login and no server of
ours. The extension does not collect personal data.

### Optional anonymous usage statistics (off by default)

The extension asks once whether you want to share anonymous usage statistics.
They stay off unless you accept (Chrome and other Chromium browsers: the popup,
or Options > About; Firefox: the optional "technical and interaction data"
choice in Firefox's own install prompt or add-on settings). You can turn them
off at any time, and the day being counted is deleted when you do.

If you accept, once a day the extension sends one event to Google Analytics
(`www.google-analytics.com`, Measurement Protocol) containing only:

- extension version, browser name, interface language, target language and
  engine mode;
- whether the 7TV extension is present and whether the browser has an
  on-device translator;
- how many translations were shown, by engine (on-device, Google, DeepL, other,
  cache), how many provider errors happened, and how many chat lines were
  skipped;
- how many compose previews were shown, inserted and dismissed;
- the median and 95th percentile time a cloud translation took that day;
- a random identifier generated on install, so a day is counted once per install.

It **never** contains message text, usernames, channel names, anything you
type, your DeepL key or your browsing history. Google Analytics does not store
IP addresses; it derives an approximate country from the request. Firefox
older than version 140 has no built-in consent for this, so nothing is ever
sent there.

## What gets sent off-device

To translate a chat message, its **text content** (after we strip emotes,
URLs, and `@mentions`) is sent to the translation provider you configure:

| Provider | Endpoint | Sends |
|---|---|---|
| Google Translate | `translate.googleapis.com` | text only |
| DeepL | `api-free.deepl.com` or `api.deepl.com` | text + the last few chat lines as context, each with its author's username + your DeepL API key |
| MyMemory | `api.mymemory.translated.net` | text only |
| Lingva (configurable) | `lingva.lunar.icu` (or your instance) | text only |

Apart from that DeepL context and the optional statistics above, we never send:
usernames, channel names, badges, timestamps, your IP (beyond what the browser
sends to any HTTP endpoint), or any other metadata.

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

- `storage`: to save your preferences and cache.
- `alarms`: to keep the service worker alive briefly during bursts of chat.
- `scripting`: once, when the extension is installed or updated, to load its
  own content script into kick.com tabs already open, so they keep translating
  without a reload. It injects nothing else, and nowhere but kick.com.
- `host_permissions` for kick.com and the translation provider endpoints
  above: to read chat and call the translators.

We do not request the `tabs` or `<all_urls>` permission.

## Contact

Open an issue at <https://github.com/Pkkls/kick-chat-translator/issues>.
