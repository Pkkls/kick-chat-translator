/**
 * Collecteur de corpus de chat Kick, à coller dans la console d'un onglet kick.com.
 *
 * Pourquoi le DOM et pas l'API : le transport temps réel de Kick n'est pas
 * exploitable côté serveur. Mesuré le 2026-08-16, `chatroom.<id>` sur le Pusher
 * classique (ws-us2.pusher.com) accepte l'abonnement et ne diffuse plus rien,
 * zéro message en 35 s sur une chaîne à 62 000 spectateurs. La passerelle maison
 * websockets.kick.com exige un token que Cloudflare refuse hors navigateur. Le DOM
 * est donc le seul canal ouvert, et c'est celui que l'extension utilise déjà.
 *
 * Les sélecteurs sont ceux de src/content/selectors.ts. S'ils décrochent ici, ils
 * décrochent aussi dans l'extension.
 *
 * Usage :
 *   1. ouvrir une chaîne live, coller ce fichier dans la console
 *   2. laisser tourner
 *   3. copy(ktCorpus.dump())        -> JSON dans le presse-papier
 *      ktCorpus.stats()             -> distribution, sans rapatrier le texte
 */
(() => {
  if (window.ktCorpus) {
    console.log('collecteur déjà actif, ' + window.ktCorpus.size() + ' messages');
    return;
  }

  const started = Date.now();
  const seen = new Map();
  let lastRows = 0;
  let lastEmpty = 0;

  /** Texte du message seul : ni horodatage, ni pseudo, ni séparateur. */
  const textOf = (row) => {
    const tv = row.querySelectorAll('span.seventv-text-token');
    const els = tv.length
      ? [...tv]
      : [...row.querySelectorAll('span.font-normal')].filter((s) => !s.classList.contains('font-bold'));
    return els
      .map((e) => {
        // Une emote personnalisée est un <img alt="nom"> : son alt n'est pas du texte.
        if (e.children.length === 1 && e.children[0] instanceof HTMLImageElement) return '';
        const t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
        return t || e.textContent || '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const sweep = () => {
    let rows = 0;
    let empty = 0;
    for (const row of document.querySelectorAll('div[data-index]')) {
      rows++;
      const txt = textOf(row);
      if (!txt) {
        empty++;
        continue;
      }
      // Clé sur le texte : le virtualiseur recycle les data-index, donc l'index
      // n'identifie pas un message. Deux personnes disant la même chose comptent
      // pour une seule ligne, ce qui est voulu pour un corpus.
      if (!seen.has(txt)) seen.set(txt, Date.now());
    }
    lastRows = rows;
    lastEmpty = empty;
  };

  sweep();
  const timer = setInterval(sweep, 1500);

  const pctOf = (k) => (seen.size ? Math.round((100 * k) / seen.size) : 0);

  window.ktCorpus = {
    size: () => seen.size,
    stop: () => clearInterval(timer),
    dump: () =>
      JSON.stringify({
        channel: location.pathname.slice(1),
        startedAt: new Date(started).toISOString(),
        durationSec: Math.round((Date.now() - started) / 1000),
        count: seen.size,
        messages: [...seen.entries()].map(([text, at]) => ({ at: new Date(at).toISOString(), text })),
      }),
    stats: () => {
      const msgs = [...seen.keys()];
      const lens = msgs.map((m) => m.length).sort((a, b) => a - b);
      const at = (q) => lens[Math.min(lens.length - 1, Math.floor(q * lens.length))];
      const laugh = /^(k{3,}|j{2,}a{2,}|rs{2,}|ha{2,}|x+d+|l+o+l+|a{4,})[\s!?.]*$/i;
      return {
        n: msgs.length,
        // Le seuil qui compte : langDetect.ts note franc peu fiable sous ~20 car.
        longueur: { p10: at(0.1), p50: at(0.5), p90: at(0.9), max: lens[lens.length - 1] },
        sousSeuilFranc: pctOf(msgs.filter((m) => m.length < 20).length) + '%',
        rires: pctOf(msgs.filter((m) => laugh.test(m)).length) + '%',
        avecMention: pctOf(msgs.filter((m) => /@\w/.test(m)).length) + '%',
        toutMajuscules:
          pctOf(msgs.filter((m) => m.length > 3 && m === m.toUpperCase() && /[A-ZÀ-Þ]/.test(m)).length) + '%',
        // Santé des sélecteurs. Attention au dénominateur : div[data-index] compte
        // TOUTES les lignes du virtualiseur, y compris systèmes et séparateurs,
        // pas seulement celles que l'observer de l'extension retient.
        lignesDom: lastRows,
        lignesSansTexte: lastEmpty,
      };
    },
  };

  console.log('collecteur actif. ktCorpus.stats() | ktCorpus.dump() | ktCorpus.stop()');
})();
