<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Un traducteur de chat en direct pour Kick. Lis le chat de n'importe quel stream dans ta langue, et réponds dans celle de la chaîne.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Utilisateurs Chrome](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=utilisateurs&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [中文](README.zh-CN.md) · [Čeština](README.cs.md)

<img src="screenshots/demo.gif" alt="Des messages de chat en espagnol arrivent un à un, chacun avec sa traduction anglaise en dessous ; puis une réponse en anglais est tapée, un aperçu en espagnol apparaît au-dessus de la boîte de chat, et Tab le met à la place" width="360">

[Voir sur un vrai chat](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## Ce que ça fait

Ouvre un stream Kick dont le chat est dans une langue que tu ne lis pas. Chaque message reçoit sa traduction
juste en dessous, au fil de l'arrivée, sur les lives comme sur les replays VOD. Écris une réponse et un aperçu
la montre dans la langue de la chaîne au-dessus de la boîte de chat : appuie sur Tab ou clique dessus, et cette
version remplace ce que tu as tapé.

Rien à régler. Le chat entrant est traduit vers la langue de ton navigateur, et ce que tu écris part dans la
langue de diffusion de la chaîne, lue depuis Kick lui-même. Les deux se changent dans les réglages.

- 43 langues, écritures de droite à gauche comprises (arabe, hébreu, persan) et variantes régionales (portugais
  du Brésil, chinois traditionnel, cantonais)
- Google d'emblée, sans clé et sans compte. Ta propre clé DeepL gratuite pour une meilleure qualité, MyMemory
  et Lingva en secours
- Traduction en local dans Chrome et Edge quand le navigateur la propose : 22 ms au lieu de 1,6 s, et le texte
  ne quitte jamais ta machine
- Emotes 7TV, filtres de bots et d'utilisateurs, filtre de mots-clés, un glossaire pour les noms que les
  moteurs massacrent
- Mets une chaîne en pause depuis la barre du chat sans arrêter les autres. Changer de chaîne ou mettre à jour
  l'extension laisse les onglets ouverts continuer à traduire, sans recharger
- Chrome, Brave, Edge et Firefox

| Le chat, traduit au fil du défilement | Le popup de la barre d'outils |
|---|---|
| <img src="screenshots/chat.png" alt="Chat Kick où chaque message en espagnol porte sa traduction anglaise en dessous, avec la barre d'état de l'extension au-dessus de la liste" width="360"> | <img src="screenshots/popup.png" alt="Le popup de l'extension avec la langue cible, le mode d'affichage, la liste des moteurs et le nombre de requêtes du jour" width="360"> |

| Ce que tu écris, avant de l'envoyer | Choisis une langue, ou laisse-le choisir |
|---|---|
| <img src="screenshots/compose.png" alt="La boîte de chat contenant un message en anglais, avec au-dessus un aperçu de la version espagnole qui sera envoyée" width="360"> | <img src="screenshots/languages.png" alt="Une grille avec recherche de drapeaux et de noms de langues, la langue propre de la chaîne en premier" width="360"> |

<sub>Captures prises sur la version publiée, dans un salon de chat que ce dépôt invente : les pseudos et les
messages sont fictifs et les traductions sont servies en local, donc aucun pseudo réel ne se retrouve sur cette page.</sub>

## Installation

[Chrome, Brave, Edge : Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox : Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

Ouvre n'importe quel stream Kick : la barre verte en haut du chat indique que ça tourne. Les copies installées
depuis les stores se mettent à jour toutes seules.

<details>
<summary>Installer à la main, depuis un zip de release</summary>

Télécharge le zip de ton navigateur sur [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) et décompresse-le.

- Chrome, Brave, Edge (`…-chromium.zip`) : ouvre `chrome://extensions`, active le mode développeur, clique sur Charger l'extension non empaquetée, choisis le dossier.
- Firefox 121+ (`…-firefox.zip`) : ouvre `about:debugging#/runtime/this-firefox`, clique sur Charger un module complémentaire temporaire, choisis `manifest.json`.

Une copie installée ainsi ne se met pas à jour toute seule. Son icône affiche un badge quand une version plus
récente existe, et le popup renvoie vers le store.

</details>

## Moteurs de traduction

Quatre moteurs en chaîne : quand l'un échoue, le suivant prend le relais. L'ordre est le tien.

| Moteur | Clé | Note |
|---|---|---|
| Google | aucune | le défaut, fonctionne d'emblée |
| DeepL | gratuite | la meilleure qualité, [clé gratuite](https://www.deepl.com/pro-api) pour 1 million de caractères par mois |
| MyMemory | aucune | secours |
| Lingva | aucune | secours, sur une instance publique sauf si tu pointes vers la tienne |

Le traducteur intégré de Chromium est plus rapide que tous les autres. Mesuré sur une chaîne en direct : 22 ms
entre l'apparition d'un message et sa traduction à l'écran, contre 1618 ms par la chaîne cloud, sans réseau et
sans quota. Chrome et Edge 138 et suivants peuvent le proposer, mais pas toutes les copies, et chaque paire de
langues demande de télécharger son modèle une fois, en un clic depuis la barre. Firefox ne l'a pas. Là où il
manque, la chaîne cloud prend le relais et rien ne casse.

## Réglages

Clique sur l'engrenage de la barre du chat, ou fais un clic droit sur l'icône de l'extension et choisis Options.

- Langue cible, et une langue de lecture retenue par chaîne si tu l'actives
- Ordre des moteurs, ta clé DeepL et le mode du moteur : local d'abord, cloud d'abord, ou local uniquement
- Affichage : sous le message (recommandé), en ligne après lui, à sa place ou au survol, avec le texte original
  et le badge de la langue source en option
- Le bouton de langue dans la barre d'actions du chat : un clic bascule entre la langue de la chaîne et ton
  dernier choix, un appui long ouvre la liste, taper deux lettres la filtre
- Aperçu d'écriture : activé ou non, sa langue cible, et si le clic remplit la boîte de chat ou copie
- Filtres : ignorer les bots, bloquer des utilisateurs, des chaînes ou des mots-clés, restreindre les langues source
- Glossaire : paires chercher/remplacer appliquées aux traductions
- Budget : part du quota DeepL, limite par chaîne, taille et durée de vie du cache
- Lisibilité et apparence : taille du texte, interligne, police, couleur d'accent, thème du chat
- Clavier : Alt+T active ou désactive la traduction du chat, Alt+W l'aperçu d'écriture
- Activité : messages traduits, succès du cache, chaque langue vue dans le chat, et pourquoi chacune des 50
  dernières lignes a été traduite ou laissée de côté
- L'interface de l'extension en anglais, espagnol, français, portugais, turc, russe, arabe, chinois, japonais
  ou coréen

## Langues prises en charge

Anglais · Français · Espagnol · Portugais · Portugais (Brésil) · Allemand · Italien · Néerlandais · Polonais · Suédois · Tchèque · Slovaque · Roumain · Russe · Ukrainien · Turc · Arabe · Hébreu · Japonais · Coréen · Chinois (simplifié) · Chinois (traditionnel) · Thaï · Vietnamien · Indonésien · Hindi · Finnois · Norvégien · Danois · Grec · Hongrois · Bulgare · Catalan · Slovène · Estonien · Lituanien · Letton · Persan · Bengali · Tamoul · Malais · Filipino · Cantonais

## Confidentialité

Pas de compte, pas d'analytics, pas de serveur à moi. Les messages du chat vont au moteur de traduction que tu
as choisi et nulle part ailleurs, et en mode local pas même là. Une copie installée depuis un store ne fait
aucune autre requête. Une copie installée à la main demande à GitHub le dernier tag de release, au plus toutes
les six heures, pour savoir s'il faut afficher son badge de mise à jour. [Détails](PRIVACY.md)

## FAQ

**Les messages ne sont pas traduits.**
Ouvre l'onglet Activité dans les réglages et appuie sur « Lire les décisions » : il liste les 50 dernières
lignes et dit pourquoi chacune a été traduite ou laissée de côté. La plupart des lignes ignorées le sont
volontairement. Sur une session en direct, 213 lignes sur 234 étaient le même utilisateur qui se répétait, 9
étaient trop courtes, 7 n'étaient que des emojis ou des rires, et 1 était déjà dans la langue de lecture. Si
l'onglet n'affiche rien du tout, l'extension ne voit pas le chat : ouvre une issue.

**La barre verte a disparu.**
Actualise la page. Si ça se reproduit, ouvre une [issue](https://github.com/Pkkls/kick-chat-translator/issues)
avec la chaîne et ce que tu as fait juste avant.

**Comment avoir de meilleures traductions ?**
Ajoute une clé DeepL gratuite dans les réglages. L'offre gratuite couvre un million de caractères par mois, et
DeepL n'est dépensé que sur les paires de langues où il bat les moteurs gratuits.

**Quel style d'affichage choisir ?**
Sous le message. Les trois autres fonctionnent, et sont encore en cours de réglage.

**Ça marche sur les replays VOD ?**
Oui, comme sur les lives.

**Ça a cassé après une mise à jour de Kick.**
Kick change parfois la façon dont son chat est construit. Ouvre une [issue](https://github.com/Pkkls/kick-chat-translator/issues)
et ça sera corrigé.

**C'est fait par Kick ?**
Non. C'est un projet open source indépendant, sans lien avec Kick.

## Nouveautés

Chaque version, avec ce qui a changé et la mesure derrière :
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) et [CHANGELOG.md](CHANGELOG.md).

## Développement

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, unit tests, build: the gate every package goes through
npm run build:firefox    # Firefox build, same dist/ folder
npm run package:all      # both zips, in release/
npm run dev              # HMR
```

Les builds sont reproductibles : le même commit donne des zips identiques à l'octet sur n'importe quelle
machine, vérifié en construisant un `git archive` du tag dans un dossier vide et en comparant les hashs.

En plus des tests unitaires, 41 gates hors ligne chargent l'extension construite dans un vrai navigateur, la
pilotent et vérifient ce qu'elle fait, avec la page servie en local et le moteur de traduction répondu en
local. Elles ont besoin de Playwright, qui n'est volontairement pas une dépendance : pointe `UX_KIT` vers un
dossier dont le `node_modules` le contient, ou lance `npm i -D playwright`.

```bash
node test/e2e/run-gates.mjs --headless                  # all 41, no window
node test/e2e/store-shots-fixture.mjs --lang=ja         # the store screenshots, in one listing language
node test/e2e/store-shots-fixture.mjs --gif             # English store screenshots, the README images and this GIF
```

Stack : Manifest V3, Vite, TypeScript, Preact, Tailwind. Les textes des stores vivent dans [store/](store/), et
une release est un tag de version : la CI la construit, la vérifie et la publie sur les deux stores.

## Projets liés

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), bloque les pubs pre-roll et les overlays de Kick
- [kick-core](https://github.com/Pkkls/kick-core), le client de la gateway temps réel partagé entre ces extensions
- [kickbus](https://github.com/Pkkls/kickbus), webhooks officiels de Kick relayés vers des bots locaux par SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), application Windows qui fait avancer le temps de visionnage des drops Kick

## Licence

MIT. Sans lien avec Kick.
