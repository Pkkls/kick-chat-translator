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


- [x] **Platform-injected text is settled without a corpus.** The category was
  blocked on a live chat capture. Kick's own i18n payload, inlined in the page
  it serves, answers most of it. The notices live under two namespaces:
  `EventBanner` carries `"<username/> has subscribed for <count/> {monthCount,
  plural, ...}"` and the gift and host equivalents, `ChatroomEvents` carries
  `"<user/> has subscribed! They have been subscribed for a total of
  <months/>"`. They are ICU strings with plurals and substitution tags, which
  means they render in the viewer's interface language rather than the
  channel's. Running the real strings through the pipeline settles the damage:
  an English notice is detected `en`, so it equals an English target and is not
  translated, and against any other target `ignoreEnglish` drops it; a French
  notice is detected `fr` and equals a French target. Both common
  configurations neutralise the notice with no rule at all. The residue is a
  Spanish notice detected Portuguese and therefore translated, which is the
  short-text detection weakness already measured elsewhere, not a category of
  its own. Two corrections on the way there: a first reading claimed
  `kick.com/locales/en.json` was a 349 KB lexicon, when it returns the SPA
  shell and the keys found in it were the page's own inlined payload; and a
  search for hard-coded notice sentences in the 66 chunks found none, which was
  the clue that they are localised rather than the absence of evidence it first
  looked like. What stays open is narrow: whether these rows carry `data-index`
  at all. `EventBanner` reads like a banner outside the message list and
  `ChatroomEvents` like a row inside it. Only a real DOM settles it, and given
  the measurement above the answer changes little.

- [x] **The short-text residue has its damage measured, and two repairs were
  measured and thrown away.** 51 short chat lines in 14 languages through the
  real detection: 28 right, 10 silent, 13 confidently wrong. The wrong answers
  are the interesting half, because `prepare()` kills a line on `detectLanguage`
  alone through `isSameLanguageAsTarget`, which does not require the wrong
  answer to be English, only that it equals the reader's target. Over the 663
  (message, target) pairs that need a translation, 11 are silently skipped as
  "already in your language", 1.7 percent, and 11 of the 51 messages are lost at
  at least one target. All 11 are on non-English targets, fr 4, pt 3, de 2, es 1,
  id 1, so this is a second silent-loss path beside the one `ignoreEnglish`
  owns. **Repair A, only a table answer may skip a line**: takes the 11 losses to
  0 and adds 37 provider calls over the same pairs, and only 2 of the 51 messages
  have a table answer at all, so in the configuration that matters (a Spanish
  reader on a Spanish stream) it sends every line to an endpoint that soft-bans
  per IP. Rejected on the same ground as the coalescing floor. **Repair B, a
  length floor under the guess**: 11 losses at 15 characters, 6 at 20, 3 at 22,
  0 at 30, against 0, 6, 10 then 23 correct skips lost out of 26. No knee, the
  same shape as tinyld's confidence bar. Rejected. What ships instead is the
  table reach below.

- [x] **The short-word table reaches 30 characters, under a veto from franc.**
  `SHORT_TEXT_MAX` was 20 and eight of the thirteen wrong answers sat between 21
  and 26 characters, out of the table's reach. Measured at 20, 25, 30, 35 and 40
  on two benches of the same lengths: 13 foreign lines of 23 to 31 characters
  carrying a table word, 10 read right at 20, 12 at 30, 13 at 35; and 8 English
  chat lines also carrying a table word, 2 wrong at 20, 3 at 30, **8 at 35**.
  Length does not separate the two, it lets them in together, which is the same
  answer repair B gave. What separates them is franc: it answers `eng` on 6 of
  the 8 English lines and on none of the 13 foreign ones, so an explicit `eng`
  now cancels the table's vote. `und` does not cancel it, and that is the point:
  `und` is franc's answer on short text, the one the table exists to replace.
  Net at 30 with the veto: 12 of 13 foreign lines read right, English damage
  stays at 2 of 8, both of which franc was already getting wrong on its own.
  Cost 51 bytes in the shipped bundle and one extra franc call on lines that
  touch the table, 23.5 to 38.9 microseconds per message over seven short lines.
  Two witnesses: putting the constant back to 20 turns three assertions red, and
  deleting the veto makes an English line detect as Spanish and hands `es` to
  the engine as a confident source.

- [ ] **The install rate is 40.5 percent and nothing is tuned against it.**
  Eighty-five installs for two hundred and ten first visits, over eight months.
  Fifty-eight percent of arrivals come from organic search, thirty-one direct,
  six from an AI assistant. The listing that produced that number has never been
  updated past 2.5.0 while the product is at 2.9.2, so the figure is a baseline
  for a page nobody has touched, not a verdict on the current text. Resubmitting
  is the experiment, and it is blocked on kil.

- [x] **The 2.9.2 archive divergence is closed by 2.9.3.** The branch carried
  four user-visible fixes past 2.9.2, so it is packaged as 2.9.3: chromium
  `a9bb7488b0a6e7b5`, firefox `43e2c81d4cc6d8e9`, both byte-reproducible across
  two consecutive runs. The Chrome archive is 271.4 KB against 2.9.2's 287.5 KB,
  and the difference is accounted for: `src/content/inject.css`, 59747 bytes
  uncompressed, is no longer emitted now that nothing exposes it, and the
  stylesheet has always been inlined into the content bundle.

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

- [k] **Emote picker dodge: only the Kick-specific half is still blocked.** The
  mechanism is verified offline now. A synthetic overlay meeting the size gate,
  40 by 40 and sitting directly above the composer, moves the preview from
  625-663 to 403-441, clear of the overlay's top at 447, and disabling
  `findOverlayTopAbove` leaves all 621 unit tests green while turning that gate
  red. What remains, and it genuinely needs kil's own Chrome, is whether Kick's
  real emote picker matches any of the six selectors in `OVERLAY_SELECTORS`:
  Kick serves an `auth-modal` to the Playwright context, so the real picker
  cannot be opened here.

- [k] **Native review of the store text.** 8 languages of 10 on the Chrome side
  and 8 of 10 on AMO were written without a native reader, which the file states
  about itself. ZH and KO are the least certain.

- [k] **Store submissions.** Chrome Web Store and AMO. Packages, listing text,
  dashboard fields and reviewer notes are ready; the accounts are kil's.

- [x] **Two controls were too small to hit, and no gate looked at them.** The
  accessibility audits run on the dumps of the chip menu and the language panel,
  where the bar itself does not appear, and `bar-live` measures the bar's
  placement without measuring its buttons. Measured across ten window widths
  from 340 to 1500 on the shipped build: the pause button was 26 by 18, the
  settings gear 25 by 19, and the retry arrow on every translated line 10 by 15,
  where WCAG 2.5.8 asks 24 by 24. Same defect as the language chip's caret, a 10
  by 6 inside a 45 by 24, which was fixed on kil's report two days ago; these
  had simply never been measured. All three are 24 tall now, the bar stays 37px
  and `chat-live` still passes on density, so nothing moved: negative block
  margins give the added height back to the line. `bar-widths` is a gate, and
  removing the rule turns it red at all ten widths.
- [x] **The rest of the interactive surface is clean, checked rather than
  assumed.** The same sweep over the compose preview, the popup and the options
  page found nothing else. The popup's one-pixel inputs and the options
  checkboxes are deliberate: a real input under a styled control, wrapped in the
  label that is the actual target, both documented in their own components. The
  one short link, `deepl.com/pro#developer` at 126 by 15, sits inside a sentence
  and falls under 2.5.8's inline exception.
- [x] **`package:all` used to leave `dist/` as the Firefox build.** It builds
  Chrome, packs, builds Firefox, packs, and stopped there, so the working
  directory kept the Firefox manifest: a `gecko` block and `background.scripts`
  where Chrome wants a `service_worker`. Chrome starts nothing from it, so no
  content script arrives and the whole interface disappears. Anyone running
  `dist/` as an unpacked extension had a silent extension after a routine
  packaging run, and the symptom said nothing about the cause. This is what
  broke kil's browser after the 2.9.3 packaging. The script ends on
  `npm run build` now, and `extension-load` names the cause before reporting
  the missing content script, so the next occurrence reads as itself. Two
  witnesses: building Firefox makes the gate say which build is in `dist/`, and
  `package:all` leaves a Chrome manifest behind. The shipped archives were never
  affected; both 2.9.3 zips hash the same before and after.
- [x] **The screenshots no longer show anybody.** What was waiting on a decision
  was that the images carried a real broadcaster's channel, their branding and
  real viewers' handles. `store-shots-fixture.mjs` takes the same five on a
  fabricated page with invented handles and a locally answered engine, so
  nothing third-party appears and nothing leaves the machine, while the shipped
  build does the translating in the image. Five PNGs at exactly the 1280x800 the
  Chrome Web Store requires, each checked for its subject before it counts as
  taken. The older live set stays in `scratchpad/harness/store/` and the listing
  says not to submit it.

---

## Done, kept for the record

- [x] **Transliteration is closed: 0 of 5 to 5 of 5.** Russian, Greek and
  Japanese typed on a Latin keyboard keep their language and lose their script,
  so the script pre-check sees nothing and the detector answers for a Latin
  language. Measured before writing a line: `privet kak dela segodnya` was
  Indonesian, `spasibo bolshoe za stream` Czech, `pozhaluysta pomogite mne`
  Italian, `khorosho ochen khorosho` Swedish, and the Greek and Japanese
  sentences were nothing at all. Russian was the worst of the three, a confident
  wrong answer: with a source allowlist it came out `lang_not_allowed`, and with
  Indonesian as target it was not translated at all.
- [x] **32 markers, one rule, and the words deliberately left out.** An entry
  earns a language only if it is unambiguous against common English and against
  the other entries, which is the rule the short-word table already states about
  itself. That is what keeps `kawaii`, `sugoi`, `senpai`, `baka`, `desu` and
  `sensei` out: English internet slang adopted them, and a reader writes them
  without a word of Japanese. Same for Greek `malaka`, and for `net`, `poka` and
  `davai`, too short or too common elsewhere. A test asserts every marker is at
  least five letters so that door stays shut. Measured: 20 transliterated
  sentences marked, 0 false positives on 20 traps.
- [x] **Not a confident answer, for the same reason as arabizi.** Declaring
  `sl=ru` on Latin-script text asks the engine to read Cyrillic where there is
  none. The markers feed ordinary detection, which feeds the filters and the
  badge; the engine keeps guessing. Cost: 617 bytes, +0.26 percent, well inside
  the margin.
## Done, kept for the record

- [x] **franc against tinyld-light: franc keeps the job, and the first verdict I
  published was wrong.** A first duel on 30 messages had tinyld winning
  everything, including the number declared decisive before the experiment:
  non-English messages classified English and therefore dropped in silence by
  `ignoreEnglish`, franc 1 of 30 against tinyld 0. Four more messages were then
  added, taken from the tests the swap had broken, and the decisive number
  reversed: **franc 1 of 34, tinyld 5**. tinyld calls `guten abend`, `tebrikler`
  and `velmi dobre` English. The first corpus was too small to contain the cases
  that decide, which is the whole reason that number was chosen in advance.
- [x] **No threshold design rescues it, and the reason is instructive.** tinyld
  returns a confidence score where franc returns none, so the obvious repair is
  to stay silent below a bar. It makes things worse: below the bar the ASCII
  fallback calls the message English, so a stricter bar anglicises more, 20 of
  34 at 0.15. Applying the bar only to the English verdict takes 5 down to 4 and
  costs English recognition, 9 of 10 down to 5, and the result is flat from 0.2
  to 0.8, meaning tinyld is confidently wrong on those three rather than
  hesitant.
- [x] **What tinyld does win, for the record.** Global accuracy, 18 correct
  against 11, and 4 silences against 9. Coverage is a tie, 25 against 26 on one
  phrase per language across the product's 42, and franc misses Arabic and
  Hebrew entirely. And weight: bundled and minified, 81121 bytes against 174824,
  which is 93703 and forty percent of the injected script. That saving is real
  and it is not available: it costs four readers their message for every one it
  saves. The margin cannot be bought this way.


- [x] **Arabizi is detected, and the damage it did was not what the grid
  assumed.** The grid scored it 0 of 5 for returning no language. Measured
  properly, an absent language costs nothing on the engine path: the `sl` sent
  is `auto` for arabizi and for correctly detected Spanish alike, because
  `confidentLanguage` withholds everything franc guesses. The real harm is in
  the filters. With a source allowlist set, an arabizi message came out
  `lang_unknown`, so an Arabic-reading user who restricts sources to `ar` lost
  exactly the messages they asked for.
- [x] **The arabizi signal, and the trap it had to survive.** Arabizi replaces
  Arabic consonants with digits chosen for their shape: 3 for ع, 5 for خ, 7 for
  ح, 9 for ق. Latin SMS also puts digits in words, but chosen for their sound:
  8 for eight, 4 for four, 2 for two, 1 for one. The two sets overlap only on 2,
  6 and 8, so keeping [3579] keeps the signal and drops the collision. Measured
  on 12 arabizi sentences and 29 traps including team names `c9`, `g2`, `d4`,
  `k9`, `s1mple`: with the wide digit set, 3 false positives; with [3579],
  12 of 12 and none. No proportion threshold is needed, one word is enough.
- [x] **It is deliberately not a confident answer.** `confidentLanguage` feeds
  the `sl` sent to the engine, and declaring `sl=ar` on Latin-script text asks
  the engine to read Arabic where there is no Arabic script, which is not
  measured here. Arabizi therefore sits in ordinary detection, which feeds the
  filters and the badge, and the engine keeps guessing for itself.
- [x] **A first version of these tests could not fail.** They exercised
  `isArabizi` alone, so removing the wiring from `langDetect` broke nothing:
  863 tests stayed green with the repair deleted. The repair has its own test
  now, and deleting the wiring fails it.
- [x] **The weight gate went red, as predicted, and the reference is raised with
  its accounting.** 233217 bytes against 228460, +4757 and +2.08 percent.
  Measured per module, minified and in isolation: the laughter table 3791, the
  smash filter 424, arabizi 227, which is 4442; the remaining ~315 are the
  2.9.3 and 2.9.4 product fixes. The way to buy the margin back is identified
  rather than guessed: franc's data is 98 KB in this file and
  `tinyld.light.browser` is 68 KB under MIT, so 30 KB and thirteen percent of
  the bundle ride on an accuracy experiment that has not been run.
## Done, kept for the record

- [x] **Keyboard smash is filtered, and the earlier claim about it was wrong.**
  Yesterday's note said eleven of fifteen smashes were already dropped through
  the English rule. Measured directly on `detectLanguage`: **zero of eleven** were
  dropped, all eleven reached the engine, and three came back with a language,
  `asdasdasd` Portuguese, `zxcvbnm` Spanish, `hjkhjkhjk` Dutch. The error was
  conflating `franc()` returning `und` with `detectLanguage` returning `'en'`: at
  the `minLength: 3` floor franc returns codes that map to nothing, so detection
  returns undefined and nothing drops the message. `isKeyboardSmash` now catches
  15 of 15 with 0 false positives.
- [x] **The obvious criterion for smash was measured and thrown away.** Absence
  of vowels catches every smash and also `krk`, `prst`, `smrt` and `vlk`, which
  are real Czech words. The criterion kept is the share of adjacent letter pairs
  living on the same keyboard row: against 15 smashes and 33 real words chosen
  as the worst case, Slavic consonant clusters included, 0.6 still leaves two
  false positives and 0.65 upward leaves none. 0.7 with a six-letter floor is
  what shipped, with margin on both sides.
- [x] **Stretched words broke the first version, and are witnesses now.** A held
  letter necessarily lives on one row, so `siiiiiiii` and `NOOOOOO` carried the
  smash signature and were dropped as noise. What separates them is the number
  of distinct letters, or a repeated GROUP rather than a held letter:
  `asdasdasd` is three times "asd", `holaaaaa` is "hola" plus a held a. Thirteen
  stretched words are in the test battery for that reason.
- [x] **The seven impurity categories have their damage measured**, on 41 cases
  through the real pipeline order: 23 behave as intended, up from 19 before this
  pass. Platform text 3/8, identity 3/5, input artefacts 5/7, code-switching
  1/3, transliteration **0/5**, no-language 5/6, gaming slang 6/7. Frequency is
  a separate number and it needs a corpus that does not exist here.

## Done, kept for the record

- [x] **Written laughter has a dictionary, by language, with its sources.** It
  was handled in two unrelated places grown by hand: an alternation of about ten
  forms inside `isNoise`, and two French entries in the short-word table. Nothing
  reusable exists to import, which was checked rather than assumed: the academic
  work on social-media normalisation treats laughter as a category and publishes
  no lexicon, the popular write-ups are prose, and the one machine-readable list
  on GitHub carries no licence at all. `src/shared/laughter.ts` records 43 forms
  drawn from three cross-checked sources, each with a note saying where it is
  attested, and 22 of them mark a language.
- [x] **A laugh is a fact about the text, so it feeds the confident path.**
  `confidentLanguage` returns only what was looked up in a table, never what
  franc guessed, and that value is what goes to the engine as the source
  language. Laughter now votes in the same token lookup as the chat-word table,
  under the same conflict rule. Measured on ten mixed messages of the shape
  "jajaja que bueno eso": 3 of 10 had a usable source language before, 10 of 10
  after, and two of the three franc had guessed were wrong, calling that Spanish
  line Portuguese and a Portuguese one French. Forms used everywhere, `haha`,
  `lol`, `xd`, mark nothing, because a wrong answer here is handed to an engine.
  It costs 3555 bytes on every page, 1.55 percent, inside the weight gate's 2
  percent margin and close enough to it that the next addition trips the gate.
- [x] **The `minLength: 3` floor under franc stays, and the measurement says
  why.** It looks like a mistake against franc's own documented unreliability,
  and removing it makes things worse. Measured on 30 short non-English chat
  messages: at the shipped floor of 3, franc is wrong more often than right, 7
  right against 14 wrong, but only 1 of 30 messages ends up classified English.
  At franc's default floor of 10 the wrong answers halve, to 8, and 11 of 30 are
  classified English instead, because a floor raises how often franc says `und`
  and `und` on ASCII becomes English, which `ignoreEnglish` then drops in
  silence. Franc's wrong identities are already withheld from the engine by
  `confidentLanguage`; its silence is not. The low floor is protecting foreign
  chat, not undermining it.
- [x] **Keyboard smash is mostly already handled, by accident.** Fifteen forms
  attested in the sources, Turkish `askfhsjkd` among them: eleven return `und`
  from franc and are dropped through the English rule, and four get a confident
  wrong language, `asdasdasd` as Portuguese, `zxcvbnm` as Spanish. The first
  measurement said fifteen of fifteen reach the engine, which was wrong: it
  checked `isNoise` and `isSlangOnly` and left out the drop that actually
  catches them. What remains is four wasted calls and four wrong badges, which
  is small enough not to justify a detector of its own yet.
- [x] **A batch inherited one message's source language and declared it for all
  the others.** The coalescer groups by TARGET language and nothing else, so a
  batch mixes sources, and `batchCall` built its joined request as
  `{ ...reqs[0], text: joined }`. Measured on a multilingual corpus: a request
  went out with `sl=ja` carrying a Japanese line and an Arabic one. `call` only
  sends `sl` when the language was looked up rather than guessed, precisely
  because a wrong `sl` makes the engine translate from the wrong language and
  return either the original or something else; taking the first message's hint
  for all the rest is that same fault by another route. When the hints disagree
  the request now declares none, which is what an unknown language already
  sends. Witness: the test fails with `expected [ 'ja' ] to deeply equal
  [ 'auto' ]`, and a second keeps a single-language batch declaring `es`, so
  never declaring anything would not pass either.
- [x] **Two of the 42 offered languages were never identified.** Malay: franc
  emits `zlm` and the table knew only `msa` and `zsm`. Hebrew: franc-min does
  not cover it at all, returning `und`, and the Unicode pre-check had ranges for
  Arabic, Cyrillic, Thai, Devanagari, Hangul and kana but not Hebrew, though the
  store listing sells right-to-left support as "Arabic, Hebrew, Persian". What
  it cost is smaller than it first looked, and the measurement says so: an
  unidentified language is not dropped, it goes out with `sl=auto`, so those
  messages were translated all along. What changes is that the engine is told
  the right source and the reader sees the right source badge. Three tests, one
  of them the boundary between the Hebrew and Arabic blocks.
- [x] **Where the injected bundle's bytes go, measured in the shipped file.**
  `content.js` is 228896 bytes and franc's trigram data is 100394 of them,
  43.9 percent, across 65 blocks; the inlined stylesheet is 30474, 13.3 percent.
  A first reading claimed 48.8 percent from an esbuild metafile whose
  `bytesInOutput` disagreed with the source file by more than a factor of two;
  the artefact settles it. Of the 61 languages franc-min can return, 21 map to
  something the product translates and 40 do not, carrying about 61 KB. Trimming
  them is not free and is not done: dropping a language franc would have chosen
  makes it choose another, and a mapped wrong answer is worse than an unmapped
  right one. Measuring detection quality before and after is the experiment that
  would settle it.
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
- [x] **The archive itself is exercised, not just `dist/`.** `KT_EXT` points the
  harnesses at an unpacked package, and all eleven translate modes plus
  `extension-load` pass against the 2.9.3 Chrome zip. Nobody had ever run a gate
  against the thing that would actually be submitted.
- [x] **Store screenshots at the size the store accepts.** The five fixture
  images were coming out 2560x1600, because this harness had drifted to
  `deviceScaleFactor: 2` while the live one carried a comment saying to keep it
  at 1. The Chrome Web Store takes exactly 1280x800 or 640x400 and rejects the
  rest, so the submission would have bounced with nothing here to say why. The
  harness asserts the dimensions now, read out of the PNG header.
- [x] **Every shipped permission is checked against its justification.** The
  listing gate reads `dist/manifest.json` and requires each of the ten entries,
  two permissions and eight hosts, to appear in the Chrome dashboard section.
  Adding a permission and forgetting to justify it is a rejection reason that
  otherwise surfaces a week later. Witness: two invented entries produce two
  named failures. And the metadata section pointed submitters at
  `scratchpad/harness/store/`, the older set taken on a live channel; it names
  `store-fixture/` now and says not to submit the other one.
- [x] **The listing is at 2.9.3 in all eleven languages**, each with a paragraph
  on what changed: whole messages again, a recycled row translated, no file
  published to the page. `audit_fiche.py` is a gate and counts 44 fields against
  their limits in UTF-16 code units, which is what the web forms count, plus the
  ten shipped `description` values read from `public/_locales` rather than from
  the prose. Its first version accused a healthy field, counting the explanatory
  text around the manifest value and reporting 376 characters for a value of 90.
- [x] **Words were being deleted from messages before translation.** The
  inline emote-name stripper carried two rules that hit ordinary language.
  `ez` in the suffix list deleted every Turkish negative aorist, a productive
  grammatical form: `etmez`, `istemez`, `gitmez`, `gerekmez`, `gondermez`, plus
  Spanish `vez`, Czech `bez`, `kez`. Turkish is the second most read of the
  localised listings. And a rule deleting any all-lowercase word of thirteen
  characters or more took `completamente`, `almacenamiento`, `armazenamento`,
  `justifications`, `communications`, `certifications`, `creditworthiness`,
  `conditionally`. Measured over 11583 words of the store listings: 30 distinct
  ordinary words destroyed, and the reader saw a translation of a sentence
  nobody wrote, with nothing to show a word had gone. After: 13, all of them
  brand names caught by the mixed-case rule that earns its place, and emote
  coverage unchanged at 10 of 13 sampled names. The long-word rule now needs a
  digit; the suffix list lost `ez` and `gg`, which costs no emote since OMEGALUL
  is still caught by `lul`. Eight regression tests, seven of which fail against
  the old rules while the ten existing parser tests passed either way.
- [x] **The extension's own box model no longer comes from the host page.** One
  `box-sizing` declaration existed in the whole stylesheet, on a fixed-position
  element; everything else inherited Kick's Tailwind reset. Measured on a page
  without that reset, the language list ran 416px of content in a 398px frame,
  18px over, which is exactly twice the `padding-inline: 9px` of a row set to
  `inline-size: 100%`. The third column left the frame and a horizontal
  scrollbar appeared, and the ellipsis the row CSS already had could not apply.
  With the rule the same page measures 390 for 390 and the panel is 408 wide as
  designed rather than 416. A project that asserts pixels cannot leave its box
  model to somebody else's stylesheet. `bar-panel-live` asserts the overflow now,
  on a stage that deliberately sets no reset. Note on the witness: removing the
  rule does make that harness exit 1, but at a click that moves out of reach
  before the assertion is read, so the honest evidence is the direct
  measurement, 416/398 before and 390/390 after.
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
