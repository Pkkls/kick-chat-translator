# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🌐 Idioma:** [English](README.md) · [日本語](README.ja.md) · [Español](README.es.md) · Português (BR)

> Leia qualquer chat da Kick.com no **seu** idioma, em tempo real. Grátis, de código aberto e privado.

Uma extensão para **Brave · Chrome · Edge** que traduz o chat da kick.com em tempo real.
Abra uma live e as mensagens em outros idiomas aparecem traduzidas logo abaixo, no
idioma que você escolher.

🎬 **Visão geral (visual):** [`presentation.html`](presentation.html) (EN / 日本語) ·
🆕 **Guia passo a passo:** [TUTORIAL.md](TUTORIAL.md)

## Exemplos (→ Português)

| Chat | Tradução |
|---|---|
| 🇯🇵 バーテンって資格必要なの？ | precisa de licença pra ser bartender? |
| 🇬🇧 that last play was insane | aquela última jogada foi insana |
| 🇪🇸 ¿alguien sabe cuándo empieza? | alguém sabe quando começa? |
| 🇸🇦 كيف حالك؟ | como você está? |

A mensagem original é mantida; a tradução aparece abaixo com uma etiqueta de idioma.

## Por que você vai gostar

- ⚡ **Em tempo real**, abaixo de cada mensagem.
- 🌍 **Qualquer idioma, em qualquer direção** — escolha o idioma de destino (English, 日本語, Español, Português…).
- 🔁 **Vários motores com troca automática** — DeepL, Google, MyMemory, Lingva. Nunca fica sem recursos.
- 🖥️ **No dispositivo no Chrome / Edge** — grátis, ilimitado e offline (o Brave usa a nuvem automaticamente).
- 🧩 **Compatível com 7TV** — lê o chat corretamente com ou sem 7TV.
- 🔒 **Privado** — sem conta, sem rastreamento, sem servidor.

## Instale em 2 minutos (sem compilar, sem terminal)

1. **Baixe** `kick-chat-translator-…-chromium.zip` na [página de Releases][releases].
2. **Descompacte**: você terá uma pasta com `manifest.json`.
3. Abra `brave://extensions` · `chrome://extensions` · `edge://extensions`.
4. Ative o **Modo do desenvolvedor** (canto superior direito).
5. Clique em **Carregar sem compactação** e selecione a **pasta descompactada**.
6. Abra qualquer live da Kick: uma barra verde aparece no topo do chat. ✅

## Escolha o seu idioma

Clique na **⚙** da barra (ou no ícone da extensão → Opções) → **Exibição → Idioma de
destino**. 30 idiomas, incluindo português, japonês, espanhol, árabe… Tudo é traduzido
para esse idioma.

## Melhor qualidade (opcional): chave gratuita da DeepL

Funciona de imediato com Google e MyMemory (sem chave). Para os melhores resultados,
adicione uma chave **gratuita** da DeepL (R$ 0, 1.000.000 de caracteres por mês):

1. Crie uma conta **DeepL API Free** em <https://www.deepl.com/pro-api>.
2. Copie a sua chave (termina em `:fx`).
3. Em **Opções → Provedores**: cole a chave, defina **Plano = Free** e mova a **DeepL** para o topo.

## Privacidade

Sem conta, sem análises e sem servidor do nosso lado. O texto de uma mensagem vai apenas
para o tradutor que você escolheu, só para traduzir. O modo no dispositivo não envia nada
para fora do seu computador. Veja [PRIVACY.md](PRIVACY.md).

## Para desenvolvedores

Para compilar a partir do código-fonte e ver a arquitetura, consulte o
[README.md](README.md) em inglês.

```bash
npm ci && npm run build   # → dist/
```

## Licença

[MIT](LICENSE) · Projeto sem afiliação com a Kick. "Kick" e "7TV" pertencem aos seus respectivos donos.

[releases]: https://github.com/Pkkls/kick-chat-translator/releases/latest
