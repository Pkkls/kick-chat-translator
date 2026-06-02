# 50 improvements — i18n / compose hardening

Status: ✅ done · 🔄 in progress · ⏳ planned

## A. Language coverage & detection
1. ✅ Add DeepL-supported langs we lacked: Estonian (et), Lithuanian (lt), Latvian (lv), Slovenian (sl)
2. ✅ Add Google-supported langs: Persian (fa), Bengali (bn), Tamil (ta), Malay (ms), Filipino (tl), Catalan (ca)
3. ✅ Brazilian Portuguese (pt-br) as a first-class entry + DeepL `PT-BR` mapping
4. ✅ Traditional Chinese: keep `zh-tw`/`zh-hant` distinct (don't collapse to `zh`)
5. ✅ `detectByScript` CJK → refine ja/zh/ko with franc instead of always 'ja'
6. ✅ `resolveBrowserLang` scans `navigator.languages` for the first supported, not just `[0]`
7. ✅ Map Kick `lang_iso` quirks (`zh-Hant`→zh-tw, `pt`+region) in a normalizer
8. ✅ RTL: `dir="auto"` on injected translation + compose panel (Arabic/Hebrew/Persian)
9. ✅ Centralize the `'auto'` sentinel as a constant (no stringly-typed literals)
10. ✅ DeepL lang-code map covers new langs (et, lt, lv, sl, pt-br); skip unsupported gracefully

## B. Compose UX
11. ✅ Keyboard insert: Ctrl/Cmd+Enter inserts the compose translation (no mouse)
12. ✅ Esc dismisses the compose panel
13. ✅ Cap compose source length before sending (avoid huge requests)
14. ✅ Rate-limit hint: subtle ⏳ on the panel when throttled (was silent)
15. ✅ Compose target badge shows the language NAME on hover (title)
16. ✅ Distinct loading state styling (don't reuse arrow pulse only)
17. ⏳ Reposition compose panel above on-screen keyboards / emote picker overlap
18. ✅ Skip compose for URL-only / mention-only typed text

## C. Incoming (reading) quality
19. ✅ Generalize `ignoreEnglish` → skip messages already in the *user's* target language (not just EN)
20. ✅ zh/ja/ko detection refinement shared with compose (#5)
21. ✅ Source-language badge tooltip shows the language name
22. ✅ Same-language guard (`looksLikeTargetLang`) generalized/guarded beyond EN-only

## D. Robustness & edge cases
23. ✅ `fetchChannelMeta`: in-flight dedup (rapid route changes don't double-fetch)
24. ✅ kickApi tolerates 403/Cloudflare → serve stale cache, never throw
25. ✅ Offline-channel compose fallback: keep last-known channel lang instead of jumping to 'en'
26. ✅ Settings load: coerce invalid targetLang/composeTargetLang to 'auto'
27. ✅ Compose: drop stale channel-lang when leaving a channel (done) + guard empty slug
28. ⏳ Handle `www.`/`m.` kick host variants in slug extraction

## E. Performance
29. ✅ `fetchChannelLangIso` reuses the chatroom-id fetch (one request) — verified, documented
30. ✅ ResizeObserver callback guarded (no work when panel hidden)
31. ⏳ Lazy-load franc-min off the hot path (bundle parse cost) — deferred (risk vs reward)
32. ✅ memCache key reuse via shared `cacheKey` (no duplicate normalization)

## F. Tests
33. ✅ `kickApi.test.ts`: lang_iso extraction, TTL cache, 403 tolerance (mocked fetch)
34. ✅ `languages.test.ts`: extend — new langs, pt-br/zh-tw normalization, resolveBrowserLang
35. ✅ `langDetect.test.ts`: zh/ja/ko script cases
36. ✅ compose target resolution unit-tested (pure helper)
37. ✅ `ignoreSameAsTarget` filter test
38. ✅ DeepL lang-code mapping test (pt-br, new langs)

## G. Code quality
39. ✅ Extract compose/i18n magic numbers to named constants
40. ✅ JSDoc on new public helpers
41. ✅ Remove dead code / unused exports surfaced during refactor
42. ✅ Strict null-safety on API parsing

## H. Docs & infra
43. ✅ README section: international auto-detect + compose
44. ✅ Handoff docs for the i18n fork — `docs/i18n-auto-detect.md` (CONTEXT.md left untouched)
45. ✅ GitHub Actions CI — already present (`.github/workflows/ci.yml`), covers typecheck/lint/test/build
46. ✅ CHANGELOG.md — 2.1.0 entry
47. ✅ Version bump (2.1.0) reflecting compose + i18n

## I. Provider interop
48. ✅ Google provider lang param handles regional codes (pt-br→pt, zh→zh-CN, zh-tw→zh-TW)
49. ⏳ MyMemory regional code mapping — deferred (3rd-tier fallback; its base 2-letter codes work)
50. ✅ Unsupported targets skip cleanly to the next provider (no crash, no cooldown)

---

**Done: 47 / 50.** Deferred (⏳, low-value / higher-risk): #17 panel-overlap reposition,
#28 www/m host variants, #31 lazy-load franc-min, #49 MyMemory regional codes.
All 4 batches shipped green: typecheck + lint + **91 tests** + build. Commits
`05db993` (A) · `5e0b61d` (B) · `eedc19e` (C) · `6503404` (D).
