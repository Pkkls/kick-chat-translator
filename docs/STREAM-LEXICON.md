# Stream lexicon: emotes, slang, abbreviations, letter spam

Status: **prepared, not started** (2026-10-16). Bases laid; no lexicon code ships yet.

## Why

Chat text is half words, half stream language. What the engine receives today:

- **Emote names typed as text** (users without 7TV see `pepeLaugh`, `KEKW` as
  words). A regex strips mixed-case names (`emoteParser.ts`, `EMOTE_NAME_RE`):
  50/50 on a written list and 23/29 on a held-out one, 0 brand names lost.
  Kept, Google mangles an emote name 44% of the time (`peepoJoyeux`).
- **Slang**: `glossary.ts` `SLANG`, about 90 hand-picked words, used only to
  skip lines made of slang.
- **Abbreviations**: `abbreviations.ts` spells out English ones (`ngl`, `idc`)
  before translation, and **only English**. The audience is international
  (GA, 28 days: US 18%, then Japan, Türkiye, Poland, Mexico, Russia, Brazil):
  `tkt`, `jsp`, `vc`, `pq`, `slm`, `nwm`, `xq` reach the engine as they are.
- **Letter spam**: `normalizeElongation` (only after a refusal, measured),
  `isKeyboardSmash`, laughter table per language (`laughter.ts`).

## Data, first collection

`scripts/lexicon/collect-kick-7tv.js`, console of a kick.com tab: 359 live
channels, 119 with a 7TV set, **21135 names; 4930 on 3+ channels, 1145 on 10+**.
Most used: HUH 99, mhm 92, xdd 89, Aware 89, o7 88, GIGACHAD 86, Prayge 80,
COPIUM 72, Sadge 72, peepoHey 70. Also in the top: `ok`, `classic`,
`Listening`, `Cinema`, `Hmm`: real words. The data file was not saved (the
run lives in the browser); rerun the script, about 3 minutes.

Other sources probed: 7TV global set (45), BTTV global (65), FFZ global (23)
answer; BTTV "top shared" is 403; 7TV GraphQL rate-limits quickly.

## Phases

1. **Emote set, safe by construction.** Keep a name only if it is on 3+
   channels, its shape cannot be a word (internal capital, all caps, letters
   with digits; a single leading capital like `Sadge` is out) and its
   case-folded form is in no corpus vocabulary of the 42 languages
   (`langCorpus`, `langChat*` corpora). Generated file in `src/shared/`,
   exact match, case-sensitive. Budget: under 20 KB in the page script.
2. **Slang expansion per language**, the way English already works: tables
   for es, pt, tr, fr, pl, de, it, ru first (the GA audience), applied only
   when the line's language is established (`confidentLanguage`), tokens
   ambiguous across languages excluded.
3. **Letter spam**: measure `normalizeElongation` as a first pass again on
   the new chat corpus (it was rejected on English: "sooo goood").

## How each phase is judged

- Emotes: coverage on a held-out list of emote names never used to build
  the filter; **0** brand or person names stripped (the two brand lists of
  2026-10-16); 0 tokens stripped from the Tatoeba corpus; page script size.
- Slang: Google output for each abbreviated line, raw vs expanded. A line
  counts as fixed when the abbreviation came back untranslated raw and is
  translated expanded; any line whose meaning changes is a failure.
- Every gain is on lines written before the rule, the repository's rule.

## Open questions

- `Aware`, `Clueless`, `Sadge`: emotes with a single capital, and used a lot.
  Strip them only when the line has no other word?
- Kick's own emotes arrive as `[emote:id:name]` tokens and are already handled;
  is the 7TV set worth shipping at all for readers who have 7TV themselves?
