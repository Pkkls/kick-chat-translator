# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🌐 Idioma:** [English](README.md) · [日本語](README.ja.md) · Español · [Português (BR)](README.pt-BR.md)

> Lee cualquier chat de Kick.com en **tu** idioma, en tiempo real. Gratis, de código abierto y privado.

Una extensión para **Brave · Chrome · Edge** que traduce el chat de kick.com en tiempo
real. Abre un directo y los mensajes en otros idiomas aparecen traducidos justo debajo,
al idioma que elijas.

🎬 **Vistazo visual:** [`presentation.html`](presentation.html) (EN / 日本語) ·
🆕 **Guía paso a paso:** [TUTORIAL.md](TUTORIAL.md)

## Ejemplos (→ Español)

| Chat | Traducción |
|---|---|
| 🇯🇵 バーテンって資格必要なの？ | ¿hace falta licencia para ser barman? |
| 🇬🇧 that last play was insane | esa última jugada fue una locura |
| 🇧🇷 que jogada absurda mano | qué jugada más absurda, tío |
| 🇸🇦 كيف حالك؟ | ¿cómo estás? |

El mensaje original se mantiene; la traducción aparece debajo con una etiqueta de idioma.

## Por qué te gustará

- ⚡ **En tiempo real**, debajo de cada mensaje.
- 🌍 **Cualquier idioma, en cualquier dirección** — elige tu idioma de destino (English, 日本語, Español, Português…).
- 🔁 **Varios motores con conmutación automática** — DeepL, Google, MyMemory, Lingva. Nunca se queda sin recursos.
- 🖥️ **En el dispositivo en Chrome / Edge** — gratis, ilimitado y sin conexión (Brave usa la nube automáticamente).
- 🧩 **Compatible con 7TV** — lee el chat correctamente con o sin 7TV.
- 🔒 **Privado** — sin cuenta, sin rastreo, sin servidor.

## Instálalo en 2 minutos (sin compilar, sin terminal)

1. **Descarga** `kick-chat-translator-…-chromium.zip` desde la [página de Releases][releases].
2. **Descomprime** el archivo: obtienes una carpeta con `manifest.json`.
3. Abre `brave://extensions` · `chrome://extensions` · `edge://extensions`.
4. Activa el **Modo de desarrollador** (arriba a la derecha).
5. Pulsa **Cargar descomprimida** y selecciona la **carpeta descomprimida**.
6. Abre cualquier directo de Kick: aparecerá una barra verde arriba del chat. ✅

## Elige tu idioma

Pulsa la **⚙** de la barra (o el icono de la extensión → Opciones) → **Pantalla →
Idioma de destino**. 30 idiomas, incluidos español, japonés, portugués, árabe…
Todo se traduce a ese idioma.

## Máxima calidad (opcional): clave gratuita de DeepL

Funciona de inmediato con Google y MyMemory (sin clave). Para los mejores resultados,
añade una clave **gratuita** de DeepL (0 €, 1.000.000 de caracteres al mes):

1. Regístrate en **DeepL API Free** en <https://www.deepl.com/pro-api>.
2. Copia tu clave (termina en `:fx`).
3. En **Opciones → Proveedores**: pégala, pon **Plan = Free** y mueve **DeepL** al principio.

## Privacidad

Sin cuenta, sin analíticas y sin servidor por nuestra parte. El texto de un mensaje va
solo al traductor que elijas, únicamente para traducirlo. El modo en el dispositivo no
envía nada fuera de tu equipo. Consulta [PRIVACY.md](PRIVACY.md).

## Para desarrolladores

Para compilar desde el código fuente y ver la arquitectura, consulta el
[README.md](README.md) en inglés.

```bash
npm ci && npm run build   # → dist/
```

## Licencia

[MIT](LICENSE) · Proyecto no afiliado a Kick. «Kick» y «7TV» pertenecen a sus respectivos propietarios.

[releases]: https://github.com/Pkkls/kick-chat-translator/releases/latest
