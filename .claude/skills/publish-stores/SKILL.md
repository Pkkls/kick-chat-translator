---
name: publish-stores
description: Publish a tagged release to addons.mozilla.org (version, source archive, release notes in every locale, reviewer notes, listing) through Claude in Chrome, and hand the Chrome Web Store part to the user. Use when the user asks to upload, publish or ship a version to the stores, or to update the store listings.
---

# Publishing to the stores

Every step below was run for 2.12.1 and is the path that worked. The dead ends are listed at the end so they are not tried again.

## 0. Before any browser

1. The version is committed, tagged `vX.Y.Z` and **pushed**: the AMO reviewer notes tell the reviewer to `git checkout` that tag.
2. The archives in `release/` were built from a clean worktree of the tag, not from the working tree (it can hold someone's uncommitted work, and 2.12.0's zips once shipped it). Check: the SHA-256 in `store-listing.md`'s AMO notes equals `sha256sum release/*.zip`.
3. Source archive for AMO, from the tag:
   ```bash
   git archive --format=zip --prefix=kick-chat-translator-X.Y.Z/ -o release/kick-chat-translator-X.Y.Z-source.zip vX.Y.Z
   ```
4. Build the payloads. The script refuses to write when a text has a dash, has lost its accents, or a summary is over 250 characters. Fix the text, never the check.
   ```bash
   node .claude/skills/publish-stores/payloads.mjs <scratchpad>/stores
   ```

## 1. Chrome Web Store: the user does it

Chrome forbids every extension from reading or driving the Web Store ("The extensions gallery cannot be scripted"): no text, no screenshot, no click through Claude in Chrome. The built-in browser pane refuses to load it, and computer use only reads browsers. Do not try. Give the user:

- https://chrome.google.com/webstore/devconsole, the item, Package, Upload new package: `release/kick-chat-translator-X.Y.Z-chromium.zip`.
- Store listing, per language: paste `## Description (XX)` from `store-listing.md` where it differs from what is online.
- Privacy tab: only if the manifest's permissions changed (`## Chrome dashboard: permission justifications`).
- Submit for review.

Automating it would need the Chrome Web Store API with an OAuth client and refresh token the user creates. Never create or type those credentials yourself.

## 2. AMO: new version

Claude in Chrome, the user's session. Slug `kick-chat-translator`, default locale `fr`, AMO has no Arabic locale.

1. `navigate` to `https://addons.mozilla.org/en-US/developers/addon/kick-chat-translator/versions/submit/`.
2. `find` "file input for add-on upload", then `file_upload` the firefox zip. Never click a file input: it opens a native dialog. Wait about 10 s, read the page: expect "validated with no errors". Warnings are listed in `/en-US/developers/upload/<uuid>/json` (the "Duplicate add-on ID" error there is an artefact of reading it outside the add-on; the page is what counts).
3. Compatibility: Firefox only, as preset. Continue. The URL now carries the version id: `/versions/submit/<id>/details`.
4. Go to `/versions/submit/<id>/source`, tick Yes, `file_upload` the source zip into "Upload source code", Continue. **This submits the version immediately**, before any notes. That is fine: the notes go in next, and small versions are auto-approved within minutes.
5. Notes, on `/en-US/developers/addon/kick-chat-translator/versions/<id>`. The Save button does not submit (the locale widget intercepts it), so post the form yourself. Load the JSON without pasting it through a tool call: add a file input outside the form, `find` it, `file_upload` `amo-notes.json` into it, then run:
   ```js
   const inp = Object.assign(document.createElement('input'), { type: 'file', id: 'kt-payload' });
   inp.setAttribute('aria-label', 'kt payload file'); document.body.appendChild(inp);
   ```
   ```js
   const { notes, rev } = JSON.parse(await document.getElementById('kt-payload').files[0].text());
   const form = document.querySelector('[name=approval_notes]').form;
   const fd = new FormData(form);
   fd.set('approval_notes', rev);
   for (const [loc, t] of Object.entries(notes)) fd.set(`release_notes_${loc}`, t);
   const r = await fetch(location.href, { method: 'POST', body: fd, credentials: 'same-origin' });
   r.status
   ```
   Verify by reloading and counting non-empty `textarea[name^=release_notes_]`: one per locale in the JSON.

## 3. AMO: listing

The sections of `/edit` load by AJAX. Same file-input trick with `amo-listing.json`, then:

```js
const { summary, description } = JSON.parse(await document.getElementById('kt-payload').files[0].text());
const url = '/en-US/developers/addon/kick-chat-translator/edit_describe/edit';
const h = { 'X-Requested-With': 'XMLHttpRequest' };
const load = async () => new DOMParser().parseFromString(await (await fetch(url, { credentials: 'same-origin', headers: h })).text(), 'text/html').querySelector('form');
const val = (f, n) => f.querySelector(`[name="${n}"]`)?.value ?? null;
const token = document.querySelector('[name=csrfmiddlewaretoken]').value;
const before = await load();
const fd = new FormData(before);
fd.set('csrfmiddlewaretoken', token);
for (const l of Object.keys(summary)) {
  fd.set(`summary_${l}`, summary[l]); fd.set(`description_${l}`, description[l]);
  if (!val(before, `name_${l}`)) fd.set(`name_${l}`, 'Kick Chat Translator');
}
const r = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin', headers: { ...h, 'X-CSRFToken': token } });
const after = await load();
({ status: r.status, ok: Object.keys(summary).filter(l => val(after, `summary_${l}`) === summary[l] && val(after, `description_${l}`) === description[l]).length + '/' + Object.keys(summary).length })
```

Without the two headers the POST is a 403 and nothing is saved.

## 4. Verify what the public sees

```js
const a = await fetch('https://addons.mozilla.org/api/v5/addons/addon/kick-chat-translator/').then(r => r.json());
({ live: a.current_version?.version === 'X.Y.Z', public: a.current_version?.file?.status === 'public' })
```

Compare as booleans: the tool output masks version strings as tokens. Then open `https://addons.mozilla.org/fr/firefox/addon/kick-chat-translator/` and read the summary and the start of the description.

## Dead ends, already paid for

- Leaving `/details` to fill the source step: the source Continue finalises the submission and the details step is skipped. Notes then go through step 5, which works anyway.
- Clicking Save on the version page: nothing is posted. Always verify by reload, never by the page state after the click.
- `NOUVEAUTES.md` release notes written without accents: the script now refuses them.
- Hard-wrapped notes pasted as is: AMO keeps the line breaks. The script unwraps them, without spaces for Chinese and Japanese, with them for Korean.
- The Web Store through any browser tool: impossible, see section 1.
