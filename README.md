# Kick Chat Translator

Extension Chrome (Manifest V3) qui traduit automatiquement les messages du chat Kick.com vers l'anglais.

## Traduction

| Backend | Clé requise | Qualité | Limite |
|---------|-------------|---------|--------|
| **DeepL Free** | Oui (gratuite) | ⭐⭐⭐⭐⭐ (japonais, coréen, etc.) | 500k chars/mois |
| **MyMemory** | Non | ⭐⭐⭐ | ~1000 req/jour |

Sans clé DeepL, MyMemory est utilisé en fallback automatique.
Prend les contextes de phrases pour les traductions avancées en Coréen / Mandarin / Russe
## Installation (dev)

### Prérequis
- Node.js 18+
- npm

### Build

```bash
cd kick-translator

# 1. Installer les dépendances
npm install

# 2. Générer les icônes PNG (optionnel — nécessite sharp)
npm install -D sharp
node scripts/generate-icons.js

# 3. Build de production
npm run build

# 4. (Optionnel) Mode watch pour le développement
npm run dev
```

### Charger dans Chrome

1. Ouvrir `chrome://extensions`
2. Activer **Mode développeur** (en haut à droite)
3. Cliquer **Charger l'extension non empaquetée**
4. Sélectionner le dossier `kick-translator/` (pas `dist/`)
   > Le `manifest.json` est à la racine, webpack sort dans `dist/`

### Clé DeepL (recommandé)

1. Créer un compte sur [deepl.com/pro#developer](https://www.deepl.com/pro#developer)
2. Choisir le plan **Free** (500k caractères/mois gratuit)
3. Copier la clé API (se termine par `:fx`)
4. Coller dans le popup de l'extension → Save

## Architecture

```
src/
├── content/
│   ├── index.ts           # Point d'entrée, init
│   ├── chatObserver.ts    # MutationObserver sur le chat Kick
│   ├── messageProcessor.ts # Filtre + dispatch vers background
│   └── uiInjector.ts      # Injection UI dans les messages
├── background/
│   └── serviceWorker.ts   # Appels API DeepL/MyMemory + cache
├── popup/
│   ├── popup.html/ts/css  # Interface utilisateur
└── shared/
    ├── types.ts            # Interfaces TypeScript
    ├── storage.ts          # Wrapper chrome.storage.sync
    └── constants.ts        # Sélecteurs DOM, URLs API
```

### Pourquoi le service worker gère les appels API ?

Les content scripts ont des restrictions CORS. Le background service worker contourne ça proprement via `host_permissions` dans le manifest, sans proxy tiers.

### Détection DOM de Kick

Kick est une SPA Vue.js. Le `ChatObserver` :
- Attend le container chat via polling 500ms
- Attache un `MutationObserver` pour les nouveaux messages
- Gère le re-attachement si l'utilisateur change de channel

### Cache

Le cache est en mémoire dans le service worker (Map). Taille max : 500 entrées (LRU simplifié). Evite de retraduire les mêmes messages entre raffraîchissements de page.

## Packaging

```bash
# Build production
npm run build

# Créer le ZIP pour le Chrome Web Store
cd kick-translator
zip -r ../kick-translator.zip manifest.json dist/ public/ -x "*.map"
```

## Troubleshooting

- **Traductions ne s'affichent pas** : ouvrir la console (F12) sur kick.com et chercher `[KickTranslator]`. Si "Chat container found" n'apparaît pas, les sélecteurs DOM ont peut-être changé → mettre à jour `CHAT_SELECTORS` dans `src/shared/constants.ts`.
- **Erreur DeepL 456** : quota mensuel dépassé, le fallback MyMemory prend le relais automatiquement.
- **Erreur DeepL 403** : clé API invalide → vérifier dans le popup.
