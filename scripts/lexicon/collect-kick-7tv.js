/**
 * Collect the 7TV emote names used on live Kick channels, to paste in the
 * console of a kick.com tab (Kick's API answers only from the site itself).
 *
 * What it does: pages through /stream/livestreams (the `lang` path segment is
 * ignored by Kick, the pages mix every language), asks 7TV for each channel's
 * emote set (`7tv.io/v3/users/kick/<user_id>`), and counts on how many channels
 * each name appears. A name used on many channels is one people type on Kick.
 *
 * First run, 2026-10-16: 359 live channels, 119 with a 7TV set, 21135 distinct
 * names; 4930 on 3 channels or more, 1145 on 10 or more. The top of the list
 * shows why the filter in docs/STREAM-LEXICON.md is needed: HUH, mhm, xdd,
 * Aware, o7, but also ok, classic, Listening, Cinema, Hmm, which are words.
 *
 * Usage:
 *   1. open any kick.com page, paste this file in the console
 *   2. await ktLexicon.run()            (about 3 minutes, 7TV rate-limits)
 *   3. copy(ktLexicon.dump(3))          JSON {name: {channels, langs}} for names
 *                                       on 3 channels or more, to save as
 *                                       scripts/lexicon/data/kick-7tv-<date>.json
 */
(() => {
  const channels = new Map(); // user_id -> language
  const names = new Map(); // emote name -> { channels, langs:Set }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function listChannels(pages = 15) {
    for (let p = 1; p <= pages; p++) {
      const j = await fetch(`/stream/livestreams/en?page=${p}&limit=24&subcategory=&sort=desc`).then((r) => r.json());
      for (const x of j.data ?? []) {
        const uid = x.channel?.user_id;
        if (uid) channels.set(uid, x.language ?? '?');
      }
    }
  }

  async function collect() {
    let with7tv = 0;
    for (const [uid, lang] of channels) {
      const r = await fetch(`https://7tv.io/v3/users/kick/${uid}`);
      if (r.status === 429) {
        await sleep(4000);
        continue;
      }
      if (r.ok) {
        const j = await r.json();
        for (const e of j.emote_set?.emotes ?? []) {
          if (!e.name) continue;
          const o = names.get(e.name) ?? { channels: 0, langs: new Set() };
          o.channels++;
          o.langs.add(lang);
          names.set(e.name, o);
        }
        with7tv++;
      }
      await sleep(200);
    }
    return with7tv;
  }

  window.ktLexicon = {
    async run(pages = 15) {
      await listChannels(pages);
      const with7tv = await collect();
      const s = { channels: channels.size, with7tv, names: names.size };
      console.log(s);
      return s;
    },
    dump(minChannels = 3) {
      const out = {};
      for (const [n, o] of [...names].sort((a, b) => b[1].channels - a[1].channels)) {
        if (o.channels >= minChannels) out[n] = { channels: o.channels, langs: [...o.langs] };
      }
      return JSON.stringify(out);
    },
  };
  console.log('ktLexicon ready: await ktLexicon.run(), then copy(ktLexicon.dump(3))');
})();
