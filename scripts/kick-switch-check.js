/**
 * Does switching stream still need a second page load?
 *
 * Paste this into the console of a kick.com channel page, in the browser you
 * actually use, signed in as you normally are. Then switch stream the way you
 * always do. It watches and prints a verdict.
 *
 * Why it exists: the fix for this was measured eight ways without a signed-in
 * session, and every one of them came back clean. The one thing left is what
 * YOUR session does, and asking you to "look and tell me" is exactly the tedious
 * part you flagged. This turns it into one paste and one switch.
 *
 * It reads. It does not click, send, store or transmit anything.
 *
 *   1. open a kick.com channel page, signed in
 *   2. paste this whole file into the console, press enter
 *   3. switch stream, the way you normally do
 *   4. read the verdict, or type  ktSwitchCheck.report()  to see it again
 */
(() => {
  const CHAT = '#channel-chatroom';
  const MARQUE = '[data-kt-id]';
  const BARRE = '#kt-floating-bar';

  const etat = () => {
    const salon = document.querySelector(CHAT);
    return {
      chemin: location.pathname,
      chat: !!salon,
      rangees: salon ? salon.querySelectorAll('[data-index]').length : 0,
      // The mark the observer leaves on a row it processed. Without it nothing on
      // this page will ever be translated, whatever the bar says.
      marquees: salon ? salon.querySelectorAll(MARQUE).length : 0,
      barre: !!document.querySelector(BARRE),
      style: !!document.getElementById('kt-inject-style'),
    };
  };

  // A full document load wipes this, which is how the check tells a client-side
  // route from a reload without needing any browser API.
  const marqueurSession = 'kt-switch-check-' + Math.random().toString(36).slice(2, 8);
  try {
    sessionStorage.setItem('ktSwitchCheck', marqueurSession);
  } catch {
    /* storage refused: the reload test degrades, the rest still works */
  }

  const depart = etat();
  const debut = Date.now();
  let switchVu = null;
  let apres = null;
  let minuteur = null;

  console.log(
    '%ckick-switch-check armé',
    'color:#53fc18;font-weight:bold',
    '\n  page actuelle :',
    depart.chat ? `${depart.rangees} lignes, ${depart.marquees} vues par l'extension` : 'pas de chat',
    '\n  Change de stream maintenant, comme tu le fais d’habitude.',
  );

  if (depart.chat && depart.marquees === 0) {
    console.warn(
      "  Attention : sur CETTE page, l'extension n'a encore marqué aucune ligne.\n" +
        '  Laisse quelques messages arriver avant de changer, sinon le point de départ\n' +
        "  ne vaut rien et le verdict non plus.",
    );
  }

  function verdict() {
    if (!apres) return;
    const rechargee = (() => {
      try {
        return sessionStorage.getItem('ktSwitchCheck') !== marqueurSession;
      } catch {
        return null;
      }
    })();
    const ok = apres.chat && apres.marquees > 0;
    const lignes = [
      '',
      '=== kick-switch-check ===',
      `  changement vu après       ${Math.round((switchVu - debut) / 1000)}s`,
      `  document rechargé         ${rechargee === null ? 'inconnu' : rechargee ? 'OUI' : 'non (route client)'}`,
      `  chat sur la page          ${apres.chat ? `oui, ${apres.rangees} lignes` : 'NON'}`,
      `  lignes vues par l’ext.    ${apres.marquees}`,
      `  barre                     ${apres.barre ? 'oui' : 'NON'}`,
      `  script de contenu         ${apres.style ? 'présent' : 'ABSENT'}`,
      '',
    ];
    if (ok) {
      lignes.push('  VERDICT : ça marche sans recharger. Le bug est fermé.');
    } else if (!apres.chat) {
      lignes.push(
        '  VERDICT : pas de chat sur la nouvelle page (chaîne hors ligne ?).',
        '            Refais l’essai sur une chaîne en direct.',
      );
    } else if (!apres.style) {
      lignes.push(
        '  VERDICT : le script de contenu n’est PAS sur la page. Ce n’est pas le',
        '            rattachement de route, c’est l’injection elle-même.',
      );
    } else {
      lignes.push(
        '  VERDICT : le chat est là et l’extension ne l’a pas pris. C’EST LE BUG.',
        `            Recharge la page : si ça repart, colle ces lignes telles quelles.`,
      );
    }
    console.log('%c' + lignes.join('\n'), ok ? 'color:#53fc18' : 'color:#ff6b6b');
  }

  // Poll rather than hook: a console snippet runs in the page's own world, but
  // the site's router owns pushState there and wrapping it would fight it. The
  // URL is the one thing both worlds agree on.
  let dernier = location.pathname;
  const tic = setInterval(() => {
    if (location.pathname === dernier) return;
    dernier = location.pathname;
    switchVu = Date.now();
    console.log('  changement détecté, mesure dans 12s…');
    clearInterval(tic);
    clearTimeout(minuteur);
    setTimeout(() => {
      apres = etat();
      verdict();
    }, 12000);
  }, 400);

  // A full reload kills this script, and that is itself the answer: the snippet
  // is gone, so the reader is told up front rather than left waiting.
  minuteur = setTimeout(() => {
    if (!switchVu) {
      clearInterval(tic);
      console.log(
        '%c  Aucun changement de stream en 3 minutes. Recolle le script quand tu veux réessayer.',
        'color:#888',
      );
    }
  }, 180000);

  window.ktSwitchCheck = { etat, report: verdict, depart };
  console.log(
    '  Si la page se recharge entièrement au changement, ce script disparaît avec elle :',
    '\n  c’est déjà une réponse, et dans ce cas recolle-le sur la nouvelle page pour la mesurer.',
  );
})();
