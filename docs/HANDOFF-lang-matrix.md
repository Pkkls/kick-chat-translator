# Handoff: la matrice de détection sur les 43 langues

État vivant de ce chantier, mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-24. Dernier commit de **code** : `8bc1cbd`, version **2.11.0** prête à publier. Les commits qui ne touchent que ce fichier sont des mises à jour du document.

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
npm run release:check  # 74 fichiers, 1164 tests, doit sortir en 0
```

**Avertissement sur l'arbre de travail.** Il contient un WIP de kil sans rapport avec ce chantier, un redesign d'UI de chat : `src/content/inject.css`, `src/content/langMenu.ts`, `src/options/styles.css`, `src/popup/styles.css`, `tailwind.config.ts`, `src/content/chatStyles.test.ts`, `src/content/injector.test.ts`, `test/audits/audit_da.py`, plus trois fichiers non suivis `src/shared/theme.css`, `src/shared/theme.test.ts`, `src/content/langPanelGeometry.test.ts`.
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

| chemin | portée | départ `ec9e02d` | aujourd'hui `8bc1cbd` |
|---|---|---|---|
| `confidentLanguage` | toutes | 1262 r / 3688 s / **90 w** | 3731 r / 1306 s / **3 w** |
| `confidentLanguage` | court ≤20 car. | 415 / 1213 / **52** | 1080 / 597 / **3** |
| `detectLanguage` | toutes | 3019 / 804 / **1217** | 4154 / 388 / **498** |
| `detectLanguage` | court | 837 / 364 / **479** | 1216 / 234 / **230** |

Le chemin sûr **répond 2,5 fois plus souvent et se trompe 83 % moins**. C'est le seul mouvement qui compte vraiment : `wrong` sur ce chemin veut dire qu'on demande au moteur de traduire depuis une langue dans laquelle le texte n'est pas.

Le chemin brut a perdu 504 erreurs. Sa part reste haute parce qu'il inclut franc par construction.

**Les 3 erreurs du chemin sûr, en entier** : `ms->ar` 1, `yue->zh-tw` 1, `yue->zh` 1. Le bloc arabe est FERMÉ, voir 5.26. **Aucune des trois n'est réparable par une règle** : la première est la ligne jawi dont le seul mot utilisable est celui que l'arabe écrit aussi, les deux autres sont du chinois standard sous étiquette `yue` dans Tatoeba, dont une en caractères simplifiés.

Les deux dernières ne sont pas des erreurs de règle : ce sont deux lignes de chinois standard sous étiquette `yue` dans Tatoeba, dont une écrite en caractères simplifiés. Aucun marqueur ne peut les atteindre, et les fermer voudrait dire corriger le corpus, pas le détecteur. **Le bloc arabe est donc le seul qui reste vraiment ouvert**, cinq lignes sur sept.

**IL Y A NEUF BANCS**, pas trois, et le diff de protocole les lance tous : Tatoeba, Tatoeba sans diacritiques, chat1, chat1 sans diacritiques, chat2 aveugle, chat3 réglage, non latin, la paire mesure, la paire réglage, plus les lignes mélangées qui se lisent à l'envers. Aucun ne se suffit, et deux d'entre eux, les « sans diacritiques », existent parce qu'un banc trop petit ne rend pas zéro, il rend une conclusion fausse.

Ces quatre chiffres sont **assertés** dans `src/content/langMatrix.test.ts`. Les bouger est normal ; les bouger sans dire dans quel sens et pourquoi ne l'est pas.

### Les langues qui ne marquent jamais un seul point

```
detect     AUCUNE   (0, contre 10 au départ)
confident  AUCUNE   (0, contre 26 au départ)
```

**Les deux listes sont vides, et c'est devenu l'assertion** : une langue qui y retombe est une régression, pas un point de départ. C'est toute la phase 2 fermée sur les deux chemins.

Les trois dernières du chemin brut, `et fi sl`, sont sorties par le lexique de chat. Les deux dernières du chemin sûr, `es` et `fr`, sont sorties sur **quatre caractères qui étaient sous les yeux depuis le début** : `ñ`, `ß`, `œ`, `û`. Voir 5.10.

### Rappel du chemin sûr, par langue

```
120  bn el he hi ja ko ta th        (écritures sans ambiguïté)
119  ar vi   116 fa   114 yue   108 lv   105 zh-tw  101 nl uk
98   pl    95 tr     93 ro     90 zh     89 ru      85 sv    80 cs
79   de    78 pt     74 bg     73 tl     72 hu      69 es    68 fr lt
67   et    66 sl     65 ca     60 fi     58 it      56 da    53 no
52   sk    35 en     33 ms     15 id

**Le bas du tableau n'est plus une question de règles.** `en` est fermé par décision, `ms` et `id` attendent un corpus de registre familier, `sk` et `no` viennent de gagner huit et quatre lignes. La marche suivante pour toutes est la même : du chat, en quantité, dans la langue visée.
```

**Plus aucune langue sous 13 sur 120**, contre vingt-six à zéro au départ. Ce tableau est celui de Tatoeba ; sur du chat le classement est différent, voir 2bis.

Le bas du tableau n'est plus fait de langues sans règle mais de langues dont les règles sont rares : `ca` a le point volat et deux terminaisons, `en` a dix-sept mots, `da` et `no` ont la porte nordique, qui s'ouvre maintenant sur un mot et plus seulement sur une lettre. Ce qui les limite est le **plafond de 20 caractères** du lexique, pas l'absence de marqueur. Voir 2quater.

**Ce que les trois tours de règles de lettres ont déplacé dans ce tableau**, et c'est net : `vi` 81 à **119**, `tr` 86 à 95, `cs` 75 à 77, `pl` 70 à 74, `nl` 53 à 64, `lt` 53 à 61, `et` 36 à 56, `hu` 41 à 52, `pt` 30 à 52, `fi` 27 à 48, `de` 28 à 45, `fr` 30 à 44, `it` 25 à 33, `ca` 20 à 37, `sk` 16 à 29, `sl` 18 à 29. Les langues qui n'écrivent pas de lettre accentuée ne bougent pas d'une ligne, ce qui est la forme attendue du mécanisme, et c'est ce qui laisse `da no id ms` en bas.

### Les paires qui volent le plus, chemin brut

| de → vers | lignes | note |
|---|---:|---|
| id → ms | 44 | **structurellement bloqué sur Tatoeba**, voir 5.27 |
| ms → id | 28 | 33 avant les mots en plein air (5.33) |
| no → sv | 26 | 48, 41, 34, puis 28 avant le déclencheur (5.34) |
| da → sv | 22 | 44, 39, 31, puis 24 |
| da → nl | 20 | 28 avant le tri intérieur, tombé sans être visé |
| ca → es | 17 | 42, puis 29 avant les mots en plein air (5.30) |
| sk → cs | 14 | 30 avant les lettres exclusives, 18 avant `iť` et `sť` |
| ca → fr | 11 | 29 avant les portes, 19 avant les mots en plein air |
| zh-tw → zh | 15 | 120 sur 120 au départ |
| pt → es | 14 | |
| da → de | 9 | 15 avant le tri intérieur |
| no → fr | 9 | |
| no → nl | 9 | 14 avant le tri intérieur |
| es → pt | 8 | 18 au départ |

**Le bas du tableau est maintenant `ms` 17 et `id` 14, et ils y sont seuls.** Le tagalog, qui partageait ce fond, est monté à 67 en un commit. Voir 5.17.

**`bg → ru` (50) et `uk → ru` (22) ont disparu de ce tableau.** Elles en étaient le sommet et elles ne sont plus nulle part.

---

## 2bis. Le banc de chat, et pourquoi il ne dit pas la même chose

`src/content/langChatCorpus.ts` et `src/content/langChat.test.ts`. 390 lignes écrites à la main, 15 par langue, sur les **26 langues latines**, celles que le pré-contrôle d'écriture ne sert pas du tout.

**Ce banc est FLATTÉ : ses lignes ont servi à choisir les mots du lexique. Le chiffre honnête est en 2bis-bis.** Lire aussi la réserve en tête du module. Le corpus est écrit par ce projet, donc ajustable par lui, exactement ce que Tatoeba n'est pas. Un chiffre de rappel y mesure le vocabulaire choisi autant que le détecteur. Trois choses tiennent quand même : le **silence**, qui ne dépend pas de savoir si la réponse est juste ; la **protection** contre les régressions ; et le **contraste** avec Tatoeba sur les mêmes langues.

Mesuré **deux fois**, tel quel et diacritiques retirées, parce qu'un chat contient les deux et que choisir un camp truquerait le résultat.

| | right | silent | wrong | muet |
|---|---:|---:|---:|---:|
| chemin sûr, tel quel | 216 | 174 | **0** | 45 % |
| chemin sûr, sans diacritiques | 146 | 244 | **0** | 63 % |
| chemin brut, tel quel | 258 | 60 | 72 | 15 % |
| chemin brut, sans diacritiques | 206 | 92 | 92 | 24 % |

Quatre choses qu'il dit et que Tatoeba ne pouvait pas dire :

1. **Le chemin sûr se trompe ZÉRO fois sur 390, dans les deux régimes.** Les règles écrites contre de la prose ne se mettent pas à mentir quand le registre change, elles se taisent. C'est l'invariant qui compte et il est asserté.
2. **Il répond à la question de la phase 1, et la réponse n'est plus la même.** Le silence mesuré ici était de 54 % et il est de **45 %**, et il reste flatté de deux façons : la mémorisation du lexique et la brièveté des lignes. Sur le corpus aveugle il est de **52 %**, et sur la bande courte de ce même corpus de **49 %**. Donner sa réponse au moteur on-device enverrait donc **une ligne sur deux** au cloud, là où c'était plus des deux tiers quand cette section a été écrite. Voir 2bis-bis et la section 10 avant de citer un chiffre d'ici.
3. **Les diacritiques valent 32 % du rappel**, 216 contre 146. L'écart s'est réduit à mesure que le lexique grossissait : les mots de structure fréquents ne portent pas d'accent, les lettres exclusives oui. C'est la fragilité de toute l'approche par lettre exclusive en un chiffre : une règle qui lit `ř` ou `ų` ne lit plus rien dès que l'utilisateur tape vite, ce qui est le cas majoritaire sur téléphone.
4. **83 % des lignes de chat font ≤20 caractères**, médiane 16, contre 33 % chez Tatoeba. Le lexique de mots courts, borné à 20, a donc une portée bien plus grande sur le régime réel que sur le corpus qui sert à le mesurer.

---

## 2bis-bis. LE CORPUS AVEUGLE, et ce qu'il corrige

`src/content/langChatCorpus2.ts` et `src/content/langChat2.test.ts`. 260 lignes, 10 par langue, **écrites après tout le travail de lexique et jamais consultées**.

**Pourquoi il existe : le premier banc de chat avait cessé d'en être un.** Ses lignes muettes ont été lues, des mots ont été choisis pour les couvrir, et le résultat mesuré sur les mêmes lignes. Tout ce qui a été dit du rappel sur le chat était flatté d'une quantité inconnue, et rien ne permettait de le savoir de l'intérieur.

| | corpus 1, qui a construit le lexique | corpus 2, **AVEUGLE** |
|---|---:|---:|
| chemin sûr, justes | 209 / 390 | 105 / 260 |
| rappel sûr | 53 % | 40 % |
| **erreurs** | **0** | **0** |
| chemin brut, rappel | 65 % | 61 % |

**Les quinze points d'écart sont pour MOITIÉ un artefact de longueur, et il a fallu une seconde mesure pour le voir.** Le corpus 1 a été écrit en visant le chat court, 83 % de lignes sous vingt caractères et médiane 16 ; le corpus 2 a dérivé vers des phrases plus longues, 37 % et médiane 22. Or le lexique s'arrête à vingt caractères. Comparer les deux totaux comparait deux mélanges de longueurs autant que deux corpus.

**À longueur égale**, l'écart se sépare proprement :

| bande | corpus 1 | corpus 2 aveugle | écart |
|---|---:|---:|---:|
| ≤ 20 car. | 55 % | 48 % | **7 points** |
| > 20 car. | 49 % | 36 % | **13 points** |

Les sept points de la bande courte sont la mémorisation du lexique, et ils sont réels. Le reste du chiffre brut était de la longueur.

**La bande longue est le résultat le plus instructif du chantier.** Elle n'est servie que par les lettres, les séquences, les portes et les terminaisons, jamais par le lexique. Son écart était de 3 points contre 8 à la première mesure ; il est monté à 15 et **ce n'était pas de la mémorisation**, mais deux sources dont aucune n'est ajustable sur un corpus : les terminaisons extraites de Tatoeba servent la prose et pas le chat, 76 lignes contre une, et les portes `ä` et `š` servent des langues dont le corpus 1 contient plus de lignes longues que le corpus 2.

**Les trois tours de règles de lettres l'ont fait REDESCENDRE de 15 à 8 points**, au niveau de la bande courte, en ajoutant des lignes justes dans une bande que le lexique ne touche pas. C'est le sens dans lequel un mécanisme qui ne mémorise pas doit faire bouger cet écart, et c'est la meilleure preuve disponible que ces règles ne sont pas du réglage déguisé.

**Ne pas lire l'égalité des deux écarts comme une équivalence.** Les sept points de la bande courte mesurent une liste de mots choisie en regardant un corpus ; les huit de la bande longue mesurent l'écart entre deux corpus qui ne se ressemblent pas. Même nombre, causes différentes.

**Mais « généralise » a une frontière, et elle a été mesurée.** Un groupe de terminaisons extrait de Tatoeba a rapporté **76 lignes sur Tatoeba et UNE seule sur le corpus aveugle de chat**. Une règle tirée de la prose trouve des formes fléchies ; le chat écrit des formes nues. Passer d'un corpus à l'autre n'est pas passer d'un registre à l'autre, et seul le premier a été fait.

**Ce qui a généralisé parfaitement est la moitié qui compte** : zéro erreur sur 260 lignes neuves, après plus de deux cents entrées de lexique choisies contre un autre corpus. La sûreté ne se mémorise pas, parce que chaque entrée a été criblée contre 5490 lignes avant d'entrer. *Le rappel a été ajusté, la justesse a été gagnée.*

**RÈGLE À NE JAMAIS ENFREINDRE** : ne jamais prendre un mot dans ce corpus pour l'ajouter au lexique. Le jour où ça arrive, il devient le premier corpus et il en faut un troisième. Une propriété d'aveuglement ne se reconstruit pas.

---

## 2ter. LA RÈGLE DES TROIS CORPUS DE CHAT

Trois corpus de chat, trois rôles, et les confondre revient à n'en avoir qu'un.

| corpus | fichier | droit d'usage |
|---|---|---|
| 1 | `langChatCorpus.ts` | a servi à CHOISIR des mots. Banc de non-régression seulement, son rappel ne mesure plus rien |
| 2 | `langChatCorpus2.ts` | **AVEUGLE**. Mesurer en TOTAL, ne jamais lire ses lignes, ne jamais y puiser |
| 3 | `langChatCorpus3.ts` | corpus de **RÉGLAGE**. On y lit, on y choisit |

**Le jour où on lit le corpus 2 ligne à ligne, il rejoint le corpus 1 et il en faut un quatrième.** Une propriété d'aveuglement ne se répare pas.

### Ce que le corpus 3 a attrapé le jour de sa création

`-ekt` était entré dans la table des motifs exclusifs comme marqueur néerlandais. Il mesurait **propre sur les 5490 lignes** de Tatoeba et du corpus 1 : trois lignes néerlandaises, zéro ailleurs. Le corpus 3 l'a fait tomber **en quatre lignes d'un coup** : `perfekt` est allemand, suédois, norvégien et danois, comme `direkt`, `korrekt` et `objekt`.

Quatre lignes écrites sans y penser ont invalidé un motif que 5490 autres avaient laissé passer. **Une absence sur un corpus ne prouve rien, et le seul remède est un corpus de plus.**

### LE CRITÈRE D'ARRÊT DU LEXIQUE

Un tour de 43 mots a été choisi sur le corpus 3 dans les règles. Résultat : **sept lignes gagnées sur le corpus 3, ZÉRO sur l'aveugle.** Sept sur 260 fait 2,7 %, donc on attendait environ sept sur les 260 de l'autre. En observer zéro n'est pas du bruit.

**Le tour a été annulé** : zéro gain mesurable ne justifie pas 43 entrées, et les livrer aurait gonflé le chiffre local sans rien donner à personne.

> **Un tour de lexique se juge sur le corpus AVEUGLE, jamais sur celui où les mots ont été choisis.** Les premiers tours transféraient à quatre cinquièmes, celui-ci à zéro. La méthode a un fond et il est atteint.

---

## 2ter-bis. Les écritures non latines sur du chat

`src/content/langChatNonLatin.ts`. 110 lignes, 10 pour chacune des **onze écritures que personne n'avait mesurées sur du chat** : `he hi th bn ta el fa yue zh-tw uk bg`. `langDetect.dix.test.ts` couvrait les cinq autres.

| résultat | |
|---|---|
| chemin sûr | **97 justes / 11 muettes / 2 fausses** sur 110 |
| `he hi th bn ta el` | **10 sur 10 chacune** |
| les 2 erreurs | `fa -> ar`, la limite connue : une ligne persane sans lettre persane |

**L'hypothèse tenait** : une règle d'écriture ne dépend ni du lexique ni de la longueur, donc le changement de registre ne lui coûte rien. C'est l'inverse exact du lexique latin, qui perd la moitié de son rappel.

### Ce que ce corpus a trouvé

**Le chinois traditionnel tombait à 4 sur 10 en registre chat**, contre 105 sur 120 chez Tatoeba. Une phrase écrite finit par porter un caractère qui sépare les deux écritures ; une ligne de chat de six caractères peut n'en porter aucun.

Cinq des six lignes muettes portaient un caractère traditionnel **simplement absent de la table** : `氣 灣 嗎 還 運`. Trois sont entrés, `還` et `運` restent dehors parce que le japonais les écrit à l'identique. 4 sur 10 devient 6 sur 10, et la liste simplifiée bouge d'autant.

**Troisième fois que « chercher ce qui manque » paie**, après `ñ` et le grec.

---

## 2quater. Le banc des lignes mélangées, et la borne de 20 caractères

`src/content/langMixedCorpus.ts` et `src/content/langMixed.test.ts`. 60 lignes qui changent de langue en cours de route, ce qu'un chat produit constamment et qu'**aucun des deux autres corpus ne contient**.

**Il se lit à l'envers des autres** : sur une ligne à deux langues, la bonne réponse est le silence, donc le chiffre à faire baisser est celui des lignes NOMMÉES. Aujourd'hui 10 sur 60.

Il existe pour une décision et une seule : peut-on lever `SHORT_TEXT_MAX` ? Le banc de chat dit ce que la levée rapporterait, celui-ci dit ce qu'elle coûterait, et **aucun des deux ne se suffit**.

| borne | mélangées nommées | chat muet | chat justes | Tatoeba justes/faux |
|---:|---:|---:|---:|---:|
| **20** | **10 / 50** | 74 % | 103 | 2348 / **15** |
| 25 | 16 / 50 | 71 % | 115 | 2367 / 17 |
| 30 | 25 / 50 | 69 % | 121 | 2395 / 17 |
| 40 | 34 / 50 | 69 % | 121 | 2455 / 17 |
| ∞ | 34 / 50 | 69 % | 121 | 2587 / **24** |

*(Relevé quand le corpus comptait 50 lignes. Les dix ajoutées depuis sont nommées à chaque cran, donc les écarts ne bougent pas.)*

- 20 → 30 achète 18 lignes de chat contre 15 mélangées nommées à tort.
- **30 → 40 ne rapporte RIEN et coûte 9 mélangées.** Perte sèche, invisible aux deux autres bancs.
- Lever entièrement gagne beaucoup sur Tatoeba et rien sur le chat : le corpus de prose applaudit une décision que le registre réel paie.

La borne reste à 20, et elle repose maintenant sur soixante lignes au lieu des huit citées par son commentaire d'origine.

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

### 4.4 Lancer les QUATRE bancs, et savoir lequel est flatté

`src/content/langDetect.dix.test.ts` contient 25 lignes de chat écrites à la main pour ar, ja, ko, ru et zh. Ce fichier a attrapé ce que Tatoeba ne pouvait pas voir : le russe de chat n'écrit presque jamais `ы э ё`, donc une règle jugée acceptable sur Tatoeba y cassait six assertions.

`src/content/langChat.test.ts` fait la même chose pour les 26 langues latines, section 2bis. **Un changement de détection se mesure sur les quatre bancs, pas sur la matrice seule.**

| banc | ce qu'il mesure | sens de lecture |
|---|---|---|
| `langMatrix.test.ts` | prose, 42 langues, 5040 lignes | rappel haut = bon |
| `langChat.test.ts` | chat, 26 langues, 390 lignes | **flatté**, a servi à construire le lexique |
| `langChat2.test.ts` | chat **AVEUGLE**, 260 lignes | **le seul chiffre honnête** |
| `langChat3.test.ts` | chat de **réglage**, 260 lignes | on a le droit d'y choisir |
| `langMixed.test.ts` | 60 lignes à deux langues | **à l'envers** : nommées = mauvais |
| `langDetect.dix.test.ts` | chat, 5 langues non latines | plancher 25 sur 25 |
| `langChatNonLatin.test.ts` | chat, **11 autres écritures**, 110 lignes | mesure, ne pas y régler |

### 4.4bis Un banc qu'on a regardé cesse d'être un banc

C'est la leçon la plus coûteuse de ce chantier et elle est arrivée sans que personne la voie venir. Le corpus de chat a été construit correctement, avec sa réserve écrite en tête. Puis on a lu ses lignes muettes pour choisir des mots de lexique, et il a cessé d'être une mesure pour devenir une cible. Rien n'a changé dans le fichier, aucun test n'est passé au rouge, et le chiffre qu'il publiait est devenu faux de seize points.

**On ne s'en aperçoit jamais de l'intérieur.** Il a fallu écrire 260 lignes neuves pour le voir.

Conséquence pratique : dès qu'un corpus sert à CHOISIR quelque chose et plus seulement à vérifier, il faut en écrire un autre. Et l'ancien garde sa valeur, mais comme banc de non-régression, pas comme mesure de rappel.

### 4.5 Faire échouer l'instrument avant de lui faire confiance

**NE PLUS RETAPER LE CRIBLE. Il est committé :**

```bash
node --import tsx test/e2e/lang-screen.mjs mot  merci mig ako
node --import tsx test/e2e/lang-screen.mjs fin  ção eux lijk
node --import tsx test/e2e/lang-screen.mjs brut "[¿¡]" "l·l"
```

Il crible contre les **trois** corpus d'un coup et sort la colonne MELANGE à part, qui doit rester à zéro. Il existe parce qu'il a été retapé cinq fois dans une seule passe et s'est cassé deux fois de la même façon.

Deux contrôles à prix nul, tous deux payés au prix fort :

- **Un banc de permutation doit reproduire une différence connue.** Le banc d'ordre des étages a été validé en lui demandant de retrouver une mesure déjà faite. S'il ne l'avait pas retrouvée, tous ses résultats négatifs auraient été du bruit.
- **Un regex de crible doit vérifier sa propre source COMPILÉE, pas une chaîne.**

Écrit dans un heredoc, la classe des lettres perd sa barre oblique et devient quatre caractères littéraux. La borne de mot cesse de borner, chaque test devient une recherche de sous-chaîne, et le crible invente des occurrences étrangères. Le mot russe `кто` en est ressorti « contaminé » par deux lignes bulgares qui étaient **докторе** et **директорите**.

**Et le garde censé l'attraper s'est cassé pareil.** Il testait que la source contienne la classe, en la cherchant sous forme de chaîne littérale ; JavaScript réinterprète cette chaîne et la source cassée la contient. *Un contrôle écrit dans le langage qu'il contrôle tombe dans le même piège que ce qu'il contrôle.* Le garde correct est une expression régulière sur la source compilée, et le script sort en erreur plutôt que d'imprimer un tableau faux.

Conséquence mesurée du bug, et elle est contre-intuitive : **aucun rejet par la mesure n'était faux.** Tous revérifiés, `mig` est bien suédois sur 9 lignes, `meg` bien hongrois sur 9, `ako` bien slovaque. En revanche il avait caché dix motifs valables, récupérés au commit `36496f3`. Un crible trop permissif ne laisse pas passer de mauvais candidats, il en recale de bons : l'erreur est silencieuse et coûte du **rappel**, pas de la justesse. C'est le genre de bug qu'on ne voit jamais dans les chiffres qu'on regarde.

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

### 4.8 L'ABLATION, et les deux façons dont elle ment

**La règle en une phrase : un total de lot ne dit pas qui l'a gagné.** Trois outils la posent à trois grains, `porte-ablation.mjs` par ligne de table, `mot-ablation.mjs` par mot dans une alternance, `lexique-ablation.mjs` par entrée de lexique. Ils ont trouvé 5 portes mortes, 37 mots sur 42 qui ne transfèrent pas, et 14 entrées de lexique inatteignables. Détail en 5.19.

**Elle ment de deux façons, et les deux ont été payées.**

**1. LE BANC ABSENT.** La première ablation du lexique déclarait morts `khong`, `loti`, `kapec`, `vienmer`, `jeste` : les moitiés **nues** d'entrées qui existent aussi accentuées, écrites pour du texte tapé vite. Aucun banc de `porte-diff.mjs` ne contenait une ligne sans diacritiques, donc l'outil ne pouvait pas voir le seul cas pour lequel elles existent.

> Un banc absent ne rend pas zéro, il rend une **conclusion fausse**.

`chat1-SANS-DIACRITIQUES` est le huitième banc depuis, et l'image s'inverse : ce sont les formes accentuées qui sont mortes.

**2. LE COUPLAGE.** Le déclencheur d'une porte et le mot qui tranche derrière elle ne valent rien l'un sans l'autre. Ajouter `kalah` au déclencheur ouvre la porte sur une ligne malaise, mais si le jeu malais n'a rien derrière, la ligne reste muette et `kalah` mesure **zéro**. Ajouter `tak` au jeu ne sert à rien tant que la porte reste fermée. Mesurés séparément les deux rendent zéro ; ensemble ils rendent six lignes du corpus aveugle.

**Le remède est le diagnostic, pas l'ablation** : `porte-diagnostic.mjs` sépare « porte fermée » de « porte ouverte, aucun mot ne tranche », et dit donc lequel des deux côtés manque. Vingt-quatre des vingt-huit lignes malaises muettes avaient la porte FERMÉE.

**Après avoir coupé une liste de mots à zéro, les retirer TOUS ENSEMBLE et remesurer.** Le couplage peut faire qu'un groupe vaille ce qu'aucun de ses membres ne vaut seul. Vérifié une fois : les 25 zéros retirés d'un bloc n'ont rien coûté sur les corpus neufs.

### 4.9 LE BUG DE L'OUTIL D'ABLATION, parce qu'il se reproduira

`mot-ablation.mjs` retirait un mot avec `source.replace('|' + mot, '')` **sur tout le fichier**, donc la PREMIÈRE occurrence de cette chaîne où qu'elle soit :

```
|ni   a mangé le `ni` de `niya`   dans la table tagalog
|je   a mangé le `je` de `ještě`  dans le jeu tchèque
|dah  a mangé le `dah` de `daha`  dans le jeu turc
|lah  a mangé le `lah` de `lahko` dans le jeu slovène
```

Les chiffres mesuraient donc **la destruction d'une autre langue**. `lah` ressortait à +5 lignes Tatoeba, qui était le slovène qui tombait, et il serait entré comme une particule malaise valant cinq lignes.

**Ce que ça a coûté ailleurs** : au tour précédent, `dah` avait été jugé à zéro et coupé alors qu'il n'avait jamais été retiré. Il transfère, il est rentré. Vérification faite sur les quarante-huit mots de tous les tours : seuls `je` et `dah` étaient dans ce cas.

Le retrait est maintenant borné à la constante nommée et exige une frontière d'alternance des deux côtés, `|mot|` ou `|mot)`. **Un outil qui modifie la source par recherche de chaîne doit dire DANS QUOI il cherche**, sinon il finit par trouver ailleurs. Même famille que le crible cassé de 4.5 : l'outil ne tombait pas en panne, il répondait faux.

---

### 4.10 UN DÉCLENCHEUR NE DOIT APPARTENIR À AUCUN DES DEUX JEUX DERRIÈRE LUI

Une porte a deux étages : un **déclencheur** qui dit « cette ligne appartient à l'une de ces deux langues », puis un **jeu de mots par langue** qui choisit dedans. Un mot présent dans les deux fait les deux tout seul : il ouvre la porte sur une ligne de l'**autre** langue, puis décide en faveur de la sienne. Les deux indices censés être indépendants n'en font qu'un.

**Payé deux fois, sous deux formes :**

| | |
|---|---|
| `dz` porte pl/lv/sk | `bardzo` porte la séquence **et** est le mot polonais du jeu. Trois lignes mélangées nommées polonaises |
| `hvor` déclencheur da/no | il est déjà dans `MOTS_NORVEGIENS`. Deux lignes danoises parties au norvégien |

La deuxième est la forme pure : le déclencheur **est** le mot qui tranche. La première est la forme cachée : il vit *dedans*.

**Les deux ont été attrapées par le diff à cinq bancs, donc après coup, et aucune ne fait tomber un test toute seule** : elles bougent du rappel et des confusions, pas une assertion nommée.

**Un garde statique dans `langMatrix.test.ts` les attrape maintenant à l'écriture.** Il lit la source, extrait l'alternance de chaque constante et croise déclencheurs et jeux. Il a été **fait échouer avant d'être cru**, protocole 4.5 : réintroduire `hvor` lui fait signaler exactement une faute, le retirer le rend vert.

**Deux pièges d'implémentation, tous deux payés en l'écrivant :**

- La regex d'une constante porte TROIS groupes, `(^|[^\p{L}])(les|mots)([^\p{L}]|$)`, et c'est celui du milieu qu'on veut. Le garde prend le groupe qui a le plus d'alternatives plutôt que de compter les parenthèses : les deux bornes en ont deux, une liste de mots en a dix.
- **Un antislash dans un template literal n'est pas un antislash.** `` `\s` `` entre backticks vaut la lettre `s`, donc le motif exige `\\s`. La première version ne trouvait aucune constante et disait « introuvable ». C'est exactement le mode d'échec contre lequel 4.5 existe, et il s'est produit dans le garde écrit pour 4.10.

---

### 4.11 LES COLLISIONS DE CLAVIER, et le banc qui ne les voyait pas

**La moitié du chat s'écrit sans accents.** Un marqueur peut donc être parfaitement exclusif sur du texte normal et faux sur du texte nu, et c'est une classe d'erreur que rien d'autre ne montre.

**LE SENS DE LA COLLISION COMPTE, et c'est lui qui rend l'audit étroit :**

| forme du marqueur | ce qui se passe sur du texte nu | risque |
|---|---|---|
| **accentuée**, `för` | ne matche plus rien, se tait | **aucun**, le silence est l'issue sûre |
| **nue**, `aqui` | matche le texte nu **et** la forme accentuée d'une autre langue une fois dépouillée | **le seul danger** |

`aqui` est portugais et propre sur 5490 lignes ; l'espagnol et le catalan écrivent `aquí`. Dépouillés, c'est la **même chaîne**.

`test/e2e/collision-clavier.mjs` pose la question sur les six corpus, pour chaque marqueur nu de la table : une autre langue écrit-elle une forme qui le rejoint une fois dépouillée ?

**LE BANC ÉTAIT LE PLUS GROS PROBLÈME.** `chat1-SANS-DIACRITIQUES` contient 390 lignes et sortait à **zéro erreur**. Le même dépouillement sur les 5040 lignes de Tatoeba en montrait **TRENTE**.

> Un banc trop petit ne rend pas zéro, il rend une **conclusion fausse**. C'est exactement la leçon 4.8 sur le banc absent, un cran plus loin : celui-là existait.

`tatoeba-SANS-DIACRITIQUES` est le neuvième banc du diff depuis.

**CE QUE L'AUDIT A TROUVÉ, et comment chaque cas s'est tranché.** Le principe : un marqueur se juge sur **les deux colonnes à la fois**, le rappel qu'il apporte et les erreurs qu'il coûte sur texte nu.

| marqueur | rejoint par | rappel | erreurs | verdict |
|---|---|---:|---:|---|
| `hon` sv | vi `hơn` | −3 | −2 | **retiré** |
| `iya` tl | tr `tatlıya` | **0** | −1 | **retiré, gratuit** |
| `nho\|nha` pt | vi `nhà` `nhớ` | −6 | −9 | **resserré** en `inho\|inha`, −2 seulement |
| `day` en | vi `dạy` `đây` | −4 et −1 aveugle | −3 | **resserré**, lettre exigée devant : −3 et rien au chat |
| `het` nl | hu `hét` | −6 | 0 | gardé |
| `ist` de | sk `ísť` | −4 | −1 | gardé, le plus discutable |
| `nang` tl | vi | −1 | 0 | gardé |
| `niy` tl | tr `utanıyorum` | −2 et −2 aveugle | −1 | gardé |

**RESSERRER PLUTÔT QUE SUPPRIMER**, et c'est la leçon réutilisable. Deux fois sur quatre, la collision venait de la forme COURTE alors que la valeur du marqueur était dans la forme LONGUE : `nho` contre `inho`, `day` nu contre `today`. Mesurer les deux variantes au lieu de supprimer d'emblée a sauvé quatre lignes de rappel dont une du corpus aveugle.

**Résultat : trente erreurs à quinze en trois tours**, et sept des quinze sont les mêmes lignes qui sont fausses sur texte normal. Le vrai prix de taper sans accents est donc de **huit lignes sur 5040**.

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

### 5.10 Les quatre lettres que la table avait manquées (`aaf077e`)

La table des lettres exclusives avait été conçue en cherchant les diacritiques **exotiques**, ceux qu'on remarque, et elle avait sauté les plus ordinaires parce qu'ils sont familiers. Quatre langues manquaient, une était à moitié servie :

```
ñ      espagnol seul          ß  allemand seul          œ û  français seuls
ā ē ī  letton : 72, 45 et 52 lignes sur 120, contre 33 pour le jeu ģķļņ
       qui était déjà là
```

Le letton était la langue la moins bien servie de la table **parce qu'on avait pris ses lettres rares et laissé ses lettres fréquentes**. Ces quatre entrées ont vidé la liste des langues que le chemin sûr ne sait jamais nommer, +91 justes, zéro erreur nouvelle.

**Leçon transférable : chercher ce qui manque dans une table vaut mieux que raffiner ce qui y est déjà.** Trois passes ont été dépensées à affiner des règles existantes pendant que `ñ` était absent.

Une réserve écrite dans le fichier : `ñ` est la seule entrée dont l'exclusivité repose sur un **usage** et non sur un alphabet, le tagalog l'admettant officiellement dans les emprunts espagnols. Zéro ligne mesurée, mais une ligne tagalog parlant d'un niño reviendrait espagnole.

### 5.11 La porte à trois du scandinave (`a3f9332`)

`ø` et `æ` nomment la paire danois-norvégien parce que le suédois ne les écrit pas. **`å` est écrit par les trois, donc il nomme le trio**, et le même mécanisme monte d'un cran.

Deux étages, et l'ordre est ce qui le fait marcher. Une ligne portant `ø` ou `æ` n'est pas suédoise quoi qu'elle porte d'autre, donc elle va directement au tri danois-norvégien où `mig dig sig` sont sûrs. Une ligne qui n'a que `å` peut être suédoise, donc il faut sortir le suédois d'abord, et seulement ensuite se servir de mots qui lui seraient ambigus.

Ce qui sépare le suédois est une orthographe différente du même mot : `jag`/`jeg`, `inte`/`ikke`, `och`/`og`, `är`/`er`, `från`/`fra`. Le suédois passe de 3 à 20 lignes justes sur la moitié tenue à l'écart.

DEHORS pour une ligne comme pour dix-neuf : `og` prend une ligne suédoise, `er` en prend dix-neuf, `till` prend une norvégienne.

### 5.12 L'harmonie vocalique finnoise, et trois séquences (`f2ed62f`)

Quatre des cinq langues les moins servies n'avaient aucune lettre exclusive et stagnaient à une ligne sur 120. Deux sont atteignables :

```
yy  finnois, l'estonien n'a pas de y du tout, il écrit ü
öö  estonien, le finnois dit yö pour la même chose
ção portugais, la terminaison n'existe nulle part ailleurs dans les 43
```

Puis ce qui bouge vraiment le finnois, et c'est de la **morphologie** et non du lexique. L'harmonie vocalique met un `ä` dans les terminaisons là où l'estonien ne le fait pas : `-ssä -llä -ttä -vät -istä`, exclusives sur les deux corpus.

**La morphologie atteint n'importe quelle phrase, là où une liste de mots n'atteint que celles qui emploient un mot connu.** C'est exactement ce qui manque à une langue agglutinante, et c'est la piste à suivre pour le slovène et l'estonien. Finnois 1 -> 27, estonien 1 -> 6, portugais 9 -> 11.

DEHORS : `-ään` prend une ligne estonienne, `-nud` et `-maks` proposés pour l'estonien prennent une turque et une finnoise. La porte `ää`, qui nomme la paire finnois-estonien, a été mesurée et écartée : 35 lignes seulement, dont huit séparables.

### 5.13 Compter les mots du lexique : résultat NÉGATIF (`0d40173`)

La borne de 20 caractères remplace de la **confiance**, donc exiger DEUX mots du lexique s'accordant devrait permettre de s'en passer : `merci bro that was insane` n'a qu'un mot français, une vraie phrase française en a plusieurs.

Mesurée : Tatoeba 2348 -> 2382 justes avec ses erreurs inchangées, chat 103 -> 107, chemin brut 932 -> 925 erreurs, et une seule ligne mélangée de plus. **Ces chiffres-là disaient oui.**

Écartée parce qu'un test qui existait déjà disait non : `tamam kanka good game` porte DEUX mots turcs et deux mots anglais. Un chat écrit `tamam kanka`, `muchas gracias` et `vielen dank` aussi naturellement qu'un mot seul. Dix lignes de cette famille ont été ajoutées au corpus mélangé : la règle les nommait toutes.

Une variante écartant d'abord les mots **sociaux**, sur l'idée qu'eux seuls se font code-switcher, a été mesurée aussi. L'idée est fausse : une vraie ligne mélangée porte des mots de structure dans sa moitié étrangère, `niet te geloven`, `bardzo dobrze`, `vraiment dommage`. Elle faisait passer les mélangées de 10 à 22.

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

### 5.14 LA TABLE DES PORTES PARTAGÉES (`a7ac4c2`, `c1b11a8`, `a87e7e5`)

Le plus gros gain de la branche après le repli cyrillique, et le mécanisme le moins cher au caractère.

Une lettre accentuée écrite par deux ou trois langues **nomme une paire, pas une langue**. Quatre portes avaient été écrites à la main, chacune avec sa logique : le nordique, le malais-indonésien, le scandinave à trois, l'estonien-portugais. Toutes les autres ont la même forme, donc elles sont des **données** : une lettre, la liste des langues qui l'écrivent, un jeu de mots par langue. Le jeu est partagé entre les portes, donc une porte de plus coûte **une ligne**.

`JEUX_DE_PORTE` et `PORTES_PARTAGEES` dans `langDetect.ts`. Vingt portes aujourd'hui, vingt-deux jeux de mots.

**Ce que la porte offre, et c'est toute la raison d'être du mécanisme.** Elle rend propres des mots impossibles en plein air. `der die das ich ist` sont écrits par le néerlandais ; derrière `ä` il n'y a plus de néerlandais. `att det som har med` sont danois et norvégiens ; ni l'un ni l'autre n'écrit `ä`. `som` seul touche onze lignes scandinaves en plein air et **aucune** derrière `š`. `tak` est tchèque, polonais et malais ; derrière `ó` il ne reste que le polonais.

**Le vote.** Une porte qui ne désigne pas exactement une langue ne tranche pas et passe la main à la suivante. Une ligne qui porte `ä` et `š` est donc examinée deux fois, ce qui est correct : deux indices indépendants. Une porte muette ne coûte rien, ce qui est la raison pour laquelle la porte `é`, à dix langues et 145 lignes muettes derrière, vaut d'exister.

**Ce qui tranche le mieux est la MÊME forme du même mot écrite deux fois** : `jsem` contre `som` contre `sem`, `jsou` contre `sú`, `byl` contre `bol`, `ještě` contre `ešte`, `una` contre `uma`, `també` contre `também`. Mieux qu'un vocabulaire distinct, qui a plus de chances d'exister des deux côtés.

**Mesure, `c1b11a8` → `a87e7e5`, les cinq bancs, carte de confusions complète :**

```
tatoeba   sur   2978r/2047s/15w -> 3061r/1964s/15w   carte IDENTIQUE
tatoeba   brut  3733r/553s/754w -> 3756r/544s/740w
chat1     sur    196r/194s/0w   ->  196r/194s/0w     carte IDENTIQUE
chat2     sur     84r/176s/0w   ->   90r/170s/0w     carte IDENTIQUE
chat3     sur     87r/173s/0w   ->   89r/171s/0w     carte IDENTIQUE
non latin sur     97r/11s/2w    ->   97r/11s/2w      carte IDENTIQUE
mélangé        10 nommées / 60  -> 10 nommées / 60
```

+83 lignes sur le chemin sûr, zéro ligne volée nulle part, 14 erreurs en moins sur le chemin brut, +322 octets gzip. **Cinq des six lignes gagnées sur le corpus aveugle sont dans la bande longue**, celle que le lexique n'atteint pas du tout. C'est la preuve directe que ce mécanisme transfère là où le lexique avait cessé de transférer.

**LES DEUX MOTS QU'IL A FALLU SORTIR, et c'est la partie instructive.** La première mesure n'était PAS propre : `ca->es` 0 → 1, `fr->vi` 0 → 1 sur le corpus flatté et 0 → 2 sur l'aveugle.

- `là` était dans le jeu vietnamien et c'est le `là` français, au caractère près. Il échoue le critère 4.6(a) frontalement : personne ne peut dire ce que le français écrit à la place, puisqu'il écrit la même chose. **Sorti.**
- `una` dans le jeu espagnol est aussi catalan. Il **reste**, parce que c'est lui qui sépare l'espagnol du portugais `uma`, mais le catalan le revendique maintenant aussi, donc une ligne qui le porte matche deux langues et la porte se tait. C'est le comportement documenté d'une porte qui ne peut pas trancher, le même que le slovaque derrière `ä`.

**Et une porte jetée pour zéro** : une porte `no`/`da` générique derrière `ø æ`, ajoutée en dernier recours sous les jeux génériques. Elle ne rapporte **rien** sur aucun des cinq bancs, parce que la fonction nordique dédiée en amont répond déjà à tout ce qu'elle pourrait répondre, et elle cassait la règle d'unanimité en nommant `no` sur une ligne qui porte les deux jeux. Sortie.

**Portes non encore ouvertes** : voir 5.15, la liste écrite ici à l'œil était fausse sur trois entrées sur quatre.

### 5.15 LE CRIBLE DE PORTES (`355d15a`, `34aff1e`)

**La leçon d'abord, parce qu'elle se répète dans tout ce chantier.** La liste de candidats écrite juste au-dessus, à l'œil, proposait `ç` et `ó` comme portes à ouvrir alors qu'elles l'étaient déjà, et `ć` comme candidat alors que c'est une lettre exclusive polonaise. Trois sur quatre. **Une relecture de table faite à l'œil se trompe, y compris quand on vient d'écrire la table.**

`test/e2e/porte-candidats.mjs`. Il compte, sur les quatre corpus, quel caractère non-ASCII chaque langue latine écrit et sur combien de lignes, puis imprime ceux qu'écrivent quatre langues ou moins avec leur statut : exclusive, porte, rejetée, ou **libre**. Une langue sous trois lignes sur un caractère est du bruit, un nom propre, et elle est imprimée à part.

**Ce qu'il a rendu, et personne ne l'avait vu :**

| caractère | lignes | langues | suite |
|---|---:|---|---|
| `č` | 160 | sl=57 sk=48 cs=34 lt=21 | **porte**, la plus large encore libre |
| `ă` | 110 | ro=103 vi=7 | porte |
| `ą` | 61 | pl=36 lt=25 | porte |
| `ę` | 57 | pl=50 lt=7 | porte |
| `ū` | 38 | lv=25 lt=13 | porte |
| 33 caractères | 437 | vi seul | **lettres exclusives** |
| `ş` | 53 | tr seul | lettre exclusive |
| `ł` | 57 | pl seul | **déjà rejeté**, voir 5.3 |
| `õ` | 47 | et seul, pt sous le seuil | déjà une porte dédiée |

Le `č` est plus large que le `š` à côté duquel il manquait, et les quatre langues qui l'écrivent avaient déjà leur jeu de mots : il a coûté **une ligne**.

Le vietnamien empile un ton sur une voyelle déjà accentuée et Unicode précompose le résultat. La table en avait trois, il y en a trente-six. **Elles sont illisibles en liste, donc aucun lecteur n'allait jamais remarquer leur absence** : c'est précisément le trou qu'un crible bouche et qu'une relecture ne bouche pas. `vi` passe de 103 à **119 sur 120**. Dehors : `ù`, que l'italien écrit dans `più`, et c'est le seul des trente-quatre que le crible signale partagé.

Le `ş` turc est U+015F ; le roumain écrit le sien avec la virgule souscrite U+0219, déjà dans la table, et le crible ne trouve **pas une** ligne roumaine portant la forme turque.

**Le crible porte sa propre liste de REJETÉS** (`ł õ ù å ø æ`), sans laquelle il repropose les mêmes caractères à chaque passage : il voit les corpus, pas les décisions.

**Ce qui distingue ce tour des deux tours de portes** : c'est la bande **COURTE** qui bouge le plus, +14 sur Tatoeba et +4, +2, +2 sur les trois corpus de chat. Une porte a besoin d'une phrase assez longue pour porter à la fois une lettre et un mot ; une lettre exclusive a besoin de six caractères. La bande courte est le régime réel du produit.

---

### 5.16 LA PORTE SANS LETTRE, et le rejet des séquences ASCII (`c3f2942`)

**Le problème que ça résout.** Trois tours de règles de lettres n'ont pas bougé `no -> sv` ni `da -> sv` d'une seule ligne, et ce n'était pas un hasard : ni le danois ni le norvégien n'écrit une lettre que la table couvre, et leurs trois lettres à eux, `å ø æ`, ne sont pas sur la plupart de leurs lignes. La file les avait marquées comme demandant autre chose.

**Ce que le crible étendu aux séquences a rendu**, et la réponse n'est pas une séquence du tout, c'est un MOT :

```
jeg    no=39 da=35   bruit 3 lignes, toutes du `jego` polonais, que la borne de mot écarte
ikke   no=28 da=25   bruit 2 lignes
det    sv=31 da=29 no=28
```

`jeg` et `ikke` nomment la paire exactement comme `ø`, et le suédois écrit `jag` et `inte` à la place : le critère (a) est rempli sans corpus. Les deux mots étaient DÉJÀ dans `MOTS_DANO_NORVEGIENS` ; la fonction ne les consultait que derrière `å`. Maintenant une ligne qui porte un mot dano-norvégien et aucun mot suédois va au tri intérieur, lettre scandinave ou pas.

```
tatoeba  sur   3099r/1926s/15w -> 3113r/1912s/15w   carte IDENTIQUE
tatoeba  brut  3777r/530s/733w -> 3791r/530s/719w
no->sv 41 -> 39,  da->sv 39 -> 34,  da->de 16 -> 15
no 18 -> 26 lignes sur le chemin sûr, da 15 -> 21
```

**ET ELLE SURVIT AU CLAVIER.** Sur le banc à diacritiques retirées, tout le reste du fichier se tait et cette porte répond encore, parce que `jeg` et `ikke` s'écrivent en ASCII. **C'est la direction pour toutes les langues que le clavier déshabille, et aucune règle de lettre ne peut y aller.**

**DEUX PORTES DE SÉQUENCE REJETÉES, et la raison vaut pour toutes.** `sz` (hu/pl) et `dz` (pl/lv/sk) criblaient propre sur les quatre corpus. Le banc des lignes mélangées a refusé `dz` : trois lignes nommées `pl`, dont `he is cracked bardzo dobrze`.

> `bardzo` porte `dz` **et** il EST le mot polonais du jeu. Le déclencheur vit dans le mot qui tranche, les deux indices censés être indépendants n'en font qu'un, et la porte dégénère en entrée de lexique **sans la borne de vingt caractères** qui tient le lexique.

`sz` a le même défaut par `nasz`, `jeszcze`, `wszystko`. Il valait deux lignes, et le corpus mélangé ne contient simplement aucune ligne qui l'expose, ce qui ne prouve rien : c'est la leçon du corpus 3. Les deux sont dehors, et retirer `dz` n'a coûté aucune des +16 lignes.

Une porte à lettre accentuée ne peut pas avoir ce défaut, `ä` ne vit pas dans `nicht`. **Une porte de séquence demanderait de vérifier que le déclencheur tombe HORS du mot trouvé**, et c'est le travail à faire si on veut rouvrir cette piste.

---

### 5.17 LA PASSE À MOTS DU CRIBLE, et le tagalog (`eb3b2cf`, `eace823`)

**Un TOKEN entier n'a pas le défaut des séquences ASCII**, parce qu'il est découpé de la même façon que le mot qui tranche et ne peut donc pas se déclencher à l'intérieur. C'est ce qui rend la passe à mots utilisable là où la passe à séquences ne l'était pas. Le découpage est celui de `SHORT_WORD_LANG`, sur les non-lettres.

**LE TAGALOG, et c'est le meilleur rapport de tout le chantier.** Il était la dernière langue de la matrice sans un seul marqueur, à 28 lignes sur 120 depuis le début. Il s'écrit en latin nu, sans un diacritique : aucune passe à lettres, à séquences ou à portes ne pouvait l'atteindre, et personne n'avait cherché ce qui le pouvait.

```
ang   56 lignes des quatre corpus, ZÉRO bruit nulle part
ng    18      siya  12      niya  10      mga  9
```

Ce sont des marqueurs **grammaticaux** et non du vocabulaire, et c'est ce qui les rend bons : `ang` marque le sujet, `ng` le complément, `mga` le pluriel. Une phrase tagalog en porte un presque toujours, quel que soit le sujet dont elle parle. Même nature que l'harmonie vocalique finnoise, pas celle d'une entrée de lexique.

**`tl` passe de 28 à 67 sur 120, pour UNE entrée de table et treize octets gzip.**

**Trois mots laissés dehors malgré un bruit mesuré à zéro** : `may`, que l'anglais écrit, `mo`, que l'italien familier écrit, `hindi`, qui est le nom d'une langue dans une phrase anglaise. Critère (a), exactement comme `тут` et `echt`.

**Cinq paires ouvertes sur un mot** (`eace823`) : `il` fr/it, `para por está` es/pt, `co jak` cs/pl, `tas tik` lv/lt, `ce au` ro/fr. +8 lignes, zéro volée. `bet` est dehors, c'est de l'anglais de chat courant que le corpus ne contient pas.

**CE QU'IL FAUT SAVOIR LIRE SUR CE DERNIER TOUR, parce que c'est un piège du critère d'arrêt.** Le corpus aveugle gagne **zéro** ligne, et la règle dit qu'un tour qui ne le bouge pas ne sert à rien. Elle ne s'applique pas ici, et c'est de l'arithmétique : les 8 lignes viennent de neuf langues, donc de 1080 lignes Tatoeba, soit 0,74 %. Ces neuf langues ont environ 90 lignes dans le corpus aveugle, où 0,74 % fait **0,67 ligne**. Observer zéro est exactement ce qu'un tour de cette taille prédit.

C'est l'inverse du tour de lexique annulé, où sept lignes sur 260 prédisaient sept sur 260 et où zéro a été observé. L'aveugle réfutait celui-là ; ici il est trop petit pour dire quoi que ce soit, et la lecture honnête est **« pas d'information »**, pas « pas de transfert ».

**Ce que la passe à mots a aussi confirmé** : le déclencheur malais-indonésien contient déjà tous les mots outils partagés que les corpus contiennent, sauf `ada`, qui est turc. La paire `id`/`ms` ne se fermera pas avec ces corpus-ci, et le fichier le disait déjà.

---

### 5.18 LA PAIRE MALAIS-INDONÉSIEN, ses deux corpus, et le mur (`3c73390`, `71af869`, `fe6bfa5`)

**Pourquoi les trois corpus de chat ne pouvaient PAS la mesurer, et c'est structurel.** Ils sont des traductions **parallèles** : dix phrases, vingt-six langues. Donc dix lignes malaises et dix indonésiennes, qui sont les mêmes dix phrases traduites. Deux langues proches traduisent une phrase neutre de la même façon, donc un corpus parallèle ne peut pas les séparer, par construction. Les corpus avaient l'air de devoir marcher et ne le pouvaient pas.

**Deux corpus NON parallèles, trente lignes chacun, chacun son rôle :**

| fichier | rôle |
|---|---|
| `langChatPaireCorpus.ts` | **MESURE.** Totaux seulement, ne jamais lire ses lignes |
| `langChatPaireReglageCorpus.ts` | **RÉGLAGE.** On y lit, on y choisit |

Même rapport que le corpus 3 face au corpus 2, et pour la même raison : le second a été écrit le jour où le premier ne pouvait plus être lu.

**CE QUE LE REGISTRE FAMILIER FAIT, et ce n'est pas ce qu'on attendait.** La question était : sépare-t-il ces deux langues là où la prose ne le fait pas ? **Non. Il les rend plus MUETTES.** 13 lignes nommées sur 60 à la création, contre 40 % sur le corpus aveugle parallèle. La porte s'ouvre sur des mots outils formels, `yang tidak dengan untuk saya ini itu`, et le chat familier écrit `gue`, `lo`, `gak`, `aku`, `kau`, `tak`.

**Et la matrice cachait une deuxième chose** : trois des erreurs brutes de ce corpus ne restent pas dans la paire. `internet aku slow gila` ressort **française**. La case `id`/`ms` faisait croire à une confusion propre, à deux sens.

**LE MUR, et c'est le résultat de la passe.** Quarante-deux mots ont été choisis sur le corpus de réglage, tous criblés, tous propres. En lot ils valaient +22 lignes de réglage et +4 d'aveugle. Mesurés **un par un**, **trente-sept sur quarante-deux ne bougent que le corpus où ils ont été lus.** Cinq transfèrent : `tidur`, `siapa`, `baru` au déclencheur, `gue` et `kemarin` côté indonésien.

Les trente-sept coupés sont du bon malais et du bon indonésien : `dah`, `korang`, `lepak`, `jiran`, `sejuk`, `comel`, `bising`, `temen`, `nyokap`, `hape`. Ils sont corrects, sans ambiguïté, et ils ne gagnent rien hors des lignes dont ils ont été tirés. **Quelqu'un voudra les remettre ; la mesure est ici pour qu'il n'ait pas à la refaire.**

Cinq mots contre quarante-deux : +3 sur l'aveugle au lieu de +4, +8 sur le réglage au lieu de +22. Trente-sept mots achetaient **une** ligne aveugle et quatorze mémorisées.

**CE QUI A DÉBLOQUÉ LE MALAIS, un tour plus tard.** Il était à 4 lignes sur 30 et les sept mots malais proposés avaient tous été coupés. Le diagnostic a dit pourquoi : **24 des 28 lignes muettes avaient la porte FERMÉE**, donc le jeu de mots ne pouvait pas servir, quel qu'il soit. Les deux moitiés sont couplées, section 4.8.

Ajoutées ensemble, `makan` et `sini` au déclencheur et `tak`, `dah`, `je`, `weh` au jeu malais rendent **+6 lignes du corpus aveugle et +1 seulement du réglage**, soit presque du transfert pur. Ce sont des particules impossibles en plein air, `tak` est tchèque et polonais, `je` est français et slovène, `dah` vit dans le turc `daha` ; derrière la porte il ne reste que deux langues et l'indonésien écrit `gak`, `udah`, `aja` à la place. **`ms` passe de 4 à 10 sur 30.**

DEHORS : `kau`, que l'indonésien écrit aussi, mesuré sur `Kenapa kau tidak mempercayaiku?` qui partait au malais. `lah`, `tu`, `ni`, `korang` sont du bon malais et rapportent zéro hors du corpus où ils ont été lus.

---

### 5.19 L'ABLATION, et ce qu'elle a trouvé dans du code déjà livré

**Le principe en une phrase : un total de lot ne dit pas qui l'a gagné.** Trois outils, même forme, tous dans `test/e2e/` :

| outil | grain | ce qu'il a trouvé |
|---|---|---|
| `porte-ablation.mjs` | une ligne de table | **5 portes mortes** sur 32, et 2 entrées aux effets invisibles |
| `mot-ablation.mjs` | un mot dans une alternance | **37 mots sur 42** qui ne bougent que leur propre corpus |
| `lexique-ablation.mjs` | une entrée de `SHORT_WORD_LANG` | le lexique n'est pas mort, et **14 entrées inatteignables** |

**UN AJOUT PEUT TUER UNE ENTRÉE AILLEURS DANS LE FICHIER.** Les portes `ô`, `ê` et `â` étaient vivantes en entrant et sont mortes deux commits plus tard, quand les trente-cinq lettres vietnamiennes ont nommé `vi` avant qu'elles ne soient consultées. Rien dans les totaux ne le signale, parce que les lignes qu'elles gagnaient sont toujours gagnées. **Relancer l'ablation après chaque lot.**

**LA CLASSE PROUVABLE, qui ne demande aucun corpus.** `detectByLookup` lit les lettres exclusives AVANT le lexique (`528c3af`). Donc une entrée de lexique dont l'orthographe porte une lettre exclusive de sa propre langue ne peut **jamais** se déclencher. Quatorze étaient dans ce cas, et elles n'y sont pas arrivées seules : les formes turques de `teşekkür` et `kardeşim` sont mortes **dans cette passe-ci**, le jour où le s cédille est entré dans la table. Un garde statique tient la classe fermée dans `langMatrix.test.ts`.

**LE PIÈGE DE L'OUTIL, et il a failli coûter cher.** La première ablation du lexique déclarait morts `khong`, `loti`, `kapec`, `vienmer`, `jeste` : les moitiés **nues** d'entrées qui existent aussi accentuées. Elles n'existent que pour du texte tapé vite, et **aucun banc de `porte-diff.mjs` ne contenait une seule ligne sans diacritiques**. L'outil ne pouvait pas voir le seul cas pour lequel elles sont écrites. Le banc `chat1-SANS-DIACRITIQUES` est le huitième depuis, et l'image s'inverse : ce sont les formes accentuées qui sont mortes.

> **Un banc absent ne rend pas zéro, il rend une conclusion fausse.** Même leçon que le crible cassé de 4.5, sous une autre forme.

**CE QUI N'A PAS ÉTÉ SUPPRIMÉ malgré un zéro partout** : les dix-neuf entrées turques, et la plupart des hongroises. Ce sont `selam`, `merhaba`, `tamam`, `kanka`, `evet`, les mots les plus courants du chat turc qui existent. Les corpus ne portent simplement jamais l'un d'eux sur une ligne sans autre lettre turque, ce qui est le seul cas pour lequel ils sont écrits. **Une absence sur un corpus ne prouve rien**, et cette règle-là protège aussi contre l'ablation.

**Le lexique n'est pas mort** : 21 groupes de langue sur 26 bougent un corpus qu'ils n'ont jamais vu. Le néerlandais vaut +15 lignes Tatoeba à lui seul, l'allemand +12, l'anglais +11. Le « fond atteint » de 2ter parle du **tour marginal**, pas de ce qui est déjà là, et il se lisait comme un verdict sur les deux.

---

### 5.20 LE MOT QUAND LA LETTRE NE PEUT PLUS RIEN (`a23e337`, `3b7c45a`, `4b54fbb`, `7df1ed6`)

**Quatre tours, un seul mouvement : le compteur d'erreurs du chemin sûr passe de 15 à 7.** Il n'avait pas bougé d'une ligne depuis la table des portes, vingt commits plus tôt : chaque tour achetait du rappel et tenait les erreurs plates. Ceux-ci achètent des erreurs.

**Le mécanisme est le même quatre fois de suite, et il vaut d'être nommé** : quand une classe de lettres ne peut pas atteindre une ligne, un MOT OUTIL le peut, et le crible le trouve. Ce qui l'admet n'est pas la mesure mais le critère (a), savoir dire ce que la langue concurrente écrit à la place.

| tour | ce qui manquait | ce qui l'a pris |
|---|---|---|
| `mano` retiré | rien : une entrée qui **coûtait** deux erreurs | `lt -> pt` et `es -> pt` à zéro |
| mots persans | 7 lignes persanes sans une seule lettre persane | `است را از او بود هر`, `fa -> ar` 7 → 4 |
| mots jawi | 3 lignes jawi sans une seule lettre jawi | `ساي تيدق كامو`, `ms -> ar` 2 → 1, `ms -> fa` 1 → 0 |
| mots ukrainiens | 1 ligne ukrainienne sans `і ї є ґ` | `це дуже щоб`, `uk -> bg` 1 → 0 |

**`mano` mérite sa ligne à part.** C'est une entrée de lexique portugaise, du brésilien courant, propre quand elle est entrée. Le crible la donne aujourd'hui à `lt=10 es=2 it=2 pt=1` : le lituanien l'écrit dix fois plus que le portugais, où elle veut dire « mon ». La retirer coûte **zéro ligne juste** sur les huit bancs et retire **deux erreurs**.

**IL N'Y A PLUS AUCUNE ERREUR EN ÉCRITURE LATINE NI CYRILLIQUE**, soit quarante et une des quarante-trois langues. Les sept qui restent :

```
fa->ar 4    ms->ar 1    yue->zh-tw 1    yue->zh 1
```

Chacune est une ligne dont le **script** est lu correctement et dont la langue derrière ce script est ce qu'aucune lettre ne voit. Quatre lignes persanes s'écrivent entièrement avec le jeu arabe et ne portent aucun mot outil persan ; l'une est `اعتراض!`, un mot seul que l'arabe écrit à l'identique. Une ligne jawi, `هيدو اين.`, dont le seul mot utilisable est écrit aussi par l'arabe. Deux sont le prix connu de la règle cantonaise.

**LE CRIBLE ARABE, et pourquoi personne ne l'avait écrit.** `porte-candidats.mjs` est borné à l'écriture latine, et ce n'est pas un oubli : sans cette borne il rendait les lettres arabes des lignes jawi comme des marqueurs malais, corrigé en `0e14a6a`. Mais du coup personne n'avait cherché de ce côté, pendant que **dix des treize erreurs y étaient**. `arabe-candidats.mjs` est la même passe portée à `ar fa ms ur`.

**CE QUI EST REFUSÉ MALGRÉ UN BRUIT MESURÉ À ZÉRO**, et c'est la moitié du travail à chaque fois :

- `به` et `در` pour le persan. L'arabe écrit bel et bien `بِهِ` « avec lui » et `دُرّ` « perle », et sans voyelles ce sont les mêmes chaînes. Le corpus n'en contient aucune, ce qui ne prouve rien.
- `ام` pour le persan, deux lettres, et l'arabe écrit `أم` sans hamza assez souvent.
- `اين` et `ايت` pour le jawi, contre `أين` « où » et `آية ». Ils laissent `هيدو اين.` non couverte, et c'est le prix.
- `دان` pour le jawi, qui est un mot persan.
- `треба` pour l'ukrainien, qui est du serbe. `добре` que le bulgare écrit **plus** que l'ukrainien.

**Le banc jawi ne contient que six lignes**, donc tout mot qui y apparaît est « écrit par `ms` seul » par construction et le crible ne peut rien dire. Ce tour-là s'est décidé **entièrement** au critère (a), la mesure ne servant que de veto.

---

### 5.21 LES SÉQUENCES, et la question que le crible ne savait pas poser (`c77dd47`, `1de29f6`, `1e6e4c0`)

**Le plus gros gain de la branche après le repli cyrillique : +58 lignes sur Tatoeba en trois tours, et +5 sur le corpus aveugle.**

**La question était mal posée depuis le début.** La passe à séquences du crible cherchait ce que DEUX À QUATRE langues partagent, parce qu'elle avait été écrite pour trouver des portes. Deux questions manquaient :

1. **Derrière une porte, le seuil n'est pas trois lignes, il est ZÉRO.** Deux langues seulement restent, donc une ligne de l'autre côté n'est pas du bruit, c'est une erreur. `porte-candidats.mjs es+pt` pose cette question.
2. **Quelle séquence une seule langue écrit, avec un bruit STRICTEMENT nul ?** C'est l'analogue exact de « quelle lettre exclusive manque », et personne ne l'avait demandé.

La deuxième a rendu que `ção` était dans la table depuis trois passes en ne voyant qu'un morceau de ce que `ão` voit.

**CE QUI SÉPARE DEUX LANGUES PROCHES EST UNE LETTRE DANS UN MOT, pas un mot.** Le danois écrit `g` là où le norvégien écrit `k`, `øj` là où il écrit `øy` : `bøger`/`bøker`, `sprog`/`språk`, `rigtig`/`riktig`, `høj`/`høy`.

> Le tour nordique a d'abord été écrit comme **onze mots** plus quatre séquences : +10 lignes. Sans les séquences : +3. Avec les séquences et sans les **neuf mots** qui ne rapportent rien seuls : **+10 encore**. Deux mots et quatre paires de lettres font tout.

C'est la leçon de l'harmonie vocalique finnoise mesurée une deuxième fois, sur une autre famille : **une séquence porte sur n'importe quel mot, un mot ne porte que sur lui-même.**

**LES SÉQUENCES ENTRÉES**, toutes à zéro ligne dans les quarante-deux autres langues :

| | |
|---|---|
| nordique, tri interne | `øy` `øk` no, `øj` `øg` da |
| ibérique | `ão` `cê` pt, `ía` es |
| slave | `cz` `prz` `ał` `wy` pl, `jse` cs |
| roumain | `să` `că` |
| germanique | `ijn` nl, `för` sv |

**TROIS SONT EN ASCII PUR** (`cz`, `prz`, `wy`), et ça vaut plus que leur compte : elles répondent encore quand un clavier pressé a mangé tous les diacritiques, là où **toutes** les règles à lettre du fichier se taisent.

**DEUX ENTRÉES REMPLACÉES parce que les nouvelles sont PLUS LARGES**, et l'ablation les a données toutes les quatre à zéro, ce qui est à quoi ressemble une paire qui se couvre : `ijn` non borné remplace `ijn` en fin de mot ; `jse` remplace la porte à trois mots `že|jeho|dnes`. Même résultat, deux entrées de moins.

**QUATRE ENTRÉES TUÉES AU PASSAGE**, troisième et quatrième fois : `ą` pl/lt valait une ligne aveugle jusqu'à ce que `cz` nomme le polonais avant elle, `ã` pt/vi est tuée par `ão`.

**CE QUI EST REFUSÉ, tout à bruit mesuré nul :**

- **`you`** en=33, et c'est le **banc des lignes mélangées** qui l'a attrapé, seul. Il nomme `grazie bro you are cracked` ANGLAISE. **L'anglais est la langue avec laquelle tout le monde mélange, donc un marqueur anglais propre reste un mauvais marqueur.**
- `gio` it=16, mais le portugais écrit `relógio`. `oor` nl=15, mais l'anglais écrit `door`. `ân` et `în` ro, mais le français écrit `âne` et `chaîne`. `kj` `skj` `gj` norvégiens, qui prennent une à trois lignes danoises.

**MOITIÉ TENUE À L'ÉCART**, protocole 4.1, sur le plus gros des trois tours : **+21 sur la moitié de réglage et +24 sur celle qui n'a jamais été regardée.** La moitié aveugle gagne PLUS, ce qui est le signal de généralisation le plus fort que ce protocole sache produire.

---

### 5.22 LA CAMPAGNE DE SÉQUENCES, vingt-trois paires interrogées (`a3a2509`, `f39220d`, `dc9d3fb`, `214d9e1`)

**La suite de 5.21, poussée jusqu'à épuisement.** Le crible sait maintenant poser deux questions qu'il ne savait pas poser :

```bash
node --import tsx test/e2e/porte-candidats.mjs da+no   # ce que l'une ecrit et l'autre jamais
node --import tsx test/e2e/porte-candidats.mjs         # bruit STRICTEMENT nul, toutes langues
```

**Vingt-trois paires passées** : toute la table des portes, plus les grosses confusions du chemin brut qui n'ont pas de porte (`da+nl`, `ca+fr`, `no+nl`, `da+de`), plus les paires des langues faibles (`tl+id`, `sk+hu`, `it+ro`, `et+lv`…).

**Ce qu'elles rendent est à 90 % DÉJÀ COUVERT**, et c'est un résultat : les séquences tchèques portent `ř` ou `ě`, les lettones portent `ņ` ou `ā`, les polonaises portent `ę`. Une séquence dont un caractère est déjà une lettre exclusive de la même langue est redondante par construction, et le crible le signale désormais dans sa sortie.

**Ce qui était libre, par famille :**

| famille | séquences | lignes Tatoeba |
|---|---|---|
| finnois, estonien | `tää` `llä` fi, `õi` et | +5 |
| germanique, slave | `wir` de, `gov` sl | +18 |
| scandinave | `gje` no, `æl` da | +7 |
| hongrois, tagalog | `agy` hu, `niy` tl | +5 |

**`gje` et `æl` méritent d'être lues ensemble.** Le diagnostic disait que 70 lignes danoises avaient la porte nordique OUVERTE sans mot pour trancher : le manque était dans le tri interne. Mais ces deux séquences sont à bruit nul dans les quarante-deux autres langues, donc elles entrent comme **exclusives** et n'ont pas besoin que la porte se soit ouverte. `æl` est le `æ` danois contre le `e` norvégien, `æble`/`eple` : la même alternance que le `g` contre le `k` que `øj` et `øg` avaient déjà prise.

**SEPT SÉQUENCES EN ASCII PUR** dans la table maintenant : `cz`, `prz`, `wy`, `wir`, `gov`, `agy`, `niy`. Elles répondent quand un clavier pressé a mangé tous les diacritiques, là où **toutes** les règles à lettre se taisent, et le banc `chat1-SANS-DIACRITIQUES` le mesure.

**TROIS ENTRÉES RETIRÉES parce qu'une séquence non bornée les a absorbées** : `ijn` en fin de mot par `ijn`, la porte à trois mots `že|jeho|dnes` par `jse`, `gjen` en fin de mot par `gje`. L'ablation les donne à zéro, ce qui est à quoi ressemble une paire qui se couvre : retirer l'une ou l'autre ne change rien, retirer les deux coûte.

**CE QUI EST REFUSÉ, tout à bruit mesuré nul :**

| | pourquoi |
|---|---|
| `you` en=33 | **le banc des lignes mélangées**, seul, l'a attrapé sur deux lignes italiennes |
| `noe` no=8 | le néerlandais écrit `noemen` |
| `gio` it=16 | le portugais écrit `relógio` |
| `oor` nl=15 | l'anglais écrit `door` |
| `ân` `în` ro | le français écrit `âne` et `chaîne` |
| `més` ca=9 | propre, mais **zéro sur les huit bancs** : les lignes catalanes qui le portent sont déjà prises |
| `hän` `sä` `taa` fi | une à quatre lignes allemandes ou suédoises |
| `igt` da=8 | onze lignes suédoises |

**Le crible porte sa propre liste de rejets**, avec les raisons, comme `REJETES` le fait pour les lettres. Sans elle il les repropose à chaque passage : il voit les corpus, pas les décisions.

**LA VEINE EST ÉPUISÉE à ce plancher.** Vingt-trois paires ne rendent plus rien que le critère (a) accepte.

---

### 5.23 LES MOTS OUTILS EXCLUSIFS, la table que personne n'avait ouverte (`8209a18`, `0923977`, `1a26688`)

**+119 lignes sur Tatoeba en trois tours, +8 sur le corpus aveugle, zéro erreur.** C'est le plus gros gain de la branche, devant la table des portes.

**Ce que personne n'avait vu.** Le crible à mots a une section « mots qu'UNE SEULE langue écrit, sans bruit du tout ». Elle avait servi à choisir des déclencheurs de paire et jamais pour elle-même, et son sommet est la liste des mots grammaticaux les plus fréquents d'Europe : `ik` 32 lignes, `the` 43, `ist` 27, `est` 26, `het` 25, `jag` 24.

**Pourquoi ils ne vont PAS dans `SHORT_WORD_LANG`.** Ce lexique-là est un vocabulaire de CHAT, borné à vingt caractères, et le protocole a mesuré que son tour marginal ne transfère plus. Ceux-ci sont des mots grammaticaux à très haute fréquence qu'une seule des quarante-trois écrit : ils n'ont besoin ni de la borne ni d'une porte. **C'est la même nature de fait qu'une lettre exclusive**, et c'est dans cette table-là qu'ils entrent.

| langue | mots | était → devient |
|---|---|---|
| `nl` | `ik hij mijn het een heb zijn` | 64 → 99 |
| `de` | `ist zu habe mir und` | 52 → 79 |
| `sv` | `jag att ett och hon` | 79 → 88 |
| `fr` | `est pour ici nous cette une deux` | 45 → 58 |
| `ro` | `sunt fost foarte poate pentru` | 87 → 93 |
| `et` | `seda siin keegi mida` | 58 → 67 |
| `lt` | `yra jis` | 61 → 68 |
| `tl` | `nang ito wala alam kung` | 69 → 73 |
| `it` | `sono quello allora` | 36 → 39 |
| `sl` | `lahko zelo zakaj nekaj ampak` | 40 → 46 |

**LE TROISIÈME TOUR VA À CONTRE-COURANT DU RESTE DU FICHIER, et ça vaut d'être dit.** `sono` et les cinq slovènes étaient déjà dans `JEUX_DE_PORTE`, donc ils ne se déclenchaient QUE derrière une lettre partagée. Le mouvement habituel est qu'un mot impossible en plein air devient propre derrière une porte ; ceux-là étaient propres en plein air depuis toujours et personne ne l'avait vérifié.

**TREIZE REFUSÉS AU CRITÈRE (a), tous à bruit mesuré nul sur 5490 lignes** : `dat`, `hat`, `bin`, `till` sont de l'anglais courant, `asta` de l'espagnol et de l'italien, `oma` du finnois, `ele` et `ela` du roumain, `mane` et `dito` de l'italien, `ako` du tagalog, `molto` par la colonne mélange, `the` et `inte` aussi.

**ET TROIS REFUSÉS PAR LE BANC DU CLAVIER, une collision que rien d'autre ne voit :**

```
aqui  n'est portugais que parce que l'espagnol et le catalan ecrivent `aqui`
lai   n'est letton que parce que le vietnamien ecrit `lai`
aici  roumain, meme famille
```

Diacritiques tombées, ce sont les **mêmes chaînes**. Ils prenaient `que esta pasando aqui`, `primer cop aqui` et `lai nhu cu` : quatre erreurs sur un banc qui était à zéro.

> **Un mot qui n'est exclusif que GRÂCE À SON ACCENT n'est pas exclusif du tout**, parce que la moitié du chat s'écrit sans accents.

Ce banc a neuf commits. Avant qu'il existe, ce tour livrait quatre erreurs dans le seul registre où elles comptent.

**SEPT ENTRÉES MORTES SOUS CES TROIS TOURS**, le plus gros nettoyage déclenché par l'ablation : `(lijk|heid|sje)` néerlandais, `ijn` mangée par `zijn`, `nav tev`, `minha`, `bol`, et **deux PORTES**, `tas|tik` lv/lt tuée par `yra|jis`, `ce|au` ro/fr avec la porte `î` derrière elle.

> Une porte est un **pis-aller** pour quand aucune des deux langues n'a de marqueur propre. Donnez-en un aux deux et la porte cesse de gagner sa ligne.

**UNE LIGNE PERDUE au passage**, et elle est signalée plutôt que cachée : retirer les six dernières d'un bloc coûte une ligne Tatoeba et une au clavier, pas zéro. Elles se couvrent entre elles quelque part. Six entrées contre une ligne, le retrait tient.

**`lv` recule de 109 à 108**, seule langue à perdre sur ces trois tours, pour la même raison : `nav tev` valait zéro mesuré et tenait une ligne en couplage.

---

### 5.24 CE QUE LA RÈGLE D'UNANIMITÉ COÛTE, et c'est presque rien (`6ad28ae`)

`detectByExclusiveLetter` ne répond que si **toutes** les entrées qui se déclenchent nomment la même langue. C'est ce qui rend la table sûre, et personne n'avait jamais compté ce que ce refus coûte.

L'ablation ne sait pas répondre : elle retire une entrée à la fois, donc un désaccord entre une entrée à +96 et une entrée à +5 ressort comme `+96` d'un côté et `-1` de l'autre, ou comme rien du tout si les deux sont grosses.

`test/e2e/unanimite.mjs` pose la question directement. Il lit les 72 entrées **dans le fichier source** plutôt que de les retaper, passe les six corpus étiquetés dedans, et groupe chaque ligne où deux entrées votent différemment.

```
6070 lignes, UN seul désaccord : nl x tr, sur `saat kaçta başlıyor`
```

**C'est un résultat négatif et il ferme l'angle** : à cette taille de table, l'unanimité est gratuite. Ne pas aller chercher un arbitrage plus malin, il n'y a rien à arbitrer. À relancer quand la table grossit, pas avant.

La ligne en question était l'entrée déjà signalée dans le fichier comme la seule à rapporter négatif quelque part. `aat` pour le néerlandais est rejoint par le turc `saat`, l'heure. Les deux formes ont été mesurées, comme 4.6 l'exige :

```
supprimer aat        -2 tatoeba, +1 chat AVEUGLE
exiger [^s]aat        0 tatoeba, +1 chat AVEUGLE, les neuf bancs identiques
```

`gaat`, `staat`, `laat` et `praat` gardent leurs neuf lignes Tatoeba. **RESSERRER PLUTÔT QUE SUPPRIMER**, pour la même raison que le diminutif portugais : la collision vit dans la forme courte.

`test/e2e/variante.mjs` est l'autre moitié du commit, et c'est l'outil qui manquait le plus. Mesurer deux formes d'une correction voulait dire éditer le fichier livré à la main, lancer le diff, le lire, défaire, recommencer ; le seul résultat certain de cette boucle est qu'une variante finit committée par accident. Il substitue une chaîne **littérale**, lance les neuf bancs, imprime ce qui a bougé, et restaure le fichier dans un `finally`.

---

### 5.25 LE CANTONAIS, DEUXIÈME TOUR, et sur quoi cette table est vraiment bâtie (`1e2a4e4`)

Le premier réflexe en rouvrant cette table est de lui appliquer le critère de l'ablation et d'en supprimer un tiers. **Ce serait une erreur**, et la mesure le montre. Sur les 36 marqueurs qu'elle portait :

```
NEUF n'apparaissent sur aucune ligne d'aucun corpus
25 ne sont jamais seuls à couvrir une ligne
130 lignes cantonaises au total, tous corpus confondus
```

Cette table n'a **jamais** été choisie sur le gain mesuré, contrairement au lexique et aux terminaisons. Une règle de PRÉSENCE se choisit sur ce que la langue écrit ; le corpus ne sert qu'à opposer un veto. Un marqueur qui rapporte zéro sur 130 lignes n'est pas du poids mort, c'est un marqueur que 130 lignes ne suffisent pas à juger.

Le critère, écrit comme il est réellement appliqué :

```
1. le caractère est cantonais et absent du chinois standard écrit moderne
2. zéro occurrence sur zh, zh-tw, ja et les 39 autres langues des bancs
3. zéro mouvement sur les neuf bancs, zéro faux positif sur canto-bench
```

Le 1 sélectionne, les 2 et 3 opposent un veto, jamais l'inverse. `test/e2e/canto-candidats.mjs` répond au 2 et porte le risque connu de chaque candidat **dans la table elle-même** : un candidat sans risque écrit est un candidat que personne n'a vérifié.

Douze caractères passent, aucun ne gagne une ligne, et c'est la forme attendue : 瞓 dormir, 啱 juste, 嬲 fâché, 攞 prendre, 搵 chercher, 唞 se reposer, 嚿 morceau, 冧 s'écrouler, 揼 frapper, 孭 porter sur le dos, 喐 bouger, 嗌 crier.

**嬲 est le seul à porter un risque connu, et il n'est pas chinois** : c'est un vrai kanji japonais. Il ne coûte rien parce que le japonais de chat porte des kana et que `detectByScript` les lit avant, mais c'est le premier à retirer si ça cesse d'être vrai.

Refusés ce tour, avec la raison dans le fichier : `嘈` (mesuré, une ligne zh-tw le porte), `郁`, `掂`, `慳`, `氹` (Taipa s'écrit 氹仔), et quatre bigrammes que le chinois standard fabrique par-dessus une frontière de mot exactement comme il fabriquait 而家 : `收皮` dans 回收皮革, `好耐` dans 好耐用, `細路` dans 仔細路過, `多過` dans 差不多過了.

Deux entrées de MOTS sont les seules du tour à bouger un chiffre : `鍾意` aimer, que le standard écrit 喜歡, et le démonstratif `呢` suivi d'un classificateur. Les deux entrées `呢個` et `呢度` étaient déjà là, écrites une par une : c'est **un mécanisme et pas deux mots**, donc la classe le dit, `呢[個度啲隻件間排粒張本]`. `呢` seul est impossible, c'est la particule finale la plus courante du chinois standard.

```
tatoeba  sur  3392r/1641s/7w -> 3394r/1639s/7w     yue 112 -> 114 sur 120
tatoeba  brut 3926r/466s/648w -> 3928r/466s/646w   yue->zh 7 -> 5
canto-bench inchangé, les deux moitiés, toujours zéro faux positif
```

**Les six lignes `yue` qui restent muettes ne portent aucun mot cantonais** : ce sont des phrases de chinois standard sous étiquette `yue` dans Tatoeba. Les deux fausses aussi, dont une écrite en caractères simplifiés. Les fermer voudrait dire corriger le corpus, pas le détecteur.

---

### 5.26 L'ARABE DOIT SE NOMMER LUI AUSSI, et le DIXIEME banc (`9ad2dea`)

`arabeOuPersan` tranchait par elimination : rien en ourdou, rien en jawi, rien en persan, donc `ar`. **Un defaut, pas une lecture**, et il portait tout le bloc arabe restant du chemin sur.

Le crible a mots avait ete pousse a bout de ce cote et le disait lui-meme : des quatre lignes persanes encore rendues arabes, deux ne portent aucun mot candidat et les deux autres n'ont que des mots deja refuses parce que l'arabe les ecrit aussi. Un septieme mot persan n'allait jamais les atteindre.

La correction est de l'autre cote. `LETTRES_ARABES` est la symetrie exacte de `LETTRES_PERSANES` : les lettres que l'orthographe arabe ecrit la ou le persan en ecrit une autre.

```
ة  teh marbuta,   le persan ecrit ه
ى  alef maksura,  le persan ecrit ی
ي  yeh U+064A,    le persan ecrit ی U+06CC
ك  kaf U+0643,    le persan ecrit ک U+06A9
```

`test/e2e/arabe-preuve.mjs` a mesure chaque jeu candidat. Les quatre lettres seules couvrent **110 des 120 lignes arabes et ZERO des 130 persanes**. Sept mots outils qui ne portent aucune de ces lettres montent a 117, toujours a zero de bruit. Les formes a hamza et l'article defini ont ete mesures separement et gagnent leur place sur les lignes de CHAT, ou vivent les interjections courtes.

**`من` est dehors et c'etait le piege du tour.** C'est "de, depuis" et "qui" en arabe, et le pronom "je" en persan, au caractere pres. A lui seul il portait dix-sept des dix-neuf lignes de bruit du premier essai.

```
tatoeba   sur  3394r/1639s/7w -> 3393r/1644s/3w    fa->ar 4 -> 0
non latin sur  97r/11s/2w     -> 97r/13s/0w        fa->ar 2 -> 0
```

UNE ligne arabe sur 120 devient muette, `غادروا بالفعل.`, dont le seul article est colle a une preposition. Quatre fausses disparaissent. **Le banc non latin est donc le sixieme corpus de chat a zero erreur**, et tous les corpus de chat du depot sont propres sur le chemin sur.

**Le chemin BRUT gagne aussi**, et c'est la lecon du repli cyrillique une deuxieme fois : une reponse codee en dur qui remplace un composant mieux informe est pire que pas de reponse. `سلام به همه` etait dans les tests comme limite documentee, assertee a `ar`. Plus rien ne repond dessus, franc reprend la main, et franc la lit juste.

#### LE DIXIEME BANC, et pourquoi il manquait

La premiere version de ce changement faisait taire **trois lignes arabes** de `langDetect.dix.test.ts` pendant que le diff des neuf bancs affichait AUCUNE confusion nouvelle. Ces cent lignes vivaient en dur dans un fichier de test, la ou l'outil de mesure ne les voyait pas.

**Un banc que l'outil ne voit pas est un banc absent**, exactement comme un banc trop petit. Elles sont maintenant dans `src/content/langChatDixCorpus.ts`, le test les importe, le garde statique du bundle couvre le nouveau fichier, et `porte-diff.mjs` les lance. Verifie en le faisant echouer expres : le jeu de lettres etroit y coute deux lignes, et le diff le dit.

---

### 5.27 LA PORTE MALAIS-INDONESIEN, ouverte sur le mot que les deux ecrivent (`1f1f32e`)

Le fichier portait le mauvais diagnostic, ecrit noir sur blanc : *le declencheur n'est PAS ce qui bloque la paire*. Il venait d'un crible qui tire ses candidats des corpus paralleles, lesquels sont en registre neutre. Le registre familier n'y est pas, donc le crible ne pouvait pas proposer les mots qui comptent et rendait zero.

`porte-diagnostic.mjs` compte la seule chose qui tranche : sur les trente lignes malaises du corpus de reglage, **VINGT-QUATRE avaient la porte FERMEE**. Le jeu malais derriere n'etait jamais consulte. Le declencheur etait bien ce qui bloquait.

`test/e2e/paire-declencheur.mjs` pose la question dans le bon registre : quel token des lignes fermees ouvrirait la porte, et quelle autre langue l'ecrit.

```
aku   ouvre 14 des 36 lignes fermees, et touche ZERO des 5850 lignes
      etiquetees des quarante et une autres langues
```

`aku`, c'est "je". Les deux langues l'ecrivent. Il etait sous les yeux, et le test de la paire le cite en exemple de ce que le chat familier ecrit, deux paragraphes au-dessus de la liste ou il ne figurait pas.

**TRENTE-QUATRE MOTS MESURES, CINQ LIVRES.** L'ablation mot a mot est sans appel : `aku` `pagi` `pergi` `habis` `sore` bougent un corpus qu'ils n'ont pas servi a choisir, les vingt-neuf autres ne bougent QUE le corpus de reglage. Et la version a trente-quatre mots donne **exactement le meme chiffre sur les neuf autres bancs, aveugle compris**. Les vingt-neuf mots en trop achetaient seize lignes du corpus ou on les avait lus, et rien ailleurs.

```
paire AVEUGLE  sur  22r/38s/0w  -> 29r/31s/0w     rappel 37 -> 48 %
paire AVEUGLE  brut 25r/20s/15w -> 33r/15s/12w    ms->id 6 -> 4
chat1          sur  216r/174s/0w -> 217r/173s/0w
+10 octets de bundle pour sept lignes aveugles
```

**Tatoeba ne bouge pas d'une ligne sur `id->ms` (44) ni sur `ms->id` (33)**, et c'est attendu : cette prose est ecrite presque entierement avec ce que les deux langues partagent. Le bloc de la matrice ne se ferme pas par ce chemin-la ; ce qui se ferme est le registre reel du produit.

#### `je` EST SORTI, ET UNE REGLE EN SORT AVEC LUI

`je` etait correct quand il a ete ecrit et rien dans le fichier ne le rendait faux. **C'est l'elargissement du DECLENCHEUR qui l'a rendu faux** : `aku` ouvre la porte sur `To je ta najhlupejsia vec, aku som kedy povedal.`, une ligne slovaque privee de ses diacritiques ou `akú` donne `aku`, et derriere cette porte `je` a nomme le malais.

**ELARGIR UN DECLENCHEUR REND RETROACTIVEMENT MOINS SURS TOUS LES MOTS DERRIERE LUI.** Le fichier disait deja que les deux moities sont couplees pour le GAIN ; elles le sont aussi pour le RISQUE, et c'est ce sens-la qui coute des lignes. Relire les deux jeux a chaque fois que la porte bouge.

La borne de surete est maintenant ecrite a cote des jeux : sur les 5850 lignes etiquetees hors de la paire, **UNE SEULE** ouvre cette porte. Tant que ce chiffre reste a un, les deux jeux peuvent contenir des mots courts ; des qu'il monte, chacun devient un piege.

---

### 5.28 LE TRI INTERIEUR, et la question qui vaut trente-deux lignes (`3eb7479`)

Plus gros gain unitaire de la branche depuis le repli cyrillique, et **la porte n'y etait pour rien**.

`porte-diagnostic.mjs` separe deux causes de silence, et pour le norvegien la reponse avait change de camp : 34 lignes Tatoeba n'ouvrent pas la porte nordique, mais **QUARANTE-SIX l'ouvrent sans que rien ne tranche derriere**. Etoffer le declencheur aurait travaille la moitie la plus petite.

`test/e2e/paire-sequences.mjs` pose la question du tri : quelle sous-chaine de deux a quatre lettres une des deux langues ecrit-elle et l'autre JAMAIS. Le seuil reste **zero**, parce que le tri se fait entre deux langues et qu'une ligne de l'autre cote n'est pas du bruit, c'est une erreur.

**Quatorze survivent et les quatorze sont une regle d'orthographe**, ce qui est la seule raison de leur faire confiance au-dela du corpus :

```
ei / ej     nei contre nej        itt      mitt ditt contre mit dit
inn         finne contre finde    opp      opp contre op
het / hed   mulighet / mulighed   ike      like contre lide
igt         rigtigt contre riktig ede      snakkede contre snakket
ud          ut contre ud          bliv     blive contre bli
æb / øb     æble contre eple      kø       køre contre kjøre
uge         uge contre uke        dst      bedst contre best
```

**Trois ont exige un ancrage** : `opp` nu vit dans le danois `stoppe`, `ud` nu dans `studere` que les deux ecrivent, `ede` nu dans le norvegien `stedet`. Les trois mesurent propre sur les 310 lignes du banc et les trois sont des accidents de corpus. **Trois autres sont sorties a l'ablation** : `uke`, `kje`, `igen` sont des regles correctes deja couvertes par une autre entree. **Une regle vraie qui ne rapporte rien reste du poids mort.**

```
tatoeba  sur  3394r/1643s/3w -> 3426r/1611s/3w     no 37 -> 49, da 31 -> 51
tatoeba  brut 3931r/466s/643w -> 3963r/463s/614w   no->sv 34->28, da->sv 31->24
chat2 AVEUGLE sur 125 -> 126
```

**`da->nl` est tombe de 28 a 22 sans que rien dans ce tour ne le vise** : franc donnait ces lignes au neerlandais faute que la table les nomme, et les nommer danoises les reprend.

---

### 5.29 LE CRIBLE DE PAIRE GENERALISE, trois autres familles (`be65c1d`)

La question n'a rien de nordique, donc le script prend maintenant deux codes de langue. **Ce qui le rend utile n'est pas lui mais le diagnostic qui le precede** : lance sur la mauvaise moitie, il etoffe ce qui n'etait pas le probleme.

Quatre entrees sur douze candidats, chacune une regle :

```
jsi jsou   le verbe etre tcheque. Le slovaque ecrit si et su.
iť sť      la desinence slovaque, robiť et radosť. Le tcheque n a pas le caron.
fue        le passe espagnol, plus fuego et fuerte, contre foi fogo forte.
oet        le neerlandais moet et zoet, contre le danois må.
```

**`jsi` a eu besoin de sa borne de mot et SEUL LE BANC SANS DIACRITIQUES l'a dit.** En plein texte il vit dans le slovaque `najhlúpejšia` et le slovene `najlepši`, qui depouilles donnent `najhlupejsia` et `najlepsi` : six lignes partaient au tcheque et aucun autre banc ne le voyait.

**Huit candidats mesuraient propre et sont refuses**, chacun parce que la langue l'ecrit et que le corpus ne le contient pas : `jog` est le droit en hongrois, `fala` la vague en polonais, `quer` vit dans le francais `manquer`, `grad` dans l'espagnol `agradar`, `egun` dans `segundo`, `aqui` est `aquí` sans son accent, `jst` est slovene, `ať` prend une ligne tcheque.

```
tatoeba  sur  3426r/1611s/3w -> 3443r/1594s/3w
sk 29 -> 38, cs 78 -> 80, es 49 -> 53, nl 99 -> 101, sk->cs 18 -> 15
```

Un test a ete **repare et pas renumerote** : `composeHint.test.ts` opposait les deux detecteurs sur `que fue con esos pendejos`, et `fue` le nomme maintenant, correctement. La propriete testee n'a pas bouge, l'exemple si, ce qui est la facon normale dont un banc vieillit.

---

### 5.30 LE DIAGNOSTIC PORTÉ AUX PORTES PARTAGÉES, et le catalan (`819f421`)

`porte-diagnostic.mjs` n'avait jamais été braqué que sur les deux portes écrites à la main, et il a payé les deux fois. Les dix-neuf portes partagées n'avaient jamais eu droit à la question, et une porte partagée a une cause de silence de plus qu'une porte à deux langues.

```
ca, 155 lignes : 48 nommées, 63 SANS AUCUNE PORTE, 42 porte ouverte sans mot, 2 avec rival
```

**La moitié du problème catalan n'était pas derrière une porte.** `Bon dia!`, `Tinc dues filles.`, `No vull tornar.` ne portent aucune lettre accentuée : aucun jeu de porte, si gros soit-il, ne peut les atteindre. Un jeu de porte plus gros était le geste évident et il aurait travaillé la moitié la plus petite.

`test/e2e/langue-candidats.mjs` sert l'autre moitié : pour UNE langue contre les quarante et une autres, quel token, séquence ou fin de mot de ses lignes MUETTES personne d'autre n'écrit. Dix mots outils sortent propres, **cinq venaient du jeu de porte où ils ne pouvaient jamais se déclencher** et sont promus en même temps qu'ils en sortent.

```
ca 36 -> 65 sur 120, ca->es 29 -> 17, ca->fr 19 -> 11
```

**`té` est dehors et c'est la décision la plus propre du tour** : il vaut trois lignes catalanes, une ligne tchèque les lui refuse, et neutraliser cette ligne demanderait un mot tchèque choisi pour elle, ce qui est de la mémorisation. **`vam` est dehors et seul le banc clavier l'a refusé** : le slovaque `vám` sans son accent est `vam`.

**L'ABLATION MENT UNE TROISIÈME FAÇON**, et ce tour l'a attrapée. `mot-ablation.mjs` lisait six bancs quand `porte-diff.mjs` en lance dix : `gaire`, `aquesta` et `molt` rendaient zéro partout et ont failli être supprimés. Ils valent deux lignes sur le banc clavier, où ce sont les AUTRES langues qui ont perdu leurs accents et où la concurrence n'est plus la même. **Elle ne ment pas sur ce qu'elle mesure, elle ment par ce qu'elle ne regarde pas.** Deux autres défauts sont sortis avec : elle ne savait pas lire un mot dans une TABLE, seulement dans une regex isolée, ni retirer le PREMIER mot d'une alternance, faute de barre devant. Onze mots d'affilée répondaient INTROUVABLE, ce qui ressemble à une faute de frappe et se lit comme un résultat.

---

### 5.31 LES JEUX DE PORTE ROUVERTS, soixante-treize lignes (`35b42fe`)

**Le plus gros tour de la branche, et il n'y avait rien à inventer.** Les dix-neuf jeux de mots avaient été écrits à la main en même temps que la table des portes et personne ne les avait rouverts. Le diagnostic dit combien de lignes attendent derrière chaque porte :

```
sk 64   hu 52   sl 46   fi 41   es 38   fr 36   pt 30   it 19
```

`test/e2e/porte-mots-candidats.mjs` les propose, et **son seuil est tout l'intérêt** : il n'exige PAS qu'un mot soit exclusif sur quarante-deux langues, seulement que les autres langues DE CETTE PORTE-LÀ ne l'écrivent pas. C'est ce que le fichier dit depuis la première porte, où `on`, `ei`, `ma`, `ta` et `ja` redeviennent utilisables derrière `õ`. Aucun crible ne savait poser cette question.

**Trente-neuf mots sur quarante transfèrent**, le meilleur rapport du chantier, et il s'explique : ce sont des mots OUTILS. `az` `én` `még` `most` pour le hongrois, `moj` `kdo` `so` pour le slovène, `ça` `été` `fois` pour le français, `ele` `tudo` `só` `foi` pour le portugais, `čo` `niečo` pour le slovaque. **Un mot outil ne mémorise pas un corpus, il décrit une langue.**

Le seul mort est `tienes`, et il se lit : deuxième personne, donc plus rare que l'infinitif ou la troisième, quand `yo`, `qué` et `ese` à côté rapportent chacun. **La fréquence d'une FORME compte autant que l'exclusivité du mot.**

```
tatoeba sur  3473r -> 3546r        chat2 AVEUGLE sur 127r -> 136r, 49 -> 52 %
hu 55->72, pt 60->70, fr 58->66, es 53->61, fi 51->60, sl 46->59, sk 38->44
```

---

### 5.32 LES MOTS EN PLEIN AIR, cinq langues de plus (`e353d62`)

Même crible que pour le catalan, porté aux langues dont le diagnostic dit qu'elles ont beaucoup de lignes sans porte : it 82, sl 52, es 50, pt 48, fr 45.

```
it  che tutti mia      sl  iz ima      es  tengo tiempo mismo
pt  ele ela            fr  joue
```

**Huit des dix rapportent PLUS sur le banc clavier que sur Tatoeba** : `che` +7 et +8, `ele` +5 et +8, `ela` +3 et +5. Un mot outil sans accent vaut davantage là où les autres langues ont perdu les leurs, et c'est le régime réel du produit.

**`non` est celui qui s'échappe**, seize lignes italiennes, et c'est le mot français à la lettre près. Le mettre dans les deux jeux ne le sauve pas : les deux voteraient sur chaque ligne et l'unanimité tomberait, ce qui est du silence acheté au prix du bruit.

**Le lot a tué deux entrées ailleurs dans le fichier**, quatrième occurrence de 5.19 : `cê` pour le portugais, que `ele` et `ela` couvrent, et la porte `ì` entre vietnamien et italien, que `che`, `tutti` et `mia` atteignent avant. Les deux sortent et leur retrait ne coûte rien sur les dix bancs.

---

### 5.33 LA PAIRE MALAISE EN PLEIN AIR, de 48 à 65 % (`ef359f6`, `c1a2d69`)

Le corpus aveugle de la paire bouge plus dans ce tour que dans tous les précédents réunis, et c'est la promotion du catalan appliquée à la langue la plus basse du tableau.

`gue`, `banget`, `udah` et `awak` vivaient derrière la porte ms/id, où il faut qu'un mot PARTAGÉ se déclenche d'abord. **Le chat familier de Jakarta n'écrit pas les mots partagés.** Il écrit `gue`, et `gue` seul suffit : quatorze des lignes muettes du corpus de paire le portent et rien d'autre.

```
paire AVEUGLE  sur  29r/31s/0w -> 39r/21s/0w     rappel 48 -> 65 %
paire AVEUGLE  brut 33r/15s/12w -> 43r/11s/6w    erreurs divisees par deux
id 15 -> 24 sur 30 de ce corpus, ms 14 -> 15
```

**La règle qui trie les deux listes est la seule qui compte ici** : un mot que LES DEUX écrivent va au déclencheur, un mot qu'une seule écrit va en plein air. `awak` contre `kamu`, `petang` contre `sore`, `bahawa` contre `bahwa`.

**Onze mots partagés sur quatorze sont morts**, et les retirer ENSEMBLE donne exactement les mêmes chiffres sur les dix bancs : ce ne sont pas onze couplages cachés, c'est onze fois le même mot déjà couvert sur sa ligne.

**Le bloc `id -> ms` de la matrice ne bouge pas et il faut le dire ainsi : ce n'est pas une règle qui manque, c'est un corpus.** Les deux langues se séparent dans le registre familier, que Tatoeba ne contient pas. `paire-sequences.mjs ms id` ne rend que des mots que les deux écrivent et que le corpus rend exclusifs par absence.

---

### 5.34 LE DÉCLENCHEUR NORDIQUE, et un mot faux depuis le premier jour (`5cd4742`)

Quatre mots que le danois et le norvégien écrivent tous les deux et que le suédois non : `bare` contre `bara`, `selv` contre `själv`, `mange` contre `många`, `hvem` contre `vem`.

**`hvem` ET `hvor` ÉTAIENT DANS LE JEU NORVÉGIEN ET LE DANOIS LES ÉCRIT.** Ils y étaient faux depuis le jour où ils ont été écrits et n'avaient jamais rien coûté, parce que la porte ne s'ouvrait pas sur les lignes où ça se voit. `mange` la fait s'ouvrir, et `hvor mange er her nu`, qui est du danois, est parti au norvégien.

**ÉLARGIR UN DÉCLENCHEUR REND RÉTROACTIVEMENT FAUX CE QUI EST DERRIÈRE.** Troisième fois sur la branche. Les deux interrogatifs passent au déclencheur, où ils sont justes : ils nomment la PAIRE, pas une des deux langues.

```
no->sv 28 -> 26, da->sv 24 -> 22, no 49 -> 51 sur 120, da 51 -> 55
```

**LE TRI INTÉRIEUR no/da EST ÉPUISÉ**, résultat négatif à ne pas refaire : le crible ne rend plus que des séquences que le danois écrit et que le corpus ne montre pas, `vel` dans `ja vel`, `sn` dans `snakke`, `unn` dans `kunne`, `oen` dans `skoen`, `ært` dans `lært`. Le relancer après un corpus neuf, pas avant.

---

### 5.35 LES TROIS CRIBLES LISAIENT LES CORPUS AVEUGLES (`4c7b90f`)

**Le défaut le plus coûteux de la journée, et il ne fait bouger aucun chiffre.** Les trois cribles écrits dans ces tours construisaient leur liste de candidats en parcourant les lignes MUETTES de tous les corpus, `langChatCorpus2.ts` et `langChatPaireCorpus.ts` compris. Un crible qui propose un mot en regardant une ligne a lu cette ligne, et 4.4bis est explicite.

**Compter n'est pas lire**, donc la correction est une séparation et pas un retrait : les aveugles répondent toujours à « ce mot apparaît-il chez toi », ce dont la colonne de bruit a besoin et qui n'expose rien. Ils ne répondent plus à « que contiennent tes lignes muettes ».

**CE QUE ÇA A COÛTÉ**, mesuré en relançant les cribles corrigés : `gue`, `banget` et `udah` ne sont plus proposés pour `id`, `petang`, `bahawa` et `bolehkah` ne le sont plus pour `ms`. Ces six-là venaient de lignes partiellement aveugles.

**Quatre des six étaient DÉJÀ dans le fichier**, dans les jeux de porte, mis là par un tour antérieur. Le crible a reproposé des mots que le fichier connaissait, donc leur sélection ne doit rien au corpus aveugle même si leur promotion a été décidée en le regardant. Les deux autres, `petang` et `bahawa`, sont des différences orthographiques attestées contre `sore` et `bahwa`, et ils tiennent sur ce terrain-là.

**CE QU'IL FAUT FAIRE DU CHIFFRE** : le passage de 48 à 65 % sur le corpus aveugle de la paire **n'est plus une mesure à l'aveugle**. C'est en partie la mesure de mots choisis en le lisant. Il reste dans les tests parce que c'est la meilleure mesure disponible, et la note à côté dit ce qu'il est.

**Retrouver un aveugle propre demande un TROISIÈME corpus de paire, écrit avant que quoi que ce soit ait été lu.** Voir la file de travail.

---

### 5.36 LE SLOVAQUE, L'ITALIEN, LE NORDIQUE, et le registre chat qui ne suit plus (`815d4aa`, `468cb65`, `b3549aa`)

Trois tours de mots outils, dix-neuf lignes Tatoeba, et un quatrième qui ne livre rien.

**Le slovaque, six fois la même règle** : `sme` contre `jsme`, `môj` contre `můj`, `zajtra` contre `zítra`, `vonku` contre `venku`, `práve` contre `právě`, `správne` contre `správně`. C'est ce qui sépare le mieux deux langues proches, et ça vaut huit lignes plus une sur l'aveugle et trois sur le réglage. `ktorý` et `môžem` sont la même règle et sortent à l'ablation.

**L'italien sur sa diphtongue**, `chi`, `vuoi`, `puoi`, `vuole`. La diphtongue `uo` elle-même est impossible en plein air, l'espagnol écrit `cuota`, le finnois `vuosi`, mais ces quatre formes ne sont à personne d'autre. Le nordique prend `dere` contre `I`, `ble` contre `blev`, `gik` contre `gikk`.

**CE TOUR-LÀ A RENDU ONZE LIGNES TATOEBA ET ZÉRO SUR LES CINQ BANCS DE CHAT**, et c'est le signal qui compte : `vuole` et `vanligvis` ne sont pas ce qu'une ligne de chat écrit. Un tour qui ne bouge que Tatoeba achète du rappel de corpus et pas du rappel de produit. `langue-candidats.mjs` a un mode `chat` depuis, qui ne lit que les corpus de chat.

#### Le registre chat scandinave : RIEN, et pourquoi

**Le danois est la langue la plus muette du produit sur du chat**, 20 lignes sur 25, le norvégien 16. Leurs lignes muettes se lisent en une minute et les paires minimales sautent aux yeux : `nu` contre `nå`, `tilbage` contre `tilbake`, `herude` contre `her ute`.

Sept entrées écrites là-dessus, et l'ablation les refuse toutes : **cinq ne bougent QUE le corpus de réglage**, celui dont les lignes les ont écrites ; `nu` pareil ; `nå` transfère d'une ligne et est refusé quand même, parce que le danois dit `nå ja` tous les jours et que seul le corpus le rendait propre.

**Une ligne de chat scandinave de six mots porte une paire minimale et rien d'autre.** Lire ces paires dans le corpus de réglage et les écrire en règles, c'est apprendre vingt-cinq lignes par cœur. **Ce qui manque ici n'est pas une règle, c'est du chat scandinave en quantité.**

---

### 5.37 LE DERNIER BALAYAGE, et 2.11.0 (`00119e2`, `3a5bb30`, `5717d49`, `1253853`, `cc33af7`, `c75f6b9`)

Trois tours de mots outils qui finissent le crible, puis la livraison. `porte-mots-candidats` a fini les dix langues qu'il n'avait pas vues, `langue-candidats` le cyrillique et quatre latines.

```
lt aš čia prieš    ro în cu aici    et ära välja
bg се го има нещо тя моля           ru он она вчера
hu nem egy mindent (promus du jeu de porte)
sl vsi dober svojo kdor   cs tady velmi líbí   fi taas sinne
et en plein air : kui selle mulle, tavo reikia patinka, iyon mong maraming
```

**`що` a failli passer et un seul banc l'a vu.** `lang-screen.mjs` lit Tatoeba et chat1 et le déclarait exclusif à l'ukrainien ; le banc de chat non latin porte `току що дойдох`, qui est bulgare, et il partait à l'ukrainien. Ce banc était à zéro erreur depuis le tour arabe. **Un crible qui lit deux corpus ne peut pas blanchir un marqueur pour dix bancs : lancer le diff avant de croire un crible, chaque fois.**

#### Les portes hors ligne, et les trois défauts qu'elles portaient

`run-gates.mjs` n'avait pas été lancé de la passe. Il l'a été, et il a rendu **38 portes sur 38 vertes** après trois corrections :

- **`audit-poids` était rouge pour une vraie raison.** Le script injecté pèse 248 199 octets contre une référence de 233 217. La hausse a été SÉPARÉE plutôt que devinée : le même build avec le seul `langDetect.ts` de master pèse 233 727, donc **14 472 octets sont les règles de détection** et 510 l'intégration du cantonais hors détecteur. La référence est à jour avec ce partage et ce qu'il achète.

- **Le cantonais était livré SANS SON DRAPEAU.** `FLAG_BY_LANG` porte `yue: 'hk'`, `flagClass('yue')` rend `kt-flag kt-flag-hk`, et aucune règle `.kt-flag-hk` n'existait dans la feuille. Le panneau dessinait un carré vide depuis la branche cantonaise. Rien dans la suite ne pouvait le voir : le test de table vérifie que chaque langue A un code, ce qui était vrai. **Un garde statique lit maintenant la feuille et échoue sur tout code distribué sans règle derrière**, vérifié en retirant la règle.

- **`flags-preview` était rouge sur tout clone** depuis toujours : il lit un `flags.css` que rien ne produit. Il lit la feuille livrée maintenant, et sa liste de langues vient du module au lieu d'une table de 42 écrite à la main, qui avait manqué exactement la langue dont le drapeau n'existait pas. Il sort de `run-gates` avec `lang-panel-measure` : le premier ne sert qu'à REGARDER, le second ouvre une page que le dépôt ne contient pas.

#### 2.11.0

Le store est sur **2.9.2** : 2.10.0 a été taggée et jamais publiée, comme 2.9.3 et 2.9.4. Cette version porte donc les deux. `release/PUBLIER.md` contient les sha256, le chemin dans la console développeur et le texte prêt à coller.

```
confidentLanguage   1262 r / 3688 s / 90 w   ->   3698 r / 1339 s / 3 w
detectLanguage      3019 / 804 / 1217        ->   4148 / 392 / 500
langues a zero      26                       ->   0
chat aveugle        48 %                     ->   55 %
paire ms/id         48 %                     ->   65 %
```

---

### 5.38 LES SIX DERNIERES LANGUES, et le fond du registre chat (`8bc1cbd`)

Le crible en plein air n'avait jamais tourné sur `de`, `sv`, `pl`, `ro`, `tr` et `nl`, parce qu'elles étaient les plus hautes du tableau et qu'on cherche d'abord là où il manque le plus. Trente-trois lignes Tatoeba et **quatre sur le corpus aveugle, 55 à 57 %**.

La moitié des mots vient des jeux de porte, où ils ne servaient qu'une ligne accentuée sur deux, et ce sont les plus fréquents de leurs langues : `nicht`, `auf`, `jest`, `heeft`.

```
de 79 -> 92 sur 120, pl 98 -> 104, nl 101 -> 108, ro 93 -> 102, tr 95 -> 97
```

**`jag` et `och` repartent dans le jeu de porte suédois** : en plein air ils ne gagnent rien, `ä`, `ö` et `är` ayant déjà leurs lignes. L'ablation le dit, et c'est le sens inverse de la promotion, qui vaut d'être noté : un mot n'est pas mieux en plein air par principe.

**`ich` est refusé et c'est le candidat le plus cher du tour.** Trente-cinq lignes allemandes, plus qu'aucun autre, et le polonais comme le slovaque écrivent `ich` pour « leur ». Mesuré : dix lignes de plus, une erreur sur Tatoeba et SEPT sur le banc clavier. **`inte` est refusé aussi, et seul le banc des lignes MÉLANGÉES voit pourquoi** : il répond sur une ligne à deux langues.

#### LE REGISTRE CHAT EST AU FOND, et voici comment on le sait

Le mode `chat` du crible, qui ne lit que les corpus de chat, a été lancé sur les cinq langues les plus muettes qui restaient, `sk`, `ca`, `sl`, `es`, `it`, en mots, en séquences et en fins de mot. **Il rend zéro candidat propre partout**, sauf `hi` pour le catalan, qui est le bonjour anglais, et `cuá` pour l'espagnol.

`cuá` a été mesuré : `cuánto` contre le catalan `quant` et le portugais `quanto`, c'est une vraie règle. Elle vaut **+1 sur chat1 et +1 sur chat3, zéro sur Tatoeba et zéro sur l'aveugle**. Les deux corpus qu'elle bouge sont ceux que le crible a lus pour la proposer. **Refusée** : le critère ne change pas parce que le filon se tarit.

**Ce qui manque aux langues encore muettes sur du chat n'est pas une règle.** `da` 20 lignes muettes sur 25, `en` 16, `no` 16, `sk` 15, `ca` 14 : leurs lignes muettes portent des mots qui n'apparaissent qu'une fois. Un crible ne peut pas proposer ce qui ne se répète pas, et écrire une règle par ligne est l'apprentissage par cœur que toute cette branche refuse. **La marche suivante est du chat, en quantité, dans la langue visée.**

---

## 6. État par phase

| Phase | Contenu | État |
|---|---|---|
| 0 | banc 43x43 + corpus + chiffre de référence, zéro correction | **FAIT** |
| 0b | corpus chat pour le rappel en registre court | **FAIT**, 390 lignes, 26 langues, section 2bis |
| 1 | plomberie : `confidentLanguage` là où la réponse brute sert | **1 des 3 faits**, et le 2e est TRANCHÉ NON par 0b, voir section 10 |
| 2 | combler les langues sans règle | **FAIT sur les DEUX chemins** : plus aucune langue à zéro |
| 3 | clusters de confusion, classés par la matrice | **cyrillique et ARABE fermés** ; catalan divisé par trois ; `id`/`ms` ouvert sur le registre réel du produit (5.27) mais intact sur Tatoeba ; nordique nommé, pas fermé |
| 4 | barrière anti-régression en CI | **FAIT** : les TROIS bancs tournent dans `vitest run` |

---

## 7. La file de travail, par valeur décroissante

**Où investir, mesuré plutôt que supposé.** Quatre mécanismes servent le chemin sûr et ils ne se valent pas :

| mécanisme | portée | mémorise ? | transfère à l'aveugle ? |
|---|---|---|---|
| écriture, lettre, séquence | toute longueur | non | **oui** |
| porte à LETTRE, puis mot derrière | toute longueur | non | oui, 5 fois sur 5 |
| porte à MOT, déclenchée par un token | toute longueur | non | **oui, et elle survit au clavier** |
| terminaison | toute longueur | peu, 4 points | oui, mais **pas d'un registre à l'autre** |
| lexique de mots | ≤ 20 car. | oui | **21 groupes sur 26 transfèrent**, mais le tour MARGINAL ne transfère plus |

Les chiffres sont en 2bis-bis, 2ter, 5.14 à 5.19.

**AVANT TOUT AJOUT, ET C'EST NOUVEAU** : relancer `porte-ablation.mjs`. Un lot qui entre peut tuer une entrée ailleurs dans le fichier sans qu'aucun total ne bouge, mesuré trois fois maintenant. Section 5.19.

1. ~~Le côté MALAIS de la paire est la seule langue encore à sec~~ **FAIT, section 5.27.** Le malais passe de 10 à 14 lignes sur 30 sur le corpus aveugle de la paire, et la paire entière de 37 % à 48 % de rappel. Ce qui restait à trouver n'était pas un mécanisme nouveau mais `aku`, et ce qui l'a trouvé est un crible posé dans le bon registre.

   **Ce qui reste ouvert de ce côté** : les lignes qui ouvrent la porte sans qu'aucun mot ne tranche, 17 sur 30 côté malais avant ce tour et moins maintenant. Elles demandent des mots de départage, donc du lexique, donc le critère d'arrêt de 5.27 s'applique : mesurer chaque mot par ablation et ne garder que ce qui bouge un corpus qu'il n'a pas servi à choisir. **Le taux observé est de cinq sur trente-quatre.**

2. **Les portes à MOT sont le filon le plus récent**, sections 5.16 et 5.17. Elles ont fait pour la paire scandinave ce que trois tours de lettres n'avaient pas fait, elles survivent aux diacritiques tombées, et le crible les trouve tout seul. Ce qu'il reste : `porte-candidats.mjs` ne rend plus de déclencheur de paire inutilisé au-dessus de quatre lignes. Descendre encore ne donnera que du bruit, il faut un corpus de plus.

3. **Le crible à LETTRE est épuisé** et le dit : ses trois listes sortent vides. Le relancer après un changement de corpus, pas avant.

4. **Les paires qui restent, chemin brut** : `id -> ms` 44, `no -> sv` 34, `ms -> id` 33, `da -> sv` 31, `ca -> es` 29, `da -> nl` 28, `ca -> fr` 19, `sk -> cs` 18.

5. ~~Les 7 erreurs restantes du chemin sûr~~ **IL EN RESTE TROIS ET AUCUNE N'EST RÉPARABLE**, section 5.26. Ne pas rouvrir ce point sans un corpus neuf : deux des trois sont un défaut d'étiquetage de Tatoeba, pas un défaut du détecteur, et la troisième demande un mot que l'arabe écrit aussi.

7. **Le cantonais est la langue la mieux servie du produit après les écritures sans ambiguïté**, 114 sur 120, et son banc propre est à 91 % sur la moitié tenue à l'écart. Ce qui lui manque n'est pas une règle mais **un corpus récolté** : Kick n'a presque pas de chaîne hongkongaise, les deux moitiés du banc sont écrites à la main, et `kick-fake-chat.js` existe précisément pour voir le chemin complet tourner sans en attendre une. Section 5.25.

6. **`mano` coûte deux lignes** et c'est un vrai mot espagnol et lituanien. Jamais mesuré, et le corpus 3 le permet.

8. **ÉCRIRE UN TROISIÈME CORPUS DE PAIRE**, et c'est le seul point de cette file qui ne peut PAS être fait par la session qui a lu les tables. Section 5.35 : l'aveugle actuel a servi à choisir des mots, donc son 65 % n'est plus un chiffre aveugle. Le nouveau doit être écrit d'abord, mesuré ensuite, et jamais relu.

9. **Le registre chat ne bouge plus autant que Tatoeba**, et c'est le signal à surveiller. Le tour italo-nordique a rendu onze lignes Tatoeba et ZÉRO sur les cinq bancs de chat : `vuole` et `vanligvis` ne sont pas ce qu'une ligne de chat écrit. Quand un tour ne bouge que Tatoeba, il achète du rappel de corpus et pas du rappel de produit, et il faut le dire dans le commit.

### Ce qu'il ne faut PAS refaire

- **Un tour de lexique choisi à la main.** Mesuré deux fois : sept lignes sur le corpus de réglage et **zéro** sur l'aveugle en 2ter, puis trente-sept mots sur quarante-deux qui ne bougent que leur propre corpus en 5.18. Le fond de la méthode est atteint pour le tour MARGINAL. Le lexique déjà en place, lui, transfère toujours.

- **Lever `SHORT_TEXT_MAX`.** Mesuré trois fois, section 2quater. 30 → 40 est une perte sèche.
- **Compter les mots du lexique pour se passer de la borne.** Mesuré, section 5.13, cassé par `tamam kanka good game`.
- **Trier les mots en « sociaux » et « structurels ».** Mesuré, l'idée est fausse.
- **Basculer le moteur on-device sur `confidentLanguage`.** Section 10, et le chiffre a bougé : à rouvrir quand l'aveugle passera sous la moitié.
- **Remettre une porte `no`/`da` générique derrière `ø æ`.** Mesurée, section 5.14 : zéro ligne sur les cinq bancs, et elle casse l'unanimité.
- **Mettre `là` dans un jeu de porte vietnamien.** C'est le `là` français au caractère près, il a volé trois lignes.
- **Une porte de séquence ASCII** (`sz`, `dz`). Mesurée, section 5.16 : le déclencheur vit dans le mot qui tranche.
- **Croire `lang-screen.mjs` sans lancer le diff.** Il lit DEUX corpus sur dix, section 5.37 : `що` en est sorti exclusif et il est bulgare. Le crible propose, le diff dispose.
- **Relancer le crible en mode `chat` sur `sk`, `ca`, `sl`, `es`, `it`.** Fait, section 5.38, en mots, en séquences et en fins de mot : zéro candidat propre. Ce qui reste muet sur du chat porte des mots qui n'apparaissent qu'une fois, et un crible ne propose pas ce qui ne se répète pas.
- **Mettre `ich` dans la table exclusive allemande.** Mesuré, 5.38 : le polonais et le slovaque l'écrivent, une erreur sur Tatoeba et SEPT sur le banc clavier pour dix lignes.
- **Laisser un crible lire un corpus AVEUGLE.** Section 5.35 : les trois cribles neufs le faisaient, et le chiffre de la paire en a payé le prix. Compter un mot dans un aveugle est permis, y chercher des mots ne l'est pas.
- **Chercher un arbitrage plus malin que l'unanimité** dans la table des lettres exclusives. Mesuré, section 5.24 : **un seul désaccord sur 6070 lignes**, et il est fermé. À rouvrir quand la table aura beaucoup grossi, pas avant.
- **Appliquer le critère de l'ablation à la table cantonaise** et supprimer ce qui rapporte zéro. Section 5.25 : neuf de ses marqueurs n'apparaissent nulle part et c'est normal, une règle de PRÉSENCE ne se choisit pas sur le gain mesuré.
- **Ajouter `嘈`, `郁`, `掂`, `慳`, `氹` au cantonais.** Mesurés ou argumentés en 5.25, tous les cinq ont un sens en chinois standard.
- **Ajouter `收皮`, `好耐`, `細路`, `多過`.** Le chinois s'écrit sans espaces et fabrique les quatre par-dessus une frontière de mot, exactement comme 而家.
- **Chercher un septième mot persan** pour les lignes que la table rend arabes. Mesuré, 5.26 : le crible à mots est épuisé de ce côté, deux des quatre lignes ne portent aucun candidat. Ce qui les a fermées est l'autre côté, la preuve arabe.
- **Mettre `من` dans la preuve arabe.** C'est le pronom `je` du persan au caractère près, et il portait dix-sept des dix-neuf lignes de bruit du premier essai.
- **Un déclencheur de paire tiré des corpus PARALLÈLES.** Mesuré deux fois, 5.27 : ils sont en registre neutre, les mots qui comptent n'y sont pas, et le crible rend zéro en concluant à tort que le déclencheur n'est pas le problème. Le crible se pose dans le registre visé.
- **Une porte morphologique pour la paire** (`-nya`, `-kan`, `-lah`, `ber-`, `meng-`, `ter-`, `se-`). Mesurés tous les neuf, 5.27 : un affixe de trois lettres en écriture latine appartient à tout le monde. Le seul propre, `-lah`, n'ouvre aucune ligne.
- **Ajouter des mots à la paire sans passer par `mot-ablation.mjs`.** Mesuré, 5.27 : cinq sur trente-quatre transfèrent, et la version complète donne le MÊME chiffre que la version réduite sur les neuf autres bancs.
- **Ajouter une lettre arabe à la table des exclusives pour le malais.** Le crible les proposait par un défaut de filtre, corrigé en `0e14a6a`.
- **Nommer l'anglais avec un seul marqueur.** Mesuré, `anglais-essai.mjs` : `the`, `you`, `inte` sont propres sur les quarante-deux autres langues et tous les trois nommés par le banc des lignes mélangées. **L'anglais est la langue avec laquelle tout le monde mélange.**
- **Nommer l'anglais en comptant DEUX marqueurs plus l'absence de toute autre langue.** Mesuré aussi, et c'est un résultat à moitié positif qu'il faut lire en entier : dès deux marqueurs le vol tombe à **zéro** sur les quatre corpus, donc la forme de la règle était bien le problème. Mais le banc mélangé en nomme deux à ce seuil, et au seuil admissible de trois le gain tombe à onze lignes. Le prototype est committé avec ses chiffres et sa condition de réouverture.
- **Supprimer les entrées de lexique turques et hongroises** parce qu'elles mesurent zéro. Section 5.19 : les corpus ne portent jamais `selam` ou `kanka` sur une ligne sans autre lettre turque, ce qui est le seul cas pour lequel elles existent.
- **Basculer `translateAndApply(msg, real, detected)` sur la réponse sûre.** Section 10 : ce paramètre ne sert qu'à dimensionner la fenêtre de contexte, et la basculer la rétrécirait.

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
| `test/e2e/build-lang-corpus.mjs` | télécharge Tatoeba, échantillonne, génère le corpus | oui |
| `src/content/langCorpus.ts` | **généré**, 42 langues, 5040 lignes, 206 Ko | oui |
| `src/content/langMatrix.ts` | le calcul et le formatage, partagés | oui |
| `src/content/langMatrix.test.ts` | les assertions Tatoeba, tourne en CI | oui |
| `src/content/langChatCorpus.ts` | **écrit à la main**, 26 langues, 390 lignes de chat | oui |
| `src/content/langChat.test.ts` | les assertions du registre chat, tourne en CI | oui |
| `src/content/langChatCorpus2.ts` | **le corpus AVEUGLE**, 260 lignes, ne jamais y puiser | oui |
| `src/content/langChat2.test.ts` | la mesure aveugle, section 2bis-bis | oui |
| `src/content/langChatCorpus3.ts` | le corpus de **réglage**, 260 lignes | oui |
| `src/content/langChat3.test.ts` | le corpus de réglage et le critère d'arrêt | oui |
| `src/content/langChatNonLatin.ts` | chat des **11 écritures non latines**, 110 lignes | oui |
| `src/content/langChatNonLatin.test.ts` | la mesure des écritures sur du chat | oui |
| `src/content/langMixedCorpus.ts` | **écrit à la main**, 60 lignes qui changent de langue | oui |
| `src/content/langMixed.test.ts` | le banc qui garde la borne de 20 caractères | oui |
| `src/content/langDetect.dix.test.ts` | le banc de chat des 5 langues non latines | oui |
| `test/e2e/lang-screen.mjs` | **le crible**, trois corpus d'un coup, garde vérifié | oui |
| `test/e2e/porte-diff.mjs` | **le diff de protocole 4.2**, cinq bancs, carte de confusions clé par clé | oui |
| `src/content/langChatPaireCorpus.ts` | **la paire, MESURE**, 30 lignes ms + 30 id, non paralleles | oui |
| `src/content/langChatPaire.test.ts` | le banc de la paire | oui |
| `src/content/langChatPaireReglageCorpus.ts` | **la paire, REGLAGE**. On y lit, on y choisit | oui |
| `test/e2e/porte-ablation.mjs` | ce que chaque LIGNE de table rapporte seule | oui |
| `test/e2e/mot-ablation.mjs` | ce que chaque MOT d'une alternance rapporte seul | oui |
| `test/e2e/lexique-ablation.mjs` | le lexique, par langue puis par entree | oui |
| `test/e2e/porte-diagnostic.mjs` | porte fermee ou porte ouverte sans mot, la question qui dit ou corriger | oui |
| `test/e2e/arabe-candidats.mjs` | le crible a mots porte a l'ecriture arabe, ar fa ms ur | oui |
| `test/e2e/anglais-essai.mjs` | **prototype non livre**, l'anglais par comptage. Resultat negatif en tete | oui |
| `test/e2e/porte-candidats.mjs` | **le crible de portes**, quelle lettre reste libre, avec sa liste de rejetés | oui |
| `test/e2e/unanimite.mjs` | **les lignes que l'unanimité fait taire**, paire par paire | oui |
| `test/e2e/variante.mjs` | **mesurer une variante sans la committer**, neuf bancs, restaure dans un `finally` | oui |
| `test/e2e/canto-candidats.mjs` | **le crible cantonais**, le candidat apparaît-il en zh, zh-tw, ja | oui |
| `test/e2e/canto-bench.mjs` | le banc cantonais, moitié réglage et moitié tenue à l'écart | oui |
| `test/e2e/arabe-preuve.mjs` | **quelle preuve l'arabe porte lui-même**, jeu par jeu | oui |
| `test/e2e/paire-declencheur.mjs` | **le crible du déclencheur de la paire**, dans le bon registre | oui |
| `test/e2e/paire-sequences.mjs` | **le crible du TRI INTÉRIEUR**, deux codes de langue en argument | oui |
| `test/e2e/porte-partagee-diagnostic.mjs` | le diagnostic porté aux **portes partagées**, trois causes de silence | oui |
| `test/e2e/langue-candidats.mjs` | **une langue contre les 41 autres**, mots, séquences et fins de mot | oui |
| `test/e2e/porte-mots-candidats.mjs` | **quel mot mettre dans un jeu de porte**, seuil sur les rivaux seuls | oui |
| `src/content/langChatDixCorpus.ts` | **le DIXIÈME banc**, 100 lignes, ar ja ko ru | oui |
| `test/e2e/lang-matrix.mjs` | écrit le rapport lisible | oui |
| `test/e2e/lang-matrix.md` | le rapport | non, régénérable |

```bash
# LE DIFF QUI DECIDE, protocole 4.2. Les trois lignes vont ensemble, la
# troisieme n'est pas optionnelle : le garde statique de langMatrix.test.ts
# voit le fichier temporaire et la gate echoue tant qu'il est la.
git show HEAD:src/content/langDetect.ts > src/content/langDetectV0.ts
node --import tsx test/e2e/porte-diff.mjs
rm src/content/langDetectV0.ts

node test/e2e/build-lang-corpus.mjs          # régénérer le corpus (réseau)
node --import tsx test/e2e/lang-matrix.mjs   # régénérer le rapport
npx vitest run src/content/langMatrix.test.ts          # le banc Tatoeba
npx vitest run src/content/langChat.test.ts            # le banc de chat latin
npx vitest run src/content/langMixed.test.ts           # le banc des lignes melangees
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
| `08e7153` | Bring the handoff up to the chat bench and the five commits after it |
| `e93c596` | Separate Malay from Indonesian, the last pair with no rule at all |
| `84b0ba2` | Give Catalan the words its middle dot cannot reach |
| `c42ce80` | Measure what raising SHORT_TEXT_MAX would cost, not just what it would buy |
| `0d40173` | Reject counting lexicon words as a substitute for the length bound |
| `aaf077e` | Add the four exclusive letters the table had walked past |
| `a3f9332` | Let the ring above the a name the Scandinavian trio, not just the pair |
| `f2ed62f` | Read Finnish off its vowel harmony, and three more exclusive sequences |
| `84a3a55` | Bring the handoff up to a branch where nothing scores zero any more |
| `9741e9a` | Let the crossed o name Estonian, and give Slovene the words it has |
| `7e12dd7` | Read Spanish off its inverted punctuation, and four languages off their endings |
| `8cb1183` | Give English a vote, which makes the detector quieter on mixed lines, not louder |
| `f5de950` | Find endings by searching instead of by knowing, and fix the vote it exposed |
| `36496f3` | Rerun the ending search with a working regex, and correct what the broken one said |
| `e9684c4` | Commit the screening tool instead of retyping it every time |
| `550221a` | Record the broken-guard lesson and point the protocol at the committed screen |
| `9e18889` | Aim the lexicon at the silence instead of at the languages without a rule |
| `0235ee5` | Take the chat silence from sixty percent to fifty-four |
| `048bfce` | Rewrite the queue around the lever that is working |
| `e7736d0` | Measure the lexicon on chat it has never seen, and find a third of the recall gone |
| `c716010` | Correct every chat figure the handoff was overstating, and say why |
| `3ca422a` | Split the blind-corpus gap into memorisation and line length |
| `fe8574c` | Extract endings from prose, and find out they serve prose |
| `3133362` | Rewrite the queue around where effort pays, with the numbers that say so |
| `7850d7f` | Write a corpus that may be tuned on, and watch it kill a rule in four lines |
| `2d57026` | Stop the lexicon: forty-three words, seven lines here, zero on the blind corpus |
| `eb4edff` | Add the three-corpus rule and retire the lexicon from the top of the queue |
| `26d4af3` | Measure the eleven non-Latin languages on chat, which nobody had done |
| `fe1faea` | Record the non-Latin chat measurement and what it found in the Chinese table |
| `a7ac4c2` | Open the two widest gates: the a-umlaut and the s-caron |
| `c1b11a8` | Turn the shared-letter gates into a table, which makes four more of them free |
| `a87e7e5` | Open fourteen more shared-letter gates, and throw out the two words that made them lie |
| `1cb8a11` | Bring the handoff up to the gate table, and correct the four figures it was stating from before |
| `355d15a` | Screen for the gates nobody had opened, and find the widest one still free |
| `34aff1e` | Add the thirty-three letters only Vietnamese writes, and the s-cedilla only Turkish writes |
| `0e14a6a` | Stop the screen from proposing Arabic letters as Malay, and record that it is now empty |
| `c3f2942` | Open the Nordic pair on a word instead of a letter, which is what it was waiting for |
| `380c60b` | Record the word gate, the sequence rejection, and where the queue points now |
| `eb3b2cf` | Give Tagalog the three grammar words that name it, which nothing here could reach |
| `eace823` | Open five more pairs on a word, and say why the blind corpus cannot judge this round |
| `f9fbd11` | Record the word pass, Tagalog, and the one queue item that needs a corpus and not code |
| `35aea2e` | Measure what each table entry is worth on its own, and delete the seven that are worth nothing |
| `b180b95` | Run the ablation over the exclusive-letter table too, and write down the two entries it exposed |
| `95ce686` | Correct phase 1: six consumers not three, and the last one is not the free win it was written as |
| `3c73390` | Write the corpus the Malay/Indonesian pair was waiting for, and find out the register makes it quieter |
| `71af869` | Try to widen the pair trigger on the screen's own words, and find out the trigger is not what blocks it |
| `fe6bfa5` | Write the tuning twin for the pair, tune on it, and throw out thirty-seven of the forty-two words it gave |
| `013a2ca` | Measure the whole lexicon, delete the fourteen entries a letter had quietly shadowed, and guard the class |
| `cc3227d` | Bring the handoff up to the pair corpora and the ablation, and rewrite the queue around what they found |
| `6888e3c` | Open the Malay side on its own particles, and fix the ablation bug that had been reporting the wrong words |
| `4f53a64` | Promote the ablation to the protocol, with the two ways it lies |
| `a23e337` | Delete one lexicon entry, and watch the error count move for the first time in twenty commits |
| `3b7c45a` | Read Persian off six words when no Persian letter is there, and take the error count to ten |
| `4b54fbb` | Read Jawi off three words as well, and close the Malay half of the Arabic-script block |
| `7df1ed6` | Give Ukrainian three words, and leave nothing wrong outside the Arabic and Chinese scripts |
| `728fbe2` | Record the four rounds that took the error count from fifteen to seven |
| `c77dd47` | Sort Danish from Norwegian on four pairs of letters, and cut the nine words that were riding along |
| `1de29f6` | Ask the screen which sequences one language writes and another never does, and gain forty-five lines |
| `1e6e4c0` | Take a second harvest of sequences, and let two of them retire entries that were wider than they needed to be |
| `6f32699` | Record the sequence rounds, the biggest gain on this branch since the Cyrillic fallback |
| `a3a2509` | Ask the Finnic pair the sorting question, and take the blind chat corpus past a hundred and ten |
| `f39220d` | Ask the last thirteen pairs, and find that almost everything they offer is already taken |
| `dc9d3fb` | Name Danish and Norwegian outright on two sequences, instead of sorting them behind a gate |
| `214d9e1` | Close the sequence sweep on Hungarian and Tagalog, and take the blind corpus to 116 |
| `32b6d98` | Record the sequence campaign, twenty-three pairs, and mark the seam worked out |
| `8209a18` | Put eight exclusive function words in the letter table, and gain forty-seven lines |
| `0923977` | Screen forty-eight more function words, and let the keyboard bench refuse three nobody else could |
| `1a26688` | Promote eight words that were only working behind a gate |
| `cb06d00` | Record the exclusive-word campaign, the largest gain on this branch |
| `c753413` | Reopen ignoreEnglish, because the number its decision rested on moved by a factor of thirty-eight |
| `49dd7c7` | Bring the on-device silence figure down to two points from its own reopening threshold |
| `7b59728` | Refresh the chat bench section, which was quoting figures three campaigns old |
| `1711b0a` | Try naming English by counting markers instead of finding a better one, and record why it is not shipped |
| `eee3fce` | Put the English counting result in the do-not-redo list, with its reopening condition |
| `c23c0c9` | Retire the last two gates the exclusive words replaced, and leave the table with nothing dead in it |
| `da1de5e` | Bring the commit list and the bundle figure up to the close-out |
| `b297cd2` | Add two more Nordic markers, and lose two lines to a trigger that was already a decider |
| `3962609` | Guard the trigger-is-also-a-decider defect, which has cost lines twice and fails no test on its own |
| `f733750` | Promote the trigger-is-also-a-decider rule to the protocol, with the guard that now holds it |
| `b6ce662` | Widen the keyboard bench from 390 lines to 5430, and find thirty errors it could not see |
| `0dc2beb` | Tighten the Portuguese diminutive instead of deleting it, and clear the largest block on the new bench |
| `4ced044` | Take the undiacriticked errors from nineteen to fifteen, one free and one measured both ways |
| `6ad28ae` | Count what the unanimity rule costs, and clear the one line it was costing |
| `1e2a4e4` | Open the Cantonese rule a second time, after finding out what it was built on |
| `9ad2dea` | Make Arabic name itself instead of being the answer when nobody speaks |
| `1f1f32e` | Open the Malay gate on the word both languages write, and ship five of thirty-four |
| `3eb7479` | Sort Danish from Norwegian on fourteen spelling rules, and gain thirty-two lines |
| `be65c1d` | Run the pair screen on three more close pairs, and take seventeen more lines |
| `819f421` | Ask the shared gates the diagnostic question, and take Catalan from 36 to 65 |
| `35b42fe` | Reopen the gate word sets, which nobody had touched since the day they were written |
| `e353d62` | Give five more languages the open-air words Catalan got, and retire two entries they killed |
| `ef359f6` | Take the Malay pair from 48 to 65 per cent by letting four words out of the gate |
| `5cd4742` | Widen the Nordic trigger, and find a word that has been wrong since the first day |
| `c1a2d69` | Ship two of four spelling differences in the Malay pair, and say what the block really needs |
| `815d4aa` | Write the Slovak spelling difference six times, and gain eight lines |
| `468cb65` | Take Italian off its diphthong and the Nordic pair off four more spellings |
| `4c7b90f` | Stop the three new screens from reading the corpora that are supposed to be blind |
| `b3549aa` | Try the Scandinavian chat register, ship nothing, and write down why |

---

## 10. Phase 1 en détail, ce qui reste

`pipeline.ts` lit la langue une fois et s'en sert à **six** endroits, pas trois. Les numéros de ligne ci-dessous ont été revérifiés au commit `b180b95` ; ils bougent à chaque passe, la colonne sert à retrouver le site, pas à l'asserter.

| Consommateur | Ligne | État | Pourquoi |
|---|---|---|---|
| `isSameLanguageAsTarget`, le verrou qui efface | `:212` | **basculé sur `confidentLanguage`** | 1217 lignes effacées à tort deviennent 15 aujourd'hui. Commit `71e78c4` |
| `ignoreEnglish` | `:180` | **laissé sur la réponse brute, mais le chiffre a bougé** | 1 ligne anglaise sur 120 quand la décision a été prise, **38 aujourd'hui**. La note « revérifié après chaque passe » était fausse depuis plusieurs passes. Mesure complète et arbitrage ci-dessous |
| `shouldDropBySourceLang`, l'allowlist | `:215` | **laissé sur la réponse brute** | Il droppe sur `lang_unknown`. Un détecteur plus silencieux le ferait supprimer **davantage**. Ce n'est pas son entrée qu'il faut changer, c'est sa sémantique |
| `localEngine.translate(detected, ...)` | `:286` | **TRANCHÉ, mais sur un chiffre PÉRIMÉ**, voir ci-dessous | |
| `detectedLang: detected`, le drapeau | `:287` | **PAS cosmétique, pas indépendant**, voir ci-dessous | |
| `requestCloud(..., confidentLanguage(real))` | `:340`, `:393` | **déjà sur la réponse sûre** | Ce consommateur ne figurait pas dans la table. C'est lui qui devient `source_lang` chez DeepL et `sl` chez Google, donc celui qui pouvait faire le plus de dégâts, et il est correct depuis qu'il est écrit |

### `ignoreEnglish` : le chiffre qui justifiait la décision a changé d'un facteur trente-huit

La ligne du tableau disait : « la réponse sûre ne nomme qu'**1 ligne anglaise sur 120**, contre 78 pour franc. Revérifié après chaque passe : l'anglais n'a pas de lettre exclusive, ce chiffre n'a pas bougé. »

**Il a bougé.** Les terminaisons anglaises puis les mots outils exclusifs l'ont porté de 1 à **38 sur 120**. La phrase « revérifié après chaque passe » n'était plus vraie depuis plusieurs passes.

Mesure complète, `2026-09-21`, les quatre corpus :

| corpus | chemin | anglaises nommées | lignes NON anglaises appelées `en` |
|---|---|---:|---:|
| Tatoeba | brut | 95 / 120 | **29** |
| Tatoeba | sûr | 38 / 120 | **0** |
| chat 1 | brut | 12 / 15 | **5** |
| chat 1 | sûr | 7 / 15 | **0** |
| chat 2 AVEUGLE | brut | 7 / 10 | **2** |
| chat 2 AVEUGLE | sûr | 3 / 10 | **0** |
| mélangé | brut | — | **13 / 60** |

**CE QUE CHAQUE COLONNE COÛTE, et les deux coûts ne sont pas de même nature.**

Une ligne **non anglaise appelée `en`** est un message que le lecteur anglophone **ne voit jamais** : `ignoreEnglish` l'efface sans le traduire. Une ligne anglaise **non nommée** part au moteur, revient identique, et le test `tt === real` la jette après coup : une requête gaspillée, rien de visible.

Donc : **une erreur sur quatre de ce que `ignoreEnglish` efface aujourd'hui n'est pas de l'anglais** (95 justes contre 29 fausses, 77 % de précision ; 71 % sur du chat). Et sur les lignes à deux langues, **13 sur 60 sont effacées**, toutes à tort.

Basculer coûterait 57 requêtes gaspillées sur 120 lignes anglaises de Tatoeba, 5 sur 15 lignes de chat, 4 sur 10 du corpus aveugle. Pour un lecteur anglophone dans un chat anglophone, c'est-à-dire le cas courant, c'est la majorité des messages qui feraient l'aller-retour.

**LA TROISIÈME VOIE A ÉTÉ MESURÉE ET ELLE VAUT ZÉRO.** L'idée était de garder la devinette mais de ne la suivre que si la réponse sûre ne la **contredit** pas : effacer si `detected === 'en'` et que `confidentLanguage` dit `en` ou se tait, refuser si elle dit autre chose. Gain : **zéro ligne sauvée sur les quatre corpus.** La raison est structurelle et vaut d'être retenue :

> Les lignes que franc appelle anglaises à tort sont **exactement** celles qui ne portent aucun marqueur. C'est pour ça que franc tombe sur l'anglais, et c'est pour ça que le chemin sûr s'y tait. Les deux échouent sur le même ensemble, donc l'un ne peut pas corriger l'autre.

**L'arbitrage reste donc binaire, et c'est un choix de produit à laisser à kil :**

1. **Laisser sur la devinette.** Rapide et gratuit sur la majorité des messages, au prix d'un message effacé sur quatre qui n'est pas de l'anglais.
2. **Basculer sur la réponse sûre.** Plus un seul message effacé à tort, au prix d'un aller-retour au moteur sur les deux tiers du chat anglophone.

Ne pas trancher ça dans une passe de détection. Ce qui a changé et qui justifie de rouvrir : l'option 2 coûtait 119 lignes sur 120 quand la décision a été prise, elle en coûte 82 aujourd'hui, et elle continuera de baisser à chaque tour qui nomme l'anglais.


### Le piège de `translateAndApply(msg, real, detected)`

Les lignes `:314` et `:320` passent la réponse **brute** à `translateAndApply`, et le paramètre s'appelle `sourceLang`. **Ce n'est pas le hint envoyé au moteur.** La fonction l'utilise uniquement pour `isContextCritical(sourceLang)`, qui choisit une fenêtre de contexte de deux ou de plusieurs lignes ; le hint réel est recalculé en `:340` avec `confidentLanguage`.

Le commentaire à côté le dit déjà en une phrase. Il a quand même fallu une lecture ratée pour s'en apercevoir, donc c'est écrit ici aussi : **une devinette suffit à dimensionner une fenêtre, se tromper n'y coûte rien.** Basculer ces deux lignes sur la réponse sûre RÉTRÉCIRAIT la fenêtre des langues qui en ont le plus besoin, à chaque fois que le détecteur se tait. Ne pas le faire.

### Le chiffre qui a bougé sous la décision du moteur on-device

La décision « ne pas basculer » a été prise sur **74 % de silence** sur du chat latin, avec la note « à rouvrir quand le silence sera descendu ». Il est descendu.

| banc | silence à la décision | après les portes `b180b95` | aujourd'hui `1a26688` |
|---|---:|---:|---:|
| chat 1, flatté | 74 % | 47 % | **45 %** |
| chat 2, AVEUGLE | 68 % | 60 % | **52 %** |

Le bon chiffre à lire est celui de l'aveugle. Il était à 68 %, il est à **52 %**, et le seuil écrit pour rouvrir était « sous la moitié ». **On y est à deux points.**

Ce que ça veut dire concrètement : basculer le moteur on-device sur la réponse sûre enverrait aujourd'hui **une ligne de chat sur deux** au cloud au lieu de trois sur quatre. Le coût en latence et en quota a été divisé par un tiers depuis que la décision a été prise, et il continue de baisser à chaque tour.

**La décision tient encore, de justesse, et pour une raison qu'il faut dire honnêtement : personne n'a jamais mesuré ce que coûte une devinette du côté moteur.** On sait que le chemin brut se trompe sur 16 % du chat, on ne sait pas ce que produit une traduction faite depuis la mauvaise langue source par le moteur on-device, ni si l'utilisateur le remarque. Tant que ce chiffre-là n'existe pas, l'arbitrage se fait entre un coût mesuré, la latence, et un coût supposé, la mauvaise traduction. **Le prochain pas utile n'est pas un tour de détection, c'est cette mesure-là.**

### Le drapeau n'est ni cosmétique ni indépendant

C'était écrit comme un gain gratuit. Vérifié, ça ne l'est pas.

Le drapeau ne prend la réponse brute que sur **un seul** chemin, `:287`, celui du moteur on-device. Or sur ce chemin `detected` est AUSSI la langue source qui vient d'être donnée au moteur, `:286`. Le drapeau est donc exact sur ce qui a été fait : il annonce « traduit depuis le portugais » quand le moteur a bien traduit depuis le portugais. C'est l'opération qui est fausse, pas l'affichage.

Sur le chemin cloud, le drapeau ne vient pas d'ici du tout : c'est le fournisseur qui renvoie sa propre détection (`deepl.ts:118`, `google.ts:70`), et elle est meilleure que franc.

Deux options, et **aucune mesure ne les départage**, donc c'est un choix de produit à laisser à kil :

1. **Laisser.** Le drapeau dit la vérité sur l'opération. Un lecteur qui voit un drapeau faux voit aussi une traduction fausse, et les deux se corrigent ensemble.
2. **Afficher le drapeau seulement quand la réponse sûre confirme.** Moins mensonger pour le lecteur, mais le drapeau cesse alors de décrire ce que le moteur a fait, et le diagnostic disparaît de l'écran.

Ne pas trancher ça dans une passe de détection. **Et surtout : le faire seul ne répare rien**, puisque la traduction resterait faite depuis la mauvaise langue. Le vrai correctif est la ligne du dessus, `:286`, et elle attend le chiffre de silence.

---

## 11. Conventions du repo

- Commits : sujet à l'impératif, corps expliquant la cause, le correctif, et **comment il a été constaté**. Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Gate : `npm run release:check`, jamais seulement `typecheck` et `test`. Il lance aussi `lint`.
- Poids du bundle content relevé avant et après toute modification du content script. **Mesurer les deux bouts soi-même**, la méthode des relevés anciens n'est pas écrite et ils ne se raccordent pas. Repère en `gzip -9` sur `dist/assets/content.js` : 91484 avant les lettres exclusives, 94212 avant les portes partagées, **96448 aujourd'hui** (`b3549aa`), soit +4645 octets depuis l'origine, 4 % du bundle, pour l'ensemble des règles, vingt-sept portes et 433 entrées de lexique. Le détail des neuf derniers tours : +322 octets pour +83 lignes, +44 pour +15, +113 pour +23, **-51 pour +14**, **+13 pour +39**, +65 pour +8, -10 pour +2, +22 pour +5, **-76 pour zéro**, qui ne fait que supprimer des entrées qui ne pouvaient plus se déclencher, **+5 pour +1** ligne aveugle en resserrant `aat`, **+94 pour +2**, le seul tour du chantier à payer un prix pareil parce qu'il achète douze caractères cantonais dont aucun ne gagne de ligne sur les bancs d'aujourd'hui, **+73 pour quatre erreurs fermées** avec la preuve arabe, et **+10 pour +7 lignes aveugles** au dernier, qui est le meilleur rapport de tout le chantier après la porte nordique. Les deux meilleurs rapports de tout le chantier sont la porte nordique à mot, qui supprime plus de code qu'elle n'en ajoute, et les marqueurs tagalog, treize octets. Les six corpus ne pèsent rien dans le bundle, un garde statique de `langMatrix.test.ts` le vérifie à chaque passe.
- Pas de nom de streamer ou de chaîne en dur, nulle part.
- Pas d'emoji dans le code.
- Les données de test vivent **inline dans le fichier de test**, pas dans une fixture séparée.
