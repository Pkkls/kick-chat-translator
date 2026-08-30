# Work queue

Marks: `- [ ]` open, `- [k]` waiting on kil, `- [x]` done. `state.mjs` counts
them and lifts the `[k]` lines into `ETAT.json`, so keep the marks exact.

Every entry carries the number that justifies it. An entry without one is a
hunch, and hunches go at the bottom until someone measures them.

---

## Dependency graph

Disjoint sets, named so the hypervisor can read them rather than guess. A unit
is spawnable when its set appears here and does not intersect another running
one.

```
ATTRACTORS, root only
  src/content/inject.css
  src/content/injector.ts

A. gate coverage        scratchpad/harness/run-gates.mjs
                        scratchpad/harness/*.mjs (the orphans)
                        .agent/state.mjs
   independent of everything below

B. repository hygiene   .gitattributes, .nvmrc, package.json
                        git history (node_modules)
   independent of A

C. live verification    scratchpad/harness/compose-kick-live.mjs
                        scratchpad/harness/lang-menu-live.mjs
                        scratchpad/harness/bar-panel-mesure.mjs
   blocked on kil for the emote picker, open for the rest

D. store listing        store-listing.md
                        screenshots
   blocked on kil for review and submission

A and B do not intersect and can run at once. C touches only harness files but
reads dist/, so it serialises behind any build. D touches no code.
```

---

## Open

- [ ] **The entire quality apparatus is untracked.** `git ls-files scratchpad/`
  returns 0. The 18 gates, the 33 harnesses and the 4 audits live under
  `scratchpad/`, which `.gitignore` line 18 excludes, so they exist on one
  machine and nowhere else. A fresh clone of the public repository gets none of
  them, and `.agent/PROMPT.md` tells the next session to run a gate runner that
  would not be there. This is the one that undermines everything else in this
  directory: state survives a session limit, and the means of checking it does
  not survive a machine.

  Not a chore. Moving them in publishes every measurement script and the
  screenshots they write, which is a decision about what the public repository
  is for. Options worth pricing: move only `run-gates.mjs`, the four audits and
  the offline harnesses; keep the live ones and their PNGs out; or leave it and
  accept the apparatus is machine-local and say so in `PROMPT.md`.

- [ ] **19 harnesses of 33 are in no runner.** `run-gates.mjs` enumerates 18
  offline gates. The live ones open a browser onto kick.com and are excluded on
  purpose, but `lang-menu-live`, `bar-panel-mesure` and `compose-kick-live` are
  the only things covering the reworked language UI and nothing runs them.
  Decide per orphan: wire it, retire it, or write down why it is neither. A live
  runner with its own entry point is probably the shape.

- [ ] **`node_modules` is in the git history**: 4308 files added, repository at
  10.9 MB. Public since 2026-08-29, so it is a clone cost for everyone. Removing
  it rewrites history, which is a decision with consequences, not a chore.

- [ ] **`.nvmrc` pins 20, the published packages were built on node 22.22.0.**
  Both satisfy `engines: >=20`. Either the pin is wrong or the build is; the AMO
  reviewer notes currently state the mismatch rather than resolve it.

- [ ] **A duplicate remote.** `public` and `origin` are the same URL, and
  `public`'s tracking ref is stale, so a naive read reports one remote up to
  date and the other 16 commits behind for the same repository. `state.mjs`
  names the alias now; the remote itself is still there.

- [ ] **`c6cb904`'s commit message lost a word** to a bash heredoc eating
  backticks. Pushed to a public master, so fixing it means a force-push of a
  shared branch. Probably not worth it; decide and close.

---

## Waiting on kil

- [k] **Emote picker dodge, compose panel.** `findOverlayTopAbove` uses guessed
  selectors and has never met Kick's real picker. Clicking the button
  (`svg[data-ds-icon="Smile"]`, which carries no aria-label, no data-testid and
  no title) opens `auth-modal` in the Playwright context even with
  `kick_session` and `kick_session_id` present. Two attempts, same wall. Needs
  kil's own Chrome, not the harness profile.

- [k] **Native review of the store text.** 8 languages of 10 on the Chrome side
  and 8 of 10 on AMO were written without a native reader, which the file states
  about itself. ZH and KO are the least certain.

- [k] **Store submissions.** Chrome Web Store and AMO. Packages, listing text,
  dashboard fields and reviewer notes are ready; the accounts are kil's.

- [k] **The screenshots show a real streamer**, their branding and real viewers'
  usernames. Normal for a chat extension listing, and still kil's call before it
  goes on a store page.

---

## Done, kept for the record

- [x] Language list drawn as a grid of flags, chip menu: 202x894 to 408x518,
  every row at 30px.
- [x] Chip menu lifted out of Kick's stacking context: covered at 5 of 9 sampled
  points, then 0 of 9 at three window sizes.
- [x] One click opens the list. The caret was a 10x6 target on a 45x24 chip,
  where WCAG 2.5.8 asks 24x24.
- [x] Bar panel reworked: 6 visible rows of 40 to 25, list 1200px to 433.
- [x] `.kt-flag` declared twice, lending every drawn flag a 0.65 opacity and a
  4px padding, and repainting them flat grey in the light theme on specificity.
- [x] Compose panel measured live for the first time: 219x54 at exactly
  `COMPOSE_PANEL_GAP` above the composer, uncovered at z-index 9999, border at
  3.75:1 against Kick's real ground rather than 3.33 against an invented one.
- [x] Both store listings at ten languages each, 31 fields inside their limits.
- [x] AMO reviewer notes with a byte-reproducible build, verified by two
  consecutive runs producing one SHA-256.
