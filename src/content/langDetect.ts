import { franc } from 'franc-min';
import { francToIso2 } from '~/shared/languages';
import { laughterLanguage } from '~/shared/laughter';
import { isArabizi } from '~/shared/arabizi';
import { romanisedLanguage } from '~/shared/romanised';

const COMMON_SHORT_TOKENS = new Set([
  'lol',
  'lmao',
  'lmfao',
  'omg',
  'wtf',
  'gg',
  'ggs',
  'ez',
  'wp',
  'kek',
  'rip',
  'bruh',
  'bro',
  'sus',
  'yo',
  'hi',
  'hey',
  'haha',
  'yes',
  'no',
  'ok',
  'okay',
  'nice',
  'good',
  'bad',
  'pog',
  'pogchamp',
  'kappa',
  'omegalul',
  'monkas',
]);

/**
 * Chat words that identify their language on their own.
 *
 * franc is unreliable below ~20 characters: it returns 'und', the ASCII check
 * below then calls the message English, and `ignoreEnglish` silently drops it.
 * A short foreign message is therefore the case most likely to be missed, so
 * these words are checked first. Entries must be unambiguous against common
 * English and against each other, which is why near-twins across Spanish and
 * Portuguese ("gente", "vamos", "cara") are deliberately absent.
 *
 * La table a d'abord ete faite de salutations et de politesse, hola, merci,
 * danke, grazie, obrigado. C'est ce qu'on ecrit en pensant a du chat, et ce
 * n'est pas ce qu'un message quelconque contient. Mesure de ce que ca coutait :
 * sur onze lignes que la detection ne savait pas nommer, la moitie etait du
 * portugais et du turc ordinaires, "nao acredito nisso", "vamos ganhar essa",
 * "ne oluyor burada", sans un seul mot de la table. Un lecteur qui restreint ses
 * sources a `pt` perdait alors la moitie de son portugais, et pareil en turc.
 *
 * Le second jeu d'entrees est donc fait de mots de STRUCTURE, ceux qui reviennent
 * dans n'importe quelle phrase. Ils suivent la meme regle et c'est elle qui
 * decide des paires es/pt, ou l'orthographe separe nettement : nao contre no,
 * hoje contre hoy, agora contre ahora, pode contre puede, estao contre estan,
 * essa contre esa.
 */
const SHORT_WORD_LANG = new Map<string, string>([
  ['hola', 'es'], ['gracias', 'es'], ['buenas', 'es'], ['buenos', 'es'], ['adios', 'es'],
  ['adiós', 'es'], ['vale', 'es'], ['venga', 'es'], ['joder', 'es'], ['oye', 'es'],
  ['chaval', 'es'], ['hostia', 'es'], ['mucho', 'es'], ['muchas', 'es'], ['siempre', 'es'],
  ['entonces', 'es'], ['también', 'es'], ['tambien', 'es'], ['ahora', 'es'],

  ['salut', 'fr'], ['bonjour', 'fr'], ['bonsoir', 'fr'], ['merci', 'fr'], ['oui', 'fr'],
  ['ouais', 'fr'], ['voilà', 'fr'], ['voila', 'fr'], ['putain', 'fr'], ['mdr', 'fr'],
  ['ptdr', 'fr'], ['quoi', 'fr'], ['alors', 'fr'], ['toujours', 'fr'], ['jamais', 'fr'],
  ['beaucoup', 'fr'], ['très', 'fr'], ['pourquoi', 'fr'], ['enfin', 'fr'],

  ['obrigado', 'pt'], ['obrigada', 'pt'], ['valeu', 'pt'], ['mano', 'pt'], ['saudade', 'pt'],
  ['você', 'pt'], ['voce', 'pt'], ['então', 'pt'], ['entao', 'pt'], ['muito', 'pt'],
  ['muita', 'pt'], ['beleza', 'pt'], ['caralho', 'pt'], ['porra', 'pt'], ['rapaz', 'pt'],
  ['também', 'pt'], ['tambem', 'pt'],

  ['danke', 'de'], ['hallo', 'de'], ['tschüss', 'de'], ['bitte', 'de'], ['nicht', 'de'],
  ['doch', 'de'], ['geil', 'de'], ['krass', 'de'], ['vielen', 'de'], ['gerne', 'de'],
  ['wirklich', 'de'], ['natürlich', 'de'], ['warum', 'de'], ['weil', 'de'], ['aber', 'de'],
  ['immer', 'de'], ['nein', 'de'],

  ['ciao', 'it'], ['grazie', 'it'], ['prego', 'it'], ['allora', 'it'], ['perché', 'it'],
  ['perche', 'it'], ['però', 'it'], ['quindi', 'it'], ['davvero', 'it'], ['ragazzi', 'it'],
  ['cazzo', 'it'], ['magari', 'it'], ['comunque', 'it'], ['anche', 'it'], ['adesso', 'it'],
  ['oggi', 'it'],

  ['selam', 'tr'], ['merhaba', 'tr'], ['tamam', 'tr'], ['güzel', 'tr'], ['guzel', 'tr'],
  ['kanka', 'tr'], ['tesekkur', 'tr'], ['evet', 'tr'],   ['hayir', 'tr'], 
  // Mots de structure. Meme regle que ci-dessus : chacun est separe de son
  // jumeau dans l'autre langue par l'orthographe, pas par le contexte.
  ['hace', 'es'], ['alguien', 'es'], ['puede', 'es'], ['estan', 'es'], ['están', 'es'],
  ['nadie', 'es'], ['eso', 'es'], ['esa', 'es'],

  ['nao', 'pt'], ['não', 'pt'], ['hoje', 'pt'], ['agora', 'pt'], ['pode', 'pt'],
  ['estao', 'pt'], ['estão', 'pt'], ['essa', 'pt'], ['esse', 'pt'], ['isso', 'pt'],
  ['alguem', 'pt'], ['alguém', 'pt'],

  ['vraiment', 'fr'], ['rien', 'fr'], ['mec', 'fr'],

  ['jemand', 'de'], ['denn', 'de'], ['ist', 'de'],

  ['qualcuno', 'it'], ['questo', 'it'], ['bene', 'it'],

  ['burada', 'tr'], ['oluyor', 'tr'], ['bir', 'tr'], ['için', 'tr'], ['icin', 'tr'],
  ['degil', 'tr'],

  // L'ANGLAIS, et il est entre en dernier parce qu'il est le cas particulier.
  //
  // Ajouter l'anglais a cette table ne change pas seulement une detection, ca
  // change ce que `ignoreEnglish` EFFACE : une ligne nommee `en` pour un lecteur
  // anglophone disparait. C'est correct quand la ligne est vraiment anglaise, et
  // c'est pour ca que chaque entree est un mot que l'anglais seul ecrit, mesure
  // sur les 5490 lignes des trois corpus.
  //
  // Le vote unanime fait ici un travail qu'il ne fait nulle part ailleurs. Vingt
  // -neuf des soixante lignes melangees portent `that`, et elles ne deviennent
  // pas anglaises pour autant : leur moitie etrangere vote pour sa langue, les
  // deux votes se contredisent et la ligne rend `undefined`. Mesure : les lignes
  // melangees nommees restent a dix, exactement les memes. Donner une voix a
  // l'anglais rend le detecteur PLUS silencieux sur le melange, pas moins.
  //
  // DEHORS : `what` prend une ligne slovaque, `have` trois danoises, `was` huit
  // allemandes et trois neerlandaises, `like` trois norvegiennes, `just` quatre
  // langues, `been` une allemande, `which` une japonaise. `stream` et `chat`
  // sont dans toutes les langues du corpus de chat, ce qui est exactement ce
  // qu'on attend d'un mot de jargon de plateforme.
  ['you', 'en'], ['that', 'en'], ['this', 'en'], ['with', 'en'], ['they', 'en'],
  ['about', 'en'], ['there', 'en'], ['were', 'en'], ['would', 'en'], ['could', 'en'],
  ['should', 'en'], ['because', 'en'], ['something', 'en'], ['everyone', 'en'],
  ['nothing', 'en'], ['really', 'en'], ['watching', 'en'],

  // Une troisieme couche de lexique, et elle vise le SILENCE plutot que les
  // langues sans regle : les lignes de chat qui ne portent aucun marqueur et ne
  // sont que des phrases ordinaires. `il est trop fort`, `wat gebeurt er nou`,
  // `mi folyik itt` n'ont ni lettre propre ni terminaison propre.
  //
  // Les mots sont choisis pour leur frequence dans la langue, pas dans le corpus
  // de chat, et c'est la precaution qui compte : ce corpus est ecrit par ce
  // projet, donc y prendre des mots puis y mesurer le gain ne mesurerait rien.
  // TATOEBA, lui, est independant et emploie les memes mots outils, donc c'est
  // son chiffre qui fait foi ici.
  //
  // DEHORS : `dans` est la danse en norvegien, `viens` est `un` en letton, `sa`
  // est tagalog sur 33 lignes, `kan` couvre cinq langues, `deje` est un
  // subjonctif espagnol, `volumen` est allemand, `vad` est `sauvage` en hongrois,
  // `godt` est norvegien autant que danois, `mis` est espagnol, `ingen` couvre
  // les trois scandinaves. `vamos` et `creo` mesurent propres sur les deux
  // corpus mais apparaissent sur le banc MELANGE, ce qui suffit a les ecarter.
  ['est', 'fr'], ['trop', 'fr'], ['chez', 'fr'], ['avec', 'fr'], ['sont', 'fr'],
  ['fait', 'fr'], ['comme', 'fr'],
  ['wat', 'nl'], ['het', 'nl'], ['een', 'nl'], ['nou', 'nl'], ['zet', 'nl'],
  ['goed', 'nl'], ['maar', 'nl'], ['ook', 'nl'], ['voor', 'nl'], ['gaat', 'nl'],
  ['deze', 'nl'],
  ['här', 'sv'], ['hur', 'sv'], ['hon', 'sv'], ['ska', 'sv'], ['vill', 'sv'],
  ['riktigt', 'sv'],
  ['čo', 'sk'], ['keď', 'sk'],
  ['opp', 'no'], ['nettopp', 'no'], ['litt', 'no'],
  ['folyik', 'hu'], ['valaki', 'hu'], ['hangot', 'hu'], ['csak', 'hu'], ['hogy', 'hu'],
  ['siin', 'et'], ['toimub', 'et'], ['keegi', 'et'], ['täna', 'et'], ['kuidas', 'et'],
  ['täällä', 'fi'], ['tapahtuu', 'fi'], ['onko', 'fi'], ['ketään', 'fi'], ['paljon', 'fi'],
  ['sker', 'da'], ['nogen', 'da'], ['rigtig', 'da'],
  ['qué', 'es'], ['pasando', 'es'], ['sube', 'es'], ['esto', 'es'], ['increíble', 'es'],
  ['che', 'it'], ['facendo', 'it'], ['alza', 'it'], ['giocando', 'it'], ['appena', 'it'],
  ['arrivato', 'it'], ['sfortuna', 'it'], ['manca', 'it'], ['niente', 'it'], ['vede', 'it'],
  ['întâmplă', 'ro'], ['cineva', 'ro'], ['joacă', 'ro'], ['tocmai', 'ro'], ['intrat', 'ro'],
  ['cred', 'ro'], ['blochează', 'ro'], ['durează', 'ro'],

  // Les vingt langues latines que la table ne couvrait pas. Le lexique etait la
  // seule chose capable de servir un chat latin et il ne parlait que six langues
  // sur vingt-six ; c'est ce que le banc de chat a rendu impossible a ignorer.
  //
  // Meme regle que ci-dessus et meme discipline que MOTS_RUSSES : chaque entree
  // est la parce que les langues concurrentes ecrivent AUTRE CHOSE, et la mesure
  // ne fait qu'opposer un veto. Criblees contre les 5040 lignes de Tatoeba ET
  // les 390 lignes de chat, 5430 au total, zero occurrence ailleurs exigee.
  //
  // Les variantes sans diacritiques sont la exprès. Un chat sur telephone ecrit
  // `czesc`, `vielä` devient `viela`, `mulțumesc` devient `multumesc` ; sans
  // elles la table ne sert que la moitie des gens qui ecrivent ces langues.
  //
  // CE QUE LE CRIBLE A REJETE, et il a bien travaille :
  //   mig dig sig  proposes pour le danois, ce sont des mots SUEDOIS, 9, 2 et 7
  //                lignes. Ils ne servent que derriere la porte ø/æ, qui a deja
  //                exclu le suedois, et c'est exactement pourquoi la regle de
  //                paire existe.
  //   meg   propose pour le norvegien : NEUF lignes hongroises.
  //   som   propose pour le slovaque : danois, norvegien et suedois.
  //   ako   propose pour le tagalog : slovaque, 5 lignes.  aqui : portugais.
  //   tak   danois, mais aussi tcheque, polonais et malais.  moi : francais.
  //   este  roumain, mais aussi espagnol et portugais.  nic : tcheque.
  //
  // CE QUE LA MESURE A LAISSE PASSER ET QUI SORT QUAND MEME, protocole 4.6 du
  // handoff : 120 lignes ne prouvent pas une absence.
  //   echt  mesure propre, c'est de l'allemand courant.
  //   heel  mesure propre, c'est de l'anglais.   tots  pareil.
  //   nem   mesure propre pour le hongrois, c'est du portugais courant.
  //   qua   mesure propre pour le vietnamien, c'est de l'italien.
  //   roi   idem, c'est du francais.   chao : espagnol.   dito : italien.
  //   kdo   propose pour le slovene, c'est du tcheque.
  //   sveiki  propose pour le letton, c'est aussi du lituanien.
  //   vel   propose pour le lituanien, c'est du danois et du norvegien.
  //   deg seg  propres a la mesure, ce sont des mots suedois. Ils restent dans
  //            la regle de paire et n'entrent pas ici.
  //   hvorfor  danois ET norvegien, donc il ne nomme ni l'un ni l'autre.
  //   cam on   deux mots : cette table est indexee par TOKEN, une entree a
  //            espace ne peut jamais correspondre. Piege a ne pas reintroduire.
  ['niet', 'nl'], ['gewoon', 'nl'], ['niks', 'nl'], ['altijd', 'nl'], ['iemand', 'nl'],
  ['waarom', 'nl'], ['zie', 'nl'], ['wel', 'nl'],

  ['och', 'sv'], ['inte', 'sv'], ['mycket', 'sv'], ['tack', 'sv'], ['varfor', 'sv'],
  ['varför', 'sv'], ['nagon', 'sv'], ['någon', 'sv'], ['aldrig', 'sv'],

  ['hvad', 'da'], ['meget', 'da'], ['altid', 'da'], ['noget', 'da'],

  ['hva', 'no'], ['mye', 'no'], ['veldig', 'no'], ['takk', 'no'], ['noen', 'no'],

  ['kiitos', 'fi'], ['tosi', 'fi'], ['viela', 'fi'], ['vielä', 'fi'], ['miksi', 'fi'],
  ['kaikki', 'fi'], ['mutta', 'fi'], ['mita', 'fi'], ['mitä', 'fi'],

  ['aitah', 'et'], ['aitäh', 'et'], ['väga', 'et'], ['tere', 'et'], ['miks', 'et'],
  ['jalle', 'et'], ['jälle', 'et'], ['praegu', 'et'], ['midagi', 'et'],

  ['bardzo', 'pl'], ['dzieki', 'pl'], ['dzięki', 'pl'], ['czesc', 'pl'],   ['jeszcze', 'pl'], ['wszystko', 'pl'], ['dlaczego', 'pl'], ['ktos', 'pl'], 
  ['jsem', 'cs'], ['neni', 'cs'], ['není', 'cs'], ['dekuju', 'cs'],   ['jeste', 'cs'], ['vzdycky', 'cs'], ['vždycky', 'cs'], ['proc', 'cs'],
  ['proč', 'cs'],

  ['dakujem', 'sk'], ['ďakujem', 'sk'], ['ešte', 'sk'], ['preco', 'sk'],
  ['prečo', 'sk'], ['vzdy', 'sk'], ['vždy', 'sk'],

  ['foarte', 'ro'], ['multumesc', 'ro'], ['acum', 'ro'], ['nimic', 'ro'],
  ['cand', 'ro'], ['când', 'ro'], ['iarasi', 'ro'], ['bine', 'ro'],

  ['khong', 'vi'], ['không', 'vi'], ['duoc', 'vi'], ['được', 'vi'], ['rồi', 'vi'],
  ['quá', 'vi'],

  ['banget', 'id'], ['gak', 'id'], ['nggak', 'id'], ['gimana', 'id'], ['udah', 'id'],
  ['aja', 'id'], ['nih', 'id'], ['dong', 'id'], ['sih', 'id'],

  ['macam', 'ms'], ['betul', 'ms'], ['sikit', 'ms'], ['tengok', 'ms'], ['awak', 'ms'],
  ['jugak', 'ms'], ['nak', 'ms'], ['memang', 'ms'],

  ['nagyon', 'hu'], ['koszi', 'hu'], ['köszi', 'hu'], ['szia', 'hu'], ['miert', 'hu'],
  ['miért', 'hu'], ['mindig', 'hu'], ['megint', 'hu'], ['semmi', 'hu'],

  ['molt', 'ca'], ['aixo', 'ca'], ['això', 'ca'], ['perque', 'ca'], ['perquè', 'ca'],
  ['amb', 'ca'], ['gracies', 'ca'], ['gràcies', 'ca'],
  ['són', 'ca'], ['què', 'ca'], ['més', 'ca'], ['també', 'ca'],
  ['aquest', 'ca'], ['aquesta', 'ca'], ['aquests', 'ca'], ['dels', 'ca'], ['avui', 'ca'],
  ['ahir', 'ca'], ['demà', 'ca'], ['seva', 'ca'], ['meva', 'ca'],
  ['nosaltres', 'ca'], ['vosaltres', 'ca'], ['tothom', 'ca'], ['ningú', 'ca'], ['ningu', 'ca'], ['tambe', 'ca'], ['gaire', 'ca'],

  ['zelo', 'sl'], ['hvala', 'sl'], ['zakaj', 'sl'], ['spet', 'sl'], ['tukaj', 'sl'],
  ['kaj', 'sl'], ['lahko', 'sl'], ['nekaj', 'sl'], ['ampak', 'sl'], ['nisem', 'sl'],
  ['kdaj', 'sl'], ['prav', 'sl'], ['tudi', 'sl'], ['ker', 'sl'], ['zdaj', 'sl'],
  ['saj', 'sl'], ['vse', 'sl'], ['sva', 'sl'], ['bova', 'sl'],
  ['vedno', 'sl'], ['danes', 'sl'],

  ['labai', 'lt'], ['aciu', 'lt'], ['ačiū', 'lt'], ['labas', 'lt'], ['kodel', 'lt'],
  ['nieko', 'lt'], ['dabar', 'lt'], ['visada', 'lt'],

  ['loti', 'lv'], ['paldies', 'lv'], ['kapec', 'lv'],   ['tagad', 'lv'], ['vienmer', 'lv'], ['atkal', 'lv'],

  ['ang', 'tl'], ['naman', 'tl'], ['mga', 'tl'], ['siya', 'tl'], ['talaga', 'tl'], ['salamat', 'tl'], ['grabe', 'tl'],
  ['sobrang', 'tl'], ['yan', 'tl'], ['wala', 'tl'],

  // Quatrieme couche, meme methode, meme crible. Les rejets de ce tour :
  // `igen` est suedois sur quatre lignes, `ingenting` aussi, `taas` est
  // estonien, `zvuk` est tcheque autant que slovaque. `happened` et `crazy`
  // mesurent propres sur les deux corpus et apparaissent sur le banc MELANGE.
  // Les mots proprement malais, `tiada teruk nampak berlaku`, ne sont PAS ici :
  // ils vont dans la porte malais-indonesien, ou ils ne risquent pas de voler
  // une ligne indonesienne, parce que l'indonesien emploie certains d'entre eux.
  ['niekto', 'sk'], ['práve', 'sk'], ['prave', 'sk'], ['výborne', 'sk'], ['vyborne', 'sk'],
  ['hrá', 'sk'], ['hra', 'sk'],
  ['endnu', 'da'], ['elendigt', 'da'],
  ['believe', 'en'], ['anyone', 'en'], ['today', 'en'],
  ['noch', 'de'], ['wieder', 'de'], ['keine', 'de'], ['gerade', 'de'],
  ['hoe', 'nl'], ['nog', 'nl'], ['geen', 'nl'], ['zijn', 'nl'], ['heeft', 'nl'],
  ['keer', 'nl'], ['vandaag', 'nl'],
  ['tänään', 'fi'], ['tanaan', 'fi'], ['hyvin', 'fi'], ['mikä', 'fi'], ['mika', 'fi'],
  ['mitään', 'fi'], ['mitaan', 'fi'],
  ['igjen', 'no'], ['lenge', 'no'], ['sjanse', 'no'],
]);

/**
 * Longest message still treated as "short" for detection purposes.
 *
 * Monte a 30, mesure, et redescendu. Le gain etait reel : sur 13 lignes
 * etrangeres de 23 a 31 caracteres portant un mot de la table, 10 lues juste a
 * 20 et 12 a 30, et sur 8 lignes anglaises portant elles aussi un mot de la
 * table le degat restait a 2, un veto sur un `eng` explicite de franc payant
 * l'ecart. Ce que ce banc-la ne pouvait pas voir, c'est le message qui change de
 * langue en cours de route. Sur 8 lignes melangees, passer de 20 a 30 fait
 * passer les lignes tuees avant l'appel de 3 a 6 et les `sl` declares sur une
 * seule moitie de 0 a 4 : "merci bro that was insane" part alors au moteur en
 * `sl=fr` et disparait pour un lecteur francophone. Le veto ne rattrape rien la,
 * franc ne rend `eng` sur aucune des 8.
 *
 * La borne tient donc a 20 parce que le melange de langues est plus frequent
 * dans un chat que la phrase etrangere de 25 caracteres, pas parce que 20 aurait
 * ete mesure comme optimal.
 */
const SHORT_TEXT_MAX = 20;

/** Unanimous vote from the lexicon, or undefined when the words disagree. */
function detectByShortWords(text: string): string | undefined {
  let vote: string | undefined;
  for (const token of text.toLowerCase().split(/[^\p{L}]+/u)) {
    // Une forme de rire est un fait sur le texte au meme titre qu'un mot de la
    // table : `jajaja` est espagnol, `kkkk` bresilien, `wkwk` indonesien. C'est
    // ce qui permet a `confidentLanguage` de s'en servir, alors qu'il refuse la
    // reponse de franc. `haha`, `lol` et `xd` ne marquent rien et ne votent pas.
    const lang = token ? (SHORT_WORD_LANG.get(token) ?? laughterLanguage(token)) : undefined;
    if (!lang) continue;
    if (vote && vote !== lang) return undefined;
    vote = lang;
  }
  return vote;
}

/**
 * Une lettre qu'une seule des 43 ecrit vaut une ecriture entiere.
 *
 * Le pre-controle d'ecriture ne sert que les alphabets complets, donc les 27
 * langues latines n'avaient pour tout recours que franc, dont `confidentLanguage`
 * refuse la reponse. Mais une LETTRE qu'une seule langue de la liste emploie
 * identifie cette langue aussi surement qu'une ecriture entiere, et c'est une
 * recherche et non une statistique : sa place est donc sur le chemin sur.
 *
 * S'applique a toute longueur, contrairement au lexique de mots courts borne a
 * 20 caracteres, et passe AVANT lui. L'ordre est mesure et non suppose, le
 * detail est sur l'appel dans `detectByLookup`.
 *
 * CE QUI EST DEHORS, et c'est la moitie du travail. Une lettre partagee par deux
 * langues de la liste ne prouve rien :
 *   ä    allemand, suedois, finnois, estonien, slovaque.
 *   ô    francais autant que slovaque.  õ  portugais autant qu'estonien.
 *   ą ę  polonais autant que lituanien : MESURE, 20 et 6 lignes lituaniennes.
 *   ø æ  danois ET norvegien, donc ils separent du suedois sans separer les deux
 *        l'un de l'autre. Il leur faut du lexique.
 *   c s z a carons  tcheque, slovaque, slovene, croate.  ö ü  une demi-douzaine.
 *
 * Le polonais ne prend PAS ł, et c'est la seule correction que le banc a imposee
 * a la table telle qu'elle avait ete concue. La lettre est bien polonaise seule,
 * mais elle voyage dans les noms propres : une ligne slovaque du corpus parle
 * des enfants de Łazarz, ne porte aucune lettre slovaque exclusive, et le vote
 * ci-dessous ne la sauve donc pas. Un nom propre n'est pas un fait sur la langue
 * de la phrase. Le remplacement mesure fait mieux des deux cotes : żźćśń prend
 * 70 lignes polonaises contre 48 pour ł, et zero ailleurs.
 *
 * Le turc `ı` est le i sans point U+0131 et non le i ordinaire ; verifie, `/ı/iu`
 * ne rend vrai ni sur `I` ni sur `i`, donc le drapeau `i` est sans danger ici et
 * il rattrape `Ğ`. Le roumain s'ecrit ici avec la virgule souscrite U+0219 et
 * U+021B, distincte de la cedille turque, donc les deux jeux ne se croisent pas.
 * Le catalan s'identifie par le point volat `l·l`, une sequence et non une lettre.
 *
 * QUATRE LANGUES ONT ETE AJOUTEES UNE PASSE PLUS TARD, et le fait qu'elles
 * aient ete oubliees est plus instructif que leur gain. La table avait ete
 * concue en cherchant les diacritiques exotiques, ceux qu'on remarque, et elle
 * avait saute les plus ordinaires parce qu'ils sont familiers :
 *   ñ  espagnol. Aucune autre des 43 ne l'ecrit, le catalan dit ny et le
 *      portugais nh. RESERVE ecrite : le tagalog l'admet officiellement dans
 *      les emprunts espagnols et les noms propres. Zero ligne mesuree sur les
 *      deux corpus, mais c'est la seule entree de cette table dont
 *      l'exclusivite repose sur un usage et non sur un alphabet.
 *   ß  allemand seul.      œ û  francais seuls.
 *   ā ē ī  letton, et ce sont les plus gros du lot : 72, 45 et 52 lignes sur
 *      120, contre 33 pour le jeu ģķļņ qui etait deja la. La langue la moins
 *      bien servie de la table l'etait parce qu'on avait pris ses lettres rares
 *      et laisse ses lettres frequentes.
 * `ū` reste dehors, le lituanien l'ecrit aussi, onze lignes.
 *
 * Ces quatre-la ont vide la liste des langues que le chemin sur ne sait jamais
 * nommer : vingt-six au depart de ce chantier, zero depuis. Chercher ce qui
 * manque dans une table vaut mieux que raffiner ce qui y est deja.
 *
 * `da fi no sl et` n'ont aucune lettre exclusive et ne sont pas dans la table :
 * ils attendent du lexique.
 */
const LETTRES_EXCLUSIVES: ReadonlyArray<readonly [RegExp, string]> = [
  [/[řěů]/iu, 'cs'],
  [/[ľĺŕ]/iu, 'sk'],
  [/[żźćśń]/iu, 'pl'],
  [/[őű]/iu, 'hu'],
  // La plus protectrice du fichier, et c'est l'ablation qui l'a montre : la
  // retirer coute 42 lignes justes sur Tatoeba ET ajoute une erreur, `lt -> pt`
  // passe de 1 a 2 et `Ar ji mano draugė?` part au portugais. Une regle qui
  // empeche une faute en plus d'en gagner quarante-deux.
  [/[ėįų]/iu, 'lt'],
  [/[ģķļņāēī]/iu, 'lv'],
  // Le s cedille U+015F est turc et rien d'autre dans les 43 : le roumain ecrit
  // sa propre lettre avec la virgule souscrite U+0219, juste en dessous, et le
  // crible ne trouve pas UNE ligne roumaine qui porte la forme turque. 53 lignes
  // gratuites qui attendaient dans la table depuis le debut.
  [/[ığş]/iu, 'tr'],
  [/[șț]/iu, 'ro'],
  [/l·l/iu, 'ca'],
  // Le vietnamien empile un ton sur une voyelle qui porte deja un accent, et
  // Unicode precompose le resultat. Aucune des 42 autres n'ecrit ces caracteres,
  // et la table n'en avait que trois. Le crible en a rendu trente-deux de plus,
  // sur 437 lignes des quatre corpus.
  //
  // DEHORS : `ù`, que l'italien ecrit dans `piu`. C'est le seul de la liste que
  // le crible signale partage, et c'est exactement le genre de caractere qu'une
  // relecture a l'oeil aurait laisse entrer.
  [
    /[ơưđạấốếờủảợậệớộắữởểịầừặũềựẽọứụỏửổẹằ]/iu,
    'vi',
  ],
  [/ñ/iu, 'es'],
  [/ß/iu, 'de'],
  [/[œû]/iu, 'fr'],
  // Trois SEQUENCES et non des lettres, comme le point volat catalan plus haut.
  // Elles servent les langues qui n'ont aucune lettre a elles : le finnois
  // double son y la ou l'estonien n'en a pas du tout, l'estonien double son o
  // barre la ou le finnois ecrit yö, et la terminaison portugaise -ção n'existe
  // nulle part ailleurs dans les 43.
  [/yy/iu, 'fi'],
  // L'harmonie vocalique finnoise : le finnois met un ä dans ses terminaisons la
  // ou l'estonien ne le fait pas, et aucune autre des 43 n'a ces suites en fin
  // de mot. C'est de la morphologie et non du lexique, donc ca porte sur
  // n'importe quelle phrase et pas seulement sur celles qui emploient un mot
  // connu, ce qui est exactement ce qui manque a une langue agglutinante.
  // DEHORS : -ään prend une ligne estonienne, -nud et -maks proposes pour
  // l'estonien en prennent une turque et une finnoise.
  [/(ssä|llä|ttä|vät|istä)([^\p{L}]|$)/iu, 'fi'],
  [/öö/iu, 'et'],
  [/ção/iu, 'pt'],
  // LE TAGALOG, la derniere langue de la matrice sans un seul marqueur.
  //
  // Il s'ecrit en latin nu, sans un diacritique, donc aucune passe de lettres ne
  // pouvait l'atteindre et il est reste a 28 lignes sur 120 pendant tout le
  // chantier. C'est la passe a MOTS du crible qui l'a rendu, et le chiffre etait
  // la depuis le debut : `ang` sur 56 lignes des quatre corpus et ZERO ailleurs.
  //
  // Ce sont des marqueurs grammaticaux et non du vocabulaire, ce qui est ce
  // qu'on veut : `ang` marque le sujet, `ng` le complement, `mga` le pluriel.
  // Une phrase tagalog en porte un presque toujours, quel que soit le sujet dont
  // elle parle. C'est la meme nature que la terminaison finnoise au-dessus, pas
  // celle d'une entree de lexique.
  //
  // CE QUI EST DEHORS, et le crible les donnait a bruit zero : `may`, que
  // l'anglais ecrit, `mo`, que l'italien familier ecrit, et `hindi`, qui est le
  // nom d'une langue dans une phrase anglaise. Le critere (a) les refuse tous
  // les trois malgre une mesure propre, exactement comme `тут` et `echt`.
  [/(^|[^\p{L}])(ang|ng|mga|siya|niya)([^\p{L}]|$)/iu, 'tl'],
  // La ponctuation inversee, qui n'est pas une lettre du tout et qui est le
  // marqueur le plus large de cette table : 27 lignes espagnoles et zero
  // ailleurs. L'espagnol etait a zero sur ce chemin il y a deux passes.
  [/[¿¡]/u, 'es'],
  // Terminaisons. Elles portent sur n'importe quelle phrase, contrairement a un
  // mot de lexique qui ne porte que sur celles qui l'emploient, et c'est ce qui
  // les rend interessantes pour les langues sans lettre propre.
  //   -ción  espagnol, contre -ção portugais et -zione italien : les trois
  //          langues ecrivent le meme suffixe latin de trois facons.
  //   -eux   francais, onze lignes, la plus grosse de ce groupe.
  //   -lijk -heid  neerlandais.  -cchi -zione -issimo  italien.
  // DEHORS : -cion sans accent est aussi portugais et catalan, -mente est
  // italien autant qu'espagnol et portugais, -ndo aussi, -gli prend trois lignes
  // lettones, -ait trois estoniennes, -ez et -ons une douzaine de langues.
  [/ción([^\p{L}]|$)/iu, 'es'],
  [/eux([^\p{L}]|$)/iu, 'fr'],
  [/(lijk|heid|sje)([^\p{L}]|$)/iu, 'nl'],
  [/(zione|issimo|cchi|glia)([^\p{L}]|$)/iu, 'it'],
  // Un second groupe de terminaisons, et il n'a pas le meme STATUT que le
  // premier, ce qui vaut d'etre dit plutot que noye.
  //
  // Les entrees ci-dessus ont ete choisies en sachant ce que la langue ecrit, et
  // la mesure n'a fait que les valider. Celles-ci ont ete TROUVEES par une
  // recherche : extraire les n-grammes de fin de mot des lignes encore muettes
  // d'une langue, garder ceux qui n'apparaissent dans aucune autre. C'est une
  // selection PAR la mesure, ce que le protocole interdit d'habitude, parce
  // qu'une absence sur 5490 lignes ne prouve pas une absence.
  //
  // Deux garde-fous ont ete appliques et ils sont la raison pour laquelle ce
  // groupe existe quand meme. D'abord l'extraction s'est faite sur la seule
  // moitie de reglage et la couverture a ete verifiee sur l'autre : elle
  // transfere a 75-80 %, donc ce sont des regularites et non des lignes apprises
  // par coeur. Ensuite, sur les motifs que la recherche a proposes, n'ont ete
  // gardes que ceux qu'on peut NOMMER : -nho diminutif, -eiro agentif, -dade
  // nominalisateur, -iamo premiere personne du pluriel, -simo superlatif, -ným
  // instrumental, -tste superlatif, -knya -nmu -anku possessifs. Tout ce qui
  // n'etait qu'une queue de mot est sorti, -mio, -gitu, -kde, -woon, -não.
  //
  // La recherche a aussi propose -nha, -chi, -aat, -lich et -lige, que
  // l'exposition complete a rejetes : deux lignes vietnamiennes, quatre
  // francaises, quatre finnoises, deux neerlandaises, sept langues.
  [/(nho|nha|eiro|eira|dade)([^\p{L}]|$)/iu, 'pt'],
  [/(iamo|simo|glio|tto|nno)([^\p{L}]|$)/iu, 'it'],
  [/(knya|nmu|anku)([^\p{L}]|$)/iu, 'id'],
  [/ným([^\p{L}]|$)/iu, 'sk'],
  // SEULE ENTREE DU FICHIER QUI RAPPORTE NEGATIF QUELQUE PART, et l'ablation
  // l'a trouvee : +8 lignes sur Tatoeba et +1 sur le corpus de reglage, mais
  // **-1 sur le corpus AVEUGLE**. Sans elle, une ligne de plus y est juste.
  //
  // Ce n'est pas une erreur qu'elle cause, la colonne des fausses ne bouge pas :
  // elle fait TAIRE cette ligne. Elle repond `nl` sur une ligne qui n'est pas
  // neerlandaise, un autre signal dit autre chose, le vote n'est plus unanime et
  // tout le monde se tait. C'est le mecanisme qui fonctionne comme prevu, le
  // silence plutot que la mauvaise reponse, et ca coute du rappel.
  //
  // Gardee : +9 contre -1, et la ligne perdue est un silence, pas une faute.
  [/(tste|aat|aal)([^\p{L}]|$)/iu, 'nl'],
  [/lich([^\p{L}]|$)/iu, 'de'],
  [/lige([^\p{L}]|$)/iu, 'da'],
  [/ait([^\p{L}]|$)/iu, 'fr'],
  [/(eix|itat)([^\p{L}]|$)/iu, 'ca'],
  [/(nje|nja|čno|vno)([^\p{L}]|$)/iu, 'sl'],
  [/(iya|yong|oong)([^\p{L}]|$)/iu, 'tl'],
  // Un troisieme groupe, extrait de TATOEBA seul et valide sur le corpus de chat
  // AVEUGLE, qui est la bonne facon de faire depuis qu'on sait que le lexique
  // memorise et que la morphologie non. La bande de plus de vingt caracteres
  // rend le meme rappel sur un corpus inconnu que sur celui de reglage, parce
  // qu'elle n'est servie que par des regles de cette forme.
  //   -ött -ában -ünk -ára -ért  suffixes de cas hongrois. Six, cinq et quatre
  //        lignes chacun, et ce sont de vraies desinences, pas des queues de mot.
  //   -szik  classe verbale hongroise.
  //   -ould -not -ity -day  anglais. `would could should`, `not cannot`.
  //   -aar -eken -iets  neerlandais.  -oir  infinitif francais.
  //   -eht -ufen  allemand.  -nys -uest  catalan.
  //
  // RESERVE sur -aar, la seule de ce groupe, et de la meme nature que celle de
  // `ñ` plus haut : l'allemand ecrit Haar et Paar. Zero ligne mesuree sur 135,
  // et le pari est que ces noms sont rares dans un chat la ou le neerlandais
  // ecrit maar, naar, waar, daar dans presque chaque phrase. Vingt-deux lignes
  // en face, c'est le plus gros marqueur du groupe.
  //
  // DEHORS malgre une mesure propre, protocole 4.6 : -mma est `mamma` en
  // italien, -tude est anglais autant que francais, -hte est `echte` en
  // neerlandais, -tic est anglais et francais.
  //
  // -ekt A ETE RETIRE APRES COUP et c'est le seul motif de cette table qu'un
  // corpus ait attrape apres son entree. Il mesurait propre sur les 5490 lignes
  // de Tatoeba et du premier chat, trois lignes neerlandaises et rien ailleurs.
  // Le corpus de reglage `langChatCorpus3`, ecrit ensuite, l'a fait tomber en
  // quatre lignes d'un coup : `perfekt` est allemand, suedois, norvegien et
  // danois, comme `direkt`, `korrekt` et `objekt`. Une absence sur 5490 lignes
  // ne prouve toujours rien, et c'est exactement ce que le protocole 4.6 dit.
  [/(ött|ában|ünk|ára|ért|szik)([^\p{L}]|$)/iu, 'hu'],
  [/(aar|eken|iets)([^\p{L}]|$)/iu, 'nl'],
  [/(ould|not|ity|day)([^\p{L}]|$)/iu, 'en'],
  [/oir([^\p{L}]|$)/iu, 'fr'],
  [/(eht|ufen)([^\p{L}]|$)/iu, 'de'],
  [/(nys|uest)([^\p{L}]|$)/iu, 'ca'],
  // Quatrieme groupe, et la difference avec le troisieme est la SOURCE : ces
  // motifs-la ont ete extraits du registre chat et non de la prose. Le groupe
  // precedent avait rapporte 76 lignes sur Tatoeba et une seule a l'aveugle,
  // parce qu'une regle tiree de la prose lit des formes flechies et que le chat
  // en ecrit peu. Celui-ci est extrait du corpus de reglage `langChatCorpus3`,
  // jamais du corpus aveugle, et mesure sur ce dernier.
  //   -ijn   neerlandais, seize lignes, le plus gros du lot : zijn, mijn, klein.
  //   -ght   anglais : right, night, thought.   -ople : people, couple.
  //   -tou   preterit portugais : voltou, gostou, estou.
  //   -gjen  norvegien, la ou le danois ecrit igen sans j.
  //   -stà   catalan, la ou l'italien ecrit sta sans accent.
  //   -ämä -eveel  finnois et neerlandais.
  // DEHORS : -indo est `lindo` en espagnol, -seen est de l'anglais, -tic est
  // anglais et francais, -hora -utti -jtra -gain sont des queues de mots.
  [/ijn([^\p{L}]|$)/iu, 'nl'],
  [/eveel([^\p{L}]|$)/iu, 'nl'],
  [/(ght|ople)([^\p{L}]|$)/iu, 'en'],
  [/tou([^\p{L}]|$)/iu, 'pt'],
  [/gjen([^\p{L}]|$)/iu, 'no'],
  [/stà([^\p{L}]|$)/iu, 'ca'],
  [/ämä([^\p{L}]|$)/iu, 'fi'],
];

/**
 * Quand la lettre ne nomme pas une langue mais une PAIRE, un mot tranche dedans.
 *
 * ø et æ sont la ou s'arretait la table du dessus : elles appartiennent au
 * danois ET au norvegien, donc elles ne nomment personne et elles etaient
 * ecartees pour ca. Mesure sur le corpus entier : elles ne touchent aucune des
 * quarante autres langues, 55 lignes danoises et 34 norvegiennes et rien
 * d'autre. Ce n'est donc pas un signal faible, c'est un signal FORT sur un
 * ensemble de deux, et il suffit d'un second tour pour choisir dedans.
 *
 * C'est la forme de `cantonaisOuChinois` et de `cyrilliqueQuelleLangue` : une
 * porte, puis une decision a l'interieur.
 *
 * CE QUE LA PORTE OFFRE GRATUITEMENT, et c'est ce qui rend la regle possible :
 * elle a deja exclu le suedois. mig, dig, sig et av sont inutilisables en
 * general parce que le suedois les ecrit aussi, neuf et trois lignes suedoises
 * du banc ; derriere la porte ils redeviennent des marqueurs propres. Un mot
 * ambigu dans les 43 peut etre net dans une paire.
 *
 * Les paires retenues opposent deux orthographes du meme mot, ce qui est plus
 * sur qu'un mot present d'un cote et absent de l'autre :
 *   meg deg seg  contre  mig dig sig       hva contre hvad
 *   av contre af         etter contre efter    noe noen contre noget nogen
 *
 * CE QUI EST DEHORS : `ikke` et `jeg` s'ecrivent pareil des deux cotes, 6 et 11
 * lignes danoises contre 11 et 13 norvegiennes, et ils sont ici comme temoins de
 * ce que les deux langues partagent vraiment. `fordi` et `bare` sont communs
 * aussi. Les deux jeux dans la meme ligne, ou aucun, rendent `undefined` : meme
 * vote unanime que partout ailleurs dans ce fichier.
 *
 * CE QUE CA NE FAIT PAS. La porte ne voit que 26 lignes danoises sur 60 et 18
 * norvegiennes sur 60, donc la regle laisse passer la majorite des deux langues.
 * Sortir de la liste a zero et fermer la paire sont deux choses differentes, et
 * c'est la meme lecon que le catalan une passe plus tot : `no -> sv` tombe de 48
 * a 41 et `da -> sv` de 44 a 42, ce qui est un progres et pas une fermeture.
 */
const LETTRES_DANO_NORVEGIENNES = /[øæ]/iu;
const MOTS_NORVEGIENS = /(^|[^\p{L}])(meg|deg|seg|hva|hvem|hvor|noe|noen|etter|av|ikkje)([^\p{L}]|$)/iu;
const MOTS_DANOIS = /(^|[^\p{L}])(mig|dig|sig|hvad|noget|nogen|efter|af|meget)([^\p{L}]|$)/iu;

/**
 * Le meme mecanisme a un cran de plus : une lettre qui nomme un TRIO.
 *
 * `ø` et `æ` nomment la paire danois-norvegien parce que le suedois ne les
 * ecrit pas. `å`, lui, est ecrit par les trois, donc il nomme le trio. Mesure
 * sur les deux corpus : les trois et personne d'autre, 28 lignes danoises, 40
 * norvegiennes et 48 suedoises.
 *
 * Deux etages, et l'ordre compte. Une ligne qui porte ø ou æ n'est pas suedoise
 * quoi qu'elle porte d'autre, donc elle va directement au tri danois-norvegien
 * ou mig, dig et sig sont surs. Une ligne qui n'a que å peut etre suedoise, donc
 * il faut d'abord sortir le suedois, et seulement apres se servir de mots qui
 * lui seraient ambigus.
 *
 * Ce qui separe le suedois de ses deux voisins est une orthographe differente du
 * meme mot, la forme la plus sure : jag contre jeg, inte contre ikke, och contre
 * og, är contre er, från contre fra. Mesure derriere la porte : jag 8 lignes
 * suedoises et zero des deux autres, inte 13 et zero, och 7 et zero, är 13 et
 * zero ; jeg 35 danoises et norvegiennes et zero suedoise, ikke 17 et zero.
 *
 * CE QUI EST DEHORS : `og` prend une ligne suedoise sur les cinquante, et `er`
 * en prend dix-neuf, parce que le suedois l'ecrit aussi. `till` prend une ligne
 * norvegienne. Aucun des trois n'entre, pour une ligne comme pour dix-neuf.
 */
const A_ROND_SCANDINAVE = /å/iu;
const MOTS_SUEDOIS = /(^|[^\p{L}])(jag|och|inte|är|från)([^\p{L}]|$)/iu;
const MOTS_DANO_NORVEGIENS = /(^|[^\p{L}])(jeg|ikke|til)([^\p{L}]|$)/iu;

/** Le tri interieur, appele une fois le suedois ecarte d'une facon ou d'une autre. */
function norvegienOuDanois(text: string): string | undefined {
  const no = MOTS_NORVEGIENS.test(text);
  const da = MOTS_DANOIS.test(text);
  if (no && !da) return 'no';
  if (da && !no) return 'da';
  return undefined;
}

/**
 * LA PORTE SANS LETTRE, et c'est ce que la paire scandinave attendait.
 *
 * Trois tours de regles de lettres n'ont pas bouge `no -> sv` ni `da -> sv`
 * d'une seule ligne, et la raison est structurelle : ni le danois ni le
 * norvegien n'ecrit une lettre que la table couvre, et leurs trois lettres a
 * eux, `å ø æ`, ne sont pas sur toutes leurs lignes.
 *
 * Le crible a sequences, `porte-candidats.mjs`, a rendu le chemin : `jeg` sur
 * 39 lignes norvegiennes et 35 danoises, `ikke` sur 28 et 25, et RIEN ailleurs.
 * Un MOT peut nommer une paire exactement comme une lettre, et le suedois ecrit
 * `jag` et `inte` a la place. Le bruit polonais de trois lignes que le crible
 * signale sur `jeg` est `jego`, et la borne de mot l'ecarte deja.
 *
 * Donc : une ligne qui porte un mot dano-norvegien et aucun mot suedois va au
 * tri interieur, qu'elle porte une lettre scandinave ou non. `å` reste le seul
 * cas ou il faut ecarter le suedois avant, parce qu'il l'ecrit aussi.
 */
function danoisOuNorvegien(text: string): string | undefined {
  if (LETTRES_DANO_NORVEGIENNES.test(text)) return norvegienOuDanois(text);
  const sv = MOTS_SUEDOIS.test(text);
  const dn = MOTS_DANO_NORVEGIENS.test(text);
  if (A_ROND_SCANDINAVE.test(text)) {
    if (sv && !dn) return 'sv';
    if (dn && !sv) return norvegienOuDanois(text);
    return undefined;
  }
  if (dn && !sv) return norvegienOuDanois(text);
  return undefined;
}

/**
 * LES PORTES PARTAGEES, en table plutot qu'une fonction par lettre.
 *
 * Une lettre ecrite par deux ou trois langues nomme une PAIRE et pas une langue,
 * et il suffit d'un second tour pour choisir dedans. Le fichier en a quatre
 * ecrites a la main plus haut, le nordique, le malais-indonesien, le scandinave
 * a trois et l'estonien-portugais, chacune avec sa logique propre.
 *
 * Celles-ci sont toutes de la meme forme, donc elles sont des DONNEES : une
 * lettre, la liste des langues qui l'ecrivent, et un jeu de mots par langue. Le
 * jeu de mots est partage entre les portes, donc ajouter une porte ne coute
 * qu'une ligne.
 *
 * CE QUE LA PORTE OFFRE, et c'est la raison d'etre de tout le mecanisme : elle
 * rend propres des mots impossibles en plein air. `der`, `die`, `das`, `ich`,
 * `ist` sont ecrits par le neerlandais et d'autres ; derriere `ä` il n'y a plus
 * de neerlandais. `att`, `det`, `som`, `har`, `med` sont danois et norvegiens ;
 * ni l'un ni l'autre n'ecrit `ä`. `som` seul touche onze lignes scandinaves en
 * plein air et aucune derriere `š`. `tak` est tcheque, polonais et malais, et
 * derriere `ó` il ne reste que le polonais.
 *
 * LE VOTE : une porte qui ne designe pas exactement une langue ne tranche pas,
 * et l'on passe a la porte suivante. Une ligne qui porte `ä` et `š` est donc
 * examinee deux fois, ce qui est correct : ce sont deux indices independants.
 *
 * MESURE derriere les deux plus grosses portes, sur les corpus de reglage :
 *   ä  fi=102 sv=77 et=53 de=15 sk=3, 160 lignes muettes avant la regle
 *   š  lt=57 lv=44 cs=38 sl=36 sk=31 et=1, 99 muettes
 *
 * Ce qui tranche le mieux entre deux langues proches est la MEME forme du meme
 * mot ecrite deux fois : `jsem` contre `som` contre `sem`, `jsou` contre `sú`,
 * `byl` contre `bol`, `ještě` contre `ešte`, `una` contre `uma`, `també` contre
 * `também`. Mieux qu'un vocabulaire distinct, qui a plus de chances d'exister
 * des deux cotes.
 *
 * CE QUI EST DEHORS : `je`, `to`, `na` sont communs a plusieurs slaves ; `ir`,
 * `kad`, `bet` sont lituaniens ET lettons ; `ja` et `oli` finnois ET estoniens ;
 * `que` francais, portugais ET catalan ; `para` et `está` espagnols ET
 * portugais. Le slovaque n'a pas de jeu derriere `ä`, ses trois lignes y restent
 * muettes, et c'est le comportement attendu d'une porte qui ne peut pas trancher.
 */
const JEUX_DE_PORTE: Readonly<Record<string, RegExp>> = {
  fi: /(^|[^\p{L}])(että|mutta|niin|kun|myös|vain|hän|ole|olen|täällä|tänään|mikä|mitä|kaikki|miksi)([^\p{L}]|$)/iu,
  sv: /(^|[^\p{L}])(och|inte|är|jag|att|det|som|för|har|med|den|till|hur|här|hon|vill)([^\p{L}]|$)/iu,
  et: /(^|[^\p{L}])(see|ta|ma|kas|aga|siis|väga|miks|midagi|praegu|kõik)([^\p{L}]|$)/iu,
  de: /(^|[^\p{L}])(nicht|der|die|das|ich|ist|und|mit|für|auf|ein|eine|sich|nur|aber|noch|wieder)([^\p{L}]|$)/iu,
  cs: /(^|[^\p{L}])(jsem|jsou|není|ještě|vždycky|proč|byl|jako|dobře)([^\p{L}]|$)/iu,
  sk: /(^|[^\p{L}])(som|sú|veľmi|ešte|prečo|vždy|bol|ako|dobre)([^\p{L}]|$)/iu,
  sl: /(^|[^\p{L}])(sem|lahko|nekaj|ampak|kaj|tudi|ker|zdaj|zelo|zakaj)([^\p{L}]|$)/iu,
  lt: /(^|[^\p{L}])(yra|labai|kaip|tai|jis|ką|dabar|nieko|taip)([^\p{L}]|$)/iu,
  lv: /(^|[^\p{L}])(ļoti|viņš|viņa|kāds|paldies|tagad|arī|nav)([^\p{L}]|$)/iu,
  hu: /(^|[^\p{L}])(hogy|nem|egy|csak|mint|nagyon|mindig|megint|semmi|miért)([^\p{L}]|$)/iu,
  pl: /(^|[^\p{L}])(jest|się|nasz|bardzo|jeszcze|wszystko|dlaczego|który)([^\p{L}]|$)/iu,
  vi: /(^|[^\p{L}])(với|của|một|không|được|rồi|quá|này|tôi)([^\p{L}]|$)/iu,
  es: /(^|[^\p{L}])(pero|muy|con|los|las|una|esto|esa|siempre)([^\p{L}]|$)/iu,
  pt: /(^|[^\p{L}])(uma|não|você|muito|isso|essa|também)([^\p{L}]|$)/iu,
  ca: /(^|[^\p{L}])(amb|això|què|molt|aquest|aquesta|també|més|són|una|vam)([^\p{L}]|$)/iu,
  fr: /(^|[^\p{L}])(est|avec|pour|dans|tout|comme|très|sont|fait)([^\p{L}]|$)/iu,
  tr: /(^|[^\p{L}])(bir|için|değil|çok|var|bu|şey|daha)([^\p{L}]|$)/iu,
  it: /(^|[^\p{L}])(allora|quindi|comunque|anche|adesso|perché|però|davvero|questo|sono|più|che|niente|una)([^\p{L}]|$)/iu,
  ro: /(^|[^\p{L}])(foarte|acum|nimic|când|care|pentru|sunt|cred|joacă|cineva)([^\p{L}]|$)/iu,
  nl: /(^|[^\p{L}])(niet|het|een|wat|voor|zijn|heeft|geen|hoe|nog|gewoon|maar)([^\p{L}]|$)/iu,
};

const PORTES_PARTAGEES: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  // Sortie du crible `porte-candidats.mjs` et non d'une relecture a l'oeil : la
  // plus large porte libre du fichier, 160 lignes sur les quatre corpus, et les
  // quatre langues qui l'ecrivent avaient deja leur jeu de mots. Meme famille
  // que `š` juste en dessous, a ceci pres que le letton ne l'ecrit pas.
  [/č/iu, ['sl', 'sk', 'cs', 'lt']],
  [/ä/iu, ['fi', 'sv', 'et', 'de']],
  [/š/iu, ['cs', 'sk', 'sl', 'lt', 'lv']],
  // Les quatre autres portes libres que le crible a rendues. Le roumain domine
  // `ă` a 103 lignes contre 7, le polonais domine `ą` et `ę`, et `ū` est la
  // seule des cinq ou les deux langues sont du meme ordre.
  [/ă/iu, ['ro', 'vi']],
  [/ą/iu, ['pl', 'lt']],
  [/ę/iu, ['pl', 'lt']],
  [/ū/iu, ['lv', 'lt']],
  // LES PORTES A MOT, troisieme passe du crible.
  //
  // Un TOKEN entier n'a pas le defaut des sequences ASCII juste en dessous : il
  // ne peut pas se declencher a l'interieur du mot qui tranche, parce que le
  // decoupage est le meme des deux cotes. C'est ce qui les rend utilisables la
  // ou `sz` et `dz` ne l'etaient pas.
  //
  // Mesure du crible, sur les quatre corpus :
  //   il            fr=37 it=21   bruit ZERO
  //   para por está es/pt          bruit 1
  //   co jak        cs/pl          bruit ZERO
  //   tas tik       lv/lt          bruit ZERO
  //   ce au         ro/fr          bruit ZERO
  //
  // DEHORS : `bet`, que le crible donne a bruit zero pour le lituanien et le
  // letton. C'est de l'anglais de chat courant, et le corpus n'en contient
  // simplement pas. Critere (a), comme `may` pour le tagalog.
  [/(^|[^\p{L}])(il)([^\p{L}]|$)/iu, ['fr', 'it']],
  [/(^|[^\p{L}])(para|por|está|vez)([^\p{L}]|$)/iu, ['es', 'pt']],
  [/(^|[^\p{L}])(co|jak)([^\p{L}]|$)/iu, ['cs', 'pl']],
  [/(^|[^\p{L}])(tas|tik)([^\p{L}]|$)/iu, ['lv', 'lt']],
  [/(^|[^\p{L}])(ce|au)([^\p{L}]|$)/iu, ['ro', 'fr']],
  // Descente du plancher du crible de huit lignes a quatre, deuxieme recolte.
  //
  // `že jeho dnes` vise `sk -> cs`, 18 lignes, et c'est la seule paire slave
  // encore ouverte. `oli` vise le couple finno-estonien, que rien ne separait en
  // plein air. `per` est catalan et italien, l'espagnol ecrit `por` et le
  // francais `par`.
  //
  // DEHORS PAR LE CRITERE (a), et c'est le meme filtre a chaque fois :
  //   cosa    donne a bruit zero pour ca/it, mais l'espagnol l'ecrit.
  //   die     de=18 nl=3, mais `die` EST dans le jeu allemand. Circulaire.
  //   ole     fi=8 et=3, mais `ole` EST dans le jeu finnois. Circulaire.
  //   mig sig sv/da, mais tous deux sont des mots qui TRANCHENT au nord.
  //   bet ar  lituanien et letton, mais `bet` est de l'anglais de chat.
  //
  // DEHORS PAR L'ABLATION, et c'est nouveau : `porte-ablation.mjs` mesure ce que
  // CHAQUE entree rapporte seule, en la retirant. `oli` pour fi/et et `jau` pour
  // lv/lt rapportent ZERO sur les quatre corpus, alors que le lot ou ils se
  // trouvaient rapportait +4. Un total de lot ne dit pas qui l'a gagne, et ces
  // deux-la seraient partis en production comme poids mort.
  [/(^|[^\p{L}])(že|jeho|dnes)([^\p{L}]|$)/iu, ['cs', 'sk']],
  [/(^|[^\p{L}])(per)([^\p{L}]|$)/iu, ['ca', 'it']],
  // PAS DE SEQUENCE ASCII ICI, et c'est un resultat mesure, pas un oubli.
  //
  // Le deuxieme passage du crible a rendu `sz` hongrois-polonais et `dz`
  // polonais-letton-slovaque, tous deux propres sur les quatre corpus. Le banc
  // des lignes melangees les a refuses, et la raison vaut pour toute sequence
  // ASCII : LE DECLENCHEUR PEUT VIVRE DANS LE MOT QUI TRANCHE. `bardzo` porte
  // `dz` et il EST le mot polonais du jeu, donc la porte s'ouvre sur le mot
  // qu'elle consulte ensuite. Les deux indices censes etre independants n'en
  // font qu'un, et la porte degenere en une entree de lexique sans la borne de
  // vingt caracteres qui tient le lexique. Mesure : trois lignes melangees
  // nommees `pl` par `dz`, dont `he is cracked bardzo dobrze`.
  //
  // `sz` a le meme defaut, `nasz`, `jeszcze` et `wszystko` le portent, et il ne
  // rapportait que deux lignes. Le corpus melange ne contient simplement aucune
  // ligne qui l'expose, ce qui ne prouve rien : c'est la lecon du corpus 3.
  //
  // Une porte a lettre accentuee n'a pas ce probleme : `ä` ne vit pas dans
  // `nicht`. Une porte de sequence demanderait de verifier que le declencheur
  // tombe HORS du mot trouve, et ca n'a pas paru valoir deux lignes.
  [/ü/iu, ['tr', 'de', 'et', 'hu']],
  [/ó/iu, ['hu', 'pl', 'vi', 'es', 'pt', 'ca', 'sk']],
  [/ú/iu, ['sk', 'hu', 'vi', 'es', 'pt', 'ca', 'cs']],
  [/ç/iu, ['tr', 'pt', 'fr', 'ca']],
  // La plus grosse de toutes : dix langues ecrivent le e accent aigu, et il y a
  // 145 lignes muettes derriere. Dix, c'est beaucoup pour une porte, mais les
  // jeux de mots ne se croisent pas et une porte qui ne tranche pas ne coute
  // rien : elle passe la main a la suivante.
  [/é/iu, ['fr', 'hu', 'ca', 'es', 'pt', 'cs', 'sk', 'it', 'nl', 'vi']],
  [/í/iu, ['sk', 'cs', 'es', 'hu', 'ca', 'pt', 'vi']],
  [/ö/iu, ['sv', 'hu', 'tr', 'de', 'fi']],
  // CINQ PORTES RETIREES PAR L'ABLATION, et c'est le resultat le plus utile
  // qu'elle ait donne : `[ďťň]` sk/cs, `ô` vi/sk/fr, `ê` pt/vi/fr, `â`
  // ro/vi/fr/pt et `ò` it/vi/ca rapportaient chacune ZERO sur les quatre
  // corpus. Trois d'entre elles etaient vivantes quand elles sont entrees et
  // sont mortes deux commits plus tard, quand les trente-cinq lettres
  // vietnamiennes ont nomme `vi` avant que la porte ne soit consultee.
  //
  // Un ajout peut donc TUER une entree existante ailleurs dans le fichier, et
  // rien dans les totaux ne le signale. Relancer l'ablation apres chaque lot.
  [/ý/iu, ['sk', 'cs', 'vi']],
  [/è/iu, ['it', 'ca', 'fr']],
  [/à/iu, ['fr', 'vi', 'ca', 'it']],
  [/ã/iu, ['pt', 'vi']],
  [/î/iu, ['ro', 'fr']],
  [/ì/iu, ['vi', 'it']],
];

function porteQuelleLangue(text: string): string | undefined {
  for (const [porte, langues] of PORTES_PARTAGEES) {
    if (!porte.test(text)) continue;
    const vus = langues.filter((l) => JEUX_DE_PORTE[l]!.test(text));
    if (vus.length === 1) return vus[0];
  }
  return undefined;
}

/**
 * L'estonien et le portugais, que le o barre reunit et que tout le reste separe.
 *
 * `õ` est la seule lettre que l'estonien pourrait avoir en propre, et il la
 * partage avec le portugais, qui l'ecrit dans põe, limões, corações. Elle etait
 * donc DEHORS de la table des lettres exclusives, comme ø et æ avant la regle de
 * paire. Mesure sur les deux corpus : 42 lignes estoniennes et UNE portugaise,
 * et rien d'autre nulle part. C'est la porte la plus deseequilibree du fichier,
 * et c'est ce qui la rend facile : les deux langues n'ont aucun mot commun.
 *
 * Meme forme que les trois autres portes, et c'est la quatrieme fois qu'elle
 * sert : le nordique, le malais-indonesien, le scandinave a trois, celle-ci.
 * Une lettre qui nomme un petit ensemble vaut mieux qu'une lettre qui ne nomme
 * personne, et il suffit d'un second tour pour choisir dedans.
 *
 * Derriere la porte, `on`, `ei`, `ma`, `ta`, `ja` et `see` redeviennent
 * utilisables alors qu'ils sont impossibles en plein air : `on` est anglais,
 * `ja` est allemand, neerlandais et finnois, `ta` est une demi-douzaine de
 * langues. C'est exactement ce que les trois autres portes offrent deja.
 */
const O_BARRE = /õ/iu;
const MOTS_ESTONIENS =
  /(^|[^\p{L}])(on|ei|ja|see|ta|ma|kõik|väga|miks|midagi|praegu|jälle|kas|aga|siis|nii|kui)([^\p{L}]|$)/iu;
const MOTS_PORTUGAIS =
  /(^|[^\p{L}])(que|não|nao|de|para|uma|com|isso|você|voce|mais|muito|está|esta)([^\p{L}]|$)/iu;

function estonienOuPortugais(text: string): string | undefined {
  if (!O_BARRE.test(text)) return undefined;
  const et = MOTS_ESTONIENS.test(text);
  const pt = MOTS_PORTUGAIS.test(text);
  if (et && !pt) return 'et';
  if (pt && !et) return 'pt';
  return undefined;
}

/**
 * Le malais et l'indonesien, la derniere paire de la matrice a n'avoir rien.
 *
 * `id -> ms` et `ms -> id` valent 49 et 38 lignes, le plus gros bloc restant, et
 * aucune des deux langues n'etait traitee nulle part. Elles ne se separent pas
 * par une lettre : elles s'ecrivent avec le meme alphabet latin nu, sans un seul
 * diacritique. Il ne reste que le lexique.
 *
 * Meme forme que le danois et le norvegien, et pour la meme raison : ce qui les
 * nomme d'abord, c'est la PAIRE. Une quinzaine de mots outils leur sont communs
 * et n'existent dans aucune des quarante autres langues, yang, tidak, dengan,
 * untuk, saya, ini, itu. Une ligne qui en porte un est malaise ou indonesienne,
 * point, et un second tour choisit dedans.
 *
 * CE QUE LA PORTE OFFRE, et c'est la meme chose qu'au nord : elle rend
 * utilisables des mots qui ne le seraient pas en plein air. `uang` touche une
 * ligne vietnamienne du banc et `mobil` une ligne italienne, donc aucun des deux
 * ne pourrait entrer dans `SHORT_WORD_LANG` ; derriere une porte qui exige deja
 * un mot outil malais-indonesien, ils ne coutent rien, et la mesure de bout en
 * bout le confirme, aucune confusion n'apparait nulle part.
 *
 * LES PAIRES qui tranchent opposent deux formes du meme mot, ce qui est plus sur
 * qu'une presence contre une absence :
 *   bisa contre boleh      coba contre cuba       karena contre kerana
 *   besok contre esok      kamar contre bilik     mau contre mahu
 *   saja contre sahaja     kamu contre awak       kayak contre macam
 *
 * CE QUI EST DEHORS :
 *   akan   mot outil des deux, mais c'est aussi du turc.
 *   anda   c'est de l'espagnol.   ada  c'est du turc, une ile.
 *   tak    dix lignes malaises, mais aussi tcheque, polonais, anglais et cinq
 *          autres. C'est le mot le plus frequent du malais familier et il est
 *          inutilisable.
 *   boleh  propose pour le malais, l'indonesien l'ecrit aussi, 2 contre 6.
 *   saja   propose pour l'indonesien, une ligne malaise le porte.
 *   kereta c'est bien la voiture en malais, mais l'indonesien dit kereta api
 *          pour le train. Mesure propre, sorti quand meme.
 *   lu gue  pronoms de l'indonesien de Jakarta, et `lu` touche vingt-trois
 *          autres langues. Le mot le plus typique du registre vise est le plus
 *          impossible a employer.
 *
 * CE QUE CA NE FAIT PAS, et le chiffre est petit exprès pour qu'on ne le
 * survende pas : la paire ne se ferme pas. `id -> ms` passe de 49 a 48. La prose
 * de Tatoeba dans ces deux langues est ecrite presque entierement avec ce
 * qu'elles partagent, et ce qui les separe vit dans le registre familier, que ce
 * corpus n'a pas. Le gain reel est ailleurs : treize lignes que le chemin sur ne
 * savait pas nommer, et qu'il nomme sans se tromper une seule fois.
 */
// `lagi` est entre au tour du corpus de paire, et c'est le SEUL des neuf mots
// partages que le crible rendait a en valoir la peine : les huit autres,
// `kamu sini makan sedang tahu bahasa berapa sekarang`, sont propres, partages,
// et rapportent ZERO ligne sur les cinq corpus. Mesure par ablation, mot a mot.
//
// Ce que ce zero dit vraiment, et c'est le resultat du tour : le declencheur
// n'est PAS ce qui bloque la paire. Les mots que ce crible peut rendre viennent
// des corpus paralleles, qui sont en registre neutre ; les mots partages du
// registre familier n'y sont pas, donc il ne peut pas les proposer. Voir
// `langChatPaire.test.ts`.
const MOTS_MALAIS_INDONESIENS =
  /(^|[^\p{L}])(yang|tidak|dengan|untuk|saya|ini|itu|dari|pada|sudah|mereka|dalam|lebih|orang|apa|lagi|tidur|siapa|baru)([^\p{L}]|$)/iu;
const MOTS_INDONESIENS =
  /(^|[^\p{L}])(bisa|uang|mobil|coba|karena|besok|kamar|kayak|nggak|gak|banget|gimana|udah|aja|nih|dong|sih|gue|kemarin)([^\p{L}]|$)/iu;
const MOTS_MALAIS =
  /(^|[^\p{L}])(kerana|sahaja|cuba|esok|bilik|mahu|jom|awak|tengok|macam|betul|sikit|jugak|memang|nak|tiada|teruk|nampak|berlaku)([^\p{L}]|$)/iu;

function malaisOuIndonesien(text: string): string | undefined {
  if (!MOTS_MALAIS_INDONESIENS.test(text)) return undefined;
  const id = MOTS_INDONESIENS.test(text);
  const ms = MOTS_MALAIS.test(text);
  if (id && !ms) return 'id';
  if (ms && !id) return 'ms';
  return undefined;
}

/**
 * Vote unanime, comme pour le lexique : deux jeux exclusifs de langues
 * DIFFERENTES dans la meme ligne, c'est une citation ou un pseudo, donc rien.
 *
 * La comparaison porte bien sur la langue et pas sur le nombre de
 * correspondances, et ca n'a pas toujours ete le cas. La version d'origine
 * rendait `undefined` des la DEUXIEME entree touchee, quelle qu'elle soit, ce
 * qui etait sans effet tant qu'une langue n'avait qu'une entree. Des que
 * l'italien en a eu deux, `-issimo` et `-simo`, une ligne portant les deux est
 * devenue muette alors que les deux disaient italien. Le test du banc latin sur
 * `sta giocando malissimo` l'a attrape.
 */
function detectByExclusiveLetter(text: string): string | undefined {
  let vote: string | undefined;
  for (const [lettres, lang] of LETTRES_EXCLUSIVES) {
    if (!lettres.test(text)) continue;
    if (vote && vote !== lang) return undefined;
    vote = lang;
  }
  return vote;
}

/**
 * L'ecriture arabe n'est pas une langue.
 *
 * Le pre-controle rendait `ar` pour tout ce qui s'ecrit dans le bloc arabe, et
 * il le rendait comme une reponse SURE, donc comme `sl` envoye au moteur.
 * Mesure sur douze lignes persanes : douze sur douze declarees arabes, avec
 * `sl=ar`. Le persan est une des 42 langues proposees et la fiche des stores
 * vend le sens droite-a-gauche par "arabe, hebreu, persan". Trois degats a la
 * fois : le moteur traduit depuis la mauvaise langue, le drapeau est faux, et
 * un lecteur arabophone voit chaque ligne persane sautee comme "deja dans ta
 * langue". franc, lui, sait : il rend `pes` sur sept de ces huit lignes, et il
 * n'etait jamais consulte puisque l'ecriture repondait avant lui.
 *
 * Ce qui separe les trois, ce sont des LETTRES, pas une statistique : le persan
 * ajoute pe, tcheh, jeh, gaf, keheh et farsi yeh au jeu arabe, et l'ourdou
 * ajoute encore tteh, ddal, rreh, noon ghunna, heh doachashmee, yeh barree et
 * heh goal par-dessus le persan. L'ourdou se teste donc EN PREMIER, sinon ses
 * lettres persanes le font passer pour du persan.
 *
 * Mesure de la regle : persan 11 sur 12, arabe 12 sur 12 sans un seul faux
 * positif, ourdou 4 sur 4. La ligne persane manquee, "salam be hame", ne
 * contient aucune lettre hors du jeu arabe et rien dans le texte ne permet de
 * la distinguer.
 *
 * L'ourdou rend `undefined` et non son code : il n'est pas dans les 42 langues
 * du produit, donc l'annoncer produirait un drapeau que rien ne sait dessiner.
 * Ce qui compte est qu'il ne soit plus annonce comme arabe.
 */
const LETTRES_PERSANES = /[پچژگکی]/u;
const LETTRES_OURDOUES = /[ٹڈڑںھےہ]/u;
/**
 * Le malais ecrit en jawi, qui est de l'ecriture arabe.
 *
 * Six des 120 lignes malaises du corpus ne sont pas en alphabet latin : Tatoeba
 * publie du `zsm` en jawi, et le pre-controle lisait leur ecriture correctement
 * pour en conclure `ar`. Cinq erreurs `ms -> ar` et une `ms -> fa`, soit six des
 * dix-huit erreurs restantes du chemin sur, sur une langue que le produit offre.
 *
 * Meme raisonnement que le persan juste au-dessus, meme forme : le jawi ajoute
 * des lettres au jeu arabe, donc ces lettres le nomment. nga, pa, ga et nya sont
 * mesurees sur les 5040 lignes et ne touchent que le malais, trois, deux, trois
 * et une ligne. ݢ et ۏ n'apparaissent nulle part dans le corpus mais sont jawi
 * seules et entrent au meme titre : une mesure a zero ne prouve pas une absence,
 * elle ne contredit rien.
 *
 * Le jawi se teste AVANT le persan et pas apres, parce qu'il emploie چ qui est
 * dans le jeu persan. Sans cet ordre, une ligne jawi portant un cheh ressort
 * persane, ce qui est exactement l'erreur `ms -> fa` mesuree.
 *
 * CE QUI EST DEHORS : چ, justement. Il est jawi ET persan, vingt-cinq lignes
 * persanes du banc contre une malaise, donc il est du mauvais cote du rapport.
 *
 * LA LIMITE, chiffree : trois des six lignes jawi ne portent aucune de ces
 * lettres et restent lues arabes. Le jawi partage l'essentiel de son jeu avec
 * l'arabe, exactement comme le chinois traditionnel partage l'essentiel du sien
 * avec le simplifie, et la meme phrase s'applique : ce qui reste demande de
 * sortir du niveau de la lettre.
 */
const LETTRES_JAWI = /[ڠڤڬڽݢۏ]/u;

/**
 * Le repli `ar` est une ELIMINATION et non une devinette, contrairement au repli
 * `ru` du cyrillique qui a ete retire. La difference est structurelle et vaut
 * d'etre ecrite, parce que les deux fonctions se ressemblent assez pour qu'on
 * veuille leur appliquer le meme correctif.
 *
 * Le persan, l'ourdou et le jawi sont l'arabe PLUS des lettres. L'arabe n'a donc
 * aucun marqueur positif a lui : il est ce qui reste quand aucune extension ne
 * se manifeste, et c'est une lecture. Le russe, lui, n'etait pas la base du
 * cyrillique, il en etait un membre parmi trois, et le nommer par defaut etait
 * une devinette. Rendre `undefined` ici ferait tomber l'arabe de 120 lignes a
 * presque rien sans corriger quoi que ce soit.
 */
function arabeOuPersan(text: string): string | undefined {
  if (LETTRES_OURDOUES.test(text)) return undefined;
  if (LETTRES_JAWI.test(text)) return 'ms';
  if (LETTRES_PERSANES.test(text)) return 'fa';
  return 'ar';
}

/**
 * L'ecriture cyrillique n'est pas une langue non plus.
 *
 * Signale par kil en testant sur une chaine mongole : le pre-controle rendait
 * `ru` pour tout ce qui s'ecrit en cyrillique, et le rendait comme une reponse
 * SURE. Mesure : vingt lignes mongoles sur vingt declarees russes avec `sl=ru`,
 * huit lignes ukrainiennes sur huit, huit bulgares sur huit. Le degat est le
 * meme que pour le persan pris pour de l'arabe, et il est pire ici parce que
 * franc ne peut pas rattraper : franc-min ne porte pas le mongol du tout, sa
 * liste cyrillique est rus, ukr, bos, srp, uzn, azj, koi, bel, bul, kaz.
 *
 * Le mongol se reconnait a deux voyelles que le russe n'a pas, ө et ү, et a une
 * poignee de particules qui reviennent dans presque toutes ses phrases. Mesure
 * de la couverture : les lettres seules prennent 8 lignes sur 20, les lettres
 * plus les particules en prennent 17, et l'ensemble fait ZERO faux positif sur
 * douze lignes russes, huit ukrainiennes et huit bulgares.
 *
 * Le mongol rend `undefined` et non un code : il n'est pas dans les 42 langues
 * du produit. Ce qui compte est qu'il cesse de partir au moteur en `sl=ru`, ce
 * qui demandait de traduire du mongol depuis le russe ; avec `sl` vide le moteur
 * detecte seul et rend une vraie traduction.
 *
 * L'ukrainien, lui, est dans les 42, donc il prend son code. Ses lettres propres
 * sont i, yi, ye et ge, absentes du russe : 6 lignes sur 8 a la mesure.
 *
 * Le bulgare, signale lui aussi par kil, n'a pas de lettre exclusive : il
 * partage l'alphabet russe. Ce qui le separe est l'inverse, une ABSENCE, plus
 * deux signaux positifs. Le russe ecrit ы, э et ё, le bulgare aucun des trois ;
 * le bulgare ecrit ъ comme une voyelle ordinaire la ou le russe l'emploie a
 * peine ; et sa copule au present, съм si сме сте са, n'existe pas en russe, qui
 * n'en a pas au present du tout.
 *
 * Le chiffre de couverture du bulgare est le seul de ce fichier qui ait ete
 * mesure DEUX fois, et la difference vaut d'etre gardee. Une premiere liste,
 * etendue jusqu'a couvrir le banc qui avait servi a l'ecrire, donnait 20 sur 20 ;
 * la meme regle sur douze lignes bulgares ecrites APRES elle donnait 4 sur 12.
 * Le premier chiffre ne mesurait que l'ajustement. La liste a ensuite ete
 * completee par PARADIGME, la copule entiere et les interrogatifs entiers,
 * jamais par la liste des ratés, et le chiffre tenu a l'ecart est monte a 7 sur
 * 12. C'est celui-la qui compte.
 *
 * Ce qui ne bouge pas, et c'est le cote qui protege : zero faux positif sur
 * vingt-huit lignes russes, dix ukrainiennes et six mongoles, aucune n'ayant
 * servi a batir quoi que ce soit.
 */
const LETTRES_MONGOLES = /[өү]/iu;
const MOTS_MONGOLS = /(^|[^\p{L}])(байна|байгаа|юм|вэ|бэ|сайхан|байлаа)([^\p{L}]|$)/iu;
const LETTRES_UKRAINIENNES = /[іїєґ]/iu;
const LETTRES_RUSSES = /[ыэё]/iu;
const ER_BULGARE = /ъ/iu;
/** L'article defini suffixe, que ni le russe ni l'ukrainien n'ont. */
const ARTICLE_BULGARE = /(ът|ата|ята)([^\p{L}]|$)/iu;
/** L'infinitif russe. Le bulgare n'en a pas, celui de l'ukrainien est -ти. */
const INFINITIF_RUSSE = /ть([^\p{L}]|$)/iu;

/**
 * Les mots russes, symetriques de MOTS_BULGARES, et choisis par CONTRASTE.
 *
 * Aucun n'est ici parce qu'il est frequent en russe : chacun est ici parce que
 * le bulgare et l'ukrainien disent autre chose. spasibo contre blagodarya et
 * dyakuyu, eto contre tova et tse, ochen contre mnogo et duzhe, gde contre kade
 * et de. Zero faux positif sur les 240 lignes bulgares et ukrainiennes du banc.
 *
 * CE QUI EST DEHORS, en deux familles, parce qu'elles ne se rejettent pas pour
 * la meme raison et qu'un futur lecteur voudra savoir laquelle il rouvre.
 *
 * Rejetes par la MESURE, sur les 120 lignes de chaque langue :
 *   да     vingt-neuf lignes bulgares. C'est le mot que tout le monde dit.
 *   ли     dix lignes bulgares.   все  deux.   просто, как, него  une chacun.
 *   что    une ligne ukrainienne. C'etait pourtant le candidat le plus evident
 *          du lot, et il est dehors pour une seule ligne, ce qui est la regle.
 *   знаю   deux ukrainiennes.     думаю  une.
 *
 * Rejetes malgre une mesure PROPRE, et c'est le garde-fou qui compte : cent
 * vingt lignes ne prouvent pas une absence, donc un mot qui mesure zero mais qui
 * existe vraiment ailleurs reste dehors.
 *   тут    zero ligne ici, et c'est de l'ukrainien courant.
 *   уже    zero ici, et l'ukrainien l'ecrit a cote de вже.
 *   из     zero ici, et le bulgare l'emploie au sens de "a travers".
 *   наш    zero ici, et il est commun aux trois.
 *
 * AVERTISSEMENT DE METHODE, paye une fois. Un premier ecran de ces candidats a
 * ete fait avec un regex ou la classe des lettres avait perdu sa barre oblique,
 * donc `[^p{L}]` au lieu de la borne de mot : elle ne bornait plus rien et le
 * test devenait une recherche de sous-chaine. `кто` ressortait alors
 * "contamine" par deux lignes bulgares qui etaient докторе et директорите.
 * Quatre mots ont ete rejetes a tort et sont rentres apres verification. Tout
 * ecran de ce genre doit imprimer la source de son regex et echouer si elle ne
 * contient pas ce qu'elle doit contenir.
 */
const MOTS_RUSSES =
  /(^|[^\p{L}])(кто|нет|они|его|можно|это|очень|сейчас|только|когда|хорошо|меня|тебя|ничего|нужно|давай|сколько|пока|больше|спасибо|привет|тоже|где|почему|здесь|сегодня|какой|вообще|лучше|понятно|молодец|смотрю|смотреть|происходит|отлично|отличная|вы|мы|всё|себя)([^\p{L}]|$)/iu;

/**
 * La terminaison d'adjectif masculin russe. L'ukrainien ecrit -ий et le bulgare
 * n'a pas de declinaison du tout. Mesure : 6 lignes russes, zero des deux
 * autres. Son jumeau -ий est DEHORS, il prend vingt lignes ukrainiennes.
 */
const ADJECTIF_RUSSE = /ый([^\p{L}]|$)/iu;
const MOTS_BULGARES =
  /(^|[^\p{L}])(съм|си|сме|сте|са|какво|кой|кога|къде|защо|много|добре|това|няма|ще|аз|мога|гледа|гледам|искам|този|започва|благодаря|страхотен|поздрави|дошли)([^\p{L}]|$)/iu;

/**
 * Le repli `ru` etait une DEVINETTE posee sur le chemin sans devinette.
 *
 * Cette fonction rendait `ru` pour toute ligne cyrillique qu'elle n'avait pas su
 * nommer autrement. Elle vit dans `detectByScript`, donc `confidentLanguage` la
 * prenait pour une lecture et l'envoyait au moteur comme langue source. C'etait
 * la source de 72 des 90 erreurs du chemin sur : 50 bulgares et 22 ukrainiennes
 * declarees russes, a elles seules les quatre cinquiemes du budget d'erreur.
 *
 * Ce que le banc a dit, et il a dit plus que corriger une erreur : le repli
 * `ru` etait AUSSI mauvais pour franc. En le retirant, `detectLanguage` gagne
 * sur les deux axes a la fois, 3325 a 3331 justes et 1024 a 975 faux. franc
 * modele rus, ukr et bul et il les separe mieux qu'une constante en dur. La
 * regle ne se taisait pas trop peu, elle parlait a la place de quelqu'un de
 * mieux renseigne.
 *
 * Le repli est donc `undefined`, et c'est l'idiome deja pose deux lignes plus
 * haut par le mongol : cyrillique sans marqueur reconnaissable, on se tait,
 * franc reprend la main.
 *
 * DEUX SIGNAUX POSITIFS rattrapent une partie du rappel perdu, et ils sont
 * choisis par exposition complete et non par commodite. Mesure sur la moitie de
 * reglage, 60 lignes par langue :
 *
 *   -ата -ят -ята   bulgare, l'article defini suffixe, que ni le russe ni
 *                   l'ukrainien n'ont. 0 faux positif.
 *   -ть             l'infinitif russe. Le bulgare n'a pas d'infinitif du tout
 *                   et celui de l'ukrainien est -ти. 0 ligne bulgare.
 *
 * CE QUI EST DEHORS, et c'est encore la moitie du travail. Chaque candidat a
 * ete mesure deux fois, sur la zone ambigue puis sur TOUTES les lignes, et les
 * deux mesures ne disent pas la meme chose :
 *   -ите   l'imperatif pluriel russe. La zone ambigue n'en montrait qu'une
 *          ligne russe, l'exposition complete en montre quatre. C'est le
 *          candidat qui aurait passe une mesure etroite.
 *   -ото   trois lignes russes.  -ого/-его  bulgare autant que russe, six
 *          lignes bulgares contre une russe, l'inverse de l'intuition.
 *   -та -то  presentes partout, dix a vingt-deux lignes de chaque langue.
 *   -ти    propose comme marqueur ukrainien, six lignes bulgares.
 *
 * Le `ть` russe touche six lignes ukrainiennes en exposition complete et n'en
 * touche aucune une fois le test ukrainien passe avant lui. Il DEPEND donc de
 * l'ordre des tests dans cette fonction, ce qui est vrai mais fragile : deplacer
 * le test ukrainien apres lui rendrait six lignes ukrainiennes russes.
 *
 * Moitie tenue a l'ecart, jamais lue avant que la regle soit ecrite : 32 erreurs
 * sur 180 lignes deviennent ZERO, et le rappel passe de 148 a 127 sur 180. Le
 * corpus entier dit la meme chose dans le meme sens, donc ce n'est pas un
 * reglage sur les donnees de reglage.
 */
function cyrilliqueQuelleLangue(text: string): string | undefined {
  if (LETTRES_MONGOLES.test(text) || MOTS_MONGOLS.test(text)) return undefined;
  if (LETTRES_UKRAINIENNES.test(text)) return 'uk';
  if (
    !LETTRES_RUSSES.test(text) &&
    (ER_BULGARE.test(text) || MOTS_BULGARES.test(text) || ARTICLE_BULGARE.test(text))
  ) {
    return 'bg';
  }
  if (
    LETTRES_RUSSES.test(text) ||
    INFINITIF_RUSSE.test(text) ||
    ADJECTIF_RUSSE.test(text) ||
    MOTS_RUSSES.test(text)
  ) {
    return 'ru';
  }
  return undefined;
}

/**
 * Le han n'est pas une langue non plus, et c'est la troisieme fois.
 *
 * Meme forme que le persan pris pour de l'arabe et le mongol pris pour du russe,
 * a une difference pres qui change tout : ici les deux langues partagent
 * l'ECRITURE ENTIERE. Le chinois ecrit standard et le cantonais vernaculaire
 * s'ecrivent tous les deux en caracteres han, et la majorite d'une ligne
 * cantonaise est faite de caracteres que le chinois standard emploie aussi. Une
 * regle de proportion, celle que ce fichier applique partout ailleurs, ne peut
 * donc pas servir : il faut une regle de PRESENCE, un seul marqueur suffit.
 *
 * Une regle de presence produit des faux positifs par construction, donc elle se
 * mesure des deux cotes ou elle ne vaut rien. Banc dans
 * scratchpad/harness/canto-bench.mjs, ecrit et non recolte : Kick n'a
 * pratiquement pas de chaine hongkongaise, et attendre qu'il y en ait une n'est
 * pas un plan. La moitie tenue a l'ecart a ete ecrite AVANT la regle.
 *
 * Ce que franc en dit : rien d'utilisable. Mesure directe, franc-min rend `cmn`
 * sur une phrase cantonaise complete et `und` sur une courte. Il n'a pas de
 * modele `yue`, donc le cantonais lui ressort mandarin, et `confidentLanguage`
 * refuse sa reponse de toute facon. Aucune bibliotheque legere ne fait mieux :
 * ELD ne porte pas `yue`, lingua non plus, cld3 est archive, et le seul modele
 * qui le porte vraiment, fastText lid.176, pese 917 Ko compresse contre un
 * budget de content script de 69 Ko. La table de caracteres est la seule voie.
 *
 * CE QUI EST DEHORS, et c'est la moitie du travail. Les candidats evidents sont
 * des pieges :
 *   係  vit dans 關係, mot courant du chinois standard. Le marqueur le plus
 *       frequent du cantonais est aussi celui qui casse le plus de lignes.
 *   晒  vit dans 晒太陽. 嗮, lui, est cantonais seul, donc c'est celui-la.
 *   喇  vit dans 喇叭. 咪 vit dans 咪表. 嘛, 啦, 好, 得, 返, 埋, 重, 邊, 度
 *       ont un sens cantonais ET un sens standard que la graphie ne separe pas.
 * Ce qui reste est un jeu ou chaque caractere est absent du chinois ecrit
 * moderne, pas seulement rare.
 *
 * Les marqueurs a deux caracteres portent leur propre risque, et il n'etait pas
 * theorique : le chinois s'ecrit sans espaces, donc 反而 suivi de 家裡 fabrique
 * 而家, et 依 suivi de 家長 fabrique 依家. Six lignes de chinois standard bâties
 * exprès sur ce defaut ont ete mises dans le seau qui protege, et elles ont pris
 * QUATRE marqueurs d'un coup : 而家, 依家, 食飯 et 咩.
 *
 * Les trois premiers sont sortis. Le cout est nul sur la moitie tenue a l'ecart
 * et de deux lignes sur celle d'ajustement, ou 依家幾點 et 食飯未 ne portaient
 * pas d'autre marqueur ; 我哋而家真係好攰 et 屋企人嗌我食飯 en portaient
 * d'autres et n'ont rien perdu. Un marqueur qui casse du chinois standard coute
 * plus cher qu'une ligne cantonaise manquee : le chinois standard marche
 * aujourd'hui.
 *
 * 咩 est reste, avec une garde. Son seul emploi en chinois standard est le cri
 * du mouton, et il est toujours redouble : 咩咩. La garde refuse le caractere
 * quand il touche son jumeau des deux cotes, ce qui laisse passer 咩事 et
 * 你估我唔知咩 et arrete 小羊咩咩叫. C'est la meme forme que l'absence de ы, э,
 * ё qui separe le bulgare du russe plus haut : un signal negatif, pas un
 * caractere de plus.
 *
 * 𨋢 est hors du plan multilingue de base. La boucle de detectByScript itere par
 * point de code, cette regle s'applique au texte entier, les deux le voient.
 */
const CARACTERES_CANTONAIS = /[唔嘅喺咗哋佢啲嘢冇嗰嚟㗎乜攰嘥噉喎嘞咁睇諗嗮畀冚]|(?<!咩)咩(?!咩)|\u{282E2}/u;
const MOTS_CANTONAIS = /點解|點樣|邊個|邊度|得閒|屋企|傾偈|靚仔|靚女|呢個|呢度/u;

/**
 * Simplifie ou traditionnel, et pourquoi c'est une question d'ECRITURE.
 *
 * franc n'a aucun modele trigramme pour le han. Il resout l'ecriture entiere en
 * `cmn`, et `FRANC_MAP` envoie `cmn` comme `zho` sur `zh`. Consequence mesuree
 * sur les 120 lignes traditionnelles du banc : 120 sur 120 repondues `zh`, cent
 * pour cent, drapeau de la Chine compris. Ce n'etait pas une regle a corriger,
 * c'etait une regle absente.
 *
 * CE QUE CE CHIFFRE VAUT, ET IL FAUT LE DIRE AVANT DE LE LIRE. Le corpus
 * traditionnel est decoupe du corpus `cmn` de Tatoeba par jeu de caracteres,
 * parce que Tatoeba n'a pas d'export traditionnel separe. La regle ci-dessous
 * lit le meme jeu de caracteres. Le rappel sur ce banc-la est donc la meme
 * phrase dite deux fois, pas une capacite mesuree, et c'est acceptable parce que
 * la distinction EST un jeu de caracteres : il n'y a rien d'autre a lire.
 *
 * Ce qui se mesure vraiment est l'autre cote, et il est propre : zero
 * croisement, aucune des 120 lignes traditionnelles ne porte un marqueur
 * simplifie et aucune des 120 simplifiees ne porte un marqueur traditionnel ;
 * aucune des 40 autres langues du banc ne declenche quoi que ce soit ; et 15
 * lignes traditionnelles et 33 simplifiees ne portent aucun marqueur du tout et
 * restent sans reponse, ce qui est correct.
 *
 * LE JAPONAIS est le seul vrai piege et il vient du fait que le japonais a fait
 * sa propre simplification. 会, 学, 実, 体, 万, 与, 区, 医, 点, 来, 国 s'ecrivent
 * en japonais comme en chinois simplifie, donc ils sont DEHORS de la liste
 * simplifiee ; 結, 議 et 龍 s'ecrivent en japonais comme en traditionnel, donc
 * ils sont dehors de la liste traditionnelle. Mesure : sur 120 lignes japonaises
 * du banc, quatre portaient un marqueur traditionnel avant ce tri, et les quatre
 * portaient des kana, donc `kana > 0` les avait deja prises plus haut. Le tri
 * est la ceinture, le kana est la bretelle.
 *
 * Le cantonais passe AVANT, et ce n'est pas un detail : le cantonais s'ecrit en
 * caracteres traditionnels, 81 de ses 120 lignes declenchent la liste
 * traditionnelle. Inverser les deux tests rendrait `zh-tw` sur du cantonais.
 */
const CARACTERES_TRADITIONNELS =
  /[這們麼說來對樣學實發應經覺讀體萬與樂區醫點關會單賣輕轉邊團圖廣壓國兩驗歲聲總濟開聽權氣灣嗎]/u;
const CARACTERES_SIMPLIFIES =
  /[这们么说对样实发应经觉读乐卖轻转边团图广压两验岁声总济开关听权气湾吗]/u;

function cantonaisOuChinois(text: string): string | undefined {
  if (CARACTERES_CANTONAIS.test(text) || MOTS_CANTONAIS.test(text)) return 'yue';
  const traditionnel = CARACTERES_TRADITIONNELS.test(text);
  const simplifie = CARACTERES_SIMPLIFIES.test(text);
  // Les deux ensemble, c'est du texte mixte ou une citation, et on ne tranche
  // pas. Ni l'un ni l'autre, c'est une ligne ecrite avec les caracteres que les
  // deux ecritures partagent, et il n'y a rien dans le texte qui permette de
  // choisir. Dans les deux cas franc reprend la main et `confidentLanguage`
  // refusera sa reponse, ce qui est le comportement d'avant.
  if (traditionnel && !simplifie) return 'zh-tw';
  if (simplifie && !traditionnel) return 'zh';
  return undefined;
}

/** Unicode script → language mapping. More reliable than franc on short texts. */
function detectByScript(text: string): string | undefined {
  // Count non-ASCII, non-space chars by script range.
  let han = 0; // CJK ideographs — ambiguous between Chinese and Japanese
  let kana = 0; // hiragana / katakana — exclusive to Japanese
  let hangul = 0;
  let arabic = 0;
  let cyrillic = 0;
  // L'hebreu est aussi peu ambigu que l'arabe depuis son ecriture, et il
  // manquait. Mesure : franc-min ne le couvre pas du tout, il rend `und` sur une
  // phrase hebraique complete, donc `detectLanguage` rendait undefined et le
  // pipeline ecartait le message pour langue inconnue. L'hebreu est pourtant une
  // des 42 langues proposees et la fiche des stores annonce l'ecriture de droite
  // a gauche par "arabe, hebreu, persan".
  let hebrew = 0;
  let thai = 0;
  let devanagari = 0;
  // Le bengali et le tamoul manquaient, et c'etait le meme trou que l'hebreu
  // avant lui : deux ecritures sans la moindre ambiguite, deux des 43 langues du
  // produit, et rien ici pour les compter. La consequence n'etait pas un drapeau
  // faux, franc les nomme par son regex d'ecriture ; elle etait que
  // `confidentLanguage` restait muet sur les deux, donc le moteur ne recevait
  // jamais leur langue source alors qu'elle se lit a coup sur.
  let bengali = 0;
  let tamil = 0;
  // Le grec manquait, et c'est le meme trou que l'hebreu puis le bengali et le
  // tamoul avant lui : une ecriture sans la moindre ambiguite, une des 43 langues
  // du produit, et rien ici pour la compter. Onzieme ecriture ajoutee au meme
  // endroit pour la meme raison.
  let greek = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c <= 0x7f || /\s/.test(ch)) continue;
    if (c >= 0x3040 && c <= 0x30ff) kana++;
    else if ((c >= 0x3400 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff)) han++;
    // Syllables, plus the compatibility jamo Korean chat writes on their own
    // (ㅋㅋ, ㅠㅠ, ㅇㅇ). Sans eux, une ligne de jamo nus ne nourrit aucune ecriture
    // et le denominateur ci-dessous vaut zero, donc plus rien n'est lu. Ce
    // correctif-la etait le symptome ; la cause etait le denominateur, qui
    // comptait tout le non-ASCII et est corrige plus bas.
    else if ((c >= 0xac00 && c <= 0xd7af) || (c >= 0x3130 && c <= 0x318f)) hangul++;
    else if (c >= 0x0600 && c <= 0x06ff) arabic++;
    else if (c >= 0x0590 && c <= 0x05ff) hebrew++;
    else if (c >= 0x0400 && c <= 0x04ff) cyrillic++;
    else if (c >= 0x0e00 && c <= 0x0e7f) thai++;
    else if (c >= 0x0900 && c <= 0x097f) devanagari++;
    // L'ecriture bengalie sert aussi l'assamais, qui n'est pas dans les 43, donc
    // la rendre `bn` est exact pour tout ce que le produit peut afficher.
    // L'ecriture tamoule ne sert que le tamoul.
    else if (c >= 0x0980 && c <= 0x09ff) bengali++;
    else if (c >= 0x0b80 && c <= 0x0bff) tamil++;
    // Bloc grec, plus le grec etendu que le polytonique emploie. Le risque
    // connu est la lettre grecque isolee dans une ligne latine, alpha, delta,
    // sigma en notation scientifique ; le plancher de deux caracteres et la
    // majorite stricte plus bas s'en chargent, exactement comme pour
    // l'homoglyphe cyrillique.
    else if ((c >= 0x0370 && c <= 0x03ff) || (c >= 0x1f00 && c <= 0x1fff)) greek++;
  }
  // Le denominateur ne compte QUE les caracteres qui portent une ecriture
  // connue. Il comptait tout le non-ASCII, emoji compris, et un emoji ne
  // nourrit aucune des huit ecritures : il gonflait le denominateur sans
  // jamais pouvoir gagner la majorite.
  //
  // Mesure de ce que cela coutait, sur les cinq langues majoritaires que ce
  // pre-controle est le seul a servir : "да" plus deux emoji tombait a 2 sur 4,
  // donc pas de majorite stricte, donc `undefined` ; "رائع" plus quatre emoji
  // tombait pareil et franc reprenait la main pour repondre PERSAN sur de
  // l'arabe. Un chat sans emoji n'existe pas, donc ce n'etait pas un cas limite.
  const total =
    kana + han + hangul + arabic + hebrew + cyrillic + thai + devanagari + bengali + tamil + greek;
  // Le plancher reste a deux, et c'est lui qui empeche un seul caractere
  // etranger de voler une ligne latine : un homoglyphe cyrillique dans un mot
  // anglais compte 1, et a un plancher de 1 la ligne entiere devient russe.
  // Le prix est connu et accepte : un message CJK d'un seul caractere reste
  // muet.
  if (total < 2) return undefined;
  const pct = (n: number) => n / total > 0.5;
  // Any kana ⇒ Japanese (Chinese never uses it). Pure Han is ambiguous → defer to
  // franc so Chinese isn't mislabelled as Japanese.
  if (kana > 0) return 'ja';
  if (pct(hangul)) return 'ko';
  if (pct(han)) return cantonaisOuChinois(text);
  if (pct(arabic)) return arabeOuPersan(text);
  if (pct(hebrew)) return 'he';
  if (pct(greek)) return 'el';
  if (pct(cyrillic)) return cyrilliqueQuelleLangue(text);
  if (pct(thai)) return 'th';
  if (pct(devanagari)) return 'hi';
  if (pct(bengali)) return 'bn';
  if (pct(tamil)) return 'ta';
  return undefined;
}

/**
 * Detect language with hybrid approach: Unicode script check first (reliable
 * for CJK/Arabic/Cyrillic/etc.), then franc-min for Latin scripts.
 * Returns ISO-2 code or undefined when not confident enough.
 * Returns 'en' for short trivial chat tokens that franc cannot resolve.
 */
/**
 * The paths that read the text rather than guess at it: the trivial-token table,
 * the chat-word lexicon, and the Unicode script check. Everything here is a lookup,
 * so a hit is a fact about the text, not a probability.
 */
function detectByLookup(trimmed: string): string | undefined {
  // ASCII short message: probably English chat-speak
  const lower = trimmed.toLowerCase();
  if (trimmed.length < 12 && /^[a-z0-9\s!?.,'-]+$/.test(lower)) {
    const tokens = lower.split(/\s+/).filter(Boolean);
    if (tokens.every((t) => COMMON_SHORT_TOKENS.has(t.replace(/[^a-z0-9]/g, '')))) {
      return 'en';
    }
  }

  // Une lettre propre a une seule langue, a toute longueur, et AVANT le lexique.
  //
  // L'ordre inverse avait ete ecrit d'abord, au motif qu'un mot de chat connu
  // serait le signal le plus fort. Mesure : c'est faux, et d'une ligne. Une
  // lettre qu'une seule langue ecrit ne peut pas apparaitre dans le mot d'une
  // autre, alors qu'un mot de chat s'ecrit avec les lettres que tout le monde
  // partage et peut donc exister ailleurs. `Ar ji mano draugė?` est lituanien,
  // porte un ė qui ne laisse aucun doute, et le lexique y lisait `mano` et
  // repondait portugais. Les deux chemins gagnent cette ligne et n'en perdent
  // aucune ; `lt->pt` est la seule confusion qui bouge dans tout le banc.
  const byLetter = detectByExclusiveLetter(trimmed);
  if (byLetter) return byLetter;

  // Meme idee, mais la lettre nomme une paire au lieu d'une langue et un mot
  // choisit dedans. Apres la table, parce qu'une lettre qui nomme une seule
  // langue est un signal plus fort qu'une lettre qui en nomme deux.
  const nordique = danoisOuNorvegien(trimmed);
  if (nordique) return nordique;

  // Meme forme encore, et la derniere paire de la matrice a n'avoir eu aucune
  // regle. Apres le nordique, l'ordre entre les deux etant sans effet : les deux
  // portes ne peuvent pas s'ouvrir sur la meme ligne.
  const nusantara = malaisOuIndonesien(trimmed);
  if (nusantara) return nusantara;

  const balte = estonienOuPortugais(trimmed);
  if (balte) return balte;

  const porte = porteQuelleLangue(trimmed);
  if (porte) return porte;

  // Short Latin message: a known chat word beats franc, which guesses at this length.
  if (trimmed.length <= SHORT_TEXT_MAX) {
    const byWord = detectByShortWords(trimmed);
    if (byWord) return byWord;
  }

  // Unicode script pre-check: more reliable than franc on short texts.
  // CJK, Arabic, Cyrillic etc. are unambiguous from their script alone.
  return detectByScript(trimmed);
}

/**
 * The language only when it was looked up rather than guessed, so it is safe to
 * hand to a translation engine as the source language.
 *
 * Franc's answer and the pure-ASCII fallback are deliberately withheld. Measured
 * on saved chat, franc got 16 of 85 Spanish lines and 13 of 51 Turkish lines
 * right; forcing one of its wrong answers on the engine makes it translate from
 * a language the text is not in, which either returns the text unchanged (the
 * line is then dropped without a word) or returns something that is not what was
 * said. Sending nothing lets the engine detect the language itself.
 */
export function confidentLanguage(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed.length === 0 ? undefined : detectByLookup(trimmed);
}

export function detectLanguage(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) return undefined;

  const lookedUp = detectByLookup(trimmed);
  if (lookedUp) return lookedUp;

  // L'arabizi, apres la recherche en table et avant franc.
  //
  // Il n'est pas dans `detectByLookup` a dessein : ce que cette fonction rend
  // part au moteur comme langue source via `confidentLanguage`, et annoncer
  // `sl=ar` sur du texte en lettres latines n'a pas ete mesure. Ici, la reponse
  // alimente les filtres et le drapeau, et le moteur continue de deviner seul.
  //
  // Ce que cela repare : avec une liste de langues sources autorisee, un message
  // arabizi sortait en `lang_unknown`, donc un lecteur arabophone qui restreint
  // ses sources a `ar` perdait exactement les messages qu'il voulait lire.
  // Les langues ecrites au clavier latin sans l'etre : russe, grec, japonais
  // romanises. Meme place et meme raison que l'arabizi : la reponse nourrit les
  // filtres et le drapeau, pas le `sl` envoye au moteur, parce qu'annoncer une
  // ecriture qui n'est pas dans le texte n'a pas ete mesure.
  const romanise = romanisedLanguage(trimmed);
  if (romanise) return romanise;

  if (isArabizi(trimmed)) return 'ar';

  const francCode = franc(trimmed, { minLength: 3 });
  if (francCode === 'und') {
    // Heuristic: pure ASCII = probably English
    if (/^\p{ASCII}+$/u.test(trimmed)) return 'en';
    return undefined;
  }
  return francToIso2(francCode);
}

export function isLikelyEnglish(text: string): boolean {
  return detectLanguage(text) === 'en';
}
