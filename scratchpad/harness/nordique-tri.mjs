/**
 * LE TRI INTERIEUR DANOIS-NORVEGIEN, et ce qui lui manque.
 *
 * `porte-diagnostic.mjs` separe deux causes de silence et la reponse a change
 * de camp pour cette paire. Cote norvegien, 34 lignes Tatoeba n'ouvrent pas la
 * porte, mais QUARANTE-SIX l'ouvrent sans que rien ne tranche derriere. Ce
 * n'est donc plus le declencheur qu'il faut etoffer, c'est `norvegienOuDanois`.
 *
 * Ce que ce script cherche est une SEQUENCE et pas un mot, parce que le tour
 * precedent a mesure le rapport : onze mots plus quatre sequences valent dix
 * lignes, les sequences seules en valent sept, les mots seuls trois. Ce qui
 * separe ces deux langues est presque toujours une lettre DANS un mot, `bøger`
 * contre `bøker`, et une sequence porte sur n'importe quel mot.
 *
 * LE SEUIL EST ZERO ET PAS TROIS. Le tri se fait entre DEUX langues : une ligne
 * de l'autre cote n'est pas du bruit de fond, c'est une erreur. C'est deja ce
 * qui a fait refuser `kj`, `skj` et `gj` au tour precedent.
 *
 * Le bruit se compte sur TOUTES les lignes des deux langues et pas seulement
 * sur celles qui entrent dans la porte : une ligne qui n'entre pas aujourd'hui
 * peut entrer demain, des que le declencheur bouge. C'est la lecon que `je` a
 * coutee du cote malais.
 *
 *   node --import tsx scratchpad/harness/nordique-tri.mjs
 */
import { LANG_CORPUS } from '../../src/content/langCorpus.ts';
import { LANG_CHAT } from '../../src/content/langChatCorpus.ts';
import { LANG_CHAT2 } from '../../src/content/langChatCorpus2.ts';
import { LANG_CHAT3 } from '../../src/content/langChatCorpus3.ts';
import { confidentLanguage } from '../../src/content/langDetect.ts';

const par = { no: [], da: [], sv: [] };
for (const c of [LANG_CORPUS, LANG_CHAT, LANG_CHAT2, LANG_CHAT3]) {
  for (const l of ['no', 'da', 'sv']) for (const t of c[l] ?? []) par[l].push(t);
}
console.log(`no ${par.no.length} lignes, da ${par.da.length}, sv ${par.sv.length}.`);

const muettes = {
  no: par.no.filter((t) => confidentLanguage(t) === undefined),
  da: par.da.filter((t) => confidentLanguage(t) === undefined),
};
console.log(`muettes aujourd hui : no ${muettes.no.length}, da ${muettes.da.length}.\n`);

/** Toutes les sous-chaines de 2 a 4 lettres, minuscules, d'un corpus. */
function sequences(lignes) {
  const vu = new Map();
  for (const t of lignes) {
    const s = t.toLowerCase();
    const dedans = new Set();
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= s.length; i++) {
        const bout = s.slice(i, i + n);
        if (!/^[a-zåäöæøéü]+$/.test(bout)) continue;
        dedans.add(bout);
      }
    }
    for (const bout of dedans) vu.set(bout, (vu.get(bout) ?? 0) + 1);
  }
  return vu;
}

const vuNo = sequences(par.no);
const vuDa = sequences(par.da);
const vuSv = sequences(par.sv);

function propose(cible, vuCible, vuAutre, nomAutre) {
  const out = [];
  for (const [bout, n] of vuCible) {
    if (n < 3) continue;
    if (vuAutre.get(bout)) continue;
    const ferme = muettes[cible].filter((t) => t.toLowerCase().includes(bout)).length;
    out.push([bout, n, ferme, vuSv.get(bout) ?? 0]);
  }
  // Une sequence dont une autre, plus courte, fait deja le travail est du bruit.
  const gardes = out.filter(([bout]) => {
    for (let n = 2; n < bout.length; n++) {
      for (let i = 0; i + n <= bout.length; i++) {
        const court = bout.slice(i, i + n);
        if (court !== bout && out.some(([b]) => b === court)) return false;
      }
    }
    return true;
  });
  gardes.sort((a, b) => b[2] - a[2] || b[1] - a[1]);
  console.log(`\n=== ${cible}, sequences que ${nomAutre} n ecrit JAMAIS (>= 3 lignes) ===`);
  console.log('sequence   lignes   muettes qu elle prendrait   sv');
  for (const [bout, n, ferme, sv] of gardes.slice(0, 30)) {
    console.log(`  ${bout.padEnd(8)} ${String(n).padStart(4)}   ${String(ferme).padStart(6)}                     ${sv}`);
  }
  return gardes;
}

propose('no', vuNo, vuDa, 'le danois');
propose('da', vuDa, vuNo, 'le norvegien');
