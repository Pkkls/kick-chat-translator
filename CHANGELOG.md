# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [2.8.0] - 2026-08-27

### Added

- A fourth display style. "Replace" had been a fourth value in the settings
  schema that no control could select, and the style it named rendered the same
  9 messages at the same row height as "Inline" while leaving the original
  standing beside it. It replaces the message now: 12 messages where inline
  shows 9, and it no longer follows the "keep original" switch, because
  replacing and keeping are the same request twice.

- A caret on the language button. The list opened on press-and-hold or the Down
  arrow, which nothing on screen suggested. A click on the code still toggles
  the language; a click on the caret opens the list.

- A filter above the source-language allowlist in Options → Filters. It listed
  all 42 languages inside a 260px scroll box, which is the same "walk the list"
  problem the chip's menu had and takes the same answer: type two letters.
  Matching covers the ISO code as well as the name, since the names render in
  the interface language.

- **A language button inside Kick's message box.** Switching the language you
  write in used to mean travelling to the bar at the top of the chat and back;
  the chip sits next to the emote button instead, so the pointer never leaves
  the text field. One click toggles between the channel's language and your
  last pick, press-and-hold (or the Down arrow) opens the list.
- Favourites, seeded by use rather than configured. The list starts empty, the
  first language picked becomes the first favourite, and it stops reordering
  once you have one, and a list that shuffles between two clicks makes you miss
  the click.
- **Every** language menu now renders in the interface language, and sorts for
  it: the popup, both menus on the Options page, the source-language allowlist,
  and the bar at the top of the chat. Only the new chip had been fixed at
  first, which left the very menu the bug was reported against untouched. The
  list also keys on the extension's own UI setting rather than the browser's
  language, so choosing Japanese in the extension is enough.
- The language list now renders in the interface language. It used to be
  English whatever the extension was set to, so a Japanese user configuring a
  fully translated extension still met a list they could not read.
  `Intl.DisplayNames` supplies the names, which is 0 strings to maintain
  instead of 42 languages x 11 locales.
- Sorting now uses the interface locale's collation. A plain sort puts
  Čeština after Zulu; measured, ja/tr/cs all disagree with it.
- A filter box at the top of the list. 42 languages fit in no list at screen
  height, so the list was never meant to be walked: type two letters and press
  Enter. Matching folds accents and also covers the ISO code, because someone
  reading a Japanese interface sees フランス語 but types "fr".
- `Show the language button in the message box` in Options → Display.

### Changed

- The chat, the bar and the language menus follow the interface language you
  chose, not the browser's. 39 strings that were English whatever the extension
  was set to now come from the catalogue, and the shipped locale files went
  from 3 languages to 10.

- Controls in the popup carry a visible boundary and a focus ring. The select,
  the text field and the outline buttons drew their edge at 1.18:1, which WCAG
  holds to 3:1, and `outline: none` had removed the only focus indicator the
  browser gave them.

- Explanatory text on the Options page wraps at a readable width. It ran 105 to
  114 characters a line, in 11px type, because the page is wide for the sake of
  the controls rather than the sentences.

- The bar at the top of the chat says **Translating** instead of
  "Translating → EN". Measured on a live channel: that label took 133px of a
  420px bar (a third of it), and the "→ EN" half repeated the language menu
  sitting immediately beside it. The resolved language moved to the tooltip.
- The provider name is no longer printed in the bar. It held 39px permanently
  to name a service the reader has no decision to make about while it works;
  which engine answered matters when one stops answering, and the Options page
  reports that. It is in the state pill's tooltip now.

- The popup fits without scrolling again. Measured with realistic settings it
  stood at 669px against a 600px target; it is now 594px. The 7-day cache graph
  (36px) and the per-language pills (23px) moved to Options → Debug, and the
  help line under "translate what I type" went altogether, since it explained a
  behaviour nobody configures, and the Options page already carries it.
  Nothing was resized to get there: two blocks left and one moved.
  Verified by rendering the built popup in all ten interface languages. Spanish
  was the one that still overflowed, at 606px, because "mantener original" and
  "insignia de idioma" each wrapped to a second line; both are shortened, and
  the nine others were already fine, and measuring only English would have shipped
  the bug.

- With "keep original text visible" off, the translation now behaves as the
  message rather than as an annotation of it: inline, full size, full contrast,
  no tint and no rule. Measured on a 24-message chat in a fixed window, this
  went from 8 messages on screen to 14, with a row dropping from 40.0px to 18.2px.
  The previous styling kept the translation on its own line even with nothing
  above it, so hiding the original made rows *taller* (41.7px against 39.98px)
  while claiming to save room.

### Fixed

- **The injected interface followed the desktop's light/dark setting instead of
  Kick's.** A light desktop reading Kick's dark chat was handed the light
  palette on a dark ground: the translation measured 1.01:1 against what it sat
  on, which is invisible. It reads the chat's own background now, and follows
  Kick's theme switch without a reload. Measured after the fix: 10.98:1.

- **The language list could open off the top of the screen.** It only clamped
  itself when an ancestor clipped it, and otherwise let CSS place it, which
  knows nothing about the window: at 420x520 its top landed 132px above the
  edge, with a third of the list unreachable. Rows also came out uneven, because
  the two codes carrying a region, `pt-br` and `zh-tw`, wrapped onto a second
  line. All 43 rows are one height now.

- **Picking a language dropped keyboard focus on the page body.** Escape had
  always returned it to the button; choosing with Enter did not, so a keyboard
  user who had just set their language had to tab in from the top of the page.

- **A failed translation took a row of its own**, and it never fails alone:
  when a provider is down every line in the chat grew one, and the chat went
  from 13 messages on screen to 8. The message sits on its line now.

- **The retry control answered only to a mouse.** It was not in the tab order,
  never reached in six tab presses, and on a touch device it stayed invisible
  forever because it was revealed by hover. It takes Enter and Space now, shows
  itself on focus, and is visible at rest wherever hovering is impossible.

- **One unbreakable token pushed the whole chat sideways.** A spam run, a long
  URL or a wall of CJK took the translation to 530px inside a 356px column and
  scrolled the page by up to 186px. Only the "Below" style had ever carried a
  break rule.

- **The chat did not mirror for right-to-left reading.** The green rule sat at
  the end of the line instead of the start, and the language badge ran into the
  message. So did the popup and the Options page, where the switch, its knob,
  the debug table and the language grid were all positioned physically. Arabic
  is a shipped interface language.

- **The "On hover" style put a label under every message**, whether or not you
  ever hovered it: rows went from 31.4px to 50.6px and the chat lost a third of
  what it could show. The marker costs nothing now, measured against an
  untouched row.

- **Hiding the original ate the emotes.** Nine of twelve cases lost their emote
  boxes along with the text they sat in.

- The Options page scrolled sideways in a narrow window. The tab bar wanted
  491px against 366px available, so two tabs were only reachable by scrolling
  the page itself.

- The tab bar had no ARIA at all: six buttons, none announced as a tab, none
  saying which section was showing, five tab presses to cross it and arrow keys
  that did nothing. It is one tab stop now, with the arrows, Home and End.

- Five controls had no accessible name and two switches shared one. Four
  textareas on the Filters tab had a visible label sitting right above them
  with nothing connecting the two, and both popup switches were called
  "enable".

- Nine strings rendered in English in all nine translated interfaces, including
  the tab bar's own accessible name.

- Animation kept running for people who asked their system to stop it. The
  policy named the language button and nothing else, leaving the toast, the
  compose panel's loading pulse, the retry reveal and the floating bar moving.

- The language menu's edge measured 1.87:1 against its own fill, and its fill
  measures 1.13:1 against Kick's chat, so nothing separated the two.

- The compose panel drew a shadow Kick never uses, and its border measured
  1.46:1. Icon-only buttons and the About links fell under the 24px minimum
  target size.

- Four pieces of chat text were below AA and had never been measured. Worst
  first: the **error message** sat at 3.19:1, unreadable at the one moment it
  exists for, and the **hover-mode placeholder**, the only thing on screen
  saying a translation is available, sat at 2.17:1, the least readable text in
  the extension. The provider badge and the loading marker were both 3.78:1.
  Now 5.53, 5.52, 6.26 and 6.26.

- **The chip landed under the message box instead of inside it.** Found by
  loading the extension on a live channel rather than in a harness. The row
  holding the shield, the field and the emote button measures 380x77 while the
  field is 293x46, so judging the row by "not much taller than the field"
  rejected it by 7px and the chip fell through to the field's own wrapper, 49px
  too low. A row is now recognised by its children sitting side by side, which
  does not depend on Kick's spacing. The chip also inserts beside the emote
  button rather than after it.
- **The language list ran off the chat column and over the video player**, and
  off the top of short windows. Its placement clamped only the right edge and
  assumed 320px of height the window may not have. Every edge is clamped now,
  and the height is what actually fits on the side it opens towards.

- **The whole Options page and popup failed AA on secondary text.** The `muted`
  token was `#6b7888`, which measures 4.30:1 on the page ground, 3.96 on a card
  and 3.18 on an active green card, which is most of the explanatory text in the
  extension. It is now Kick's own `#9FA6AD`: 7.87 / 7.24 / 7.52 / 5.82 on those
  same grounds. One token, 180 failures across the six tabs.
- Every select and numeric field on the Options page and in the popup now has an
  accessible name. They had a visible `<label>` beside them but nothing tying
  the two together, so a screen reader announced "combo box" with no clue which
  setting it belonged to. axe rated this critical on four of the six tabs.
- The language codes of unavailable on-device models were drawn at 50% opacity
  (2.76:1). WCAG allows that for a disabled control, but the label *is* the
  information: it names which pair has no model. Now 75%, which keeps AA.

- The "Replace" display style rendered its text at 0.8em, about 10.4px.
  Measured against the other styles it bought nothing for that: the same 7
  messages on screen as Inline, the same opacity, just smaller. It now shares
  Inline's 0.85em.
- The language select in the bar at the top of the chat now uses the same
  surface, stroke and text as the chip in the message box, one control in two
  places rather than two unrelated widgets. Its border was
  `rgba(255,255,255,.15)`, which flattens to 1.62:1 against the bar when WCAG
  1.4.11 asks 3:1 of a control's boundary. `#5F5F60` measures 3.04 there and
  3.08 on the chat ground, so a single value now covers both surfaces.
- Same fault in the light theme, where the bar's controls were outlined in
  `rgba(0,0,0,.15)`, 1.42:1. `#8D8D8E` gives 3.11 on the bar, 3.02 on the chip
  surface and 3.32 on white.

- The waiting state used to fade its label in and out, which dropped the text
  to 2.22:1 against its own background. The pulse moved to the border, which
  is held to 3:1 rather than 4.5:1, so the label keeps its full contrast.
- Selected-row text in the light theme measured 4.20:1 against the green
  highlight, below AA. Found by rendering the component rather than by
  reading the stylesheet.
- The popup wrapped its filter field in a `listbox`, which may only contain
  options, a critical ARIA violation. It is now a combobox owning a separate
  listbox.

## [2.7.0] - 2026-08-16

### Fixed
- **Changing the reading language now changes what is already on screen.** Picking a new language
  from the bar only affected messages that arrived afterwards; everything already visible kept the
  previous language until you reloaded the page. The mark that stops a line being handled twice was
  built from the row, the name and the text, and never from the language, so an already-translated
  line still matched its own mark and was skipped. The same held for the display style and the two
  badges. All four now redraw the lines on screen, and only a language change costs a request; a
  style or badge change is redrawn from memory.
- **A message the translation services gave up on is no longer sent back to them over and over.**
  The extension re-checks the visible chat when you come back to the tab and when you stop
  scrolling, to catch anything it missed. That check only recognised lines that had been
  translated, so a line carrying a failure marker looked untouched and was sent again on every
  scroll pause, for the whole minute or five that a service stays in cooldown. On a full chat panel
  that is around thirty needless calls each time you stop scrolling, which is exactly the quota you
  have least of when a service is already struggling. Such a line now keeps its marker and its
  retry button, and goes back out only when you click it.
- **A stretched message is no longer left untranslated.** Chat writes "muuuuy biennnn" and
  "BINNNNNNNGOOOOOOO", and the translation services hand those straight back unchanged. When that
  happens the line is now tried once more on its flattened text, which returns "très bien" and
  "BINGO". Only after a refusal, never before: the services already handle some stretching well,
  and flattening everything up front made those cases worse. Japanese words that legitimately carry
  a long vowel, like コーヒー or ラーメン, are left exactly as written.
- **The compose preview no longer tells the service what language you wrote in unless it is sure.**
  It was passing a guess, and on short text that guess is wrong about two thirds of the time, which
  makes the service translate from a language your message is not in: the preview then shows either
  your own text back or something you did not say. It now says nothing when it does not know, and
  the service works it out itself, which it does well.
- **The extension no longer stays silent on a page when the browser was slow to wake it.** Its
  background worker is shut down when idle, and the first request after that wakes it. If that
  request lost the race, the page ended up with no translation at all and nothing said so. It now
  waits and asks again before giving up.

### Changed
- **Your DeepL key stays on the machine you typed it on.** It was stored with the rest of the
  settings, which sync across every Chrome signed into the same account, so a key entered on one
  computer arrived on all the others, work and shared profiles included. It now lives in local
  storage. An existing key is moved across automatically the first time this version runs, and
  nothing is asked of you.
- **The extension is 15% lighter on every Kick page.** The content script carried a settings
  validation library, 13.7 KB compressed, to re-check data the extension had written itself. It now
  asks the background worker, which already held it. 81.3 KB down to 69.0 KB compressed.
- **The store listing is served in the reader's own language.** The name and the short description
  are what store search matches on, and they were English only. They are now published in Turkish
  and Arabic as well, which together account for a fifth of everyone who reaches the listing.

## [2.6.0] - 2026-08-14

### Added
- **The chat bar can now be used, not just read.** It carries a reading language picker and a
  pause button, the two settings people touch most and the only ones that used to force a whole
  options page open. Pause and resume were already there, as a click anywhere on the bar, which
  nothing announced; that still works and now has a button that says so.
- **A Debug tab in the options page, showing the last 50 calls the extension made.** Press "Read
  decisions" and it asks an open Kick tab what it recently translated and what it left alone, with
  the reason for each. The list lives in that tab's memory only, is never written to storage, and
  disappears when the page does. If no Kick tab is open, or the open one has not loaded the
  extension yet, it says so instead of failing. Until now the debug setting only wrote to the
  browser console, where nobody was going to look.
- **A line that was not translated now says why.** Hover it and its tooltip gives the reason, for
  example "Not translated: it is already in your language", "it is only emoji, symbols or laughter",
  "it is shorter than your 2 character minimum" or "this user is on your blocked list". Every reason
  the extension can skip a message for is covered, including the ones that used to give up without a
  word once a translation had already come back. Nothing about which messages get translated
  changes, only whether you can find out why. The reason is dropped as soon as a row is reused for
  another message, so it never explains the wrong line.
- **Export / import your settings** from the Advanced tab. Export writes a JSON backup, import
  restores it and reloads the page. A backup from an older build still imports: missing fields
  fall back to their defaults and unknown ones are dropped, so the file never breaks storage.
- **Minimum message length is now a setting** (Filters tab). The floor below which a message is
  left untranslated used to be fixed at 2 characters; raise it to spend less provider quota on a
  busy chat. Existing installs keep the old value, so nothing changes until you move it.
- **Common chat words are now recognised directly.** Below about 20 characters the statistical
  language detector often gives up or answers confidently wrong ("ok merci" came back as
  Hungarian, and that wrong code was passed to the translation service as the source language).
  A short list of everyday words in Spanish, French, Portuguese, German, Italian and Turkish is
  now checked first, and words that disagree with each other leave the message unlabelled rather
  than guessing. This covers the words on that list; it is not a general accuracy improvement.
- **Cache hit rate trend in the popup.** Usage stats now retain the last 7 days instead of being
  wiped at midnight, and the popup draws them as a small bar chart under the counters. Days with
  no traffic are skipped rather than drawn as 0%. The trend appears once two days have been
  recorded, so it stays empty on a fresh install until history builds up.

### Removed
- **The WebSocket path to Kick's chat relay is gone, and with it the Connection mode setting.** It
  opened a socket to a host the extension never declared, using an application key hard-coded years
  ago that the relay has been rejecting with "App key not in this cluster" for as long as it was
  measured. It only ever warmed the cache; every translation you saw came from reading the page.
  Nothing you can see changes, the setting that chose between the two paths is removed because only
  one path was ever real, and the extension no longer contacts a host it did not declare.

### Changed
- **A busy channel that hits its own rate cap now says so once, not once per message.** The cap is
  a fact about the channel, so painting a red marker on every message over it repeated the same
  sentence dozens of times a minute and buried the failures that were really about a line. The
  floating bar shows the throttle instead and those lines stay bare. Every other failure reason
  keeps its own marker with its retry button.
- **Very long non-Latin messages no longer stall on Lingva.** Lingva receives the message inside
  the URL, where non-Latin text expands to roughly nine times its size, so a long Japanese or
  Chinese line could produce a request too large for some servers to accept. Those messages now go
  straight to the next translation service instead. Lingva keeps its place in the chain for
  everything else.
- **The cache now warms the languages you actually use.** On startup the worker pulled the first
  200 stored translations into memory, but stored keys are ordered by target language, so it
  loaded whichever language happened to sort first and often skipped yours entirely. It now warms
  the language you read first, then the ones seen most in chat, so repeated lines are answered
  from memory right away instead of going back to storage.
- The ASCII check in language detection now uses `\p{ASCII}` instead of a literal control-character
  range. Same behaviour, but the source file no longer contains a NUL byte, so Git treats it as text
  and changes to it show up as readable diffs.

### Added
- **The glossary is editable at last.** It has always been in the settings and the translator has
  always applied it, but the only way to put anything in it was to hand-edit an exported file. It
  now has its own box on the Filters tab, with the expected format shown in the empty box.
- **The empty channel and user lists now show what goes in them.** They were blank boxes with no
  hint of one-entry-per-line, and two of them used real streamer names as examples. The examples
  are now neutral placeholders.
- **The Connection and Cache groups in Advanced now say what they are for.** Two of the four groups
  on that tab opened straight onto number fields with no explanation of what they affect. Each now
  carries a one-line description under its heading, like the other two already did. No setting was
  added, removed or renamed.
- **The Display tab now shows what each style looks like.** Picking between Below, Inline, Replace
  and Hover used to be a guess from four short descriptions. A sample chat line now sits under the
  four cards and re-renders in whichever style is selected, using the same code and the same
  stylesheet that draw a real translation, so it cannot drift from what you will actually see. It
  also follows the source-language badge, the provider badge and the keep-original toggles.

### Added
- **The interface is available in Korean.** Korean chat is the one this extension reads most
  reliably, every line of the saved sample identified from its writing system alone, and it was the
  last language with that kind of presence and no settings to read in it. All 140 strings are
  covered, none left in English.
- **The interface is available in Turkish.** Turkey is one of this extension's largest audiences,
  and Turkish was one of the two languages worst hit by the bug that refused every language written
  in the Latin alphabet. Reading the settings in Turkish should not have come last. All 140 strings
  are covered.
- **The interface is available in Spanish.** It was already one of the languages the extension
  translates into and one of the languages its README is written in, but not one you could read the
  settings in. All 140 strings are covered, so nothing falls back to English.

### Fixed
- **The language menus are readable again, in the chat bar and in the settings page.** Opening one
  gave a white panel where only the row under the pointer could be read. The browser paints that
  list from the control's own colours rather than from the page, so a control left transparent left
  the list white while the option text stayed near white. The colours are now named on the options
  themselves, and the picker in the chat bar is opaque. The language picker in the settings header
  was missed the first time round because it carries its own classes and never had the shared one.
- **The chat bar can no longer end up showing stale state.** Kick leaves a second copy of the chat
  panel in the page carrying the same id, and it comes first. Mounting the bar was already taught to
  ignore that copy, but everything that updated the bar afterwards, the label, the counter, the
  throttle indicator and the on device chip, still searched the whole page and would have found the
  dead copy first. They all go through the same lookup as the mount now. Removing the bar stays
  page wide on purpose, so it can never strand a copy behind.
- **The Debug tab no longer gives two different answers for what looks like one case.** Three
  separate checks can end a message with "already readable", and two of them were phrased
  identically, so the list showed two verdicts and no way to tell them apart. Each now says who
  decided and when: one names the setting that skipped it, one says it was already in your language,
  and the third says the translation service reported that only after being asked. Messages in the
  list are also cut at the column edge with an ellipsis instead of through the middle of a word, and
  the whole message is on the hover.
- **The settings button is back inside the chat bar.** Adding the language menu and the pause button
  pushed it out of the frame on a normal Kick chat panel, and it is the only way to reach the
  options page from Kick, so it left no way back in. The bar now gives up room in a fixed order:
  the status text shortens with an ellipsis first, then the language menu narrows. The settings
  button and the pause button never shrink.
- **Dropdown menus are readable again.** Opening the language menu on the chat bar showed a white
  panel where only the line under the pointer could be read, and the menus in the options page and
  the popup showed pale grey text on white. The list a menu opens is drawn by the browser, and with
  no colour scheme declared it drew itself light while our text stayed light. Each menu now declares
  one. On the chat bar it follows the light or dark theme rather than being fixed, so it stays
  readable either way.
- **The bar at the top of chat kept disappearing, and the extension never noticed.** Kick can leave
  a second copy of the chat panel in the page, carrying the same id, hidden inside a placeholder its
  renderer never removed. That copy comes first, so the bar was mounted into it and was invisible
  from the start, while the panel you were actually reading had no bar. Measured live on one
  channel: two panels present, the visible one holding 30 messages and no bar, the hidden one
  holding no messages and the bar. Worse, the check for "is the bar already there" asked the whole
  page rather than the panel on screen, found the buried one and concluded all was well, so it was
  never put back. The bar is now mounted into the panel that actually holds the chat, any copy
  stranded elsewhere is cleared, and the check asks the visible panel.
- **Nothing written in the Latin alphabet was translated when your language was English.** The
  service worker refused to send a message to any engine when the target was English and the text
  was more than 85% basic Latin characters, on the assumption that it was already English. An ASCII
  ratio cannot tell English from Spanish, Turkish, Finnish, French or Portuguese, so it turned away
  every one of them, while Japanese, Korean, Russian and Arabic went through untouched because of
  their writing system. That is why a mixed chat looked like only the Japanese was being translated.
  Measured on saved chat with an English target, the check dropped 66 of the 76 Spanish lines and 40
  of the 51 Turkish lines that reached the worker, against 0 of 43 Korean. It is gone. Deciding what
  is already in your language is left to the detector that honours your ignoreEnglish setting, which
  runs before the worker is called at all.
- **Spanish and Turkish messages often came back wrong, or not at all, while Japanese was fine.**
  The extension told the translation engine which language a message was in, including when that
  language had only been guessed at by the statistical detector. Measured on saved chat with an
  English target, the guess was wrong for 21 of the 76 Spanish lines and 11 of the 51 Turkish lines
  that reached the engine, against 0 of 43 Korean ones, which is why languages written in their own
  script looked fine. Forcing a wrong source language made Google hand back the original text for 4
  of the 11 Turkish lines checked, and those lines were then dropped without a word; most of the
  rest came back saying something other than what was written. The source language is now sent only
  when it was read off the text, by chat-word lookup or writing system, and left out otherwise so
  the engine detects it itself. Wrong source languages went from 21 to 0 on the Spanish sample and
  11 to 0 on the Turkish one. English is still left untranslated when you asked for that.
- **Korean written with bare letters was not recognised as Korean.** Chat writes laughter and short
  replies as standalone jamo (ㅋㅋ, ㅠㅠ, ㅇㅇ), which sit in a different part of Unicode from
  syllables. Only syllables were counted, so those letters padded the total without counting as
  Korean and a short line like "시발 ㅋㅋ" fell below the majority needed to call it Korean. They
  now count. On the saved Korean sample this restores 43 lines out of 43 to a language read
  straight off the writing system.
- **A line the translation services gave up on can now be retried.** It used to lose its translation
  and, with it, the retry button that lived inside, so it looked exactly like a line that was never
  meant to be translated and there was nothing left to click. Such a line now keeps a small marker
  naming the reason, with the retry button on it. A retry that fails again keeps the button instead
  of deleting it. Lines skipped on purpose, by the glossary, by the same language check or by the
  identical text check, stay silent as before.
- **Hiding the original now works when a chat emote extension is running.** With "Keep original
  text visible" turned off, the original stayed on screen for anyone using 7TV. That extension hides
  the text Kick writes and renders its own copy next to it, and only Kick's copy was being hidden,
  so the setting did nothing at all. Both are hidden now, emotes included.
- **Hiding the original now works on replies too.** With "Keep original text visible" turned off, a
  reply kept showing its original text while every other line hid it. Kick nests the message of a
  reply one level deeper than a plain line, and the rule only reached text sitting directly beside
  the translation. It now keys on the element holding the translation, which reaches both shapes.
  The quoted message a reply points at stays readable, as it should.
- **"Keep original text visible" now does something.** The switch was offered in both the options
  page and the popup and was saved correctly, but no part of the extension ever read it, so turning
  it off left the chat exactly as it was. Turning it off now hides Kick's own text on the lines that
  carry a translation, and only on those lines: a line that was never translated, or one the chat's
  virtual scrolling reused, keeps its text.
- **The Replace display style paid for the same translation over and over.** Three checks asking
  "has this line already been translated?" listed the Below and Inline classes but not the separate
  class Replace uses, so on that style every translated line still read as untranslated. Coming
  back to the tab, and every pause after scrolling, re-submitted every visible line to a translation
  service. The same blind spot let the recycled-row rescue overwrite a line's translation with a
  different message's. All three now share one selector built from the display styles themselves.
- **The Replace display style described itself wrongly.** Its card in the options page said the
  translation appears below the message. It appears on the same line, right after it, in smaller
  italics. Corrected in English and in all six translated interfaces.
- **The Replace display style was unreadable.** Its translation had no green tint, no copy cursor
  and a re-translate button that could never be revealed, because those three CSS rules named
  `.kt-translation` and `.kt-translation-inline` but not the separate `.kt-translation-compact`
  class that Replace actually uses. It now carries the same cue as the other styles, keeping its
  smaller italic text, and it reads correctly on a light OS theme too. Inline gains the green
  left edge that Below already had; Below and Hover are unchanged.
- **The extension could bind to the wrong part of the chat page.** It picked the first element
  matching its chat-container selector. Kick's layout has three matching elements, and the first is
  a horizontal scroller that holds no messages: on the three channels checked, one offline and two
  live, that element contained none of the chat. It now picks the candidate that actually holds
  chat messages, and keeps looking while the chat is still empty instead of settling on the wrong
  one.
- **Switching channels no longer leaves background watchers behind.** Each channel switch started a
  page-wide DOM watcher without dropping the previous one, so they piled up and every one of them
  ran on every change anywhere on the page. Long sessions hopping between channels should feel
  lighter.
- **Compact display no longer stacks duplicate translations.** In the compact display style, a
  re-translation (the retry button, or the same message being processed again) added a second
  translation under the message instead of replacing the first, and they piled up. The other
  display styles were unaffected.
- **The compose preview no longer overwrites your clipboard for nothing.** When a translation came
  back identical to what you had typed, inserting it left the box looking unchanged, which the
  extension read as "the editor rejected it" and fell back to copying the text over whatever you
  had on your clipboard. It now only falls back when the translation would actually have changed
  the box.
- **Glossary entries with non-Latin text now work.** Every rule whose source term was not plain
  ASCII was silently ignored, including the documented `草→lol` example, along with Cyrillic and
  accented words like `café`. Rules on ASCII words still match whole words only.
- **Turkish names and words are now matched regardless of capitalisation.** Lowercasing a Turkish
  capital İ leaves an extra invisible mark behind, so the same name written in a different case no
  longer looked like the same name: a blacklisted Turkish user kept coming through, and the same
  Turkish word in two capitalisations was translated and paid for twice instead of being reused
  from cache. Dotted and dotless i stay distinct, as they are genuinely different letters.
- **Username detection was broken by a Kick layout change, which silently disabled the user
  filters.** Kick now renders the sender's name directly on a button instead of inside a span, so
  the extension read every message as having no author: blacklisted users were still translated,
  the bot filter had nothing to match on, and the "same user repeated themselves" check never
  fired, so spam was re-translated at your providers' expense. Checked against live chat, where
  none of the previous detection paths matched a single message.

## [2.5.0] — 2026-06-04

### Added
- **The extension UI is now available in 7 languages** — English, Japanese, French, Chinese,
  Arabic, Russian, and Portuguese. The options page and popup auto-detect your browser language
  and can be switched live from a picker in the options header; Arabic renders right-to-left.
  Missing strings fall back to English, so the UI is never blank.

### Fixed
- **Firefox (AMO) data-consent.** Added the now-required
  `browser_specific_settings.gecko.data_collection_permissions` key, declaring that the extension
  transmits chat message text (website content) to the user-selected translation provider and
  nothing else. This unblocks Firefox Add-ons validation.

## [2.4.1] — 2026-06-03

### Fixed
- **Firefox build compatibility.** `strict_min_version` is now `121.0` (the version that supports
  ES-module background scripts and `storage.session`) instead of an incorrect `109.0` that left the
  background non-functional on Firefox 109–120 and failed `web-ext lint`. The keepalive now guards
  `storage.session`. `web-ext lint` → 0 errors. (Promise-based `chrome.*` works natively on Firefox MV3,
  so no polyfill is needed.)

## [2.4.0] — 2026-06-03

### Improved
- **Outgoing (compose) quality, especially into Japanese.** The compose translation now feeds DeepL
  the recent channel lines as `context` (free — DeepL doesn't bill context characters) so the wording
  fits the conversation, and requests the **polite register** (`formality: prefer_more` → keigo for
  Japanese) where DeepL supports it. Compose also **remembers a channel's broadcast language**, so an
  offline Japanese channel still targets Japanese instead of defaulting to English.

## [2.3.1] — 2026-06-03

### Fixed
- **Compose preview stayed up after you cleared the chat box.** Kick's Lexical composer never fires a
  catchable `input` event on delete-to-empty (only `beforeinput`/`keyup`), so clearing your draft left
  the translation panel visible. It now also re-evaluates on `keyup`, so an empty box hides the panel.

## [2.3.0] — 2026-06-03

### Added
- **"Update available" indicator** — the popup checks the latest GitHub release (cached 6h) and shows
  a one-click banner linking to the release when a newer version is published; the header now shows the
  installed version. New read-only host permission: `https://api.github.com/*`.

## [2.2.1] — 2026-06-03

### Fixed
- **Critical: incoming chat translation was completely broken** (v2.1.0–v2.2.0). The pipeline's
  `effTarget` getter referenced itself instead of `settings.targetLang`, causing infinite recursion
  (`RangeError`) on every incoming message — `prepare()` threw and the rejection was swallowed by the
  observer, so messages were marked seen but never translated (0 requests reached the service worker).
  Compose ("translate what I type") was unaffected. Added a regression test (`pipeline.test.ts`) and a
  postmortem (`docs/postmortem-2026-06-03-efftarget-recursion.md`).

## [2.2.0] — 2026-06-02

Quality + reach polish, and a correct two-store release pipeline.

### Added
- **Budget-aware DeepL routing** (`deeplSmartRouting`, default on): DeepL is spent only
  on the European language pairs where it measurably beats the free engines; other
  targets (Japanese, Korean, Chinese, Arabic, Hindi, Thai…) demote it to a last-resort
  fallback — stretching the Free **1,000,000 chars/month** quota much further. Toggle in
  Options → Providers → DeepL.

### Changed / Fixed
- **Compose panel placement** now tracks the **visual viewport**, so it rides above the
  on-screen keyboard instead of hiding behind it, and lifts clear of Kick's emote / emoji
  picker when one opens over the composer.
- **MyMemory** regional codes: variants are sent as RFC-3066 (`pt-BR`, `zh-CN`, `zh-TW`,
  `no`) instead of a bare 2-letter code, improving 3rd-tier fallback quality.
- **Release pipeline**: the Chrome and Firefox bundles are now packed from their *own*
  builds — previously the published `-chromium` asset actually contained the Firefox
  build and no correct Firefox zip was produced. `build:firefox` is now cross-platform
  (`cross-env`); new `package:all` produces both store zips locally.
- Corrected the stale DeepL Free quota copy (500k → 1,000,000 chars/month).

### Tests
- 116 unit tests (was 91): budget routing, MyMemory code mapping, compose-panel geometry.

## [2.1.0] — 2026-06-02

International auto-detection + a compose preview. Works for any user on any channel
with zero configuration.

### Added
- **Compose preview** — translate what *you* type, live, in a floating panel above the
  chat box; click or **Ctrl/Cmd+Enter** to insert, **Esc** to dismiss.
- **Zero-config language detection, both directions:** reading target defaults to your
  **browser language** (`targetLang: 'auto'`); compose target is the **channel's
  language**, auto-detected from Kick's API (`livestream.lang_iso`) — no manual picking.
- **+11 languages** (31 total): Catalan, Slovenian, Estonian, Lithuanian, Latvian,
  Persian, Bengali, Tamil, Malay, Filipino, Slovak; plus **Brazilian Portuguese**.
- **RTL rendering** (`dir="auto"`) for Arabic / Hebrew / Persian.

### Changed / Fixed
- Chinese is no longer mislabelled as Japanese (kana-vs-Han script detection).
- Regional variants kept distinct (pt-BR, zh-TW); base-language comparison avoids
  pointless self-translation.
- DeepL: correct `PT-BR` / `ZH-HANS` / `ZH-HANT` / `NB` targets, valid base-code
  `source_lang` (was sending an invalid `EN-US`), and unsupported targets skip cleanly
  to Google without cooling DeepL down. Google: regional `tl` codes.
- Channel-meta fetches de-duplicated and tolerant of Cloudflare 403/503; invalid
  language settings coerced back to `auto`.
- Floating bar showed the literal `AUTO` sentinel instead of the resolved language.
- Compose was blocked for ASCII source languages (bonjour → "good") by the background's
  English-only same-language heuristic.

### Tests
- 91 unit tests (was 57).

## [2.0.0] — 2026-05-28

Complete rewrite. Not backwards-compatible with 1.x settings.

### Added
- **WebSocket-first ingestion** via Kick's Pusher endpoint
  (`App\Events\ChatMessageEvent`), with a DOM observer fallback.
- **Multi-provider chain**: Google Translate (free, no key), DeepL Free/Pro,
  MyMemory, and any Lingva / LibreTranslate instance.
- **Auto-failover** with per-provider exponential cooldown.
- **IndexedDB cache** with TTL + LRU + in-memory front layer.
- **Per-channel token-bucket rate limiter** to protect provider quotas.
- **Dedicated options page** (Preact + Tailwind) with tabs:
  Providers, Display, Filters, Advanced, About.
- **Hover-to-translate** display mode (on-demand, zero passive cost).
- **Source-language allowlist** to translate only specific languages.
- **Bot/user/channel filters** with whitelist + blacklist support.
- **`franc-min`-based language detection** replacing the naive heuristic.
- **Kick `[emote:id:name]` parser** + `@mention` / URL stripping before
  translation, so we don't ship emote text to the provider.
- **Daily usage stats**: requests, cache hit rate, errors, top languages.
- **Firefox MV3 build target** alongside Chrome.
- **Vitest test suite** and **GitHub Actions CI**.
- **Privacy policy** (`PRIVACY.md`) and **LICENSE** (MIT).

### Changed
- Build: Webpack → **Vite 5 + @crxjs/vite-plugin v2** + TypeScript strict.
- UI: vanilla TS → **Preact + Tailwind** for popup + options.
- Service worker: keepalive via `chrome.alarms` (instead of dying mid-burst).

### Removed
- The promised-but-never-implemented DeepL backend from v1 (now real).
- The dead `libretranslate.com` public endpoint (replaced by configurable
  Lingva, which still proxies LibreTranslate engines).
- Inline styles scattered across the codebase (now in `inject.css`).

### Fixed
- XSS surface in injection (no more `innerHTML` on untrusted content).
- Cache lost on every service-worker idle (now persisted to IndexedDB).
- Identical-text "translations" pollute the chat (now suppressed).
