// Spanish UI translations. Keys = verbatim English source strings.
export const es: Record<string, string> = {
  'v2 · options & preferences': 'v2 · opciones y preferencias',
  saved: 'guardado',
  ready: 'listo',
  Providers: 'Proveedores',
  Display: 'Visualización',
  Filters: 'Filtros',
  Advanced: 'Avanzado',
  About: 'Acerca de',
  'Kick Chat Translator listens to chat in real time and translates non-English (or non-target-language) messages right under the original. No tracking, no account, fully open-source.':
    'Kick Chat Translator escucha el chat en tiempo real y traduce los mensajes que no están en inglés (o fuera del idioma de destino) justo debajo del original. Sin seguimiento, sin cuenta, totalmente de código abierto.',
  Links: 'Enlaces',
  'GitHub repository': 'Repositorio de GitHub',
  'Privacy policy': 'Política de privacidad',
  'Report an issue': 'Reportar un problema',
  'How translation happens': 'Cómo funciona la traducción',
  'The extension reads each chat message from the page as it appears.':
    'La extensión lee cada mensaje del chat en la página a medida que aparece.',
  'Each chat message is parsed; emotes and links are stripped before translation.':
    'Cada mensaje del chat se analiza; los emotes y enlaces se eliminan antes de traducir.',
  'The extension picks the first available provider in your chain.':
    'La extensión usa el primer proveedor disponible en tu cadena.',
  'Translations are cached locally in IndexedDB to avoid duplicate calls.':
    'Las traducciones se almacenan en caché localmente en IndexedDB para evitar llamadas duplicadas.',
  Connection: 'Conexión',
  'Cache & performance': 'Caché y rendimiento',
  Debugging: 'Depuración',
  'Pause when tab is hidden': 'Pausar cuando la pestaña está oculta',
  "Background Kick tabs won't translate (saves DeepL quota while you're away).":
    'Las pestañas de Kick en segundo plano no traducirán (ahorra cuota de DeepL mientras estás ausente).',
  'Verbose console logs': 'Registros detallados en la consola',
  'Cache max entries': 'Máximo de entradas en caché',
  'Larger = more hits across sessions, more disk space.':
    'Más grande = más aciertos entre sesiones, más espacio en disco.',
  'Cache TTL (hours)': 'TTL de la caché (horas)',
  'After this, entries expire.': 'Pasado este tiempo, las entradas expiran.',
  'Concurrent translations': 'Traducciones simultáneas',
  'In-flight provider requests.': 'Solicitudes en curso al proveedor.',
  'Per-channel budget (req/min)': 'Límite por canal (req/min)',
  'Hard cap to avoid hammering providers on fast chats.':
    'Límite estricto para evitar saturar a los proveedores en chats rápidos.',
  'Clear translation cache': 'Borrar caché de traducción',
  'Reset usage stats': 'Restablecer estadísticas de uso',
  'Reset all settings to defaults': 'Restablecer todos los ajustes',
  'click again to confirm': 'haz clic de nuevo para confirmar',
  '"Reset all settings" restores defaults — use it if translations stop appearing because a filter (whitelist / source-language allowlist) was left active.':
    '"Restablecer todos los ajustes" recupera los valores predeterminados. Úsalo si las traducciones dejan de aparecer porque quedó activo un filtro (lista blanca o lista de idiomas de origen permitidos).',
  'Translation target': 'Idioma de destino',
  'Display style': 'Estilo de visualización',
  'Compose preview': 'Vista previa de redacción',
  'Translate everything to': 'Traducir todo a',
  'Auto — your browser language': 'Automático, idioma de tu navegador',
  'Auto reads incoming chat in your own language, detected from the browser.':
    'Automático muestra el chat entrante en tu propio idioma, detectado desde el navegador.',
  'Write my messages in': 'Escribir mis mensajes en',
  "Auto — the channel's language": 'Automático, idioma del canal',
  "Auto detects the channel's broadcast language from Kick — no manual picking.":
    'Detecta automáticamente el idioma de transmisión del canal desde Kick, sin selección manual.',
  Below: 'Debajo',
  'On a new line under the message.': 'En una nueva línea debajo del mensaje.',
  Inline: 'En línea',
  'In a pill after the original text.': 'En una etiqueta después del texto original.',
  Replace: 'Reemplazar',
  'Show floating bar at top of chat (toggle live)':
    'Mostrar barra flotante en la parte superior del chat (activar en vivo)',
  'Keep original text visible': 'Mantener visible el texto original',
  'Show source language badge': 'Mostrar insignia del idioma de origen',
  'Show which provider was used': 'Mostrar qué proveedor se usó',
  'Enable compose preview': 'Activar vista previa de redacción',
  'Click inserts into the chat box (off = copy to clipboard instead)':
    'Al hacer clic se inserta en el cuadro de chat (desactivado = copiar al portapapeles)',
  'Translate what you type before sending. A live preview appears above the chat box; click it to drop the translation in. Uses the same DeepL-first chain as incoming chat.':
    'Traduce lo que escribes antes de enviarlo. Aparece una vista previa en vivo encima del cuadro de chat; haz clic para insertar la traducción. Usa la misma cadena con DeepL en primer lugar que el chat entrante.',
  Engine: 'Motor',
  'on-device:': 'en el dispositivo:',
  'available ✓': 'disponible ✓',
  'not supported in this browser': 'no compatible con este navegador',
  Strategy: 'Estrategia',
  'On-device first, cloud fallback (recommended)':
    'Primero en el dispositivo, con respaldo en la nube (recomendado)',
  'Cloud first, on-device fallback': 'Primero en la nube, con respaldo en el dispositivo',
  'On-device only (no network, no cloud)': 'Solo en el dispositivo (sin red, sin nube)',
  'On-device = local Chromium models: unlimited, instant, private, no rate-limit. Each language needs a one-time model download (click a flag below, or the "Local" chip in chat).':
    'En el dispositivo = modelos locales de Chromium: ilimitado, instantáneo, privado, sin límite de solicitudes. Cada idioma requiere una descarga única del modelo (haz clic en una bandera abajo, o en la etiqueta "Local" del chat).',
  'Enable on-device translation': 'Activar traducción en el dispositivo',
  'Download models →': 'Descargar modelos →',
  General: 'General',
  'Source languages allowlist': 'Lista de idiomas de origen permitidos',
  'Channels & users': 'Canales y usuarios',
  'Leave empty to translate every detected language. Pick specific ones to ONLY translate those (e.g. only JA + KO).':
    'Déjalo vacío para traducir todos los idiomas detectados. Elige idiomas específicos para traducir SOLO esos (por ejemplo, solo JA + KO).',
  'Skip messages already in target language':
    'Omitir mensajes que ya están en el idioma de destino',
  'Ignore common bot accounts (StreamElements, Nightbot, …)':
    'Ignorar cuentas de bots comunes (StreamElements, Nightbot, …)',
  'Whitelist channels (only translate on these)':
    'Lista blanca de canales (traducir solo en estos)',
  'Blacklist channels': 'Lista negra de canales',
  'Blacklist users': 'Lista negra de usuarios',
  'Cloud fallback chain': 'Cadena de respaldo en la nube',
  "Used when on-device is off or a language pair isn't downloaded. Providers are tried in order; failing ones are temporarily skipped (exponential cooldown).":
    'Se usa cuando la traducción en el dispositivo está desactivada o no se ha descargado un par de idiomas. Los proveedores se prueban en orden; los que fallan se omiten temporalmente (espera exponencial).',
  ok: 'ok',
  down: 'caído',
  'Google Translate (free, no key)': 'Google Translate (gratis, sin clave)',
  'DeepL (best quality, needs key)': 'DeepL (mejor calidad, requiere clave)',
  'MyMemory (free, ~1000/day)': 'MyMemory (gratis, ~1000/día)',
  'Lingva (LibreTranslate front, configurable)':
    'Lingva (interfaz de LibreTranslate, configurable)',
  'API key': 'Clave de API',
  Plan: 'Plan',
  'Free (api-free.deepl.com)': 'Gratis (api-free.deepl.com)',
  'Pro (api.deepl.com)': 'Pro (api.deepl.com)',
  'Smart budget routing': 'Enrutamiento inteligente de cuota',
  'Spend DeepL only on the European languages it clearly wins at; other targets (Japanese, Arabic, Hindi…) use the free engines first, so your DeepL quota lasts much longer.':
    'Usa DeepL solo en los idiomas europeos donde claramente destaca; otros idiomas de destino (japonés, árabe, hindi…) usan primero los motores gratuitos, así tu cuota de DeepL dura mucho más.',
  'Lingva instance': 'Instancia de Lingva',
  'Custom URL (optional)': 'URL personalizada (opcional)',
  'Leave blank to use the default public instance.':
    'Déjalo en blanco para usar la instancia pública predeterminada.',
  '⬆ Update available': '⬆ Actualización disponible',
  'Target language': 'Idioma de destino',
  'Translate what I type': 'Traducir lo que escribo',
  Today: 'Hoy',
  'Auto — your language': 'Automático, tu idioma',
  'Below original': 'Debajo del original',
  'Auto — channel language': 'Automático, idioma del canal',
  "Auto-detects the channel's language. Preview shows above the chat box — click it to insert.":
    'Detecta automáticamente el idioma del canal. La vista previa aparece encima del cuadro de chat, haz clic para insertarla.',
  'order in options': 'orden en las opciones',
  'DeepL quota': 'Cuota de DeepL',
  enable: 'activar',
  'keep original': 'original',
  'lang badge': 'insignia',
  'Clear cache': 'Borrar caché',
  Options: 'Opciones',
  requests: 'solicitudes',
  cache: 'caché',
  errors: 'errores',
  available: 'disponible',
  unavailable: 'no disponible',
  Backup: 'Copia de seguridad',
  'Save your configuration to a JSON file, or restore it on another browser.':
    'Guarda tu configuración en un archivo JSON, o restáurala en otro navegador.',
  'Export settings': 'Exportar ajustes',
  'Import settings': 'Importar ajustes',
  'Invalid settings file': 'Archivo de ajustes no válido',
  'cache hit rate, last 7 days': 'tasa de aciertos de caché, últimos 7 días',
  'Minimum message length': 'Longitud mínima del mensaje',
  'Shorter messages are left alone. Raise it to spend less provider quota on busy chats.':
    'Los mensajes más cortos se dejan sin traducir. Súbelo para gastar menos cuota del proveedor en chats concurridos.',
  Preview: 'Vista previa',
  'is anyone else seeing this?': '¿alguien más está viendo esto?',
  'Whether a Kick tab keeps translating once you look away.':
    'Si una pestaña de Kick sigue traduciendo cuando dejas de mirarla.',
  'Reusing past translations, and how hard the engines are pushed on a busy chat. The defaults suit most channels.':
    'Reutilización de traducciones pasadas, y cuánto se exige a los motores en un chat concurrido. Los valores predeterminados funcionan bien para la mayoría de los canales.',
  'one channel name per line': 'un nombre de canal por línea',
  'one username per line': 'un nombre de usuario por línea',
  Glossary: 'Glosario',
  'Words the engines keep getting wrong for your channels. Each line replaces the left side with the right side, after translating.':
    'Palabras que los motores siguen traduciendo mal para tus canales. Cada línea reemplaza el lado izquierdo por el lado derecho, después de traducir.',
  'one rule per line, in the form word→replacement':
    'una regla por línea, en el formato palabra→reemplazo',
  Debug: 'Depuración',
  'Last decisions': 'Últimas decisiones',
  'Why each recent message was translated or left alone. Read from an open Kick tab, kept in memory there, never saved to disk.':
    'Por qué cada mensaje reciente fue traducido o se dejó como estaba. Se lee desde una pestaña de Kick abierta, se guarda en memoria allí, nunca se guarda en disco.',
  'Read decisions': 'Leer decisiones',
  'No Kick tab is open. Open a channel, let the chat run, then read again.':
    'No hay ninguna pestaña de Kick abierta. Abre un canal, deja correr el chat y vuelve a leer.',
  'The open Kick tab has not loaded the extension yet. Reload the tab, then read again.':
    'La pestaña de Kick abierta aún no ha cargado la extensión. Recarga la pestaña y vuelve a leer.',
  'Nothing recorded yet. Let a chat run for a moment, then read again.':
    'Aún no hay nada registrado. Deja correr un chat un momento y vuelve a leer.',
  'Filter languages': 'Filtrar idiomas',
  'No language matches': 'Ningún idioma coincide',
  'Move up': 'Subir',
  'Move down': 'Bajar',
  Remove: 'Quitar',
  'Settings sections': 'Secciones de ajustes',
  'Show the quick language button in chat': 'Mostrar el botón rápido de idioma en el chat',
  Usage: 'Uso',
  'most translated languages': 'idiomas más traducidos',
  'Translate the chat': 'Traducir el chat',
  "In place of the original text. Emotes stay.": "En lugar del texto original. Los emotes se mantienen.",
  "The Replace style always hides it.": "El estilo Reemplazar siempre lo oculta.",
};
