# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [日本語](README.ja.md) · [Español](README.es.md)

Tradução em tempo real do chat da Kick.com, tanto em lives quanto em replays de VOD. Você abre uma
transmissão e qualquer mensagem em outro idioma aparece traduzida logo abaixo. Sem nada para configurar.

<img width="354" height="593" alt="image" src="https://github.com/user-attachments/assets/4f7ae414-6c2a-4ee5-b191-6af9e29d46ec" />


Funciona no **Brave, Chrome, Edge e Firefox**, e entende os emotes do 7TV.

![Chat japonês traduzido para inglês](screenshots/japanese-chat.jpg)

**Configuração zero.** O chat recebido é traduzido para o idioma do *seu* navegador. Quando você digita, uma
prévia mostra a sua mensagem no idioma *do canal* (detectado automaticamente a partir da Kick) logo acima da
caixa de chat; clique nela ou pressione **Ctrl/Cmd+Enter** para enviar essa versão. As duas direções funcionam
sozinhas, então você nunca precisa escolher um idioma. (Ainda assim, dá para escolher nas configurações.)

**42 idiomas**, incluindo os de escrita da direita para a esquerda (árabe, hebraico, persa) e variantes
regionais (português do Brasil, chinês tradicional).

---

## Instalação

**[➥ Chrome / Brave / Edge · Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox · Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

Um clique para instalar. Abra qualquer live da Kick: uma barra verde no topo do chat indica que está funcionando.
<img width="347" height="193" alt="image" src="https://github.com/user-attachments/assets/3973b7a0-4767-42a2-974c-7f94b2534595" />

<details>
<summary>Ou instale manualmente (descompactada / build de desenvolvimento)</summary>

Baixe o zip certo em [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) e descompacte.

- **Chrome / Brave / Edge** (`…-chromium.zip`): abra `chrome://extensions`, ative o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta.
- **Firefox 121+** (`…-firefox.zip`): abra `about:debugging#/runtime/this-firefox`, clique em **Carregar extensão temporária…** e selecione o `manifest.json`.

</details>

## Motores de tradução

Quatro provedores em cadeia: se um cai, o próximo assume.

| Provedor | Chave? | Nota |
|---|---|---|
| Google | Não | Padrão, funciona direto |
| DeepL | Sim (grátis) | Melhor qualidade. [Pegue uma chave grátis](https://www.deepl.com/pro-api) (1M de caracteres/mês, R$ 0) |
| MyMemory | Não | Reserva |
| Lingva | Não | Reserva (apenas auto-hospedado: ~2 GB de RAM, não recomendado a menos que você rode sua própria instância) |

No Chrome/Edge também há tradução local: sem rede e sem limite. Brave e Firefox ainda não suportam, então
recorrem à cadeia na nuvem.

A ordem é você quem define nas configurações.

## Configurações

Clique na engrenagem da barra do chat, ou clique com o botão direito no ícone da extensão → Opções.

- **Idioma de destino**: para qual idioma tudo é traduzido (42 disponíveis)
- **Ordem dos provedores**: arraste para reordenar, cole sua chave do DeepL
- **Filtros**: pular bots, bloquear usuários ou canais, restringir os idiomas de origem
- **Pausa automática**: abas em segundo plano param de traduzir (economiza sua cota do DeepL)

## Privacidade

Sem conta, sem analytics, sem nenhum servidor meu. As mensagens vão para o provedor de tradução que você
escolheu e para mais nenhum lugar; e no modo local, nem isso. [Detalhes](PRIVACY.md)

## FAQ

**P: A barra verde desapareceu / a tradução parou de funcionar.**
**R:** Atualize a página. O Kick atualiza sua interface de vez em quando, o que pode interromper a conexão da extensão com o chat.

**P: As mensagens não estão sendo traduzidas.**
**R:** Abra as configurações e verifique se o idioma de destino é diferente do de origem. Confira também se pelo menos um provedor está ativo na cadeia.

**P: Funciona em replays de VOD?**
**R:** Sim, a extensão traduz o chat tanto em transmissões ao vivo quanto em replays de VOD.

**P: Quais navegadores são suportados?**
**R:** Chrome, Brave, Edge e Firefox são todos suportados.

**P: Meus dados estão seguros?**
**R:** Não há sistema de contas nem coleta de dados analíticos. As mensagens do chat são enviadas apenas para o provedor de tradução que você selecionou, e para mais nenhum lugar.

**P: Como consigo uma qualidade de tradução melhor?**
**R:** Adicione uma chave de API gratuita do DeepL nas configurações. O plano gratuito do DeepL cobre até 1 milhão de caracteres por mês e supera consistentemente os provedores padrão.

**P: Algumas mensagens mostram caracteres estranhos ou não são traduzidas.**
**R:** Mensagens muito curtas e mensagens só com emotes são ignoradas de propósito: raramente contêm texto traduzível e desperdiçariam chamadas de API.

**P: A extensão quebrou após uma atualização do Kick.**
**R:** O Kick às vezes muda a estrutura do chat, o que pode quebrar a detecção de mensagens. Abra uma [issue no GitHub](https://github.com/Pkkls/kick-chat-translator/issues) e ela será corrigida o mais rápido possível.

## Idiomas suportados

Inglês · Francês · Espanhol · Português · Português (Brasil) · Alemão · Italiano · Holandês · Polonês · Sueco · Tcheco · Eslovaco · Romeno · Russo · Ucraniano · Turco · Árabe · Hebraico · Japonês · Coreano · Chinês (simplificado) · Chinês (tradicional) · Tailandês · Vietnamita · Indonésio · Hindi · Finlandês · Norueguês · Dinamarquês · Grego · Húngaro · Búlgaro · Catalão · Esloveno · Estoniano · Lituano · Letão · Persa · Bengali · Tâmil · Malaio · Filipino

## Como funciona

1. Um content script observa o DOM do chat da Kick e captura cada mensagem nova.
2. A mensagem é passada para o service worker em segundo plano, que tenta os provedores em ordem até um dar certo.
3. A tradução é injetada de volta no DOM, abaixo da mensagem original.
4. Para as mensagens enviadas, o idioma do canal é detectado automaticamente pela API da Kick e uma prévia aparece acima da caixa de chat.

A extensão nunca intercepta nem modifica as próprias requisições de rede da Kick.

Ela pede `storage` e `alarms`, e acesso de host à kick.com, a cada provedor de tradução que pode chamar (Google, DeepL, MyMemory, as duas instâncias do Lingva) e a `api.github.com`. Esse último é a verificação de atualização: lê a tag da release mais recente, com limite de frequência e cache, e o popup oferece um link quando existe uma versão mais nova. Nada é enviado nessa requisição e nada se atualiza sozinho.

---

## Compilar a partir do código

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build     # saída em dist/
```

Outros comandos: `npm run dev` (HMR), `npm run test`, `npm run lint`,
`npm run pack` (zip para distribuição).

Stack: MV3, Vite, TypeScript, Preact, Tailwind. O content script é distribuído
como um IIFE clássico para uma injeção confiável no Brave.

## Licença

MIT. Sem afiliação com a Kick.

## Projetos relacionados

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), bloqueia os anúncios da Kick
- [kick-core](https://github.com/Pkkls/kick-core), o cliente de gateway em tempo real compartilhado por essas extensões
- [kickbus](https://github.com/Pkkls/kickbus), webhooks oficiais da Kick retransmitidos por SSE para bots locais
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), app Windows que avança o tempo de exibição dos drops
