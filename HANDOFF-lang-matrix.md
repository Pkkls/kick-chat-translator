# Handoff: language-detection matrix across the 43 languages

État vivant de ce chantier. Mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-21. Commit le plus récent du chantier : `8cd28e3`. Phase 2 en cours, 9 langues restantes.

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
| 2 | combler les langues sans règle | **commencée** : `zh-tw` fait (`4dc5710`), 9 restantes |
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

### État courant (commit `8cd28e3`)

| chemin | portée | right | silent | wrong |
|---|---|---:|---:|---:|
| `confidentLanguage` | toutes | 1694 (34%) | 3255 (65%) | **91 (2%)** |
| `confidentLanguage` | court | 550 (33%) | 1076 (64%) | **54 (3%)** |
| `detectLanguage` | toutes | 3126 (62%) | 804 (16%) | **1110 (22%)** |
| `detectLanguage` | court | 871 (52%) | 364 (22%) | **445 (26%)** |

Le chemin sûr est passé de 25 % à 34 % de réponses sans que son taux d'erreur bouge (2 %). C'est le seul mouvement qui compte vraiment : il répond plus souvent, pas plus faux.

Ces quatre chiffres sont **assertés** dans `src/content/langMatrix.test.ts`. Les bouger est normal, les bouger sans dire dans quel sens et pourquoi ne l'est pas. Quand ils changent : relancer `node --import tsx scratchpad/harness/lang-matrix.mjs`, lire le rapport, mettre à jour le test **et cette section**.

### Les neuf langues qui ne marquent jamais un seul point

`ca da et fi lt lv no sk sl`

Pas "souvent fausses" : **jamais justes**, sur aucune ligne, à aucune longueur. C'est la file de travail de la phase 2. `zh-tw` en est sorti au commit `4dc5710`.

### Les paires qui volent le plus de lignes

Table du point de départ. `zh-tw -> zh` est passé de 120 à 15 au commit `4dc5710`, les autres n'ont pas bougé.

| de -> vers | lignes |
|---|---:|
| zh-tw -> zh | 120 sur 120 au départ, **15 aujourd'hui** |
| bg -> ru | 50 |
| id -> ms | 49 |
| no -> sv | 48 |
| da -> sv | 44 |
| ca -> es | 43 |
| ms -> id | 38 |
| da -> nl | 35 |
| ca -> fr | 30 |
| sk -> cs | 30 |
| uk -> ru | 22 |
| no -> nl | 20 |
| es -> pt | 18 |
| pt -> es | 18 |

Le chinois traditionnel était répondu simplifié **sur 100 % des lignes**, drapeau de la Chine compris. Ce n'était pas une règle à corriger, c'était une règle absente : franc n'a aucun modèle trigramme pour le han, il résout toute l'écriture en `cmn`, et `FRANC_MAP` envoie `cmn` et `zho` sur `zh`. Corrigé au commit `4dc5710` par deux classes de caractères dans `cantonaisOuChinois`.

**Les 15 qui restent ne sont pas un échec de la règle** : elles sont écrites entièrement avec ce que les deux écritures partagent, la règle refuse de trancher, et franc répond `zh` comme il l'a toujours fait. Les fermer demande de sortir franc de ce chemin, pas d'allonger la liste.

**Piège à ne pas réintroduire** : le japonais a fait sa propre simplification et il est tombé d'accord avec la Chine sur certains caractères et avec Taïwan sur d'autres. `会 学 実 体 万 与 区 医 点 来 国` sont japonais ET simplifiés, ils sont donc DEHORS de la liste simplifiée. `結 議 龍` sont japonais ET traditionnels, ils sont dehors de la liste traditionnelle. Ne jamais les rajouter.

### Les vingt-deux langues que le chemin sûr ne peut jamais nommer

`ca cs da el es et fi fr hu id lt lv ms nl no pl ro sk sl sv tl vi`

(`zh` et `zh-tw` en sont sortis au commit `4dc5710`, `bn` et `ta` au commit `8cd28e3`.)

C'est la raison pour laquelle la phase 1 ne peut pas se contenter de remplacer la réponse brute par la réponse sûre : la réponse sûre ne sait nommer que 16 langues sur 42.

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

2. **Le cluster nordique, `no da sv`.** 48 lignes norvégiennes et 44 danoises partent en suédois, et ni `no` ni `da` ne marque un seul point. Protocole du cantonais : hold-out écrit avant la règle, lignes adversariales, zéro faux positif exigé sur le voisin. Les trois langues partagent presque tout, donc chercher des marqueurs orthographiques durs (`ø` et `æ` sont danois et norvégiens contre `ö` et `ä` suédois, ce qui sépare déjà sv du couple ; séparer no de da demande du lexique).

3. **Le catalan.** 0 point, 43 lignes en espagnol et 30 en français. Marqueurs orthographiques disponibles et durs : le point volat `l·l`, les terminaisons `-ació`, `ny` là où l'espagnol écrit `ñ`, les mots `amb`, `això`, `què`, `perquè`, `tots`.

4. **`sk` contre `cs`.** 30 lignes slovaques en tchèque, `sk` à 0 point. Séparables par lettres : `ä ľ ĺ ŕ ô` sont slovaques et absentes du tchèque, `ř ě ů` sont tchèques et absentes du slovaque.

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
