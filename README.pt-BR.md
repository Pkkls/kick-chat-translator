# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [日本語](README.ja.md) · [Español](README.es.md)

Traduz o chat da Kick.com em tempo real. Você abre uma live, as mensagens em
outros idiomas aparecem traduzidas logo abaixo. Só isso.

Funciona no **Brave, Chrome e Edge**. Compatível com 7TV.

![Chat japonês traduzido para inglês](screenshots/japanese-chat.jpg)

O idioma de destino é configurável. Se botar em português,
tudo aparece em português. 30 idiomas disponíveis.

---

## Instalação

Baixe o zip em [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest)
e descompacte.

1. Abra `brave://extensions` (ou `chrome://extensions`, `edge://extensions`)
2. Ative o **Modo do desenvolvedor**
3. **Carregar sem compactação** → selecione a pasta

Abra uma live da Kick. Barra verde no topo do chat = funcionando.

## Motores de tradução

Quatro provedores em cadeia — se um cai, o próximo assume:

| Provedor | Chave? | Nota |
|---|---|---|
| Google | Não | Padrão, funciona direto |
| DeepL | Sim (grátis) | Melhor qualidade. [Chave grátis](https://www.deepl.com/pro-api) (1M caracteres/mês, R$ 0) |
| MyMemory | Não | Reserva |
| Lingva | Não | Reserva |

No Chrome/Edge tem tradução local também (sem rede, sem limite).
Brave ainda não suporta, usa a nuvem.

A ordem se muda nos ajustes.

## Ajustes

Clique na engrenagem da barra, ou clique com botão direito no ícone → Opções.

- **Idioma de destino** — para qual idioma traduzir (30 disponíveis)
- **Ordem dos provedores** — arraste pra reordenar, cole sua chave DeepL
- **Filtros** — pular bots, bloquear usuários/canais, restringir idiomas de origem
- **Pausa automática** — abas em segundo plano não traduzem (economiza cota DeepL)

## Privacidade

Sem conta, sem analytics, sem servidor. As mensagens vão só pro tradutor
que você escolheu. No modo local, nem isso. [Detalhes](PRIVACY.md)

---

## Compilar do código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

Licença MIT. Sem afiliação com a Kick.
