# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [日本語](README.ja.md) · [Português](README.pt-BR.md)

Traduce el chat de Kick.com en tiempo real. Abres un directo, los mensajes en
otros idiomas aparecen traducidos debajo. Eso es todo.

Funciona en **Brave, Chrome, Edge y Firefox**. Compatible con 7TV.

![Chat japonés traducido al inglés](screenshots/japanese-chat.jpg)

El idioma de destino se puede cambiar. Si lo pones en español,
todo se traduce al español. 30 idiomas disponibles.

---

## Instalacion

**[➥ Chrome / Brave / Edge — Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)** · **[➥ Firefox — Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

Un clic para instalar, luego abre un directo de Kick — si ves una barra verde arriba del chat, funciona.

<details>
<summary>O instala manualmente (zip / build de desarrollo)</summary>

Descarga el zip correcto de [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest)
y descomprímelo.

**Chrome / Brave / Edge** — `…-chromium.zip`:

1. Abre `brave://extensions` (o `chrome://extensions`, `edge://extensions`)
2. Activa **Modo de desarrollador**
3. **Cargar descomprimida** → selecciona la carpeta

**Firefox 121+** — `…-firefox.zip`:

1. Abre `about:debugging#/runtime/this-firefox`
2. **Cargar complemento temporal…** → elige el `manifest.json` de la carpeta
   *(temporal — Firefox lo quita al reiniciar, hasta que este en Mozilla Add-ons)*

</details>

## Motores de traducción

Cuatro proveedores en cadena — si uno falla, el siguiente sigue:

| Proveedor | ¿Clave? | Nota |
|---|---|---|
| Google | No | Por defecto, funciona solo |
| DeepL | Sí (gratis) | Mejor calidad. [Clave gratis](https://www.deepl.com/pro-api) (1M caracteres/mes, 0 €) |
| MyMemory | No | Respaldo |
| Lingva | No | Respaldo |

En Chrome/Edge también hay traducción local (sin red, sin límite).
Brave y Firefox no la soportan todavía, usan la nube.

El orden se cambia en los ajustes.

## Ajustes

Haz clic en el engranaje de la barra, o clic derecho en el icono → Opciones.

- **Idioma de destino** — a qué idioma traducir (30 disponibles)
- **Orden de proveedores** — arrastra para reordenar, pega tu clave DeepL
- **Filtros** — saltar bots, bloquear usuarios/canales, restringir idiomas de origen
- **Pausa automática** — las pestañas en segundo plano no traducen (ahorra cuota DeepL)

## Privacidad

Sin cuenta, sin analíticas, sin servidor. Los mensajes van solo al traductor
que elegiste. En modo local ni siquiera eso. [Detalles](PRIVACY.md)

---

## Compilar desde el código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

Licencia MIT. No afiliado con Kick.
