# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [日本語](README.ja.md) · [Português](README.pt-BR.md)

Traduce el chat de Kick.com en tiempo real. Abres un directo, los mensajes en
otros idiomas aparecen traducidos debajo. Eso es todo.

Funciona en **Brave, Chrome, Edge y Firefox**. Compatible con 7TV.

![Chat japonés traducido al inglés](screenshots/japanese-chat.jpg)

El idioma de destino se puede cambiar. Si lo pones en español,
todo se traduce al español. 42 idiomas disponibles.

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

- **Idioma de destino** — a qué idioma traducir (42 disponibles)
- **Orden de proveedores** — arrastra para reordenar, pega tu clave DeepL
- **Filtros** — saltar bots, bloquear usuarios/canales, restringir idiomas de origen
- **Pausa automática** — las pestañas en segundo plano no traducen (ahorra cuota DeepL)

## Privacidad

Sin cuenta, sin analíticas, sin servidor. Los mensajes van solo al traductor
que elegiste. En modo local ni siquiera eso. [Detalles](PRIVACY.md)

---

## FAQ

**P: La barra verde desapareció / la traducción dejó de funcionar.**
**R:** Recarga la página. Kick actualiza su interfaz de vez en cuando, lo que puede interrumpir la conexión de la extensión con el chat.

**P: Los mensajes no se están traduciendo.**
**R:** Abre los ajustes de la extensión y asegúrate de que el idioma de destino sea distinto al idioma de origen. Comprueba también que haya al menos un proveedor de traducción activo en la cadena de proveedores.

**P: ¿Funciona en las repeticiones de VOD?**
**R:** Sí, la extensión traduce el chat tanto en directos como en repeticiones de VOD.

**P: ¿Qué navegadores son compatibles?**
**R:** Chrome, Brave, Edge y Firefox son todos compatibles.

**P: ¿Están seguros mis datos?**
**R:** La extensión no tiene sistema de cuentas ni recopila ningún tipo de analíticas. Los mensajes del chat se envían únicamente al proveedor de traducción que hayas seleccionado, y a ningún otro sitio.

**P: ¿Cómo puedo mejorar la calidad de las traducciones?**
**R:** Añade una clave de API gratuita de DeepL en los ajustes de la extensión. El plan gratuito de DeepL permite hasta 1 millón de caracteres al mes y supera de forma consistente a los proveedores por defecto.

**P: Algunos mensajes muestran caracteres extraños o no se traducen.**
**R:** Los mensajes muy cortos y los que contienen solo emotes se omiten de forma intencionada, ya que raramente incluyen texto traducible y gastarían llamadas a la API innecesariamente.

**P: La extensión se rompió tras una actualización de Kick.**
**R:** Kick a veces modifica la estructura de su chat, lo que puede romper la detección de mensajes. Abre un [issue en GitHub](https://github.com/Pkkls/kick-chat-translator/issues) y se publicará un parche lo antes posible.

## Compilar desde el código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

Licencia MIT. No afiliado con Kick.
