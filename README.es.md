# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [日本語](README.ja.md) · [Português](README.pt-BR.md)

Traducción en tiempo real del chat de Kick.com, tanto en directos como en repeticiones de VOD. Abres un
stream y cualquier mensaje en otro idioma aparece traducido justo debajo. Sin nada que configurar.

<img width="354" height="593" alt="image" src="https://github.com/user-attachments/assets/4f7ae414-6c2a-4ee5-b191-6af9e29d46ec" />


Funciona en **Brave, Chrome, Edge y Firefox**, y entiende los emotes de 7TV.

![Chat japonés traducido al inglés](screenshots/japanese-chat.jpg)

**Cero configuración.** El chat entrante se traduce al idioma de *tu* navegador. Cuando escribes, una vista
previa muestra tu propio mensaje en el idioma *del canal* (detectado automáticamente desde Kick) justo encima
de la caja de chat; haz clic en ella o pulsa **Ctrl/Cmd+Enter** para enviar esa versión. Ambas direcciones
funcionan solas, así que nunca tienes que elegir un idioma. (Aun así puedes hacerlo, en los ajustes.)

**42 idiomas**, incluidos los de escritura de derecha a izquierda (árabe, hebreo, persa) y variantes
regionales (portugués de Brasil, chino tradicional).

---

## Novedades de la [2.6.0](https://github.com/Pkkls/kick-chat-translator/releases/latest)

El chat escrito en alfabeto latino vuelve a traducirse. Con el inglés como idioma de lectura, cualquier
texto con más del 85% de caracteres latinos básicos se rechazaba como si ya estuviera en inglés, lo que
dejaba fuera al español, turco, francés y portugués mientras que el japonés y el coreano pasaban sin
tocar. Medido sobre chat guardado: se perdieron 66 de 76 líneas en español y 40 de 51 en turco, frente a
0 de 43 en coreano.

La barra de la parte superior del chat ya no desaparece, la interfaz ahora está disponible en 10 idiomas,
el glosario por fin se puede editar, y una pestaña de Depuración muestra por qué se dejó una línea sin
traducir. Lista completa en [CHANGELOG.md](CHANGELOG.md).

---

## Instalación

**[➥ Chrome / Brave / Edge · Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox · Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

Un clic para instalar. Abre cualquier directo de Kick: una barra verde en la parte superior del chat indica que está funcionando.
<img width="347" height="193" alt="image" src="https://github.com/user-attachments/assets/3973b7a0-4767-42a2-974c-7f94b2534595" />

<details>
<summary>O instala manualmente (descomprimida / build de desarrollo)</summary>

Descarga el zip correcto desde [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) y descomprímelo.

- **Chrome / Brave / Edge** (`…-chromium.zip`): abre `chrome://extensions`, activa el **Modo de desarrollador**, pulsa **Cargar descomprimida** y selecciona la carpeta.
- **Firefox 121+** (`…-firefox.zip`): abre `about:debugging#/runtime/this-firefox`, pulsa **Cargar complemento temporal…** y selecciona el `manifest.json`.

</details>

## Motores de traducción

Cuatro proveedores en cadena: si uno falla, el siguiente toma el relevo.

| Proveedor | ¿Clave? | Nota |
|---|---|---|
| Google | No | Por defecto, funciona sin más |
| DeepL | Sí (gratis) | Mejor calidad. [Consigue una clave gratis](https://www.deepl.com/pro-api) (1M de caracteres/mes, 0 €) |
| MyMemory | No | Respaldo |
| Lingva | No | Respaldo. Usa una instancia pública de forma predeterminada; apunta a la tuya propia en los ajustes si lo prefieres |

En Chrome/Edge también hay traducción en el dispositivo, si el hardware lo permite: sin red y sin límite. Brave y
Firefox todavía no incluyen esa API, así que recurren a la cadena en la nube.

El orden lo decides tú en los ajustes.

## Ajustes

Haz clic en el engranaje de la barra del chat, o clic derecho en el icono de la extensión → Opciones.

- **Idioma de destino**: a qué idioma se traduce todo (42 disponibles)
- **Orden de proveedores**: arrastra para reordenar, pega tu clave de DeepL
- **Modo de motor**: primero en el dispositivo, primero en la nube, o solo en el dispositivo
- **Visualización**: la traducción debajo del mensaje, en línea con él, después en cursiva más pequeña, o al pasar el ratón; el texto original, el idioma de origen y el proveedor son insignias opcionales. Una línea de ejemplo en los ajustes muestra cada estilo antes de que elijas
- **Vista previa al escribir**: activada o desactivada, su idioma de destino, y si al hacer clic se rellena la caja de chat o se copia la traducción al portapapeles
- **Filtros**: saltar bots, bloquear usuarios o canales, restringir los idiomas de origen, o permitir solo ciertos canales
- **Glosario**: pares de buscar y reemplazar aplicados a la traducción, para nombres y bromas internas que los motores destrozan
- **Presupuesto**: cuota de DeepL y enrutado inteligente, límite de frecuencia por canal, tamaño y duración de la caché, concurrencia
- **Pausa automática**: las pestañas en segundo plano dejan de traducir (ahorra tu cuota de DeepL)
- **Idioma de la interfaz** de la propia extensión, en inglés, español, francés, portugués, turco, ruso, árabe, chino, japonés o coreano, además de botones para vaciar la caché o restablecer estadísticas y ajustes
- **Depuración**: las últimas decisiones del traductor y por qué se dejó una línea sin traducir, guardadas solo en memoria

## Privacidad

Sin cuenta, sin analíticas, sin ningún servidor mío. Los mensajes van al proveedor de traducción que elegiste
y a ningún otro sitio; y en modo local, ni siquiera ahí. [Detalles](PRIVACY.md)

## FAQ

**P: La barra verde desapareció / la traducción dejó de funcionar.**
**R:** La 2.6.0 corrigió la causa: Kick deja en la página una segunda copia oculta del panel de chat, y la barra se montaba en esa copia, invisible desde el principio. Actualiza primero. Si sigue pasando en la 2.6.0 o posterior, recarga la página y abre una incidencia, porque entonces sería un fallo nuevo.

**P: Los mensajes no se están traduciendo.**
**R:** Abre los ajustes y asegúrate de que el idioma de destino sea distinto al de origen. Comprueba también que haya al menos un proveedor activo en la cadena.

**P: ¿Funciona en las repeticiones de VOD?**
**R:** Sí, la extensión traduce el chat tanto en directos como en repeticiones de VOD.

**P: ¿Qué navegadores son compatibles?**
**R:** Chrome, Brave, Edge y Firefox son todos compatibles.

**P: ¿Están seguros mis datos?**
**R:** No hay sistema de cuentas ni recopilación de analíticas. Los mensajes del chat se envían únicamente al proveedor de traducción que hayas elegido, y a ningún otro sitio.

**P: ¿Cómo consigo mejor calidad de traducción?**
**R:** Añade una clave de API gratuita de DeepL en los ajustes. El plan gratuito de DeepL cubre hasta 1 millón de caracteres al mes y supera de forma consistente a los proveedores por defecto.

**P: Algunos mensajes muestran caracteres extraños o no se traducen.**
**R:** Los mensajes muy cortos y los que contienen solo emotes se omiten a propósito: rara vez incluyen texto traducible y gastarían llamadas a la API en balde.

**P: La extensión se rompió tras una actualización de Kick.**
**R:** Kick a veces cambia la estructura de su chat, lo que puede romper la detección de mensajes. Abre un [issue en GitHub](https://github.com/Pkkls/kick-chat-translator/issues) y se corregirá lo antes posible.

## Idiomas soportados

Inglés · Francés · Español · Portugués · Portugués (Brasil) · Alemán · Italiano · Neerlandés · Polaco · Sueco · Checo · Eslovaco · Rumano · Ruso · Ucraniano · Turco · Árabe · Hebreo · Japonés · Coreano · Chino (simplificado) · Chino (tradicional) · Tailandés · Vietnamita · Indonesio · Hindi · Finés · Noruego · Danés · Griego · Húngaro · Búlgaro · Catalán · Esloveno · Estonio · Lituano · Letón · Persa · Bengalí · Tamil · Malayo · Filipino

## Cómo funciona

1. Un content script observa el DOM del chat de Kick y capta cada mensaje nuevo.
2. El mensaje pasa al service worker en segundo plano, que prueba los proveedores en orden hasta que uno funciona.
3. La traducción se inyecta de vuelta en el DOM, debajo del mensaje original.
4. Para los mensajes salientes, el idioma del canal se detecta automáticamente a través de la API de Kick y aparece una vista previa encima de la caja de chat.

La extensión nunca intercepta ni modifica las propias peticiones de red de Kick.

Pide `storage` y `alarms`, y acceso de host a kick.com, a cada proveedor de traducción al que puede llamar (Google, DeepL, MyMemory, las dos instancias de Lingva) y a `api.github.com`. Esto último es la comprobación de actualizaciones: lee la etiqueta de la última release, con límite de frecuencia y caché, y el popup ofrece un enlace cuando hay una versión más reciente. No se envía nada con esa petición y nada se actualiza solo.

---

## Compilar desde el código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build     # salida en dist/
```

Otros comandos: `npm run dev` (HMR), `npm run test`, `npm run lint`,
`npm run pack` (zip para distribución).

Stack: MV3, Vite, TypeScript, Preact, Tailwind. El content script se distribuye
como un IIFE clásico para una inyección fiable en Brave.

## Licencia

MIT. Sin afiliación con Kick.

## Proyectos relacionados

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), bloquea los anuncios de Kick
- [kick-core](https://github.com/Pkkls/kick-core), el cliente de gateway en tiempo real que comparten estas extensiones
- [kickbus](https://github.com/Pkkls/kickbus), webhooks oficiales de Kick retransmitidos por SSE a bots locales
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), app de Windows que avanza el tiempo de visionado de los drops
