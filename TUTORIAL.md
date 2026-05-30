# Kick Chat Translator — User Guide

Translate Kick.com chat into your language, live. This guide gets you from zero
to translated chat in a few minutes. No coding needed.

---

## ⚡ Quick start (3 steps)

1. **Install** the extension (see below).
2. Open any **Kick stream** — a small bar appears at the top of chat:
   **🟢 Translating → EN**.
3. That's it. Foreign messages now show an English line underneath. ✅

> On **Chrome/Edge** it can run fully **on the device** (free, unlimited).
> On **Brave** (or for best quality anywhere), add a **free DeepL key** — see
> ["Best quality"](#-best-quality-free-deepl-key) below.

---

## 📦 Install

You'll load it as an "unpacked extension" (it's not on the Web Store yet).

1. Unzip `kick-chat-translator-…-chromium.zip` to a folder you'll keep.
2. Open your browser's extensions page:
   - **Chrome** → `chrome://extensions`
   - **Brave** → `brave://extensions`
   - **Edge** → `edge://extensions`
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** → select the **unzipped folder** (the one containing `manifest.json`).
5. (Optional) Pin the icon so it's always visible.

Open a Kick stream and you're ready.

---

## 🎛️ Using it

### The bar at the top of chat
- **🟢 Translating → EN** = on. Click it to turn translation **off/on** for all your tabs.
- **⚙** opens the full **Options**.
- A small number (e.g. **· 42**) counts how many messages were translated this session.

### Where translations show
Under each foreign message, in green, with a language tag:

> **someone**: ¿cómo estás?
> `ES` How are you?

You always keep the original message.

### Re-translate a message
Hover a translation and click the small **⟳** to translate it again (handy if a
result looks off — it tries again, ignoring the cache).

---

## 🌍 Choose your language & look

Open **Options** (the ⚙ on the bar, or right-click the icon → Options).

- **Display tab**
  - **Target language** — what everything is translated *into* (e.g. English, Français…).
  - **Display style** — *Below* the message (default), *Inline*, or *Replace*.
  - Toggles for keeping the original, showing the language badge, etc.

---

## 💎 Best quality: free DeepL key

DeepL gives the nicest translations. The key is **free** (no charge) — it just
takes ~2 minutes to create.

1. Go to **<https://www.deepl.com/pro-api>** and sign up for **DeepL API Free**.
   - It asks for a card to verify, but the **Free** plan is **0 € / 1,000,000 characters per month**. You're not charged.
2. Copy your **Authentication Key** (it ends with **`:fx`**).
3. In the extension → **Options → Providers**:
   - Paste the key into **DeepL → API key**.
   - Set **Plan = Free (api-free.deepl.com)**. ⚠️ This must be **Free** for an `:fx` key.
   - In **Cloud fallback chain**, click **+ DeepL** and move it to **#1** with the ↑ arrow.
4. Done — chat now translates via DeepL.

> No key? It still works with **Google** and **MyMemory** (free, no signup),
> just with stricter limits on very busy channels.

---

## 🖥️ On-device translation (Chrome / Edge)

If your browser has it (Chrome today; **Brave disables it**), you can translate
**locally, unlimited, with no key and no internet round-trip**:

1. **Options → Providers → Engine** → keep **"On-device first"** and **"Enable on-device translation"** on.
2. The first time a language appears, click the **"Local"** chip on the chat bar
   (or the language button in Options) to download its model **once** (a few MB).
3. After that, that language translates instantly and privately, forever.

On **Brave**, this isn't available — the extension automatically uses the cloud
(DeepL/Google) instead. Nothing to do.

---

## ✨ Handy options

In **Options**:

- **Filters** — skip bots, hide spam, or restrict to specific source languages /
  channels. *(Leave these empty if you want everything translated.)*
- **Advanced**
  - **Pause when tab is hidden** (on by default) — background tabs don't translate,
    so they never waste your DeepL quota while you're not watching.
  - Cache size, speed, per-channel limit.
  - **Reset all settings to defaults** — fixes any weird state in one click.

---

## ❓ Nothing is translating?

Run down this list:

1. **Is the bar green?** If it says **"Translation off"**, click it to turn on.
2. **Are you watching the tab?** Background tabs auto-pause (by design). Bring the
   tab to the front.
3. **Filters** — if you set a *Whitelist channel* or *Source-language allowlist*
   earlier, it may be hiding everything. Clear them, or hit
   **Options → Advanced → Reset all settings to defaults**.
4. **Same language** — messages already in your target language aren't translated.
5. **DeepL not used?** Make sure the key is pasted **and** DeepL is added to the
   chain (Options → Providers), and **Plan = Free** for an `:fx` key.

---

## 🔒 Privacy

- No account, no tracking, no analytics, **no server on our side**.
- On-device mode: nothing leaves your computer.
- Cloud mode: a message's text goes **only** to the translator you chose (e.g. DeepL),
  only to translate it. Full details in [PRIVACY.md](PRIVACY.md).

---

Questions or bugs → open an issue on the GitHub repo. Enjoy the streams. 🎉
