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

- [ ] **The install rate is 40.5 percent and nothing is tuned against it.**
  Eighty-five installs for two hundred and ten first visits, over eight months.
  Fifty-eight percent of arrivals come from organic search, thirty-one direct,
  six from an AI assistant. The listing that produced that number has never been
  updated past 2.5.0 while the product is at 2.9.2, so the figure is a baseline
  for a page nobody has touched, not a verdict on the current text. Resubmitting
  is the experiment, and it is blocked on kil.

- [ ] **The local 2.9.2 archives are not the published ones.** Rebuilding after
  the placement fix overwrote them: chromium is 294379 bytes locally against
  294586 published, a delta of 207. Same version number, different build, which
  is exactly how a stale package reaches a store. `state.mjs` compares sizes
  against the release and says so at every start now, but the condition stands
  until this branch merges and a 2.9.3 ships. Do not submit anything from
  `release/` while that warning is up.

- [ ] **`node_modules` is in the git history**: 4308 files added, repository at
  10.9 MB. Public since 2026-08-29, so it is a clone cost for everyone. Removing
  it rewrites history, which is a decision with consequences, not a chore.

- [x] **The duplicate remote is gone.** `public` pointed at `origin`'s URL with
  a stale tracking ref, so a naive read reported one remote current and the
  other 16 commits behind for the same repository. Removed locally; `devcopy` is
  a different repository and stays. Restore with `git remote add public` and the
  URL if it is ever wanted back.

- [x] **`c6cb904`'s truncated commit message stays as it is.** Fixing it means
  rewriting a commit already on a public master, so every clone and every fork
  point moves to spare one word in one message. The cost is larger than the
  defect. Closed as a decision, not as a fix.

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

- [x] **The two reworked menus have an accessibility pass.** axe reports zero
  violations on the chip menu in both themes, checked against a doctored copy
  that it does report; target size passes with 96 targets. The kit's keyboard
  gate fails on the saved HTML because a dump carries the DOM and not the
  listeners, so the arrows were measured where they exist instead: Down +3,
  Right +1, Up -3, three columns, in dark, light and RTL. Asserted now, with
  forcing the column count to 1 as the witness.

- [x] **Czech added to both listings, on measurement rather than inference.**
  A first pass mapped country to language and named Polish as the biggest
  uncovered group. The page-title report says which localised store page people
  actually land on, and Polish appears on none of them: the order is English,
  Turkish, Arabic, then Czech, which is ahead of Russian, Japanese, Chinese and
  Korean, all four of which already had text. Czech had none. Eleven languages
  each side now, 34 fields inside their limits, and the shape check caught the
  same duplicated privacy paragraph in the derived Czech that it caught in the
  other eight.

- [x] **The one cost every reader pays now has a budget.** Store analytics were
  offered as a basis for optimisation and could not serve as one: they describe
  the listing page, a sixth of that traffic is on phones and another eighth on
  browsers that cannot install a Chrome extension, and there is no install or
  usage figure in them. The extension ships no telemetry on purpose. So the
  question became what can be measured here, and the answer was the injected
  script: `assets/content.js` is parsed on every kick.com page whether or not
  anyone opens anything, with `inject.css` inlined into it. Read out of the
  published archives rather than out of a note: flat at 199.4 KB from 2.7.0 to
  2.8.1, then 224.3 at 2.9.0, up 12.5 percent in one version for the drawn flags
  and the shared panel, unseen for three days. `audit_poids.py` compares against
  a baseline that lives in the file itself, since a JSON beside it would be
  gitignored and would not survive a machine. Checked both ways: green at the
  current size, red against a baseline 12 percent lower, which is the jump it
  would have caught.

  Not done, on purpose: the flag rules are 10.9 KB of that bundle, 45 rules and
  7.5 KB of SVG data URIs, and moving them to a stylesheet injected on first use
  would save 4.9 percent of the bundle and a sub-millisecond parse. That is
  optimising a number rather than an experience.

- [x] **The live suite was not non-deterministic; three probes were broken.**
  Filed as a systemic property of live gates, which was the wrong shape. The
  flapping was `live-kick` setting `.value` and dispatching `change` on the
  bar's language control, which stopped being a `<select>` when the shared panel
  replaced it: on a button that does nothing at all, so the target was never
  changed and the count that followed measured the default target. It passed or
  failed with the language of whatever channel `/browse` served. It clicks the
  button, picks French from the panel, and refuses to count until the control
  itself reads FR. Three runs after: 6, 5 and 2 translations, zero errors, the
  verdict steady while the count follows the traffic, which is what it should
  do. The other two flaps were a null crash in my own keyboard probe and one
  unexplained `kick-dom-recon`, so the systemic claim rested on one real
  unknown, not three.

- [x] **`latency` runs.** It reads counters only a metrics build emits, and
  every pass builds normally, so it had never run once: it exited 2 and said
  why, honestly and uselessly. `run-live.mjs` gives it its own phase, last and
  alone since it rewrites dist/, which builds metrics, measures, and restores
  the ordinary build even when the measurement fails. First run: green, 108.3s.
- [x] **The node version is printed where it matters.** The 2.9.x packages went
  out on node 22 while `.nvmrc` pins 20 and CI builds on 20, and nothing
  objected because `engines` allows both. `pack.ts` prints the running version
  and the full sha256 with every archive, and says when it differs from the pin.
  A warning, not a failure: refusing would contradict `engines`.

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
- [x] **The compose side is covered offline.** Writing a reply and seeing it in
  the channel's language is half the product, and it was only ever verified
  live. The property that matters is not that a preview appears, it is which
  language it targets: the channel's, read from Kick, and not the reader's.
  Getting that wrong sends a polite sentence in the wrong language in front of
  everyone. The fixture answers `lang_iso: es` on Kick's API while incoming chat
  goes to English, so the two are told apart. Clean coverage, measured: never
  handing the channel language to the compose controller leaves all 621 unit
  tests green and turns this gate red. The product's fallback is sound, by the
  way: with no channel language it shows nothing rather than translating to the
  wrong one.
- [x] **The version check is covered end to end.** The extension reads the
  latest GitHub release to tell a reader a newer version exists, and that read
  is one of the permissions both store listings have to justify. If it breaks,
  everyone stays on an old version and nothing says so.
  `updateChecker.store.test.ts` covers the decision with `fetch` stubbed and the
  function called directly; what nothing covered is the trip itself, popup asks
  the service worker, worker asks GitHub, popup draws the banner. The gate
  serves a release announcing v99.0.0 and reads the banner's text and link.
  Clean coverage, measured: forcing the worker's answer to "no update" leaves
  all 621 unit tests green and turns this gate red.
- [x] **Both caches are measured, on cost and on display.** The same line comes
  round constantly in chat, and two caches are meant to catch it: the in-tab one
  in `pipeline.ts` and the service worker's. Neither was checked end to end,
  though it is a direct cost to the reader, in money at DeepL and in soft bans
  at Google. The gate posts a line, waits for its translation, then posts the
  same text under a different username, since the per-user skip in `prepare()`
  would otherwise drop it without consulting any cache and the zero would prove
  nothing. Two witnesses. Blinding both caches makes the repeat cost one call.
  And a cache hit that returns without applying leaves all 621 unit tests green
  while turning the gate red, which is the worse failure of the two: every
  repeated message would silently show nothing.
- [x] **The 7TV DOM contract is exercised.** On a page where 7TV renders the
  chat, the message is not in Kick's `span.font-normal` but in
  `span.seventv-text-token`, which `extractMessageText` reads first. A row whose
  text exists only in those tokens is sent to the engine once and translated.
  Witness: removing the preference means the message is never sent at all. A
  unit test catches that same break, so the coverage is not unique; what the
  gate adds is the whole chain on a 7TV-rendered row. It deliberately does not
  claim to reproduce the native+7TV duplicate the source comment names: two row
  shapes were tried and neither produces it, because `joinTexts` reads only an
  element's own text nodes, and inventing a third shape would prove nothing.
- [x] **Choosing a language in the bar reaches the page without a reload.** The
  gate drives the product's own control rather than writing settings by hand,
  and reads back the `tl` parameter the engine actually received, so the
  assertion is about the language requested and not about a label. Clean
  coverage, measured: cutting `pipeline.updateSettings` leaves all 621 unit
  tests green and turns this gate red. A first version wrote a partial settings
  object straight into `chrome.storage` and did not propagate, which says
  nothing about the product: a partial object is not what the bar writes.
- [x] **The hover mode's economy claim is measured.** Both store listings sell
  hover mode on a number: roughly ten times less consumption on a fast chat.
  That only holds if nothing is requested before the pointer arrives, which only
  a real browser can say. The gate sets `displayStyle` from the extension's own
  service worker, waits, and asserts zero engine calls, then hovers and asserts
  one. Clean coverage, measured: short-circuiting `armHoverTranslate` so the
  line translates immediately leaves all 621 unit tests green and turns this
  gate red on three counts.
- [x] **The chat fixture was missing the element the product injects into.**
  `pickInjectionTarget` looks for `div.w-full.min-w-0.shrink-0` first and falls
  back to the row's first child, which in the fixture was the username button.
  Translations were landing inside the username, visible in earlier output as
  `pseudo1ESZZTRADUCTIONZZ:...` and never questioned, and hover mode armed the
  username instead of the message. The fixture carries the wrapper now. This
  does not touch the recycling finding, where the observer never delivered the
  row at all.
- [x] **Changing channel is covered offline.** Kick switches channel by
  navigating the app: the URL moves and the chat is remounted, with no reload.
  If the extension does not rebind, translation stops for good and nothing says
  so. The content script patches `history.pushState` to notice, but it lives in
  an isolated world and Kick's router calls its own in the main world, where
  that patch does not exist, so the harness navigates from the main world like
  the site does. The product survives it: the container watcher rescans. Clean
  coverage, measured: disabling that rescan leaves all 621 unit tests green and
  turns this gate red.
- [x] **A recycled chat row was never re-translated.** Kick's virtual scroller
  reuses rows by replacing their CONTENTS, which makes the row the mutation
  TARGET and never an added node. The observer collected candidates from added
  nodes and their descendants only, so it walked straight past the row: measured
  with the extension loaded, eight recycled rows carried no translation, no
  reason on the line, and produced no provider call. The comment above that code
  said the case was covered; the code did not do it. `enclosingMessageRow` walks
  up from the mutation target. Two witnesses: the new gate goes from 9 of 9 to 1
  of 9 without it, and a unit test in `observer.test.ts` fails without it. That
  test needed the test double to stop discarding the `MutationObserver`
  callback, which is why nothing in the unit suite could reach this branch.
- [x] **The fallback chain is tested offline, and it covers ground nothing else
  does.** When the first engine rate-limits a reader mid-stream, the next one is
  supposed to take over. That was verified only by `live-fallback`, which kills
  providers at the DNS resolver because its first version routed with
  `page.route` and measured nothing: in MV3 the translation requests leave from
  the service worker. `ctx.route`, at the context level, does see them, measured
  here. So `translate-offline --bascule` returns 429 from the first engine and a
  canned answer from the second, and asserts both were called and that the text
  on screen came from the second. Truncating the runtime cascade to one provider
  in `background/translator/index.ts` leaves all 620 unit tests green and turns
  this gate red. Removing the chain from the default settings is caught by a
  unit test, but that one asserts a constant and says nothing about the chain
  running.
- [x] **The product's one job is tested offline.** A message arrives in chat and
  its translation appears under it: nothing offline verified that. `chat-live`
  calls `inject()` by hand and measures rendering, the 620 unit tests stub at
  module boundaries, and the only end-to-end coverage was live harnesses that
  open the real kick.com. `translate-offline` loads the real extension, serves a
  local chat fixture taken from `observer.test.ts`, and answers the translation
  engine with a made-up string, so the assertion is exact. Witness: breaking
  `font-normal` in `selectors.ts` turns it red. Measured limit, stated in the
  file: removing the engine's host permission does not turn it red, because the
  interception answers before the permission matters.
- [x] **`extension-load` was hitting the real network and said it was not.**
  Playwright's glob does not match `*.kick.com` against `kick.com`, so the
  document navigation went to the real site while its subresources were
  intercepted, which is why the run reported 70 interceptions and looked right.
  A regular expression takes both forms. The claim that nothing left the machine
  was false when it was written.
- [x] **The extension exposes nothing to kick.com pages any more.** The built
  manifest listed six web-accessible resources: a stylesheet, an icon glob, and
  four ESM chunks crxjs adds for the loader that `scripts/bundle-content.ts`
  replaced. Measured on the built bundle: zero `getURL`, zero
  `chrome-extension`, zero dynamic import, zero icon reference, and all 22
  `url()` in the stylesheet are inline `data:` SVG. Nothing was reachable for a
  reason, and what was listed gave any script on a kick.com page a stable URL to
  request as a test for whether the extension is installed. This matters here:
  the site already walls off what it detects. Removed at the source and dropped
  again after crxjs, in both the Chrome and Firefox builds.
- [x] **A gate that loads the real extension.** Every other offline gate mounts
  components by hand and never touches the manifest, `content_scripts`, or the
  path Chrome actually injects through. The only harnesses that did open the
  real kick.com, so they need the network and do not run in the suite: the
  defect `bundle-content.ts` exists to fix, a dynamic import losing its race and
  injecting nothing silently, was invisible to every gate. `extension-load`
  intercepts `https://kick.com/**` and serves a local fixture, so the document
  keeps its kick.com URL, Chrome injects, and nothing leaves the machine. Two
  witnesses: pointing `content_scripts` at a missing file, and re-exposing one
  chunk. It needs a window, since a headless run loads no extension at all, and
  the window is pushed off screen.
- [x] **The offline gates no longer need a Google Chrome on the machine.**
  Seventeen gates and three shooters launched `channel: 'chrome'`, which makes
  the browser a property of the machine, in an apparatus that was just made
  tracked so a clone could run it. They use Playwright's own Chromium now, which
  `package.json` pins. Speed is not what decided it: the system Chrome is
  faster, 914 to 1443 ms against 1474 to 2256 ms on one gate over three launches
  each. An apparatus that may run on either browser produces two sets of numbers
  and these gates assert pixels. Both agreed on the day of the change, and they
  are two version streams with no reason to keep agreeing. `live-kick` and
  `compose-kick-live` keep the real Chrome: they open the real kick.com, where
  the profile and the site's bot detection are part of what is measured.
- [x] **Both reworked menus audited, and the audit made permanent.** axe 0
  violations and 96 targets at or above 24x24 on each, in dark, light and RTL.
  The kit's keyboard gate reads a saved dump, which carries no listeners, so
  arrow behaviour is measured live instead: Down +3, Right +1, Up -3, 3 columns,
  asserted and witnessed by forcing `MENU_COLS` to 1. The audits hang off
  `chip-live` and `bar-panel-live` rather than being a gate of their own,
  because a pooled runner could schedule a separate gate before the harness that
  writes its input. Four dumps per sweep, about 4.4s.
- [x] **A dump audited in the wrong state reads as coverage.** The bar panel's
  first dump was taken with the filter still holding "por", leaving 2 of 39 rows
  visible, and both accessibility gates stayed green on it: the target-size gate
  measures the targets it finds and does not count them. The harness now
  measures visible rows as it writes the file. Witness: taking the dump filtered
  gives 2 of 39 and exit 1, axe still green on the same run.
- [x] **`npm run lint` was red and nothing said so**, since `e3ea484` added
  `scripts/kick-chat-collector.js`: a console-paste snippet under a directory
  `tsconfig` includes without `allowJs`, which the type-aware parser fails on
  before it lints anything else. Ignored like `scripts/pack.ts`, with a witness
  proving the rule still fires on real code.
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
