import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const isFirefox = process.env.BROWSER === 'firefox';

export default defineManifest({
  manifest_version: 3,
  name: 'Kick Chat Translator',
  short_name: 'Kick Translator',
  version: pkg.version,
  // The blurb both stores show in SEARCH RESULTS, served in the reader's browser
  // language from public/_locales. Organic search is where 60% of new users come
  // from, and a Turkish reader looking for "sohbet çevirmen" never matches an
  // English sentence. The name stays literal: it is the brand, and "Kick" is the
  // query people actually type.
  //
  // The English message must stay in step with `description` in package.json,
  // which is what npm and the repo show. locales.test.ts asserts they match.
  default_locale: 'en',
  description: '__MSG_extDescription__',
  icons: {
    16: 'public/icons/icon16.png',
    32: 'public/icons/icon32.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icons/icon16.png',
      32: 'public/icons/icon32.png',
    },
    default_title: 'Kick Chat Translator',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: isFirefox
    ? ({ scripts: ['src/background/index.ts'], type: 'module' } as unknown as { service_worker: string })
    : { service_worker: 'src/background/index.ts', type: 'module' },
  content_scripts: [
    {
      matches: ['https://kick.com/*', 'https://www.kick.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  permissions: ['storage', 'alarms'],
  host_permissions: [
    'https://kick.com/*',
    'https://api.github.com/*',
    'https://translate.googleapis.com/*',
    'https://api-free.deepl.com/*',
    'https://api.deepl.com/*',
    'https://api.mymemory.translated.net/*',
    'https://lingva.lunar.icu/*',
    'https://lingva.ml/*',
  ],
  // Aucune ressource exposee aux pages du site. Le script de contenu est
  // re-bundle en un seul fichier autonome par `scripts/bundle-content.ts`, la
  // feuille de style y est inline par `?inline`, et ses 22 `url()` sont des SVG
  // `data:`. Mesure du 2026-08-30 sur le bundle construit : zero `getURL`, zero
  // `chrome-extension`, zero import dynamique, zero reference a une icone. Rien
  // n'etait donc joignable pour une raison. Ce qui restait listé donnait a
  // n'importe quel script d'une page kick.com une URL stable a interroger pour
  // confirmer que l'extension est installee.
  ...(isFirefox && {
    browser_specific_settings: {
      gecko: {
        id: 'kick-translator@pkkls.dev',
        // FF 121+ : ES-module background scripts (`background.type: module`) and
        // storage.session both require it.
        strict_min_version: '121.0',
        // Required by AMO for new submissions/versions. The extension transmits chat
        // message text (website content) to the user-selected translation provider —
        // nothing else; no analytics, no accounts. On-device mode transmits nothing.
        data_collection_permissions: { required: ['websiteContent'] },
      },
    },
  }),
} as Parameters<typeof defineManifest>[0]);
