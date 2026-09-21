/**
 * Les lignes qui changent de langue en cours de route.
 *
 * Test-only module, comme les deux autres corpus, et le meme garde statique
 * l'empeche d'entrer dans le bundle livre.
 *
 * POURQUOI IL EXISTE. `SHORT_TEXT_MAX` vaut 20, et ce plafond est ce qui limite
 * tout le reste : le lexique de mots courts est la seule chose capable de servir
 * les 26 langues latines, et il ne s'applique qu'aux lignes de vingt caracteres
 * ou moins. Le catalan, l'indonesien et le malais en ont fait la demonstration :
 * on peut leur ecrire des mots exclusifs et ils ne gagnent presque rien sur de la
 * prose, parce que la prose depasse la borne.
 *
 * La borne a ete posee sur une mesure, et son commentaire dans `langDetect.ts`
 * la resume : montee a 30 elle gagnait des lignes etrangeres et en cassait
 * d'autres, et ce qui a decide est le MELANGE DE LANGUES. "merci bro that was
 * insane" part au moteur en `sl=fr` et disparait pour un lecteur francophone.
 *
 * Or ni Tatoeba ni le corpus de chat ne contiennent une seule ligne melangee.
 * Les deux bancs sont donc structurellement incapables de voir le risque qui
 * justifie la borne, et ils montreraient un gain franc en la levant. C'est un
 * piege, pas un resultat, et ce fichier existe pour qu'on ne tombe pas dedans.
 *
 * CE QUE MESURE CE BANC. Pour une ligne melangee, la bonne reponse du chemin sur
 * est le SILENCE. Nommer une langue sur une ligne qui en contient deux, c'est
 * soit la faire effacer pour "deja dans ta langue" alors que la moitie ne l'est
 * pas, soit imposer au moteur une langue source qui ne couvre que la moitie du
 * texte. Le chiffre a lire est donc le nombre de lignes NOMMEES : plus il est
 * bas, mieux c'est, et c'est l'inverse des deux autres bancs.
 *
 * Il sert a une decision precise et a une seule : peut-on lever
 * `SHORT_TEXT_MAX` ? Le banc de chat dit ce que la levee rapporterait, celui-ci
 * dit ce qu'elle couterait, et aucun des deux ne se suffit.
 *
 * MEME RESERVE que le corpus de chat : ces lignes sont ecrites par ce projet.
 * Elles ne prouvent pas un taux, elles exposent un mecanisme. Le mecanisme, lui,
 * est reel et documente dans `langDetect.ts` depuis la passe qui a fixe la borne.
 *
 * Construction : chaque ligne porte un mot de `SHORT_WORD_LANG` d'un cote et de
 * l'anglais de chat de l'autre, parce que c'est le melange qu'un chat produit
 * vraiment. Les longueurs vont de 15 a 45 caracteres pour que la borne puisse
 * etre deplacee et mesuree a chaque cran.
 */
export const LANG_MIXED: readonly string[] = [
  // Salutation ou remerciement dans une langue, reaction en anglais.
  'merci bro that was insane',
  'gracias man that was sick',
  'danke dude i needed that',
  'grazie bro you are cracked',
  'obrigado man that was clean',
  'tesekkur ederim that was huge',
  'dziekuje mate that was crazy',
  'kiitos man that was actually nuts',
  'tack dude that was so clean',
  'dank je wel that was great',

  // Reaction dans une langue, commentaire en anglais.
  'no me lo creo that actually happened',
  'putain that was close',
  'krass that was way too easy',
  'davvero that was unreal',
  'nao acredito that was so lucky',
  'inanmiyorum that was a fluke',
  'nie wierze that actually worked',
  'ei voi olla that was insane',
  'det ar inte sant that was clean',
  'niet te geloven that was perfect',

  // Anglais d'abord, langue etrangere ensuite.
  'that was actually insane muito bom',
  'he is cracked bardzo dobrze',
  'chat is going crazy que risa',
  'first time here bonjour tout le monde',
  'this is so good sehr gut gemacht',
  'stream is lagging molto male',
  'who else is watching alguien mas',
  'so close vraiment dommage',
  'he has no chance hic sansi yok',
  'same thing every time zawsze to samo',

  // Deux langues etrangeres dans la meme ligne, sans anglais.
  'merci beaucoup muchas gracias',
  'danke schon grazie mille',
  'obrigado muito gracias amigo',
  'salut hola que tal',
  'ciao bonjour a tous',

  // Pseudo ou citation dans une autre langue, le reste en anglais.
  'shoutout to niet_te_geloven in chat',
  'that clip called merci beaucoup was wild',
  'the guy named bardzo just subbed',
  'someone said tamam and left',
  'he keeps saying vamos every round',

  // Lignes courtes melangees, sous la borne actuelle de 20.
  'merci bro',
  'danke man',
  'gracias dude',
  'grazie mate',
  'tack man',
  'kiitos bro',
  'obrigado man',
  'salut guys',
  'hola chat',
  'ciao all',
];
