# Store texts

Everything the Chrome Web Store and addons.mozilla.org show about the extension,
one plain-text file per store, field and language. `scripts/stores/payloads.mjs`
reads this folder and refuses to build when a text breaks a rule below; the
`audit-fiche` gate checks the field limits.

```
chrome/description/<lang>.txt   detailed description (16000 chars), pasted by hand
chrome/summary.txt              short summary (132 chars)
chrome/dashboard/*.txt          single purpose, permission justifications, data usage, metadata
amo/summary/<lang>.txt          summary (250 chars), set through the API
amo/description/<lang>.txt      description (15000 chars), set through the API
amo/reviewer-notes.txt          notes for AMO reviewers; {{VERSION}}, {{CHECKSUMS}} and
                                {{TOOLCHAIN}} are filled at build time
amo/data-collection.txt         answers for AMO's data collection form
notes/<lang>.txt                release notes of the version being shipped (AMO)
```

`<lang>` is `en fr es pt-BR tr ru ar ja ko zh cs` (notes add `de` and European `pt`).
The short description Chrome shows under the name is not here: it is the
manifest's `extDescription`, in `public/_locales/*/messages.json`.

## Rules

- **No version number in a description.** Chrome's descriptions can only be set
  by pasting them in the dashboard, eleven languages at a time, so they carry
  nothing that goes stale with a release. What changed goes in `notes/`, which
  AMO shows per version and the GitHub release carries.
- **Plain text.** Neither store renders Markdown; capitalised lines are the only
  headings.
- **No em or en dash, accents kept.** Every paragraph of 120 characters or more
  in a Latin-script language must carry at least one accent, and no Cyrillic
  letter may hide in a Latin word. Both have shipped before.
- **Translations** were written without a native reader and checked by
  round-tripping each paragraph back to English. The tone follows each
  language's own convention (tu in French, vous in Russian and Czech).
