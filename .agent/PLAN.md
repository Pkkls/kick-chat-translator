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

- [ ] **The live gates are not deterministic.** Two runs of the same suite,
  minutes apart, disagreed: `kick-dom-recon` and `bar-panel-mesure` failed in
  one and passed individually in the other. They follow whichever channel
  `/browse` serves and depend on its chat, its load and the network. A suite
  that goes red on a quiet channel trains people to skip it, which is the
  failure mode `audit_da.py` already documents for itself. Worth pricing: a
  retry on a differing channel, a distinction between "the product is wrong" and
  "the page gave me nothing to measure", or accepting the noise and saying so.

- [ ] **`latency` cannot run in a normal pass.** It needs
  `npm run build:metrics`, and every other gate needs the ordinary build, so a
  suite that builds normally always reports it as a prerequisite. It exits 2 and
  says why, which is honest, but nothing ever runs it.

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

- [x] **Runner coverage: 31 harnesses of 33.** 21 offline gates plus 10 in
  `run-live.mjs`. The six left have a stated reason rather than a silence:
  `flag-render`, `lang-panel-shoot`, `probe-row-space` and `bar-select` assert
  nothing and exist to draw or print for a human; `store-shots` produces the
  listing screenshots; `live-profile` is the window someone signs into by hand.
  Wiring an assertion-free script buys runtime and no verdict.

- [x] **A `position: fixed` panel that was not viewport-relative.** Found by a
  harness nothing was running. `bar-panel-live` reported the bar's language
  panel 4px off the left of the window; live at 1000x750 it hung 362px below
  the bottom, with a third of the list unreachable. The placement code was
  right all along, writing `top: 222px` inline while the panel rendered at
  y=711: `.kt-float` carries a `backdrop-filter`, which makes it the containing
  block for any fixed descendant, and 489 + 222 = 711 to the pixel. Our CSS,
  not Kick's. The panel hangs off the body now, like the compose preview and
  the chip's menu, and measures clean at 1000x750, 1280x900 and 1500x950.
- [x] **A live runner.** `run-live.mjs`, two workers by default rather than six:
  these open real pages on one host. The three that need a signed-in profile are
  excluded unless asked for, since failing because nobody signed in is noise.
- [x] **Three offline harnesses wired into the runner**, `bar-panel-live`,
  `flags-preview` and `lang-panel-measure`. Three others stay out and the runner
  says why: they draw images and assert nothing, so running them would buy time
  and no verdict.
- [x] **The quality apparatus is tracked.** It was on one machine and nowhere
  else: `git ls-files scratchpad/` returned 0 while `PROMPT.md` told the next
  session to run a gate runner a fresh clone would not have. 40 files enter, 291
  KB: 35 harnesses and 5 audits. The output stays out, which is the whole
  argument, 272 MB of screenshots, HTML dumps, bundles and browser profiles
  against 422 KB of scripts. The French working prompts under `scratchpad/*.md`
  stay private too.
- [x] **No machine path left in the harnesses.** 33 files carried the same
  absolute path into one home directory as Playwright's fallback location,
  invisible while everything was ignored and unusable the moment it was not.
  They import `./playwright.mjs` now, which looks at `$UX_KIT`, then a
  gitignored `scratchpad/uxkit.path`, then the repository's own
  `node_modules`, and exits 2 with the three ways to fix it when none is there.
  Exit 2 rather than 1 on purpose: a missing prerequisite is not a failed gate.
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
