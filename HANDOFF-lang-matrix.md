# Handoff: la matrice de détection sur les 43 langues

État vivant de ce chantier, mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-21. Dernier commit de **code** : `4e0395b`. Les commits qui ne touchent que ce fichier sont des mises à jour du document.

---

## 0. Reprendre en trente secondes

```
repo      C:\Users\kil\Downloads\kick-chat-translator
branche   feat/lang-matrix
base      f247d4b  (dernier commit du chantier cantonais, sur feat/cantonese-yue)
plan      C:\Users\kil\.claude\plans\on-va-partir-sur-peppy-swan.md
skill     .claude/skills/add-language/SKILL.md   (la checklist, lire en premier)
```

```bash
cd "C:/Users/kil/Downloads/kick-chat-translator"
git checkout feat/lang-matrix
npm ci                 # seulement si node_modules absent
npm run release:check  # 69 fichiers, 1132 tests, doit sortir en 0
```

**Avertissement sur l'arbre de travail.** Il contient un WIP de kil sans rapport avec ce chantier, un redesign d'UI de chat : `src/content/inject.css`, `src/content/langMenu.ts`, `src/options/styles.css`, `src/popup/styles.css`, `tailwind.config.ts`, `src/content/chatStyles.test.ts`, `src/content/injector.test.ts`, `scratchpad/audit_da.py`, plus trois fichiers non suivis `src/shared/theme.css`, `src/shared/theme.test.ts`, `src/content/langPanelGeometry.test.ts`.
**Ne jamais faire `git add .` ni `git commit -a`.** Chaque commit de ce chantier stage ses fichiers un par un, par chemin.

---

## 1. Pourquoi ce chantier existe

kil : "je remarque pas mal de faux positifs et ça peut souvent être vu comme une extension cheap. Ça arrive lorsque l'on sélectionne les options par défaut, sans sélectionner les langages que l'on souhaite."

Le diagnostic initial était à moitié faux et la vraie cause était pire :

1. `sourceLangAllowlist` vide, le défaut, ne filtre **rien** (`filters.ts:25`). L'allowlist n'était pas le coupable.
2. `pipeline.ts:175` appelait `detectLanguage`, la réponse **brute** de franc, juste 32 % du temps sur du vrai chat.
3. Cette réponse pilotait trois décisions : effacer le message en silence, imposer la langue source au moteur on-device qui est le défaut sur Chrome, et alimenter le drapeau.
4. `confidentLanguage`, la version stricte qui refuse les devinettes, n'était appelée qu'une fois, sur le chemin cloud.

Ce qui a été découvert en cours de route et qui n'était pas dans le diagnostic : **le chemin dit "sûr" contenait lui-même des devinettes**, et l'une d'elles coûtait plus cher que franc. Voir 5.4.

---

## 2. Où en sont les chiffres

Corpus : 42 langues, 5040 lignes, Tatoeba CC-BY 2.0 FR, 120 lignes par langue.
Trois issues, **jamais additionnées** : `right` la bonne langue, `silent` le détecteur a refusé de répondre ce qui est l'issue SÛRE, `wrong` une autre langue.

| chemin | portée | départ `ec9e02d` | aujourd'hui `4e0395b` |
|---|---|---|---|
| `confidentLanguage` | toutes | 1262 r / 3688 s / **90 w** | 2332 r / 2693 s / **15 w** |
| `confidentLanguage` | court ≤20 car. | 415 / 1213 / **52** | 728 / 940 / **12** |
| `detectLanguage` | toutes | 3019 / 804 / **1217** | 3384 / 717 / **939** |
| `detectLanguage` | court | 837 / 364 / **479** | 964 / 346 / **370** |

Le chemin sûr **répond 85 % plus souvent et se trompe 83 % moins**. C'est le seul mouvement qui compte vraiment : `wrong` sur ce chemin veut dire qu'on demande au moteur de traduire depuis une langue dans laquelle le texte n'est pas.

Le chemin brut a perdu 278 erreurs. Sa part reste haute parce qu'il inclut franc par construction.

**Il existe maintenant un second banc, en registre chat, et il ne dit pas la même chose.** Section 2bis, et c'est celui qui décrit le régime réel du produit.

Ces quatre chiffres sont **assertés** dans `src/content/langMatrix.test.ts`. Les bouger est normal ; les bouger sans dire dans quel sens et pourquoi ne l'est pas.

### Les langues qui ne marquent jamais un seul point

```
detect     AUCUNE      (0, contre 10 au départ)
confident  es fr id    (3, contre 26)
```

**La liste du chemin brut est vide, et c'est devenu l'assertion** : une langue qui y retombe est une régression, pas un point de départ. Les trois dernières, `et fi sl`, sont sorties par le lexique de chat, la seule chose capable de les atteindre puisqu'elles partagent chacune de leurs lettres avec un voisin et n'ont pas de marqueur de paire.

`es fr id` restent muettes sur le chemin sûr **chez Tatoeba seulement**, et ce n'est plus une supposition : le banc de chat les mesure à 3, 1 et 6 sur 15. C'est un artefact du corpus, pas du détecteur.

### Rappel du chemin sûr, par langue

```
120  ar bn el he hi ja ko ta th     (écritures sans ambiguïté)
113  fa    112 yue   105 zh-tw   97 uk   89 ru   87 zh
86   tr     81 vi     75 cs      74 bg   70 pl   61 ro   53 lt
34   lv     25 hu     14 de      14 no   12 sk   11 da    9 pt
6    sv      6 tl      4 ms       4 nl    3 ca    3 it     1 en
1    et      1 fi      1 sl
0    es fr id
```

**Ne pas lire `ca=3` ou `et=1` comme des langues réglées.** Elles sont sorties de la liste à zéro et c'est tout. Ce tableau est celui de Tatoeba ; sur du chat le classement est différent, voir 2bis.

### Les paires qui volent le plus, chemin brut

| de → vers | lignes | note |
|---|---:|---|
| id → ms | 49 | jamais traitée, le cluster le plus dur |
| ca → es | 42 | `l·l` n'apparaît que 2 fois sur 120 |
| da → sv | 42 | 44 avant la règle de paire |
| no → sv | 41 | 48 avant |
| ms → id | 38 | |
| da → nl | 31 | |
| ca → fr | 29 | |
| sk → cs | 27 | 30 avant les lettres exclusives |
| es → pt, pt → es | 18 chacune | |
| zh-tw → zh | 15 | 120 sur 120 au départ |

**`bg → ru` (50) et `uk → ru` (22) ont disparu de ce tableau.** Elles en étaient le sommet et elles ne sont plus nulle part.

---

## 2bis. Le banc de chat, et pourquoi il ne dit pas la même chose

`src/content/langChatCorpus.ts` et `src/content/langChat.test.ts`. 390 lignes écrites à la main, 15 par langue, sur les **26 langues latines**, celles que le pré-contrôle d'écriture ne sert pas du tout.

**Lire la réserve en tête du module avant de citer un chiffre d'ici.** Le corpus est écrit par ce projet, donc ajustable par lui, exactement ce que Tatoeba n'est pas. Un chiffre de rappel y mesure le vocabulaire choisi autant que le détecteur. Trois choses tiennent quand même : le **silence**, qui ne dépend pas de savoir si la réponse est juste ; la **protection** contre les régressions ; et le **contraste** avec Tatoeba sur les mêmes langues.

Mesuré **deux fois**, tel quel et diacritiques retirées, parce qu'un chat contient les deux et que choisir un camp truquerait le résultat.

| | right | silent | wrong | muet |
|---|---:|---:|---:|---:|
| chemin sûr, tel quel | 101 | 289 | **0** | 74 % |
| chemin sûr, sans diacritiques | 63 | 327 | **0** | 84 % |
| chemin brut, tel quel | 182 | 99 | 109 | 25 % |
| chemin brut, sans diacritiques | 154 | 118 | 118 | 30 % |

Quatre choses qu'il dit et que Tatoeba ne pouvait pas dire :

1. **Le chemin sûr se trompe ZÉRO fois sur 390, dans les deux régimes.** Les règles écrites contre de la prose ne se mettent pas à mentir quand le registre change, elles se taisent. C'est l'invariant qui compte et il est asserté.
2. **Il répond à la question de la phase 1, et la réponse est non.** Sur du chat latin le chemin sûr est muet 74 fois sur 100, donc donner sa réponse au moteur on-device enverrait les trois quarts de ce chat au cloud, avec sa latence et son quota. Le chiffre à faire baisser d'abord est le silence.
3. **Les diacritiques valent un tiers du rappel**, 101 contre 63. C'est la fragilité de toute l'approche par lettre exclusive en un chiffre : une règle qui lit `ř` ou `ų` ne lit plus rien dès que l'utilisateur tape vite, ce qui est le cas majoritaire sur téléphone.
4. **83 % des lignes de chat font ≤20 caractères**, médiane 16, contre 33 % chez Tatoeba. Le lexique de mots courts, borné à 20, a donc une portée bien plus grande sur le régime réel que sur le corpus qui sert à le mesurer.

---

## 3. Décisions prises, à ne pas rouvrir sans raison

| Décision | Choix | Pourquoi |
|---|---|---|
| Corpus protecteur | Tatoeba, exports par langue | CC-BY, étiqueté par des humains, **écrit par personne dans ce projet donc non ajustable** |
| Corpus de rappel chat | synthétique, phase 0b | mais il en existe déjà un partiel, voir 4.4 |
| Politique de correctif | resserrer les règles | choix de kil, contre "se taire plus souvent" et "changer les défauts" |
| Portée | matrice 43x43 | choix de kil, contre l'aller-retour de traduction et la couverture provider |
| Où vit le banc | `src/content/langMatrix.test.ts`, vitest | Playwright est volontairement hors des dépendances ; la CI lance déjà `vitest run` |
| Où vit le corpus | module `.ts` committé, **pas** de fixture JSON | un corpus mesuré en scratchpad a été perdu deux fois faute de commit |

---

## 4. LE PROTOCOLE DE BANC

C'est la partie la plus réutilisable du document. Quatre passes de règles ont été écrites avec, et **chaque fois qu'une étape a été sautée ou bâclée, elle a produit une erreur qu'il a fallu défaire.**

### 4.1 Couper le corpus avant de regarder quoi que ce soit

```js
const reglage = (l) => LANG_CORPUS[l].filter((_, i) => i % 2 === 0);
const ecart   = (l) => LANG_CORPUS[l].filter((_, i) => i % 2 === 1);
```

La moitié d'écart n'est lue **qu'une fois la règle écrite**, et une seule fois. Un chiffre mesuré sur les données qui ont servi à régler ne mesure que le réglage. Précédent documenté dans le code : une première version de la règle bulgare donnait 20 sur 20 sur son propre banc et 7 sur 12 sur des lignes écrites après.

### 4.2 Les totaux ne prouvent rien, le diff de la carte de confusions prouve

Un total d'erreurs stable peut cacher une erreur échangée contre une autre. La mesure qui répond vraiment à "zéro ligne volée" est le **diff complet de la carte de confusions** contre `HEAD` :

```bash
git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts
```

puis passer les deux exports de chaque version à `runMatrix` et comparer clé par clé. **Supprimer le fichier temporaire avant de lancer la gate**, il est vu par le garde statique de `langMatrix.test.ts`. Trois minutes, et c'est ce qui transforme "les totaux n'ont pas bougé" en preuve.

### 4.3 Mesurer en EXPOSITION COMPLÈTE, pas seulement dans la zone visée

Un candidat testé sur les seules lignes qui atteignent la règle paraît plus propre qu'il n'est. Cas réel : le suffixe `-ите`, proposé comme marqueur bulgare, montrait **1** ligne russe dans la zone ambiguë et **4** sur les 120. C'est l'impératif pluriel russe. Il serait passé avec une mesure étroite.

### 4.4 Tatoeba ne voit pas le registre chat : lancer les DEUX bancs

`src/content/langDetect.dix.test.ts` contient 25 lignes de chat écrites à la main pour ar, ja, ko, ru et zh. Ce fichier a attrapé ce que Tatoeba ne pouvait pas voir : le russe de chat n'écrit presque jamais `ы э ё`, donc une règle jugée acceptable sur Tatoeba y cassait six assertions.

`src/content/langChat.test.ts` fait la même chose pour les 26 langues latines, section 2bis. **Un changement de détection se mesure sur les deux, pas sur la matrice seule.** Un corpus de prose et un corpus de chat ne se contredisent pas par accident : ils mesurent deux régimes et le produit tourne dans le second.

### 4.5 Faire échouer l'instrument avant de lui faire confiance

Deux contrôles à prix nul, tous deux payés au prix fort une fois chacun :

- **Un banc de permutation doit reproduire une différence connue.** Le banc d'ordre des étages a été validé en lui demandant de retrouver une mesure déjà faite. S'il ne l'avait pas retrouvée, tous ses résultats négatifs auraient été du bruit.
- **Un regex de screening doit imprimer sa propre source et échouer si elle est fausse.**

```js
const WORD = (m) => new RegExp('(^|[^\\p{L}])' + m + '([^\\p{L}]|$)', 'iu');
if (!WORD('x').source.includes('\\p{L}')) throw new Error('REGEX CASSE, mesure invalide');
```

Sans cette ligne : un `\` perdu dans un heredoc a transformé `[^\p{L}]` en `[^p{L}]`, la borne de mot a cessé de borner, et le screening est devenu une recherche de sous-chaîne. Le mot russe `кто` en est ressorti "contaminé" par deux lignes bulgares qui étaient **докторе** et **директорите**. Quatre mots rejetés à tort.

### 4.6 La mesure est un VETO, pas un critère de sélection

Choisir un marqueur parce qu'il mesure propre sur 120 lignes, c'est confondre absence de preuve et preuve d'absence. La règle appliquée ici :

> un marqueur entre si **et seulement si** (a) on sait dire ce que les langues concurrentes écrivent à la place, **et** (b) la mesure ne le contredit pas.

Exclus par (a) malgré une mesure parfaitement propre : `тут` est de l'ukrainien courant, `уже` s'écrit aussi en ukrainien, `из` est bulgare au sens de "à travers", `наш` est commun aux trois.

Même liste pour le lexique latin, et elle est plus longue : `echt` est de l'allemand courant, `heel` et `tots` de l'anglais, `nem` du portugais, `qua` de l'italien, `roi` du français, `chao` de l'espagnol, `dito` de l'italien, `kdo` du tchèque, `sveiki` aussi du lituanien, `vel` du danois. Tous mesuraient zéro sur 5430 lignes.

**Piège d'implémentation à ne pas réintroduire** : `SHORT_WORD_LANG` est indexée par TOKEN, le texte étant découpé sur les non-lettres. Une entrée contenant un espace, comme `cam on` proposé pour le vietnamien, ne peut jamais correspondre à quoi que ce soit.

### 4.7 Se demander si un test qui casse assertait le défaut

Deux cas réels dans cette passe :

- `detectLanguage('да 😂😂')` attendait `ru`. Or `да` est bulgare sur 29 lignes sur 120, et serbe, et le reste. Il ne rendait `ru` que parce que **tout** le cyrillique rendait `ru`. Le test prétendait mesurer la dilution par emoji et mesurait le défaut. Échantillon remplacé par `это`, qui est russe seul, intention du test intacte.
- Un test nommé "laisse passer du bulgare sans marqueur, ce qui est la limite" attendait `ru` sur une ligne bulgare. La limite a été franchie, le test dit maintenant `bg`.

---

## 5. Les règles écrites, et ce qui est DEHORS

Pour chacune, la moitié du travail est la liste de ce qui a été refusé. Le détail complet vit dans les commentaires de `src/content/langDetect.ts` ; ceci est l'index.

### 5.1 Les deux écritures chinoises (`4dc5710`)

`zh-tw` était rendu `zh` sur **100 %** des lignes, drapeau de la Chine compris. franc n'a aucun modèle trigramme pour le han et résout toute l'écriture en `cmn`. Corrigé par deux classes de caractères dans `cantonaisOuChinois`. 120 → 15.

**Piège à ne jamais réintroduire** : le japonais a fait sa propre simplification. `会 学 実 体 万 与 区 医 点 来 国` sont japonais ET simplifiés, donc DEHORS de la liste simplifiée. `結 議 龍` sont japonais ET traditionnels, dehors de la liste traditionnelle.

Les 15 restantes ne sont pas un échec : elles n'emploient que ce que les deux écritures partagent. Les fermer demande de sortir franc de ce chemin.

### 5.2 Le bengali et le tamoul (`8cd28e3`)

Deux écritures sans la moindre ambiguïté, simplement absentes du compteur de `detectByScript`. 0 → 120 sur 120, sur les deux chemins.

### 5.3 Les lettres exclusives (`0bd3699`, `528c3af`)

Une lettre qu'**une seule** des 43 écrit nomme cette langue aussi sûrement qu'une écriture entière, et c'est une recherche et non une statistique, donc sa place est sur le chemin sûr.

```
[/[řěů]/iu, 'cs']   [/[ľĺŕ]/iu, 'sk']   [/[żźćśń]/iu, 'pl']  [/[őű]/iu, 'hu']
[/[ėįų]/iu, 'lt']   [/[ģķļņ]/iu, 'lv']  [/[ığ]/iu, 'tr']     [/[șț]/iu, 'ro']
[/l·l/iu, 'ca']     [/[ơưđ]/iu, 'vi']
```

**Le polonais ne prend pas `ł`**, et c'est la correction que le banc a imposée à la table telle qu'elle avait été conçue. La lettre est bien polonaise seule, mais *une lettre exclusive à une langue n'est pas la même chose qu'une ligne qui la porte étant dans cette langue* : une phrase slovaque du corpus parle des enfants de `Łazarz`. `żźćśń` prend 70 lignes polonaises contre 48 et ne vole rien.

DEHORS : `ä` (5 langues), `ô` (fr et sk), `õ` (pt et et), `ą ę` (pl et lt, mesuré 20 et 6 lignes lituaniennes), `č š ž` (4 langues), `ö ü` (une demi-douzaine).

**L'ordre d'appel est mesuré** : la règle passe AVANT le lexique de mots courts. L'inverse avait été écrit sur une phrase, pas sur une mesure. `Ar ji mano draugė?` est lituanien, son `ė` est certain, et le lexique y lisait `mano` et répondait portugais.

**Le vote unanime n'est atteint par aucune des 5040 lignes.** Le banc n'est pas favorable à cette branche, il est **muet** sur elle. Elle a un test écrit à la main, marqué comme construit et non mesuré.

### 5.4 Le repli cyrillique (`949679f`), le plus gros défaut trouvé

`cyrilliqueQuelleLangue` finissait sur `return 'ru'`. Toute ligne cyrillique non nommée revenait russe, et comme la fonction vit dans `detectByScript`, `confidentLanguage` prenait cette **devinette pour une lecture**. 72 des 90 erreurs du chemin sûr, quatre cinquièmes du budget, dans une ligne de code.

Le repli est maintenant `undefined`, l'idiome déjà posé deux lignes plus haut pour le mongol.

**La moitié du résultat qui n'était pas le but compte plus que le but** : retirer le repli devait acheter du silence contre du rappel. Il a acheté du rappel aussi, `detectLanguage` gagnant sur les deux axes à la fois. franc modèle rus, ukr et bul et les sépare mieux qu'une constante en dur. **Une règle qui répond à la place de quelqu'un de mieux renseigné est pire que pas de règle.**

Trois signaux positifs remplacent ce que le repli prétendait savoir : l'article défini suffixé bulgare (`-ът -ата -ята`), l'infinitif russe `-ть`, et une liste de mots russes symétrique de `MOTS_BULGARES`.

DEHORS, rejetés par la mesure : `да` (29 lignes bulgares), `ли` (10), `что` (1 ukrainienne), `знаю` (2), `все`, `просто`, `как`, `него`, et les suffixes `-ите` (impératif pluriel russe), `-ий` (17 lignes ukrainiennes), `-ая`, `-ое`.

**Fragilité à connaître** : `-ть` termine aussi onze lignes ukrainiennes et n'est inoffensif que parce que le test ukrainien passe avant lui. Déplacer ce test sous lui rend onze lignes ukrainiennes russes. Un test verrouille ça.

### 5.5 Quand la lettre nomme une PAIRE (`011a14f`)

`ø` et `æ` appartiennent au danois ET au norvégien, donc elles ne nomment personne et la table les avait écartées. Lecture à moitié juste : mesurées sur tout le corpus elles ne touchent **que** ces deux langues, 55 lignes danoises et 34 norvégiennes. Signal fort sur un ensemble de deux, plus un second tour pour choisir dedans. Même forme que `cantonaisOuChinois`.

**Ce que la porte offre gratuitement, et c'est ce qui rend la règle possible** : elle a déjà exclu le suédois, donc `mig dig sig` et `av`, inutilisables en général puisque le suédois les écrit, redeviennent propres derrière elle. *Un mot ambigu dans les 43 peut être net dans une paire de deux.*

Les paires opposent deux orthographes du même mot : `meg deg seg` contre `mig dig sig`, `hva` contre `hvad`, `av` contre `af`, `etter` contre `efter`, `noe noen` contre `noget nogen`. DEHORS : `ikke`, `jeg`, `fordi`, `bare` s'écrivent pareil des deux côtés.

La porte ne voit que 26 lignes danoises sur 60 et 18 norvégiennes. `da` et `no` sortent de la liste à zéro sans que la paire soit fermée.

### 5.6 Le grec, onzième écriture (`1425c03`)

`detectByScript` comptait dix écritures et le grec n'en était pas. **Quatrième fois que ce trou exact apparaît**, après l'hébreu, puis le bengali et le tamoul.

Il se cache toujours de la même façon, et c'est la partie à retenir : franc nomme le grec par son propre regex d'écriture, donc `detectLanguage` était déjà juste et le drapeau déjà bon, rien ne paraissait cassé. Le dégât était une couche plus bas, là où `confidentLanguage` ne fait confiance qu'à ce qui a été lu : sans plage il n'y avait rien à lire, donc le moteur n'a jamais reçu la langue source d'une ligne grecque. 0 → 120 sur 120, et pas une ligne volée.

Le bloc grec plus le grec étendu, pour que le polytonique soit lu aussi. Risque connu : la lettre grecque isolée dans une ligne latine, alpha ou sigma en notation scientifique. Le plancher de deux caractères d'écriture et la majorité stricte s'en chargent, comme pour l'homoglyphe cyrillique, et la mesure le confirme, aucune confusion n'a bougé.

**Les 43 langues tiennent maintenant toutes dans une écriture comptée.** La liste est close sauf ajout de langue, ce à quoi sert `.claude/skills/add-language/SKILL.md`.

### 5.7 Le malais en jawi (`aa25666`)

Six des 120 lignes malaises de Tatoeba ne sont pas en alphabet latin : l'export `zsm` contient du jawi, qui est de l'écriture arabe. Le pré-contrôle lisait l'écriture correctement et concluait `ar`.

Même forme que le persan juste au-dessus : le jawi AJOUTE des lettres au jeu arabe, donc ces lettres le nomment. `ڠ ڤ ڬ ڽ` mesurées sur les 5040 lignes ne touchent que le malais. Le jawi se teste AVANT le persan parce qu'il emploie `چ`, qui est persan.

**Le repli `ar` reste, et c'est une distinction à ne pas perdre.** C'est une ÉLIMINATION et non une devinette, contrairement au repli `ru` retiré en 5.4 : le persan, l'ourdou et le jawi sont l'arabe PLUS des lettres, donc l'arabe est ce qui reste quand aucune extension ne se manifeste. Le russe, lui, était un membre parmi trois du cyrillique. Rendre `undefined` ici ferait tomber l'arabe de 120 à presque rien sans rien corriger.

Limite chiffrée : trois des six lignes jawi ne portent aucune de ces lettres et restent lues arabes.

### 5.8 Le lexique de chat, étendu à vingt langues (`4e0395b`)

`SHORT_WORD_LANG` était la seule chose capable de servir un chat latin et ne parlait que six langues sur vingt-six. 155 entrées pour dix-neuf de plus, criblées contre les 5040 lignes de Tatoeba ET les 390 de chat, zéro occurrence ailleurs exigée.

C'est ce qui a vidé la liste des langues à zéro, `et fi sl` comprises.

Les variantes sans diacritiques sont là exprès : un téléphone écrit `czesc`, `viela`, `multumesc`. La colonne "sans diacritiques" du banc de chat mesure directement ce que ça rapporte.

Ce que le crible a rejeté est en 4.6. Deux rejets valent d'être retenus ici parce qu'ils éclairent d'autres règles : `mig dig sig`, proposés pour le danois, sont des mots **suédois** (9, 2 et 7 lignes) et ne fonctionnent que derrière la porte `ø æ` qui a déjà exclu le suédois, ce qui est exactement la raison d'être de la règle de paire ; et `meg`, proposé pour le norvégien, touche **neuf lignes hongroises**.

### 5.9 L'ordre des étages de `detectByLookup`, résultat NÉGATIF

Quatre étages s'y suivent. Les sept ordres qui ont un sens ont été mesurés :

| étage | répond | juste | faux |
|---|---:|---:|---:|
| `COMMON_SHORT_TOKENS` → `en` | **1** / 5040 | 1 | 0 |
| lettres exclusives | 488 | 488 | **0** |
| lexique de chat | 32 | 29 | 3 |
| pré-contrôle d'écriture | 1752 | 1664 | 88 |

Les étages sont **disjoints** sauf lettres-contre-lexique, qui se croisent sur 3 lignes. Une seule frontière porte donc un signal, celle qui a été corrigée en `528c3af`. Les autres sont inertes.

**Réserve qui annule la moitié de ce résultat** : `COMMON_SHORT_TOKENS` ne répond qu'**une fois sur 5040** parce que Tatoeba n'a pas de chat-speak. Le corpus ne peut donc rien dire de ses deux frontières, et ce n'est pas "elles sont inertes" mais "on ne sait pas". C'est un angle mort de la phase 0b, pas un point réglé.

---

## 6. État par phase

| Phase | Contenu | État |
|---|---|---|
| 0 | banc 43x43 + corpus + chiffre de référence, zéro correction | **FAIT** |
| 0b | corpus chat pour le rappel en registre court | **FAIT**, 390 lignes, 26 langues, section 2bis |
| 1 | plomberie : `confidentLanguage` là où la réponse brute sert | **1 des 3 faits**, et le 2e est TRANCHÉ NON par 0b, voir section 10 |
| 2 | combler les langues sans règle | **FAIT** : plus aucune langue à zéro sur le chemin brut |
| 3 | clusters de confusion, classés par la matrice | **commencée** : cyrillique fermé, nordique entamé, `id`/`ms` intact |
| 4 | barrière anti-régression en CI | **FAIT** : les deux bancs tournent dans `vitest run` |

---

## 7. La file de travail, par valeur décroissante

1. **`id` contre `ms`, 49 et 38 lignes**, la plus grosse paire restante de la matrice et la seule jamais traitée. Les deux langues sont proches au point que le banc de chat les sépare surtout par de l'argot, `banget gak nih` d'un côté, `macam betul sikit` de l'autre. La forme à essayer est celle de 5.5 : chercher d'abord un marqueur qui nomme la PAIRE contre le reste du monde, puis trancher dedans, plutôt qu'un marqueur par langue contre les 42.

2. **Faire baisser le silence sur le chat, de 74 % vers 50 %.** C'est le seul chiffre qui débloque la phase 1, et la méthode est connue et mesurée : plus d'entrées de lexique, criblées contre les deux corpus. Le plafond est à 83 %, la part des lignes de chat qui font ≤20 caractères. **Attention à la circularité** : ajouter des mots pris dans le corpus de chat gonfle le chiffre sans rien améliorer. Régler sur les indices pairs, valider sur les impairs, et vérifier que l'écart entre les deux moitiés reste nul.

3. **Le catalan**, 3 points sur 120 chez Tatoeba, 42 lignes en espagnol et 29 en français. `l·l` est certain mais rare. Ce qui reste demande du lexique : `-ació`, `ny` là où l'espagnol écrit `ñ`, `això`, `perquè`, `amb` (déjà entrés), et surtout de la morphologie.

4. **Fermer la paire nordique.** La porte `ø æ` ne voit que 26 lignes danoises sur 60 et 18 norvégiennes. Élargir demande des marqueurs sans `ø` ni `æ`, donc exposés au suédois, à l'allemand et au néerlandais. À mesurer en exposition complète.

5. **Les trois lignes jawi sans lettre jawi** et les 7 `fa->ar`, qui sont ensemble 10 des 15 erreurs restantes du chemin sûr. Les deux cas sont de la même nature : une ligne écrite entièrement avec ce que l'extension partage avec sa base. Fermer ça demande de sortir du niveau de la lettre.

6. **Finir la phase 1.** Le drapeau à `pipeline.ts:256` reste à traiter et il est cosmétique. Le moteur on-device à `:255` est **tranché : ne pas basculer**, voir section 10.

7. **`mano` dans `SHORT_WORD_LANG` coûte deux lignes** (`es->pt` et `lt->pt`) et c'est un vrai mot espagnol (la main) et lituanien (mon). Maintenant que le banc de chat existe, la question est mesurable : il suffit d'ajouter des lignes brésiliennes qui l'emploient et de comparer.

---

## 8. Ce qui a été établi sur Tatoeba, pour ne pas le re-chercher

- URL : `https://downloads.tatoeba.org/exports/per_language/<iso3>/<iso3>_sentences.tsv.bz2`
- Format décodé : `id \t iso3 \t phrase`, une par ligne.
- **41 des 41 codes nécessaires existent**, à une correction près : le letton est `lvs` et non `lav`, qui rend 404.
- Une requête HTTP `Range` sur les premiers ~400 Ko suffit. `bzip2 -dc` sur un fichier tronqué décode les blocs complets et sort en erreur ; l'erreur est à ignorer.
- `bzip2` est présent : `/mingw64/bin/bzip2` via Git Bash.
- Biais assumé : les premières lignes d'un export sont les plus anciennes phrases. Contre-mesure appliquée : échantillonnage régulier sur tout le bloc décodé.
- **Deux langues n'ont pas de corpus propre** : `pt-br` partage `por`, `zh-tw` partage `cmn`.

```
en eng   fr fra   es spa   pt por   de deu   it ita   nl nld   pl pol
sv swe   cs ces   sk slk   ro ron   ru rus   uk ukr   tr tur   ar ara
he heb   ja jpn   ko kor   zh cmn   yue yue  th tha   vi vie   id ind
hi hin   fi fin   no nob   da dan   el ell   hu hun   bg bul   ca cat
sl slv   et est   lt lit   lv lvs   fa pes   bn ben   ta tam   ms zsm
tl tgl   pt-br aucun (partage por)   zh-tw aucun (partage cmn)
```

**Question ouverte, à trancher avec kil** : `pt-br` contre `pt`. Distinction lexicale fine, aucun corpus séparé. Proposition par défaut : ne pas écrire de règle, documenter que la détection rend `pt`.

---

## 9. Artefacts et commandes

| Fichier | Rôle | Suivi |
|---|---|---|
| `HANDOFF-lang-matrix.md` | ce document | oui |
| `scratchpad/harness/build-lang-corpus.mjs` | télécharge Tatoeba, échantillonne, génère le corpus | oui |
| `src/content/langCorpus.ts` | **généré**, 42 langues, 5040 lignes, 206 Ko | oui |
| `src/content/langMatrix.ts` | le calcul et le formatage, partagés | oui |
| `src/content/langMatrix.test.ts` | les assertions Tatoeba, tourne en CI | oui |
| `src/content/langChatCorpus.ts` | **écrit à la main**, 26 langues, 390 lignes de chat | oui |
| `src/content/langChat.test.ts` | les assertions du registre chat, tourne en CI | oui |
| `src/content/langDetect.dix.test.ts` | le banc de chat des 5 langues non latines | oui |
| `scratchpad/harness/lang-matrix.mjs` | écrit le rapport lisible | oui |
| `scratchpad/harness/lang-matrix.md` | le rapport | non, régénérable |

```bash
node scratchpad/harness/build-lang-corpus.mjs          # régénérer le corpus (réseau)
node --import tsx scratchpad/harness/lang-matrix.mjs   # régénérer le rapport
npx vitest run src/content/langMatrix.test.ts          # le banc Tatoeba
npx vitest run src/content/langChat.test.ts            # le banc de chat latin
npx vitest run src/content/langDetect.dix.test.ts      # le banc de chat non latin
npm run release:check                                  # la gate complète
```

`npx tsx` est réécrit en `npm tsx` par le proxy rtk de cette machine et échoue. Utiliser `node --import tsx <fichier>`.

Commits, du plus ancien au plus récent :

| Hash | Sujet |
|---|---|
| `ec9e02d` | Measure every language against every other one, and write down what it says |
| `71e78c4` | Stop deleting messages on a guess |
| `4dc5710` | Tell the two Chinese scripts apart, which nothing here could do |
| `f40b9bf` | Bring the handoff up to the three commits that exist |
| `8cd28e3` | Count Bengali and Tamil, which detectByScript never did |
| `5f8256d` | Park the exclusive-letter rule in the handoff rather than commit it unmeasured |
| `0bd3699` | Name ten languages by a letter only they write |
| `45ea7ce` | Record what the bench said about the exclusive letters |
| `528c3af` | Read an exclusive letter before the chat lexicon, not after |
| `d79b253` | Record the ordering measurement and the branch the bench cannot see |
| `949679f` | Stop answering Russian for every Cyrillic line nobody could name |
| `011a14f` | Tell Danish from Norwegian, which no letter could do alone |
| `a7e32a9` | Rewrite the handoff around the protocol rather than the chronology |
| `aa25666` | Read Malay written in Jawi as Malay, not as Arabic |
| `1425c03` | Count Greek, the eleventh script and the fourth time this hole appeared |
| `476fa5f` | Measure the detector on chat, which is the register the product runs in |
| `4e0395b` | Give the chat lexicon the twenty Latin languages it never had |

---

## 10. Phase 1 en détail, ce qui reste

`pipeline.ts` lit la langue une fois et s'en sert à trois endroits.

| Consommateur | Ligne | État | Pourquoi |
|---|---|---|---|
| `isSameLanguageAsTarget`, le verrou qui efface | `:183` | **basculé sur `confidentLanguage`** | 1217 lignes effacées à tort deviennent 18 aujourd'hui. Commit `71e78c4` |
| `ignoreEnglish` | `:180` | **laissé sur la réponse brute** | La réponse sûre ne nomme qu'**1 ligne anglaise sur 120**, contre 78 pour franc. Revérifié après chaque passe : l'anglais n'a pas de lettre exclusive, ce chiffre n'a pas bougé. Seule la phase 0b le débloquera |
| `shouldDropBySourceLang`, l'allowlist | `:184` | **laissé sur la réponse brute** | Il droppe sur `lang_unknown`. Un détecteur plus silencieux le ferait supprimer **davantage**. Ce n'est pas son entrée qu'il faut changer, c'est sa sémantique |
| `localEngine.translate(detected, ...)` | `:255` | **TRANCHÉ : ne pas basculer** | Mesuré par le banc de chat : sur du chat latin la réponse sûre est muette 74 fois sur 100. Basculer enverrait les trois quarts de ce chat au cloud, avec sa latence et son quota, pour éviter des devinettes dont le coût réel n'est pas mesuré. À rouvrir quand le silence sera descendu, pas avant. Le repli cloud que ce correctif exigeait n'est donc pas à écrire non plus |
| `detectedLang: detected`, le drapeau | `:256` | **à faire**, cosmétique | Indépendant du point ci-dessus : le drapeau peut prendre la réponse sûre et ne rien afficher quand elle est muette, sans changer le routage |

---

## 11. Conventions du repo

- Commits : sujet à l'impératif, corps expliquant la cause, le correctif, et **comment il a été constaté**. Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Gate : `npm run release:check`, jamais seulement `typecheck` et `test`. Il lance aussi `lint`.
- Poids du bundle content relevé avant et après toute modification du content script. **Mesurer les deux bouts soi-même**, la méthode des relevés anciens n'est pas écrite et ils ne se raccordent pas. Repère en `gzip -9` : 91484 avant les lettres exclusives, **92860 aujourd'hui**, soit +1376 octets pour sept règles et 155 entrées de lexique. Les deux corpus ne pèsent rien dans le bundle, un garde statique de `langMatrix.test.ts` le vérifie à chaque passe.
- Pas de nom de streamer ou de chaîne en dur, nulle part.
- Pas d'emoji dans le code.
- Les données de test vivent **inline dans le fichier de test**, pas dans une fixture séparée.
