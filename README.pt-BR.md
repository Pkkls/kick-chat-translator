# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [日本語](README.ja.md) · [Español](README.es.md)

Traduz o chat da Kick.com em tempo real. Você abre uma live, as mensagens em
outros idiomas aparecem traduzidas logo abaixo. Só isso.

Funciona no **Brave, Chrome, Edge e Firefox**. Compatível com 7TV.

![Chat japonês traduzido para inglês](screenshots/japanese-chat.jpg)

O idioma de destino é configurável. Se botar em português,
tudo aparece em português. 42 idiomas disponíveis.

---

## Instalação

**[➥ Chrome / Brave / Edge — Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)** · **[➥ Firefox — Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

Um clique para instalar, depois abra uma live da Kick — barra verde no topo do chat significa que esta funcionando.

<details>
<summary>Ou instale manualmente (zip / build de desenvolvimento)</summary>

Baixe o zip certo em [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest)
e descompacte.

**Chrome / Brave / Edge** — `…-chromium.zip`:

1. Abra `brave://extensions` (ou `chrome://extensions`, `edge://extensions`)
2. Ative o **Modo do desenvolvedor**
3. **Carregar sem compactação** → selecione a pasta

**Firefox 121+** — `…-firefox.zip`:

1. Abra `about:debugging#/runtime/this-firefox`
2. **Carregar extensão temporária…** → escolha o `manifest.json` da pasta
   *(temporária — o Firefox a remove ao reiniciar, ate estar no Mozilla Add-ons)*

</details>

## Motores de tradução

Quatro provedores em cadeia — se um cai, o próximo assume:

| Provedor | Chave? | Nota |
|---|---|---|
| Google | Não | Padrão, funciona direto |
| DeepL | Sim (grátis) | Melhor qualidade. [Chave grátis](https://www.deepl.com/pro-api) (1M caracteres/mês, R$ 0) |
| MyMemory | Não | Reserva |
| Lingva | Não | Reserva |

No Chrome/Edge tem tradução local também (sem rede, sem limite).
Brave e Firefox ainda não suportam, usam a nuvem.

A ordem se muda nos ajustes.

## Ajustes

Clique na engrenagem da barra, ou clique com botão direito no ícone → Opções.

- **Idioma de destino** — para qual idioma traduzir (42 disponíveis)
- **Ordem dos provedores** — arraste pra reordenar, cole sua chave DeepL
- **Filtros** — pular bots, bloquear usuários/canais, restringir idiomas de origem
- **Pausa automática** — abas em segundo plano não traduzem (economiza cota DeepL)

## Privacidade

Sem conta, sem analytics, sem servidor. As mensagens vão só pro tradutor
que você escolheu. No modo local, nem isso. [Detalhes](PRIVACY.md)

---

## FAQ

**Q: A barra verde desapareceu / a tradução parou de funcionar.**
**A:** Atualize a página. O Kick atualiza sua interface ocasionalmente, o que pode interromper a conexão da extensão com o chat.

**Q: As mensagens não estão sendo traduzidas.**
**A:** Abra as configurações da extensão e verifique se o idioma de destino é diferente do idioma de origem. Confira também se pelo menos um provedor de tradução está ativado na cadeia de provedores.

**Q: Funciona em replays de VOD?**
**A:** Sim, a extensão traduz o chat tanto em transmissões ao vivo quanto em replays de VOD.

**Q: Quais navegadores são suportados?**
**A:** Chrome, Brave, Edge e Firefox são todos suportados.

**Q: Meus dados estão seguros?**
**A:** A extensão não possui sistema de contas e não coleta nenhum dado analítico. As mensagens do chat são enviadas apenas para o provedor de tradução que você selecionou, e para mais nenhum lugar.

**Q: Como obter uma qualidade de tradução melhor?**
**A:** Adicione uma chave de API gratuita do DeepL nas configurações da extensão. O plano gratuito do DeepL permite até 1 milhão de caracteres por mês e supera consistentemente os provedores padrão.

**Q: Algumas mensagens mostram caracteres estranhos ou não são traduzidas.**
**A:** Mensagens muito curtas e mensagens compostas apenas por emotes são ignoradas intencionalmente, pois raramente contêm texto traduzível e desperdiçariam chamadas de API.

**Q: A extensão quebrou após uma atualização do Kick.**
**A:** O Kick às vezes muda a estrutura do seu chat, o que pode quebrar a detecção de mensagens. Por favor, abra uma [issue no GitHub](https://github.com/Pkkls/kick-chat-translator/issues) e ela será corrigida o mais rápido possível.

## Compilar do código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

Licença MIT. Sem afiliação com a Kick.
