# Handoff: la matrice de détection sur les 43 langues

État vivant de ce chantier, mis à jour dès qu'un artefact est créé.
**Écrit pour être repris par une autre session Claude, sur un autre compte, sur la même machine.** Tout ce qui est nécessaire est ici ou référencé par chemin absolu. Rien n'est supposé connu.

Dernière mise à jour : 2026-09-21. Dernier commit de **code** : `011a14f`. Les commits qui ne touchent que ce fichier sont des mises à jour du document.

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
npm run release:check  # 68 fichiers, 1123 tests, doit sortir en 0
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

| chemin | portée | départ `ec9e02d` | aujourd'hui `011a14f` |
|---|---|---|---|
| `confidentLanguage` | toutes | 1262 r / 3688 s / **90 w** | 2176 r / 2846 s / **18 w** |
| `confidentLanguage` | court ≤20 car. | 415 / 1213 / **52** | 655 / 1013 / **12** |
| `detectLanguage` | toutes | 3019 / 804 / **1217** | 3359 / 726 / **955** |
| `detectLanguage` | court | 837 / 364 / **479** | 942 / 355 / **383** |

Le chemin sûr **répond 72 % plus souvent et se trompe 80 % moins**. C'est le seul mouvement qui compte vraiment : `wrong` sur ce chemin veut dire qu'on demande au moteur de traduire depuis une langue dans laquelle le texte n'est pas.

Le chemin brut a perdu 262 erreurs. Sa part reste haute parce qu'il inclut franc par construction.

Ces quatre chiffres sont **assertés** dans `src/content/langMatrix.test.ts`. Les bouger est normal ; les bouger sans dire dans quel sens et pourquoi ne l'est pas.

### Les langues qui ne marquent jamais un seul point

```
detect     et fi sl                            (3, contre 10 au départ)
confident  el es et fi fr id ms nl sl sv tl    (11, contre 26)
```

`et fi sl` partagent chacune de leurs lettres avec un voisin et n'ont pas non plus de marqueur de paire. Elles attendent vraiment le lexique de la phase 0b, et **aucune règle de la forme employée jusqu'ici ne les atteindra**.

### Rappel du chemin sûr, par langue

```
120  ar bn he hi ja ko ta th        (écritures sans ambiguïté)
113  fa    112 yue   105 zh-tw   97 uk   89 ru   87 zh
86   tr     80 vi     75 cs      74 bg   70 pl   58 ro   51 lt
33   lv     24 hu     14 de      13 no   10 da   10 sk    9 pt
3    it      2 ca      1 en
0    el es et fi fr id ms nl sl sv tl
```

**Ne pas lire `ca=2` ou `sk=10` comme des langues réglées.** Elles sont sorties de la liste à zéro et c'est tout.

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

### 4.4 Tatoeba ne voit pas le registre chat, et le repo a déjà mieux

`src/content/langDetect.dix.test.ts` contient **25 lignes de chat écrites à la main pour ar, ja, ko, ru et zh**, les cinq langues non latines que le produit parle. Ce fichier a attrapé ce que Tatoeba ne pouvait pas voir : le russe de chat n'écrit presque jamais `ы э ё`, donc une règle jugée acceptable sur Tatoeba y cassait six assertions. **Le lancer à chaque changement de détection, pas seulement la matrice.**

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

### 5.6 L'ordre des étages de `detectByLookup`, résultat NÉGATIF

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
| 0b | corpus chat synthétique pour le rappel en registre court | **pas commencé**, et c'est maintenant le goulot |
| 1 | plomberie : `confidentLanguage` là où la réponse brute sert | **1 des 3 faits**, voir section 10 |
| 2 | combler les langues sans règle | **10 sur 13 faites**, restent `et fi sl` |
| 3 | clusters de confusion, classés par la matrice | **commencée** : le cluster cyrillique est fermé, le nordique entamé |
| 4 | barrière anti-régression en CI | **de fait FAIT** : `langMatrix.test.ts` tourne dans `vitest run` |

---

## 7. La file de travail, par valeur décroissante

1. **Phase 0b, le corpus chat.** Devenu le goulot de tout le reste. Les 11 langues que le chemin sûr ne nomme jamais sont un chiffre **gonflé** par le fait que `SHORT_WORD_LANG` est un vocabulaire de chat mesuré contre des phrases de livre. Modèle à suivre : `langDetect.dix.test.ts`, 25 lignes par langue, écrites à la main, committées. Commencer par `es fr nl sv`, à zéro sur le chemin sûr alors qu'ils marqueraient sur du vrai chat.

2. **Finir la phase 1.** `localEngine.translate(detected, ...)` à `pipeline.ts:255` et le drapeau à `:256` reçoivent toujours la réponse brute. **Piège** : en mode `local-only`, une détection vide perd le message entièrement (`pipeline.ts:267-278`), donc le correctif doit venir avec un repli cloud. Plus urgent qu'avant : le chemin sûr est maintenant à 18 erreurs sur 5040, donc l'argument de prudence qui le retenait a disparu.

3. **`id` contre `ms`, 49 et 38 lignes**, la plus grosse paire restante et la plus dure. Aucune des deux n'est traitée nulle part. **Six des 120 lignes malaises du corpus sont en jawi**, l'écriture arabe, ce qui produit `ms->ar=5` et `ms->fa=1`, soit 6 des 18 erreurs restantes du chemin sûr. Piste mesurable et de forme déjà éprouvée : `چ ڠ ڤ ڬ ڽ` sont des lettres jawi absentes de l'arabe, donc c'est une table de lettres exclusives dans l'écriture arabe, à poser dans `arabeOuPersan` qui applique déjà exactement ce raisonnement pour le persan et l'ourdou.

4. **Le catalan**, 2 points sur 120, 42 lignes en espagnol et 29 en français. `l·l` est certain mais rare. Ce qui reste demande du lexique : `-ació`, `ny` là où l'espagnol écrit `ñ`, `amb`, `això`, `què`, `perquè`, `tots`.

5. **Fermer la paire nordique.** La porte `ø æ` ne voit que la moitié des lignes. Élargir demande des marqueurs sans `ø` ni `æ`, donc exposés au suédois, à l'allemand et au néerlandais. À mesurer en exposition complète.

6. **`et fi sl`**, les trois dernières à zéro. Pas de lettre propre, pas de marqueur de paire. Sans phase 0b, rien à faire.

7. **`mano` dans `SHORT_WORD_LANG` coûte deux lignes** (`es->pt` et `lt->pt`) et c'est un vrai mot espagnol (la main) et lituanien (mon). Il vaut probablement sa place en chat brésilien. **Ne pas y toucher avant la phase 0b**, seule chose capable de dire ce qu'il rapporte.

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
| `src/content/langMatrix.test.ts` | les assertions de référence, tourne en CI | oui |
| `src/content/langDetect.dix.test.ts` | le banc de chat des 5 langues non latines | oui |
| `scratchpad/harness/lang-matrix.mjs` | écrit le rapport lisible | oui |
| `scratchpad/harness/lang-matrix.md` | le rapport | non, régénérable |

```bash
node scratchpad/harness/build-lang-corpus.mjs          # régénérer le corpus (réseau)
node --import tsx scratchpad/harness/lang-matrix.mjs   # régénérer le rapport
npx vitest run src/content/langMatrix.test.ts          # les assertions de la matrice
npx vitest run src/content/langDetect.dix.test.ts      # le banc de chat
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

---

## 10. Phase 1 en détail, ce qui reste

`pipeline.ts` lit la langue une fois et s'en sert à trois endroits.

| Consommateur | Ligne | État | Pourquoi |
|---|---|---|---|
| `isSameLanguageAsTarget`, le verrou qui efface | `:183` | **basculé sur `confidentLanguage`** | 1217 lignes effacées à tort deviennent 18 aujourd'hui. Commit `71e78c4` |
| `ignoreEnglish` | `:180` | **laissé sur la réponse brute** | La réponse sûre ne nomme qu'**1 ligne anglaise sur 120**, contre 78 pour franc. Revérifié après chaque passe : l'anglais n'a pas de lettre exclusive, ce chiffre n'a pas bougé. Seule la phase 0b le débloquera |
| `shouldDropBySourceLang`, l'allowlist | `:184` | **laissé sur la réponse brute** | Il droppe sur `lang_unknown`. Un détecteur plus silencieux le ferait supprimer **davantage**. Ce n'est pas son entrée qu'il faut changer, c'est sa sémantique |
| `localEngine.translate(detected, ...)` | `:255` | **à faire**, voir file §2 | |
| `detectedLang: detected`, le drapeau | `:256` | **à faire**, avec le point précédent | |

---

## 11. Conventions du repo

- Commits : sujet à l'impératif, corps expliquant la cause, le correctif, et **comment il a été constaté**. Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Gate : `npm run release:check`, jamais seulement `typecheck` et `test`. Il lance aussi `lint`.
- Poids du bundle content relevé avant et après toute modification du content script. **Mesurer les deux bouts soi-même**, la méthode des relevés anciens n'est pas écrite et ils ne se raccordent pas. Repère en `gzip -9` : 91484 avant les lettres exclusives, **92051 aujourd'hui**, soit +567 octets pour quatre règles.
- Pas de nom de streamer ou de chaîne en dur, nulle part.
- Pas d'emoji dans le code.
- Les données de test vivent **inline dans le fichier de test**, pas dans une fixture séparée.
