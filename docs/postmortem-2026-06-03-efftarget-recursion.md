# Postmortem — 2026-06-03 — `effTarget` infinite recursion broke all incoming translation

## Impact

For the window that **v2.1.0 → v2.2.0** were live, **incoming chat translation was completely
broken on every browser**. The floating bar showed "Translating → …" and chat rows were marked as
seen, but **no translation ever appeared**. Outgoing translation (compose / "translate what I type")
was unaffected.

## Root cause

In `src/content/pipeline.ts`, the `effTarget` getter resolved the reading target like this:

```ts
private get effTarget(): string {
  return this.effTarget === 'auto' ? resolveBrowserLang() : this.effTarget; // BUG: self-reference
}
```

It reads **itself** (`this.effTarget`) instead of the settings field. Reading the getter invokes the
getter → unbounded recursion → `RangeError: Maximum call stack size exceeded`.

`effTarget` is read in `prepare()` for **every** incoming message, so `prepare()` threw on every
message. `onDomMessage` is invoked from the chat observer as `void pipeline.onDomMessage(...)`, so the
resulting unhandled rejection was **silently swallowed**. Observed symptoms, all consistent:

- content script running, chat container + rows detected, real text extracted;
- rows *marked seen* (`data-kt-id`) by the observer (marking happens before `onDomMessage`);
- **0 translations injected, 0 `translate` requests reaching the service worker**;
- no visible error (debug logging was off; `log.*` is gated on `settings.debug`).

## Why every rollback / reset failed

`pipeline.ts` is shared code that the later feature work never touched — **the same buggy getter was
present in both v2.1.0 and v2.2.0**. So switching versions, re-cloning from GitHub, resetting settings,
and clean-reloading the extension all changed nothing: the defect lived in code common to every
candidate. Compose kept working because it runs through a different path (`compose.ts` /
`composeLogic.ts`) that never reads `effTarget`.

## Detection

Live DOM inspection of a Japanese channel (via the browser MCP) isolated the failure to *between*
"observer saw the message" and "request sent to SW": text was extracted and rows marked, providers were
reachable (a direct fetch to MyMemory/Google returned translations), and the SW was alive (the popup
rendered provider status + DeepL quota) — yet zero requests reached it. Reading `pipeline.ts` then
revealed the self-referential getter.

## Fix

Read the settings field, not the getter:

```ts
private get effTarget(): string {
  return this.settings.targetLang === 'auto' ? resolveBrowserLang() : this.settings.targetLang;
}
```

Shipped as **v2.2.1**.

## Prevention

- **Regression test** — `src/content/pipeline.test.ts` drives `onWebSocketMessage` and asserts it
  dispatches to the SW with a *resolved* (non-`'auto'`) target. Throws/fails with the old getter,
  passes with the fix.
- **Warning comment** on the getter.
- **Lesson** — green CI (typecheck + lint + unit tests + build) did **not** catch this: `pipeline.ts`
  had no test, and a self-referential getter is valid TypeScript with no lint rule against it. The core
  message path needs at least one behavioral test, and runtime changes to the message/build/runtime
  layers must be smoke-tested in a real browser before shipping — green build ≠ working runtime.
