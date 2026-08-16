# Handoff — kick-chat-translator, 2026-08-16

State document for continuing this work in a fresh session. Written after items 96
to 104 on branch `integration/2026-08-13`. Nothing has been pushed.

---

## 1. Where things are

Repo `C:\Users\kil\Downloads\kick-chat-translator`, branch `integration/2026-08-13`,
working tree clean, **nothing pushed**. Published version is 2.6.0; these commits
are not released.

| Commit | Item | What it does |
|---|---|---|
| `7df0ea5` | 96 | Re-translate on-screen lines when the reading language changes |
| `d2a1b14` | 97 | Metrics sink, integration builds only, stripped from releases |
| `c03c179` | 98 | `_locales` en/tr/ar so store search matches the reader's language |
| `92d64f1` | 99 | Turkish and Arabic long store listings, paste-ready |
| `40271d5` | 100 | Same re-translation for `displayStyle` and the badges |
| `818dd46` | 101 | DeepL key moved from `storage.sync` to `storage.local` |
| `c1781ef` | 102 | zod out of the content script, 81.3 → 69.0 KB gzipped |
| `6d66382` | 103 | Bridge so the page can read collected metrics |
| `e986e55` | 104 | Metrics survive a service worker restart |

377 tests across 35 files. `npm run build` and `npm run build:metrics` both green.

Commit convention: `[item N] Imperative subject`, one item per commit, with a body
explaining cause, fix and how it was witnessed. Next item is **105**.

---

## 2. How to measure

```
npm run build:metrics        # instrumented build into dist/
```

Then load `dist/` unpacked in Chrome. Its id is derived from the install path;
for `C:\Users\kil\Downloads\kick-chat-translator\dist` it is
`igdnhalokbeabohdmncbmogjakkgcheb`.

**Chrome does not pick up a rebuild by itself.** After every `build:metrics`, click
reload on `chrome://extensions`, then reload the Kick tab. Storage survives both,
so earlier samples are kept.

Read the numbers from any Kick tab, in page context:

```js
JSON.parse(document.getElementById('kt-metrics-dump').textContent)
```

Release builds carry none of this. `scripts/check-strip.ts` fails the build if the
marker `kt.metrics.v1` appears in a release bundle, and fails an instrumented build
if it is missing from `assets/content.js`. Both directions are enforced, on purpose:
a check that can only pass is not a check.

---

## 3. What has actually been measured

Live Kick chat, instrumented build, browser-observed. Sample sizes are small; treat
these as directional, not as decisions.

### Latency

| Series | n | p50 | p95 |
|---|---|---|---|
| `e2e.cloud` (message seen → translation painted) | 31 | **1761 ms** | 2197 ms |
| `provider.google.item` | 10 | 979 ms | 2176 ms |
| `e2e.local` | **0** | — | — |

Nearly two seconds to paint a translation on a chat that scrolls. Provider latency
is most of it, so the remaining budget is small.

**The on-device engine has never fired in any observation.** It is the default
(`engineMode: 'local-first'`), so this needs explaining before anything else is
optimised. Candidate causes, none verified: no model downloaded for the pair, or
`detected` being undefined so the local branch is skipped.

### Caches, chain, DOM

- `cache.mem` hit rate **0%**, `cache.sw` hit rate **10%**. The in-tab cache earned
  nothing over these windows.
- `chain.depth.1` only: the first provider answered every time, the fallback chain
  never ran.
- `batch.items` p50 **14**, n=2. Too few samples to judge the 180 ms window.
- `dom.row.textEmpty / dom.row.seen` = **54%**. Do not read this as broken
  selectors: `dom.row.seen` counts rows the observer matched, which includes system
  lines and emote-only messages that legitimately carry no text. An external probe
  over `div[data-index]` gave 64-70% on a different channel. Neither number has a
  clean denominator yet; establishing one is worth an item.

### Language detection — the big finding

`franc` is measurably unreliable on chat text.

Corpus: 804 unique messages from a live Spanish channel over 8.5 hours.

| Property | Value |
|---|---|
| Median message length | 15 characters |
| Under 20 characters (franc's own stated floor) | 61% |
| All caps | 67% |
| Single word | 28% |

On a 28-message sample of that corpus, all Spanish:

| Variant | Correct |
|---|---|
| franc, unrestricted | 32% |
| franc restricted to the 45 languages the extension supports | 36% |
| repeated words removed, restricted | 36% |
| only messages with ≥5 distinct words | 56%, covering 57% of chat |
| only messages with ≥6 distinct words | 60%, covering 36% of chat |

**No cheap preprocessing rescues it.** Case is not the problem: 23 of 23 verdicts
were identical between upper and lower case. Failures concentrate on repeated spam
("BINGO BINGO BINGO" → Dutch, "PIUM ×12" → Indonesian) and on short slang.

This corroborates `langDetect.ts:170`, which already records 16 of 85 Spanish lines
and 13 of 51 Turkish lines correct.

---

## 4. The open decision

`confidentLanguage()` returns a language only when it was **looked up** — Unicode
script, the short-word lexicon, the trivial-token table — never when franc guessed.
The cloud path already uses it (`pipeline.ts:297`), which is why cloud translation
is sound: providers detect the language themselves.

`detectLanguage()` does return franc's guess, and `pipeline.prepare()` uses it for
three drop decisions and hands it to the on-device engine as the source language
(`pipeline.ts:253`). So the local engine is asked to translate Spanish from Swahili.

**Proposal, not yet implemented:** give the local branch `confidentLanguage(real)`
instead of `detected`, so the same rule applies on both paths. A Japanese message is
still detected by its script and translates locally; ambiguous Latin text has no
trustworthy source, so it goes to the cloud which detects for itself.

**An idea that was tried and rejected — do not re-propose it.** Using the channel's
broadcast language (`livestream.lang_iso`, already fetched at `index.ts:179` for the
compose path) as the source prior. It breaks on multilingual chats, which is exactly
where a chat translator earns its keep. Counter-example: `kick.com/nanatty`, a
Japanese streamer whose chat runs in five languages at once. Every message must be
judged on its own text.

Still open beyond that: whether the same rule should also cover the three drop
decisions (`ignoreEnglish`, `isSameLanguageAsTarget`, source-language allowlist),
which currently trust franc too. That is a wider change touching the filters.

---

## 5. Store and distribution

Chrome Web Store analytics, 1 July to 16 August: 133 unique visitors, 200 listing
views, **62 installs** (31% of views, 47% of visitors — a strong funnel, leave it
alone).

- US = 28 of 133 visitors. **79% of the audience is outside the US, 68% outside
  every English-speaking country.**
- Listing views by store language: English 148, **Turkish 21, Arabic 17**, Russian
  5, then a tail of Japanese, Czech, Chinese, Hebrew.
- 60% of new users arrive via organic search. Referrals: 1.

Items 98 and 99 addressed this: `_locales` for the searchable fields, and
paste-ready Turkish and Arabic long descriptions in `store-listing.md`.

**Waiting on the user:** paste those two listings into the dashboard (they want a
native reader first — neither was written by a native speaker), and pull the
**uninstall** figures, which no export so far has included and which are the only
number that says whether shipped bugs cost users.

At ~5 listing views a day, a donation button returns approximately nothing. The
free AMO "Contributions" field costs two minutes and is worth having; anything more
elaborate is not the lever. Distribution is.

---

## 6. Traps found the hard way

**Kick API.** Layer 0 is cleared by sending **no** `User-Agent` header at all, not
by a "neutral" one. `node` → 403, `Mozilla/5.0` → 403, empty string → 403, header
absent → 404 on a nonexistent slug, i.e. the app was reached. `kick-api-notes`
records this as "neutral UA", which is wrong: Node's `https.get` simply sends none.

**Pusher chat is dead and lies about it.** `chatroom.<id>` on `ws-us2.pusher.com`
still answers `subscription_succeeded`, then delivers nothing — zero messages in
35 s on a channel with 62 868 viewers. Pusher accepts subscriptions to any public
channel name without checking it exists. `kick-core/gateway.js` is right against
`private-api.md`.

**Discovery that does work, anonymously:** `GET /stream/livestreams/{lang}?page=N&limit=24`
returns 200 with no UA header. The language segment is **not** a filter — `/tr`
returned Spanish streams. Filter client-side on each entry's `language` field. The
listing carries no `chatroom.id`; resolve each slug via `/api/v2/channels/{slug}`.

**Chat corpus comes from the DOM**, not from any API. `kick-chat-collector.js` in
the scratchpad does it with the extension's own selectors.

**Build.** `scripts/bundle-content.ts` re-bundles the content script in its own vite
pass with `configFile: false`, so `vite.config.ts` is never read and any `define`
must be repeated there. This was caught twice: once shipping the live sink into a
release, once stripping it from an instrumented build while the check still passed
because the worker bundle carried the marker.

**MV3.** The service worker is killed whenever it goes idle. Anything holding state
in worker memory must merge with storage rather than overwrite it. That was item 104.

---

## 7. How this work was done

The parts that produced results, kept because they are cheap and they worked:

**Never claim a behaviour that was not observed.** Every commit message ends by
stating its verification level; most say "never seen in a browser, unit tests only".
Only item 104 is confirmed live.

**A check needs a witness.** Every guard added here was watched failing for the
right reason before being kept: remove `displayStyle` from `RERENDER_KEYS` and the
test names the missing key; make `withoutKey` stop stripping and four assertions go
red with `expected 'secret-abc' to be ''`; restore the plain `set` in the metrics
flush and four persistence tests fail, the first with `expected 4 to be 7`, the
production symptom exactly.

**A negative must prove its own measurement.** A witness that "passed" once turned
out to have edited nothing — a CRLF file against an LF pattern. A `check-strip` that
reported green was hiding a half-stripped build. Both were caught by asserting the
probe did something before trusting what it said.

**Derive lists, never hand-keep them.** This codebase has been bitten five times by
a hand-written list that someone forgot to extend: `ARTIFACT_CLASSES` three times
before item 95, the hover placeholder at item 100 (it was a bare string literal, so
the item 95 guard could not see it), and `RERENDER_KEYS` would have been the sixth.
Guards now read the source and derive what they expect.

**Measure before optimising, and publish negative results.** The channel-language
prior, the caps hypothesis and the franc `only:` restriction were all killed by
measurement before any code was written. Those three non-changes are worth more than
the commits.

---

## 8. What to do next, in order

1. **Explain why `e2e.local` has no samples.** The on-device engine is the default
   and has never been observed running. Everything else is secondary to that.
2. **Decide the `confidentLanguage` question in section 4** and implement it.
3. **Give `dom.row.textEmpty` an honest denominator** so the 54% figure means
   something.
4. Let metrics accumulate over a long session across several non-English channels
   before touching provider order, the coalescing window, or cache sizes. Nothing
   there has enough samples to justify a change yet.
5. `stripInlineEmoteNames` in `emoteParser.ts` strips any mixed-case word, so
   `iPhone`, `McDonald` and `PlayStation` are removed before translation. Unrelated
   to the above, silent, still unfixed.
6. Incoming `@mentions` are deleted from the translated line rather than preserved;
   the outgoing path masks and restores them instead. Two opposite strategies for
   the same thing. See `scratchpad/handles-mentions.md`.
