# Screenshots

Generated, not collected. `scratchpad/harness/store-shots-fixture.mjs` loads the
built extension into a browser, opens a chat room this repository makes up, and
captures it.

| File | What it shows |
|---|---|
| `chat.png` | Incoming chat with a translation under each message, and the status bar above the list. |
| `compose.png` | The compose box holding an English message, with the preview of the version that would be sent. |
| `languages.png` | The language grid, searchable, with the channel's own language first. |
| `popup.png` | The toolbar popup: target language, display mode, providers, the day's counts. |

Regenerate them all with:

```bash
node scratchpad/harness/store-shots-fixture.mjs
cp scratchpad/harness/readme/*.png screenshots/
```

Two rules these images follow, and both were paid for.

**Nobody real is in them.** The room, the usernames and the messages are
invented, and the translation engine is answered locally, so nothing leaves the
machine and no chatter's handle ends up on a page they never agreed to be on.
The image this replaced was a capture of a live Japanese channel and carried four
real handles. What the pictures show of the product is still true: it is the
`dist/` build running, reading that room the way it reads any other.

**Each one is checked for its own subject** before it counts as taken. The chat
shot fails unless at least six translations were actually rendered, the language
shot unless the panel holds more than ten rows, the compose shot unless the
preview is mounted and carries text. A redesign that empties a panel therefore
fails the run rather than shipping a picture of nothing.

The same harness also writes `scratchpad/harness/store-fixture/01..05.png` at the
1280x800 the Chrome Web Store demands. Those are the store's, not this file's:
at that size the fabricated page is three quarters empty video area, which is
fine in a listing where the image is clicked and enlarged, and useless in a
README where it is squeezed into a column of text.

`japanese-chat.jpg` is kept as the record of what the earlier capture looked
like. It is no longer referenced by any README.
