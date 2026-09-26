// Ce que la detection rend de bout en bout sur la shlyokavitsa, avant contre
// apres. La colonne AVANT est figee ici parce qu'elle a ete mesuree sur le code
// d'avant les marqueurs `bg` : sans elle, "franc eparpille" est une phrase et
// pas une mesure, et l'argument "notre reponse fausse vaut mieux que la sienne"
// ne se verifie plus une fois le changement fait.
//
// Ce qui compte autant que la langue rendue : `sl` doit rester VIDE partout.
// `romanisedLanguage` n'est pas une reponse sure, pour la meme raison que
// l'arabizi, donc le moteur doit continuer a detecter seul. Une entree qui
// remonterait jusqu'a `confidentLanguage` demanderait au moteur de lire du
// cyrillique la ou il n'y en a pas.
//
// Lancer avec tsx, le fichier importe du TypeScript.
const { detectLanguage, confidentLanguage } = await import('../../src/content/langDetect.ts');

/** texte, langue rendue AVANT les marqueurs bg, ce que la ligne est vraiment. */
const LIGNES = {
  'shlyokavitsa tenue a l ecart': [
    ['mnogo dobre igra', undefined, 'bg'],
    ['mnogo smeshno', 'pl', 'bg'],
    ['az sam tuk', 'id', 'bg'],
    ['ai stiga be', 'sv', 'bg'],
  ],
  'collision russe romanise': [
    ['eto bylo mnogo smeshno', undefined, 'ru'],
    ['mnogo smeshno segodnya', 'pl', 'ru'],
    ['ochen mnogo ludey tut', 'ru', 'ru'],
    ['spasibo bylo smeshno', 'ru', 'ru'],
  ],
};

let vues = 0;
let slNonVide = 0;
let mieux = 0;
let pire = 0;

for (const [titre, lignes] of Object.entries(LIGNES)) {
  console.log(`\n## ${titre}\n`);
  for (const [texte, avant, vraie] of lignes) {
    const apres = detectLanguage(texte);
    const sl = confidentLanguage(texte);
    vues += 1;
    if (sl !== undefined) slNonVide += 1;
    const avantJuste = avant === vraie;
    const apresJuste = apres === vraie;
    if (!avantJuste && apresJuste) mieux += 1;
    if (avantJuste && !apresJuste) pire += 1;
    const fleche = avantJuste === apresJuste ? '   ' : apresJuste ? '+  ' : '-  ';
    console.log(
      `  ${fleche}${JSON.stringify(texte).padEnd(28)} ` +
        `vraie ${vraie}  avant ${String(avant).padEnd(9)} apres ${String(apres).padEnd(9)} sl ${String(sl ?? '(vide)')}`,
    );
  }
}

if (vues === 0) {
  console.error('SONDE MUETTE: aucune ligne evaluee.');
  process.exit(2);
}

console.log(`\n${mieux} ligne(s) devenues justes, ${pire} devenue(s) fausses, sur ${vues}`);

if (slNonVide > 0) {
  console.error(
    `FAIL: ${slNonVide} ligne(s) partent avec une langue source declaree. ` +
      'Un marqueur romanise ne doit jamais atteindre `confidentLanguage`.',
  );
  process.exit(1);
}
console.log('sl vide sur les 8 lignes : le moteur detecte toujours seul');
