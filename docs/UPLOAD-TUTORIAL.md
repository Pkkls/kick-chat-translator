# Upload Tutorial — Kick Chat Translator v2.4.1

Human walkthrough for submitting the extension to both stores.  
Prerequisites: logged in, Chrome $5 fee already paid, both zips downloaded from the v2.4.1 GitHub release.

All copy lives in `docs/STORE-SUBMISSION.md` — never duplicate it here, just reference field names.

---

## Part A — Chrome Web Store

Dashboard: <https://chrome.google.com/webstore/devconsole>

### 1. Open the developer console
Go to <https://chrome.google.com/webstore/devconsole>.  
If prompted to pay the $5 registration fee, complete it — you said it's done.

### 2. Create a new item
Click **"Add new item"** (blue button, top-right area).

### 3. Upload the package
Click **"Choose file"** in the upload dialog.  
Select `kick-chat-translator-2.4.1-chromium.zip`.  
Click **"Upload"**. Wait for processing to finish; the dashboard will redirect to the item edit page.

### 4. Store listing tab

Click the **"Store listing"** tab on the left sidebar.

| Field | What to paste |
|---|---|
| **Name** | `Item name` from STORE-SUBMISSION.md |
| **Short description** | `Short description` from STORE-SUBMISSION.md (≤132 chars) |
| **Detailed description** | `Detailed description` from STORE-SUBMISSION.md (multi-line markdown OK) |
| **Category** | Select **Social & Communication** (matches `Category` field) |
| **Language** | English (matches `Default language` field) |

**Screenshots** (required — at least one):
- Size must be **1280×800** or 640×400, PNG or JPG, up to 5 images.
- Upload your existing Kick chat screenshots (translated-chat view, popup, or Options page).
- Click the screenshot upload zone and pick your file(s).

**Store icon**: already bundled inside the zip — Chrome extracts the 128×128 icon automatically; you do not need to upload it separately.

Click **"Save draft"** before moving on.

### 5. Privacy practices tab

Click the **"Privacy practices"** tab on the left sidebar.

**Single purpose:**
- Paste the `Single purpose statement` from STORE-SUBMISSION.md into the "Single purpose" field.

**Permissions — justifications:**
For each permission Chrome lists, paste the matching justification from the `Permission justifications` table in STORE-SUBMISSION.md:
- `storage` → paste its row text
- `alarms` → paste its row text
- `https://kick.com/*` → paste its host-permission row
- `https://api.github.com/*` → paste its row
- Each translation-provider host (`translate.googleapis.com`, `api-free.deepl.com`, `api.deepl.com`, `api.mymemory.translated.net`, `lingva.lunar.icu`, `lingva.ml`) → paste their respective rows

**Privacy policy URL:**
Paste the URL from `Privacy policy URL` in STORE-SUBMISSION.md:  
`https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md`

**Data usage disclosure:**
Select the option indicating **no personal data is collected** (the form usually shows a series of data-type checkboxes — leave all unchecked, or select "No" for each).  
Then tick all three certification checkboxes listed under `Data usage disclosure` in STORE-SUBMISSION.md:
- "This item does not sell or share user data..."
- "This item does not use or transfer user data for purposes unrelated to its single purpose..."
- "This item does not use or transfer user data to determine creditworthiness..."

Click **"Save draft"**.

### 6. Distribution tab

Click the **"Distribution"** tab on the left sidebar.  
Set visibility to **Public** (matches `Visibility` field in STORE-SUBMISSION.md).  
Leave geo-restrictions blank unless you want to restrict countries.

Click **"Save draft"**.

### 7. Submit for review — IRREVERSIBLE

Click **"Submit for review"** (blue button, top-right).  
A confirmation dialog appears — read it, then click **"Submit"**.

> ⚠️ After submission, the item enters the review queue. You cannot unpublish it retroactively without going through another review cycle.

**Review time:** typically a few hours to a few days for a new item.

### Future updates
Bump `version` in `manifest.json`, build a new zip, go back to the item in the developer console, click **"Package"**, upload the new zip, then click **"Submit for review"** again.

---

## Part B — Firefox AMO

Dashboard: <https://addons.mozilla.org/developers/>

### 1. Sign in
Go to <https://addons.mozilla.org/developers/> and sign in with your Mozilla account.

### 2. Start a new submission
Click **"Submit a New Add-on"**.

### 3. Distribution channel
Select **"On this site"** (listed, publicly searchable on AMO).  
Click **"Continue"**.

### 4. Upload the Firefox package
Click **"Select a file"**.  
Select `kick-chat-translator-2.4.1-firefox.zip`.  
Click **"Upload Version"**. AMO runs automated validation — wait for the green checkmark.

### 5. Upload source code — REQUIRED
AMO requires source code for minified/built extensions.  
When prompted ("Does this add-on use any build tools?"), select **"Yes"** and upload a source archive, or provide the following in the source-code notes field:

- **Repository URL:** `https://github.com/Pkkls/kick-chat-translator`
- **Build steps** (copy from `Source code submission` in STORE-SUBMISSION.md):
  ```
  npm ci
  npm run build:firefox
  ```
  Node ≥20. The submitted zip is an archive of the `dist/` folder.

If AMO shows a separate "Source code" upload input, create a zip of the full repository root (exclude `node_modules/` and `dist/`) and attach it there.

Click **"Continue"**.

### 6. Fill the listing

Click the **"Describe Add-on"** (or listing) step.

| Field | What to paste |
|---|---|
| **Name** | `Add-on name` from STORE-SUBMISSION.md |
| **Summary** | `Summary` from STORE-SUBMISSION.md (≤250 chars) |
| **Description** | `Description` from STORE-SUBMISSION.md (multi-line) |
| **Categories** | Select **Social & Communication** as primary, **Appearance** as secondary |

### 7. Screenshots
At least one required.  
Click the screenshot upload zone and add your Kick chat screenshots (Options page, popup, or live translated chat — same images you used for Chrome work fine).

### 8. Data collection disclosure
On the "Data collection" step, select **"No"** — this add-on does not collect user data.  
(Do not add `data_collection_permissions` to the manifest; the form declaration is sufficient, and that field would force `strict_min_version 140+`.)

### 9. Submit for review — IRREVERSIBLE

Click **"Submit Version for Review"**.

> ⚠️ Once submitted, the version is locked in the review queue. Human review can take several days to a couple of weeks for new add-ons.

**Until AMO approves:** users can install the `.xpi` temporarily via `about:debugging` → "Load Temporary Add-on" (development only, not for end users).

**Updates:** increment `version` in `manifest.json`, rebuild, upload the new firefox zip, re-attach source, resubmit.
