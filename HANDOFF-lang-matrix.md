# Handoff: language-detection matrix across the 43 languages

État vivant de ce chantier. Mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-21. Dernier commit de **code** du chantier : `0bd3699` (les commits qui suivent et ne touchent que ce fichier sont des mises à jour de ce document). Phase 2 en cours, **5 langues restantes** et ce sont les cinq sans lettre propre, donc la phase 2 ne peut plus avancer sans lexique.

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
npm ci            # seulement si node_modules absent
npm run release:check
```

**Avertissement sur l'arbre de travail.** Il contient un WIP de kil sans rapport avec ce chantier, un redesign d'UI de chat : `src/content/inject.css`, `src/content/langMenu.ts`, `src/options/styles.css`, `src/popup/styles.css`, `tailwind.config.ts`, `src/content/chatStyles.test.ts`, `src/content/injector.test.ts`, `scratchpad/audit_da.py`, plus trois fichiers non suivis `src/shared/theme.css`, `src/shared/theme.test.ts`, `src/content/langPanelGeometry.test.ts`.
**Ne jamais faire `git add .` ni `git commit -a`.** Chaque commit de ce chantier stage ses fichiers un par un, par chemin.

---

## 1. Pourquoi ce chantier existe

kil : "je remarque pas mal de faux positifs et ça peut souvent être vu comme une extension cheap. Ça arrive lorsque l'on sélectionne les options par défaut, sans sélectionner les langages que l'on souhaite."

Le diagnostic initial était à moitié faux et la vraie cause est pire. Résumé en cinq lignes, détail complet dans le plan :

1. `sourceLangAllowlist` vide, le défaut, ne filtre **rien** (`filters.ts:25`). L'allowlist n'est pas le coupable.
2. `pipeline.ts:175` appelle `detectLanguage`, la réponse **brute** de franc. Elle est juste **32 %** du temps (`HANDOFF.md`, 804 messages espagnols) et même **16/85** en espagnol et **13/51** en turc selon une seconde mesure (`langDetect.ts:417-420`).
3. Cette réponse pilote trois décisions : effacer le message en silence s'il croit reconnaître la langue du lecteur (`pipeline.ts:183`), imposer la langue source au moteur on-device qui est le moteur par défaut sur Chrome (`pipeline.ts:255`), et alimenter le drapeau affiché (`pipeline.ts:256`).
4. `confidentLanguage`, la version stricte qui refuse les devinettes, n'est appelée qu'une fois, sur le chemin cloud (`pipeline.ts:309`).
5. Le correctif est déjà décrit dans `HANDOFF.md` section 4 et n'a jamais été appliqué.

---

## 2. Décisions prises, à ne pas rouvrir sans raison

| Décision | Choix | Pourquoi |
|---|---|---|
| Corpus protecteur | Tatoeba, exports par langue | CC-BY, étiqueté par des humains, **écrit par personne dans ce projet donc non ajustable** |
| Corpus de rappel chat | synthétique, plus tard | phase 0b, voir section 6 |
| Politique de correctif | resserrer les règles | choix de kil, contre "se taire plus souvent" et "changer les défauts" |
| Portée | matrice de détection 43x43 | choix de kil, contre l'aller-retour de traduction et la couverture provider |
| Où vit le banc | `src/content/langMatrix.test.ts`, vitest | Playwright est volontairement hors des dépendances pour que la CI n'installe pas de navigateur ; le job CI lance déjà `vitest run` sur `src/**/*.test.ts` |
| Où vit le corpus | module `.ts` committé, **pas** de fixture JSON | le repo n'a aucun dossier `fixtures/`, décision écrite : un corpus mesuré en scratchpad a été perdu deux fois faute de commit |

---

## 3. État par phase

| Phase | Contenu | État |
|---|---|---|
| 0 | banc 43x43 + corpus + chiffre de référence, **zéro correction** | **FAIT**, voir section 4bis |
| 0b | corpus chat synthétique pour le rappel en registre court | pas commencé |
| 1 | plomberie : `confidentLanguage` là où la réponse brute sert | **1 des 3 faits**, voir section 4ter |
| 2 | combler les langues sans règle | **commencée** : `zh-tw` (`4dc5710`), `bn ta` (`8cd28e3`), `ca lt lv sk` plus six autres (`0bd3699`), **5 restantes** |
| 3 | clusters de confusion, classés par la matrice | pas commencé |
| 4 | barrière anti-régression en CI | pas commencé |

---

## 4. Artefacts créés par ce chantier

Mis à jour à chaque création. Tout est sur `feat/lang-matrix`.

| Fichier | Rôle | Suivi par git |
|---|---|---|
| `HANDOFF-lang-matrix.md` | ce document | oui |
| `scratchpad/harness/build-lang-corpus.mjs` | télécharge Tatoeba, échantillonne, génère le corpus | oui |
| `src/content/langCorpus.ts` | **généré**, 42 langues, 5040 lignes, 206 Ko | oui |
| `src/content/langMatrix.ts` | le calcul et le formatage du rapport, partagés | oui |
| `src/content/langMatrix.test.ts` | les assertions de référence, tourne en CI | oui |
| `scratchpad/harness/lang-matrix.mjs` | écrit le rapport lisible | oui |
| `scratchpad/harness/lang-matrix.md` | le rapport lui-même | **non**, sortie régénérable, `.gitignore` la range avec les autres sorties de harnais |

Commits de ce chantier, sur `feat/lang-matrix`, du plus ancien au plus récent :

| Hash | Sujet |
|---|---|
| `ec9e02d` | Measure every language against every other one, and write down what it says |
| `71e78c4` | Stop deleting messages on a guess |
| `4dc5710` | Tell the two Chinese scripts apart, which nothing here could do |
| `f40b9bf` | Bring the handoff up to the three commits that exist |
| `8cd28e3` | Count Bengali and Tamil, which detectByScript never did |
| `0bd3699` | Name ten languages by a letter only they write |

Commandes :

```bash
# régénérer le corpus depuis Tatoeba (une minute, réseau)
node scratchpad/harness/build-lang-corpus.mjs
node scratchpad/harness/build-lang-corpus.mjs --dry     # compte sans écrire

# régénérer le rapport lisible
node --import tsx scratchpad/harness/lang-matrix.mjs

# les assertions
npx vitest run src/content/langMatrix.test.ts
```

Note sur `npx tsx` : le proxy rtk de cette machine réécrit `npx tsx` en `npm tsx` et ça échoue. Utiliser `node --import tsx <fichier>`.

---

## 4bis. Les chiffres

Corpus : 42 langues, 5040 lignes, Tatoeba CC-BY 2.0 FR. Trois issues, jamais additionnées : `right` la bonne langue, `silent` le détecteur a refusé de répondre ce qui est l'issue SÛRE, `wrong` une autre langue.

### Point de départ, avant toute correction (commit `ec9e02d`)

| chemin | portée | right | silent | wrong |
|---|---|---:|---:|---:|
| `confidentLanguage` (le `sl` envoyé au moteur) | toutes | 1262 (25%) | 3688 (73%) | **90 (2%)** |
| `confidentLanguage` | court, <=20 car. | 415 (25%) | 1213 (72%) | **52 (3%)** |
| `detectLanguage` (efface, pilote le moteur local, le drapeau) | toutes | 3019 (60%) | 804 (16%) | **1217 (24%)** |
| `detectLanguage` | court, <=20 car. | 837 (50%) | 364 (22%) | **479 (29%)** |

Lecture du point de départ : **presque un message court sur trois recevait une mauvaise langue** sur le chemin qui supprime des messages en silence et qui pilote le moteur par défaut de Chrome.

### État courant (commit `0bd3699`)

| chemin | portée | right | silent | wrong |
|---|---|---:|---:|---:|
| `confidentLanguage` | toutes | 2179 (43%) | 2770 (55%) | **91 (2%)** |
| `confidentLanguage` | court | 667 (40%) | 959 (57%) | **54 (3%)** |
| `detectLanguage` | toutes | 3324 (66%) | 691 (14%) | **1025 (20%)** |
| `detectLanguage` | court | 935 (56%) | 332 (20%) | **413 (25%)** |

Le chemin sûr est passé de 25 % à 43 % de réponses **sans qu'un seul de ses deux compteurs d'erreur bouge**, 91 et 54 depuis le point de départ. C'est le seul mouvement qui compte vraiment : il répond plus souvent, pas plus faux. La règle des lettres exclusives a fait à elle seule 34 % -> 43 %.

Le chemin brut a perdu 85 erreurs d'un coup, pour la même raison : une lettre lue bat une devinette de franc sur la même ligne.

Ces quatre chiffres sont **assertés** dans `src/content/langMatrix.test.ts`. Les bouger est normal, les bouger sans dire dans quel sens et pourquoi ne l'est pas. Quand ils changent : relancer `node --import tsx scratchpad/harness/lang-matrix.mjs`, lire le rapport, mettre à jour le test **et cette section**.

### Les cinq langues qui ne marquent jamais un seul point

`da et fi no sl`

Pas "souvent fausses" : **jamais justes**, sur aucune ligne, à aucune longueur. C'est la file de travail de la phase 2. `zh-tw` en est sorti au commit `4dc5710`, `ca lt lv sk` au commit `0bd3699`.

**Ces cinq-là sont exactement les cinq sans lettre exclusive.** Ce n'est pas une coïncidence, c'est la limite de la méthode : tout ce qui était atteignable par lecture d'un caractère l'a été. Les cinq restantes demandent du lexique, donc la phase 0b, et non une règle de plus du même genre.

### Les paires qui volent le plus de lignes

Colonne de gauche : le point de départ. Colonne de droite : aujourd'hui, au commit `0bd3699`.

| de -> vers | départ | aujourd'hui |
|---|---:|---:|
| zh-tw -> zh | 120 | **15** (`4dc5710`) |
| bg -> ru | 50 | 50 |
| id -> ms | 49 | 49 |
| no -> sv | 48 | 48 |
| da -> sv | 44 | 44 |
| ca -> es | 43 | **42** |
| ms -> id | 38 | 38 |
| da -> nl | 35 | 35 |
| ca -> fr | 30 | **29** |
| sk -> cs | 30 | **27** |
| uk -> ru | 22 | 22 |
| no -> nl | 20 | 20 |
| es -> pt | 18 | 18 |
| pt -> es | 18 | 18 |

Les lettres exclusives ont à peine entamé ce tableau, et c'est attendu : elles répondent surtout là où le détecteur se taisait. Le catalan ne perd qu'une ligne vers l'espagnol parce que `l·l` n'apparaît que 2 fois sur 120, et le slovaque en reprend 3 au tchèque parce que `ľ ĺ ŕ` ne couvrent que 10 lignes sur 120. Les deux langues sortent de la liste à zéro sans que leur confusion principale bouge vraiment. **Sortir de la liste à zéro et fermer une paire sont deux choses différentes**, et ces paires restent la phase 3.

Le chinois traditionnel était répondu simplifié **sur 100 % des lignes**, drapeau de la Chine compris. Ce n'était pas une règle à corriger, c'était une règle absente : franc n'a aucun modèle trigramme pour le han, il résout toute l'écriture en `cmn`, et `FRANC_MAP` envoie `cmn` et `zho` sur `zh`. Corrigé au commit `4dc5710` par deux classes de caractères dans `cantonaisOuChinois`.

**Les 15 qui restent ne sont pas un échec de la règle** : elles sont écrites entièrement avec ce que les deux écritures partagent, la règle refuse de trancher, et franc répond `zh` comme il l'a toujours fait. Les fermer demande de sortir franc de ce chemin, pas d'allonger la liste.

**Piège à ne pas réintroduire** : le japonais a fait sa propre simplification et il est tombé d'accord avec la Chine sur certains caractères et avec Taïwan sur d'autres. `会 学 実 体 万 与 区 医 点 来 国` sont japonais ET simplifiés, ils sont donc DEHORS de la liste simplifiée. `結 議 龍` sont japonais ET traditionnels, ils sont dehors de la liste traditionnelle. Ne jamais les rajouter.

### Les treize langues que le chemin sûr ne peut jamais nommer

`da el es et fi fr id ms nl no sl sv tl`

(`zh` et `zh-tw` en sont sortis au commit `4dc5710`, `bn` et `ta` au commit `8cd28e3`, `ca cs hu lt lv pl ro sk tr vi` au commit `0bd3699`.)

C'est la raison pour laquelle la phase 1 ne peut pas se contenter de remplacer la réponse brute par la réponse sûre : la réponse sûre ne sait nommer que **29 langues sur 42**, contre 16 avant les lettres exclusives.

**Ce chiffre ne rouvre PAS la question `ignoreEnglish` de la section 4ter, et c'est vérifié et non supposé** : l'anglais n'a pas de lettre exclusive, donc son rappel sur le chemin sûr est resté à **1 ligne sur 120**, identique à la mesure qui avait décidé de le laisser sur la réponse brute. Ce qui débloquera cette ligne-là est le lexique de la phase 0b, pas la couverture générale du chemin sûr.

**Ce chiffre est à lire avec sa réserve, et elle joue dans les deux sens.** Tatoeba est de la phrase écrite, et le lexique de mots courts qui alimente `confidentLanguage` est un vocabulaire de chat : hola, merci, danke, selam. Une phrase espagnole de Tatoeba n'en contient aucun, donc `es` marque zéro ici alors qu'il marquerait sur une vraie ligne de chat. Les 26 sont donc une **borne haute** du trou, pas sa mesure. La phase 0b tranchera.

---

## 5. Ce qui a été établi sur Tatoeba, pour ne pas le re-chercher

- URL : `https://downloads.tatoeba.org/exports/per_language/<iso3>/<iso3>_sentences.tsv.bz2`
- Format décodé : `id \t iso3 \t phrase`, une par ligne.
- **41 des 41 codes nécessaires existent**, à une correction près : le letton est **`lvs`** et non `lav`, qui rend 404.
- Poids total compressé : environ 120 Mo. Inutile de tout prendre : une requête HTTP `Range` sur les premiers ~400 Ko rend déjà 3585 lignes pour le slovène. `bzip2 -dc` sur un fichier tronqué décode les blocs complets et sort en erreur, l'erreur est à ignorer.
- `bzip2` est présent sur cette machine : `/mingw64/bin/bzip2` via Git Bash.
- Biais connu et assumé : les premières lignes d'un export sont les plus anciennes phrases de Tatoeba, donc pas un échantillon aléatoire. Contre-mesure appliquée : échantillonnage régulier sur tout le bloc décodé plutôt que les N premières.
- **Deux langues n'ont pas de corpus Tatoeba propre** : `pt-br` partage `por`, `zh-tw` partage `cmn`. Voir section 6.

Table des codes, ceux du produit vers Tatoeba :

```
en eng   fr fra   es spa   pt por   de deu   it ita   nl nld   pl pol
sv swe   cs ces   sk slk   ro ron   ru rus   uk ukr   tr tur   ar ara
he heb   ja jpn   ko kor   zh cmn   yue yue  th tha   vi vie   id ind
hi hin   fi fin   no nob   da dan   el ell   hu hun   bg bul   ca cat
sl slv   et est   lt lit   lv lvs   fa pes   bn ben   ta tam   ms zsm
tl tgl
pt-br  aucun (partage por)
zh-tw  aucun (partage cmn)
```

---

## 4ter. Phase 1, état détaillé

`pipeline.ts` lit la langue une fois et s'en sert à trois endroits. Un seul a été basculé sur la réponse sûre, et les deux autres sont restés en place **pour des raisons mesurées, pas par prudence vague**. Ne pas les basculer sans refaire la mesure.

| Consommateur | Ligne | État | Pourquoi |
|---|---|---|---|
| `isSameLanguageAsTarget`, le verrou qui efface | `pipeline.ts:183` | **basculé sur `confidentLanguage`** | 1217 lignes effacées à tort deviennent 90, soit 93 % de moins. Commit `71e78c4` |
| `ignoreEnglish` | `pipeline.ts:180` | **laissé sur la réponse brute** | Mesuré : la réponse sûre ne nomme que **1 ligne anglaise sur 120** contre 78 pour franc, parce que `SHORT_WORD_LANG` est un vocabulaire de chat et que Tatoeba est de la prose écrite. Basculer enverrait deux tiers d'un chat anglais au moteur pour sauver les 48 lignes étrangères que franc appelle anglaises. À rouvrir quand la table couvrira plus de six langues, donc après la phase 2 |
| `shouldDropBySourceLang`, l'allowlist | `pipeline.ts:184` | **laissé sur la réponse brute** | Il droppe sur `lang_unknown`. Lui donner un détecteur plus silencieux le ferait supprimer **davantage** pour quiconque a réglé une allowlist. Ce n'est pas l'entrée qu'il faut changer, c'est sa sémantique |
| `localEngine.translate(detected, ...)` | `pipeline.ts:255` | **pas encore traité** | Le moteur par défaut sur Chrome reçoit toujours une langue source devinée. Attention : en mode `local-only`, une détection vide **perd le message entièrement** (`pipeline.ts:267-278`), donc le correctif doit venir avec un repli cloud |
| `detectedLang: detected`, le drapeau | `pipeline.ts:256` | **pas encore traité** | Cosmétique, à faire avec le point précédent |

Ce qui reste à faire en phase 1 : les deux dernières lignes du tableau, et rien d'autre.

Le résidu des 90 suppressions restantes est presque entièrement `bg -> ru` (50) et `uk -> ru` (22), produit par la règle cyrillique, qui est un chemin SÛR. C'est donc un vrai défaut de règle, pas une devinette, et il est la première cible de la phase 3.

---

## 6. Questions ouvertes, à trancher avant la phase 2

1. **`zh-tw` contre `zh`.** La distinction est un jeu de caractères, pas une langue. Séparer le corpus `cmn` par jeu de caractères puis écrire une règle qui détecte le jeu de caractères est tautologique. C'est acceptable parce que c'est la définition même de la distinction, mais le chiffre qui en sortira ne mesurera que la cohérence, pas une capacité. À écrire tel quel dans le commentaire de la règle.
2. **`pt-br` contre `pt`.** Distinction lexicale et orthographique fine, aucun corpus séparé. Proposition par défaut : ne pas écrire de règle, documenter que la détection rend `pt` et que `pt-br` reste un choix de l'utilisateur. À valider avec kil.
3. **Registre.** Tatoeba est de la phrase écrite complète, pas du chat. Contre-mesure gratuite appliquée en phase 0 : découper le même corpus en bandes de longueur (court jusqu'à 20 caractères, moyen 21 à 40, long au-delà) pour obtenir la courbe de dépendance à la longueur, qui est exactement le régime où le produit échoue. Le vrai registre chat viendra en phase 0b.

---

## 6bis. La prochaine action, dans l'ordre

Reprendre ici. Chaque entrée est indépendante des autres, prendre celle qu'on veut.

1. ~~`bn` et `ta` sans plage dans `detectByScript`~~ **FAIT au commit `8cd28e3`.** 120/120 sur les deux, sur les deux chemins. Le gain était bien sur `confidentLanguage` et non sur `detectLanguage`, exactement comme prévu.

1bis. ~~La règle des lettres exclusives, section 8~~ **FAIT au commit `0bd3699`.** Mesurée, zéro ligne volée sur les deux chemins, 9 langues à zéro ramenées à 5. Le détail de ce que le banc a corrigé dans la table conçue est en section 8, qui est maintenant un compte rendu et non une proposition.

2. **Le cluster nordique, `no da sv`.** 48 lignes norvégiennes et 44 danoises partent en suédois, et ni `no` ni `da` ne marque un seul point. Protocole du cantonais : hold-out écrit avant la règle, lignes adversariales, zéro faux positif exigé sur le voisin. Les trois langues partagent presque tout, donc chercher des marqueurs orthographiques durs (`ø` et `æ` sont danois et norvégiens contre `ö` et `ä` suédois, ce qui sépare déjà sv du couple ; séparer no de da demande du lexique).

3. **Le catalan.** ~~0 point~~ **2 points sur 120 au commit `0bd3699`**, par le point volat `l·l`, qui est certain mais rare. Il reste 42 lignes en espagnol et 29 en français. Sortir de la liste à zéro ne l'a donc quasiment pas soigné : ce qui reste demande les marqueurs lexicaux et morphologiques déjà listés ici, les terminaisons `-ació`, `ny` là où l'espagnol écrit `ñ`, les mots `amb`, `això`, `què`, `perquè`, `tots`. Ceux-là ne sont pas des lettres exclusives et devront être mesurés séparément.

4. **`sk` contre `cs`.** ~~30 lignes~~ **27 lignes** slovaques en tchèque, `sk` à **10 points sur 120** depuis `0bd3699`. Les lettres exclusives sont posées et faites : `ľ ĺ ŕ` côté slovaque, `ř ě ů` côté tchèque. Ce qui reste est la part de lignes slovaques qui n'écrit aucune des trois, et `ä ô` ne peuvent pas la prendre : `ä` est aussi allemand, suédois, finnois, estonien et `ô` est aussi français. Du lexique, donc.

5. **`bg` et `uk` lus comme `ru`.** 50 et 22 lignes, et c'est le **résidu principal du chemin SÛR** après la phase 1. La règle cyrillique existe déjà dans `cyrilliqueQuelleLangue`, elle est donc à resserrer et non à écrire. Son commentaire porte déjà sa mesure tenue à l'écart (7 sur 12 pour le bulgare), la relire avant d'y toucher.

6. **`id` contre `ms`.** 49 et 38 lignes, mutuellement. Aucune des deux n'est traitée comme une paire nulle part dans le code, chacune n'a que ses formes de rire. C'est le cluster le plus difficile du lot, garder pour la fin.

7. **Finir la phase 1** : `localEngine.translate(detected, ...)` à la ligne 255 et le drapeau à la 256. Voir la section 4ter, et le piège du mode `local-only` qui perd le message quand la détection est vide.

8. **Phase 0b**, le corpus chat. Tatoeba est de la prose écrite, et c'est la limite de tout ce qui précède. Le nombre à débloquer en priorité est celui des 24 langues que le chemin sûr ne nomme jamais : il est gonflé par le fait que `SHORT_WORD_LANG` est un vocabulaire de chat mesuré contre des phrases de livre.

---

## 7. Conventions du repo à respecter

- Commits : sujet à l'impératif, corps expliquant la cause, le correctif, et comment il a été constaté. Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Le préfixe `[item N]` de l'ancien `HANDOFF.md` n'est plus utilisé depuis le commit 121.
- Gate : `npm run release:check`, jamais seulement `typecheck` et `test`. Il lance aussi `lint`, et c'est l'étape qui a accumulé des erreurs dans les passes précédentes.
- Poids du bundle content relevé avant et après toute modification du content script. Référence au démarrage de ce chantier : **91414 octets gzippés** pour `dist/assets/content.js`.
- Pas de nom de streamer ou de chaîne en dur, nulle part.
- Pas d'emoji dans le code.
- Les données de test vivent **inline dans le fichier de test**, pas dans une fixture séparée.

---

## 8. La règle des lettres exclusives : MESURÉE ET COMMITTÉE (`0bd3699`)

Conçue en fin de session précédente et annulée de l'arbre avant commit faute de mesure. Reprise, mesurée, corrigée sur un point, committée. **Ce qui suit est le compte rendu ; la proposition d'origine est conservée telle quelle pour que l'écart entre ce qui était prévu et ce qui a été mesuré reste lisible.**

### Ce que le banc a rendu

| chemin | right | silent | wrong |
|---|---:|---:|---:|
| `confidentLanguage` avant (`8cd28e3`) | 1694 | 3255 | 91 |
| `confidentLanguage` après (`0bd3699`) | **2179** | 2770 | **91, inchangé** |
| `detectLanguage` avant | 3126 | 804 | 1110 |
| `detectLanguage` après | **3324** | 691 | **1025** |

**Zéro ligne volée**, exigence du protocole, et vérifiée de la seule façon qui prouve quelque chose : en diffant la **carte de confusions entière** contre `HEAD`, et non en regardant les totaux. Un total d'erreurs stable peut cacher une erreur échangée contre une autre. Résultat du diff : sur le chemin sûr aucune confusion ne bouge, ni en hausse ni en baisse ; sur `detectLanguage` 85 disparaissent et **aucune n'apparaît**.

Langues à zéro : 9 -> 5. Sorties : `ca lt lv sk`. Chemin sûr : nomme 29 langues sur 42 contre 16.

Poids du bundle content : 91484 -> 91654 octets gzippés, soit **+170**, les deux bouts mesurés ici en `gzip -9`. Note pour la prochaine session : ce chiffre ne se raccorde pas aux 91747 du commit `8cd28e3`, dont la méthode de mesure n'est pas écrite. Mesurer les deux bouts soi-même, ne pas comparer au journal.

### La seule correction que le banc a imposée à la table conçue

**Le polonais ne prend pas `ł`.** La lettre est bien polonaise seule parmi les 43, et c'est exactement le piège : *une lettre exclusive à une langue n'est pas la même chose qu'une ligne qui la porte étant dans cette langue.* Une phrase slovaque du corpus parle des enfants de `Łazarz`, ne porte aucune lettre slovaque exclusive, et le vote unanime ne la sauve donc pas. Un nom propre n'est pas un fait sur la langue de la phrase.

Il n'y a pas eu d'arbitrage à faire, parce que le remplacement est meilleur des deux côtés : `żźćśń` prend **70** lignes polonaises contre 48 pour `ł`, et ne vole rien. La lettre proposée était simplement la mauvaise. Un test nomme cette ligne slovaque pour que remettre `ł` coûte une assertion rouge.

Le piège que la conception avait déjà nommé a tenu : `ą` et `ę` restent dehors, le lituanien les écrit sur 20 et 6 lignes du corpus.

### Table finale, telle qu'elle est dans `langDetect.ts`

```
[/[řěů]/iu, 'cs']   [/[ľĺŕ]/iu, 'sk']   [/[żźćśń]/iu, 'pl']  [/[őű]/iu, 'hu']
[/[ėįų]/iu, 'lt']   [/[ģķļņ]/iu, 'lv']  [/[ığ]/iu, 'tr']     [/[șț]/iu, 'ro']
[/l·l/iu, 'ca']     [/[ơưđ]/iu, 'vi']
```

Deux écarts de forme avec la proposition, tous deux vérifiés : le turc prend le drapeau `i` parce que `/ı/iu` ne rend vrai **ni sur `I` ni sur `i`** en JS, ce qui était le seul vrai danger de la table, et le drapeau rattrape `Ğ`. Le roumain s'écrit avec la virgule souscrite U+0219 et U+021B, distincte de la cédille turque `ş`, donc les deux jeux ne se croisent pas.

### Rappel par langue sur le chemin sûr, pour savoir laquelle vaut encore du travail

```
tr 86/120   vi 80   cs 75   pl 70   ro 58   lt 50   lv 33   hu 24   sk 10   ca 2
```

`ca` et `sk` sont sortis de la liste à zéro mais restent pratiquement muets. Ne pas lire leur sortie comme une langue réglée.

---

### La proposition d'origine, conservée

**Idée.** Le pré-contrôle d'écriture ne sert que les alphabets entiers, donc 27 langues latines n'ont pour tout recours que franc. Mais une **lettre** qu'une seule des 43 langues écrit identifie cette langue aussi sûrement qu'une écriture entière. C'est une recherche, pas une statistique, donc elle a sa place dans `confidentLanguage`.

**Où.** Dans `detectByLookup`, une fonction `detectByExclusiveLetter(trimmed)` appelée **après** le lexique de mots courts et **avant** `detectByScript`. Elle s'applique à toute longueur, contrairement au lexique borné à 20 caractères.

**La table proposée**, une lettre appartenant à une seule des 43 :

```
[/[řěů]/iu, 'cs']   [/[ľĺŕ]/iu, 'sk']   [/ł/iu, 'pl']    [/[őű]/iu, 'hu']
[/[ėįų]/iu, 'lt']   [/[ģķļņ]/iu, 'lv']  [/[ığ]/u, 'tr']  [/[șț]/iu, 'ro']
[/l·l/iu, 'ca']     [/[ơưđ]/iu, 'vi']
```

Vote unanime : deux jeux exclusifs dans la même ligne, c'est une citation ou un pseudo, donc `undefined`. Même règle que le lexique de mots courts.

**Ce qui est DEHORS et pourquoi, c'est la moitié du travail :**
`ä` allemand, suédois, finnois, estonien, slovaque. `ô` français autant que slovaque. `õ` portugais autant qu'estonien. `ą ę` polonais autant que lituanien. `ø æ` danois ET norvégien, donc ils séparent du suédois sans séparer les deux l'un de l'autre, il leur faut du lexique. `č š ž` tchèque, slovaque, slovène, croate. `ö ü` une demi-douzaine de langues.

Le turc `ı` est le i sans point U+0131, pas le i ordinaire. Le catalan s'identifie par le point volat `l·l`, une séquence et non une lettre.

`fi et da no sl` n'ont aucune lettre exclusive et ne sont donc pas dans la table : ils attendent du lexique.

**Gain attendu, à vérifier et non à croire** : couvre 5 des 9 langues à zéro (`sk lt lv ca` plus `ro tr hu pl cs vi` déjà partiellement servis). Ne couvre pas `da fi no sl et`.

*Vérifié : 4 des 9 et non 5, parce que le catalan et le slovaque sortent de la liste à zéro avec 2 et 10 lignes. La prévision comptait les langues servies, pas les lignes, et l'écart est là.*

**Protocole obligatoire avant de committer** : c'est un ajout au chemin SÛR, donc discipline du cantonais. Lancer `node --import tsx scratchpad/harness/lang-matrix.mjs`, exiger **zéro nouvelle ligne volée** aux 42 autres langues, et retirer toute lettre qui en vole une, quel que soit son gain en rappel. Puis mettre à jour les quatre chiffres assertés dans `langMatrix.test.ts` ET la section 4bis de ce document.

*Suivi intégralement. Une remarque pour la prochaine règle : le protocole dit de lancer le rapport, mais le rapport seul ne montre pas les lignes volées, il montre des totaux. La mesure qui répond vraiment à l'exigence est le **diff de la carte de confusions** contre `HEAD`, obtenu en copiant `git show HEAD:src/content/langDetect.ts` dans un fichier temporaire de `src/content/` et en passant ses deux exports à `runMatrix`. Trois minutes, et c'est ce qui transforme "les totaux n'ont pas bougé" en preuve.*
