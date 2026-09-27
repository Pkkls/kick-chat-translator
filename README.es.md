<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Un traductor de chat en vivo para Kick. Lee el chat de cualquier stream en tu idioma y responde en el del canal.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Usuarios de Chrome](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=usuarios&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [日本語](README.ja.md) · [Português](README.pt-BR.md)

<img src="screenshots/demo.gif" alt="Mensajes de chat en español llegan uno a uno, cada uno con su traducción al inglés debajo; luego se escribe una respuesta en inglés, aparece una vista previa en español sobre la caja de chat y Tab la sustituye" width="360">

</div>

## Qué hace

Abre un directo de Kick donde el chat esté en un idioma que no lees. Cada mensaje recibe su traducción justo
debajo según va llegando, en directos y en repeticiones de VOD. Escribe una respuesta y una vista previa la
muestra en el idioma del canal sobre la caja de chat: pulsa Tab o haz clic en ella, y esa versión sustituye
lo que escribiste.

No hay nada que configurar. El chat entrante se traduce al idioma de tu navegador, y lo que escribes sale en
el idioma en que emite el canal, leído de la propia Kick. Ambos se pueden cambiar en los ajustes.

- 43 idiomas, incluidos los que se escriben de derecha a izquierda (árabe, hebreo, persa) y las variantes
  regionales (portugués de Brasil, chino tradicional, cantonés)
- Google de serie, sin clave y sin cuenta. Tu propia clave gratuita de DeepL para más calidad, MyMemory y
  Lingva como respaldo
- Traducción en el dispositivo en Chrome y Edge cuando el navegador la ofrece: 22 ms en lugar de 1,6 s, y el
  texto nunca sale de tu máquina
- Emotes de 7TV, filtros de bots y usuarios, filtro de palabras clave, un glosario para los nombres que los
  motores destrozan
- Chrome, Brave, Edge y Firefox

| El chat, traducido mientras avanza | La ventana de la barra de herramientas |
|---|---|
| <img src="screenshots/chat.png" alt="Chat de Kick donde cada mensaje en español lleva debajo su traducción al inglés, con la barra de estado de la extensión encima de la lista" width="360"> | <img src="screenshots/popup.png" alt="La ventana de la extensión con el idioma de destino, el modo de visualización, la lista de proveedores y las peticiones del día" width="360"> |

| Lo que escribes, antes de enviarlo | Elige un idioma, o deja que elija |
|---|---|
| <img src="screenshots/compose.png" alt="La caja de chat con un mensaje en inglés y, encima, una vista previa con la versión en español que se enviará" width="360"> | <img src="screenshots/languages.png" alt="Una cuadrícula con buscador de banderas y nombres de idiomas, con el idioma del canal primero" width="360"> |

<sub>Capturas de la versión publicada en una sala de chat que este repositorio se inventa: los nombres y los
mensajes son ficticios y las traducciones se responden en local, así que ningún usuario real aparece aquí.</sub>

## Instalación

[Chrome, Brave, Edge: Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox: Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

Abre cualquier directo de Kick: la barra verde en la parte superior del chat indica que está funcionando.
Las copias de las tiendas se actualizan solas.

<details>
<summary>Instalación manual, desde un zip de release</summary>

Descarga el zip de tu navegador en [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) y descomprímelo.

- Chrome, Brave, Edge (`…-chromium.zip`): abre `chrome://extensions`, activa el Modo de desarrollador, haz clic en Cargar descomprimida y elige la carpeta.
- Firefox 121+ (`…-firefox.zip`): abre `about:debugging#/runtime/this-firefox`, haz clic en Cargar complemento temporal y elige `manifest.json`.

Una copia instalada así no se actualiza sola. Su icono muestra una insignia cuando hay una versión nueva, y
la ventana enlaza a la tienda.

</details>

## Motores de traducción

Cuatro proveedores encadenados: cuando uno falla, el siguiente toma el relevo. El orden lo decides tú.

| Proveedor | Clave | Nota |
|---|---|---|
| Google | ninguna | el predeterminado, funciona de serie |
| DeepL | gratuita | la mejor calidad, [clave gratuita](https://www.deepl.com/pro-api) para 1 millón de caracteres al mes |
| MyMemory | ninguna | respaldo |
| Lingva | ninguna | respaldo, en una instancia pública salvo que apuntes a la tuya |

El traductor integrado de Chromium es más rápido que todos ellos. Medido en un canal en directo: 22 ms desde
que aparece un mensaje hasta que su traducción está en pantalla, frente a 1618 ms por la cadena en la nube,
sin red y sin cuota. Chrome y Edge 138 y posteriores pueden ofrecerlo, aunque no todas las copias lo hacen, y
cada par de idiomas necesita descargar su modelo una vez, con un clic desde la barra. Firefox no lo tiene.
Donde falta, la cadena en la nube toma el relevo y nada se rompe.

## Ajustes

Haz clic en el engranaje de la barra del chat, o clic derecho en el icono de la extensión y Opciones.

- Idioma de destino, y un idioma de lectura recordado por canal si lo activas
- Orden de proveedores, tu clave de DeepL y el modo de motor: primero en el dispositivo, primero en la nube,
  o solo en el dispositivo
- Visualización: debajo del mensaje (recomendada), en línea tras él, en su lugar o al pasar el ratón, con el
  texto original y la insignia del idioma de origen opcionales
- El botón de idioma en la barra de acciones del chat: un clic alterna entre el idioma del canal y tu última
  elección, mantenerlo pulsado abre la lista, escribir dos letras la filtra
- Vista previa de redacción: activada o no, su idioma de destino, y si al hacer clic rellena la caja de chat
  o copia
- Filtros: omitir bots, bloquear usuarios, canales o palabras clave, limitar los idiomas de origen
- Glosario: pares de buscar y reemplazar aplicados a las traducciones
- Presupuesto: reparto de la cuota de DeepL, límite por canal, tamaño y duración de la caché
- Legibilidad y apariencia: tamaño del texto, interlineado, tipografía, color de acento, tema del chat
- Teclado: Alt+T activa o desactiva la traducción del chat, Alt+W la vista previa de redacción
- Actividad: mensajes traducidos, aciertos de caché, cada idioma visto en el chat, y por qué cada una de las
  últimas 50 líneas se tradujo o no
- La interfaz de la extensión en inglés, español, francés, portugués, turco, ruso, árabe, chino, japonés o
  coreano

## Idiomas

Inglés · Francés · Español · Portugués · Portugués (Brasil) · Alemán · Italiano · Neerlandés · Polaco · Sueco · Checo · Eslovaco · Rumano · Ruso · Ucraniano · Turco · Árabe · Hebreo · Japonés · Coreano · Chino (simplificado) · Chino (tradicional) · Tailandés · Vietnamita · Indonesio · Hindi · Finés · Noruego · Danés · Griego · Húngaro · Búlgaro · Catalán · Esloveno · Estonio · Lituano · Letón · Persa · Bengalí · Tamil · Malayo · Filipino · Cantonés

## Privacidad

Sin cuenta, sin analítica, sin servidor propio. Los mensajes del chat van al proveedor de traducción que
elegiste y a ningún otro sitio, y en modo dispositivo ni siquiera ahí. Una copia instalada desde una tienda
no hace ninguna otra petición. Una copia instalada a mano pregunta a GitHub la última etiqueta de release, como
mucho cada seis horas, para saber si mostrar su insignia de actualización. [Detalles](PRIVACY.md)

## Preguntas frecuentes

**Los mensajes no se traducen.**
Abre la pestaña Actividad en los ajustes y pulsa "Leer decisiones": muestra las últimas 50 líneas y por qué
cada una se tradujo o no. La mayoría de las líneas omitidas se omiten a propósito. En una sesión en directo,
213 de 234 eran el mismo usuario repitiéndose, 9 eran demasiado cortas, 7 solo emojis o risas, y 1 ya estaba
en el idioma de lectura. Si la pestaña no muestra nada, la extensión no ve el chat: abre una incidencia.

**La barra verde desapareció.**
Recarga la página. Si vuelve a pasar, abre una [incidencia](https://github.com/Pkkls/kick-chat-translator/issues)
con el canal y lo que hiciste antes.

**¿Cómo consigo mejores traducciones?**
Añade una clave gratuita de DeepL en los ajustes. El plan gratuito cubre un millón de caracteres al mes, y
DeepL solo se gasta en los pares de idiomas donde supera a los motores gratuitos.

**¿Qué estilo de visualización uso?**
Debajo del mensaje. Los otros tres funcionan y todavía se están ajustando.

**¿Funciona en repeticiones de VOD?**
Sí, igual que en directo.

**Dejó de funcionar tras una actualización de Kick.**
Kick cambia a veces la estructura de su chat. Abre una [incidencia](https://github.com/Pkkls/kick-chat-translator/issues)
y se corrige.

**¿La hace Kick?**
No. Es un proyecto independiente de código abierto, sin relación con Kick.

## Novedades

Cada versión, con lo que cambió y la medición detrás:
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) y [CHANGELOG.md](CHANGELOG.md).

## Desarrollo

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, tests unitarios, build: el control por el que pasa cada paquete
npm run build:firefox    # build de Firefox, en la misma carpeta dist/
npm run package:all      # los dos zips, en release/
npm run dev              # HMR
```

Los builds son reproducibles: el mismo commit da zips idénticos byte a byte en cualquier máquina,
comprobado construyendo un `git archive` de la etiqueta en una carpeta vacía y comparando los hashes.

Además de los tests unitarios, 39 pruebas sin red cargan la extensión construida en un navegador real, la
manejan y comprueban lo que hace, con la página y el motor de traducción servidos en local. Necesitan
Playwright, que a propósito no es una dependencia: apunta `UX_KIT` a una carpeta cuyo `node_modules` lo
contenga, o ejecuta `npm i -D playwright`.

```bash
node test/e2e/run-gates.mjs --headless                  # las 39, sin ventana
node test/e2e/store-shots-fixture.mjs --lang=es         # las capturas de la tienda, en un idioma de ficha
node test/e2e/store-shots-fixture.mjs --gif             # capturas en inglés, las imágenes del README y este GIF
```

Stack: Manifest V3, Vite, TypeScript, Preact, Tailwind. Los textos de las tiendas están en [store/](store/),
y una release es una etiqueta de versión: la CI la construye, la comprueba y la publica en las dos tiendas.

## Proyectos relacionados

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), bloquea los anuncios pre-roll y superpuestos de Kick
- [kick-core](https://github.com/Pkkls/kick-core), el cliente del gateway en tiempo real que comparten estas extensiones
- [kickbus](https://github.com/Pkkls/kickbus), webhooks oficiales de Kick reenviados a bots locales por SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), aplicación de Windows que avanza el tiempo de visionado de los drops de Kick

## Licencia

MIT. Sin relación con Kick.
