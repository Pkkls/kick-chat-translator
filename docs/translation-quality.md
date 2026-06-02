# Translation quality: which languages need what

Two questions drove this: (1) which languages are grammatically divergent enough that
basic MT systematically errs, and (2) which engine to use where. The trigger was the
**wrong-person** bug — Japanese drops the subject, so MT outputs *"I …"* when the
speaker meant *"he …"*.

## The finding (the counter-intuitive part)

The wrong-person error happens when a language **drops the subject AND lacks the verb
morphology to recover it**. That is a small, specific set:

- **Japanese, Korean, Chinese (Simpl./Trad.)** — pro-drop, isolating/agglutinative, no
  grammatical person; the subject is purely contextual.
- **Vietnamese** — no grammatical pronouns at all; person is a kinship/status term.
- **Thai** — pro-drop + no inflection + no word spacing.
- **Arabic** — pro-drop, dialectal chat clips the person marking.

Romance (es/it/pt) and Slavic (ru/pl/cs…) are *also* pro-drop, but their conjugation
encodes the person unambiguously, so MT recovers "I/you/he" correctly. **Pro-drop alone
is harmless; pro-drop + no person inflection is the lethal combo.**

**No engine can recover a referent the language leaves implicit** — not DeepL, not
Google. Independent comparisons find both guess, and both guess wrong on bare lines;
for Japanese, Google's larger dataset often matches or beats DeepL. So *switching engine
does not fix the wrong-person bug.* **The only real lever is feeding the surrounding
conversation** so the engine can infer who is meant.

## What we do about it

1. **Extra context for the ambiguous sources.** When translating *from* `ja, ko, zh,
   zh-tw, vi, th, ar` we pass **6 prior chat lines** (vs 2 for everything else),
   formatted as `username: message`, into DeepL's `context` parameter — which exists
   precisely to disambiguate without translating the context itself. This is what lets
   it pick "he" over "I". See `src/shared/langTiers.ts` (`isContextCritical`) and
   `src/content/pipeline.ts` (`contextFor`). (Context only helps DeepL; Google's web
   endpoint ignores it, so a DeepL key materially improves these languages.)

2. **Engine routing tiers** (`langTiers.ts`, exposed for budget-aware routing):
   - **DeepL-premium** (`de fr es pt pt-br it nl pl sv cs sk ro ru uk fi hu bg el sl et
     lt lv da tr`) — European pairs where DeepL measurably beats Google → worth the
     limited DeepL Free budget.
   - **Google-fine** (`ja ko zh zh-tw ar he th vi id` and the Latin SVO languages) —
     Google is as good or better, or DeepL doesn't support them → save the budget.
   - **DeepL-unsupported** (`hi bn ta ms tl ca fa no`) — Google/MyMemory only.

## Sources

Typological analysis + a 2025–2026 engine-quality review (DeepL vs Google), incl. DeepL's
supported-language set and the documented pro-drop / dropped-pronoun MT problem. DeepL's
edge is concentrated in European pairs; its Asian additions (ar/he/th/vi) are recent and
MSA/standard-tuned, weaker for the dialectal/informal register of live chat.
