# Handoff: language-detection matrix across the 43 languages

État vivant de ce chantier. Mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-21, phase 0 en cours.

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
| 1 | plomberie : `confidentLanguage` là où la réponse brute sert | pas commencé |
| 2 | combler les 17 langues sans règle + les 2 inatteignables | pas commencé |
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

## 4bis. Le chiffre de référence, phase 0, 2026-09-21

Corpus : 42 langues, 5040 lignes, Tatoeba CC-BY 2.0 FR. Aucune correction appliquée, c'est l'état du code tel qu'il est livré aujourd'hui.

Trois issues, jamais additionnées : `right` la bonne langue, `silent` le détecteur a refusé de répondre ce qui est l'issue SÛRE, `wrong` une autre langue.

| chemin | portée | right | silent | wrong |
|---|---|---:|---:|---:|
| `confidentLanguage` (le `sl` envoyé au moteur) | toutes | 1262 (25%) | 3688 (73%) | **90 (2%)** |
| `confidentLanguage` | court, <=20 car. | 415 (25%) | 1213 (72%) | **52 (3%)** |
| `detectLanguage` (efface, pilote le moteur local, le drapeau) | toutes | 3019 (60%) | 804 (16%) | **1217 (24%)** |
| `detectLanguage` | court, <=20 car. | 837 (50%) | 364 (22%) | **479 (29%)** |

Lecture : **presque un message court sur trois reçoit une mauvaise langue** sur le chemin qui supprime des messages en silence et qui pilote le moteur par défaut de Chrome. Le chemin sûr, lui, fait son travail : il se tait 73 % du temps et ne se trompe que 2 % du temps.

### Les dix langues qui ne marquent jamais un seul point

`ca da et fi lt lv no sk sl zh-tw`

Pas "souvent fausses" : **jamais justes**, sur aucune ligne, à aucune longueur. C'est la file de travail de la phase 2.

### Les paires qui volent le plus de lignes

| de -> vers | lignes |
|---|---:|
| zh-tw -> zh | **120 sur 120, soit 100 %** |
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

Le chinois traditionnel est répondu simplifié **sur 100 % des lignes**, drapeau de la Chine compris. Ce n'est pas une règle à corriger, c'est une règle absente : franc n'a aucun modèle trigramme pour le han, il résout toute l'écriture en `cmn`, et `FRANC_MAP` envoie `cmn` et `zho` sur `zh`.

### Les vingt-six langues que le chemin sûr ne peut jamais nommer

`bn ca cs da el es et fi fr hu id lt lv ms nl no pl ro sk sl sv ta tl vi zh zh-tw`

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

## 6. Questions ouvertes, à trancher avant la phase 2

1. **`zh-tw` contre `zh`.** La distinction est un jeu de caractères, pas une langue. Séparer le corpus `cmn` par jeu de caractères puis écrire une règle qui détecte le jeu de caractères est tautologique. C'est acceptable parce que c'est la définition même de la distinction, mais le chiffre qui en sortira ne mesurera que la cohérence, pas une capacité. À écrire tel quel dans le commentaire de la règle.
2. **`pt-br` contre `pt`.** Distinction lexicale et orthographique fine, aucun corpus séparé. Proposition par défaut : ne pas écrire de règle, documenter que la détection rend `pt` et que `pt-br` reste un choix de l'utilisateur. À valider avec kil.
3. **Registre.** Tatoeba est de la phrase écrite complète, pas du chat. Contre-mesure gratuite appliquée en phase 0 : découper le même corpus en bandes de longueur (court jusqu'à 20 caractères, moyen 21 à 40, long au-delà) pour obtenir la courbe de dépendance à la longueur, qui est exactement le régime où le produit échoue. Le vrai registre chat viendra en phase 0b.

---

## 7. Conventions du repo à respecter

- Commits : sujet à l'impératif, corps expliquant la cause, le correctif, et comment il a été constaté. Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Le préfixe `[item N]` de l'ancien `HANDOFF.md` n'est plus utilisé depuis le commit 121.
- Gate : `npm run release:check`, jamais seulement `typecheck` et `test`. Il lance aussi `lint`, et c'est l'étape qui a accumulé des erreurs dans les passes précédentes.
- Poids du bundle content relevé avant et après toute modification du content script. Référence au démarrage de ce chantier : **91414 octets gzippés** pour `dist/assets/content.js`.
- Pas de nom de streamer ou de chaîne en dur, nulle part.
- Pas d'emoji dans le code.
- Les données de test vivent **inline dans le fichier de test**, pas dans une fixture séparée.
