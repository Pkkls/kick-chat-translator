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

## Novidades da [2.7.0](https://github.com/Pkkls/kick-chat-translator/releases/latest)

**Mudar o idioma de leitura agora muda o que já está na tela.** Antes só afetava as mensagens que
chegavam depois, então tudo o que já estava visível mantinha o idioma anterior até você recarregar a
página. O mesmo valia para o estilo de exibição e os selos.

**Uma mensagem esticada ganha uma segunda chance.** No chat se escreve `muuuuy biennnn` e
`BINNNNNGOOOOO`, e os serviços de tradução devolvem isso do jeito que veio, sem traduzir. Quando isso
acontece, a linha é tentada mais uma vez com o texto compactado, que devolve `muy bien` e `BINGO`. Só
depois de uma recusa, nunca antes: os serviços já dão conta de alguns alongamentos, e compactar tudo de
saída piorava esses casos.

**Sua chave da DeepL fica na máquina onde você a digitou.** Antes ela sincronizava para todos os Chrome
conectados à sua conta. Uma chave existente se muda sozinha.

Além disso: a prévia de redação parou de dizer ao motor em que idioma você escreveu a menos que tenha
certeza, a extensão não fica mais muda numa página quando o navegador demorou a acordar seu worker, e
cada página da Kick carrega 15% menos script. Lista completa em [CHANGELOG.md](CHANGELOG.md).

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
| Lingva | Não | Reserva. Usa uma instância pública já de saída; aponte para a sua nos ajustes se preferir |

A ordem é você quem define nas configurações.

### Tradução no dispositivo

O tradutor embutido do Chromium, onde está disponível, é de longe o caminho mais rápido. Medido em um
canal ao vivo: **22 ms** desde a mensagem aparecer até a tradução estar na tela, contra **1618 ms** pela
cadeia na nuvem. Sem rede, sem limite, e o texto nunca sai da sua máquina.

Duas coisas condicionam isso, e vale conhecer as duas antes de contar com ela.

A API precisa existir. O Firefox não a traz. Chrome e Edge 138+ deveriam, mas não é garantido: na mesma
máquina, um Chrome 151 a expunha e outro não. Se o seu não tiver, tudo recai na cadeia na nuvem acima e
nada quebra.

E o modelo do seu par de idiomas precisa estar baixado, uma vez, com um clique na barra. Até lá esse par
também vai para a nuvem, mesmo que os pares já baixados continuem locais.

## Configurações

Clique na engrenagem da barra do chat, ou clique com o botão direito no ícone da extensão → Opções.

- **Idioma de destino**: para qual idioma tudo é traduzido (42 disponíveis)
- **Ordem dos provedores**: arraste para reordenar, cole sua chave do DeepL
- **Modo do motor**: dispositivo primeiro, nuvem primeiro, ou apenas no dispositivo
- **Exibição**: a tradução abaixo da mensagem, na mesma linha, depois dela em itálico menor, ou ao passar o mouse; o texto original, o idioma de origem e o provedor são selos opcionais. Uma linha de exemplo nos ajustes mostra cada estilo antes de você escolher
- **Botão de idioma**: um chip dentro da caixa de mensagem do Kick, ao lado do ícone de emotes. Um clique alterna entre o idioma do canal e sua última escolha, manter pressionado abre a lista e digitar duas letras filtra. Fica ali para que mudar o idioma em que você escreve nunca exija subir ao topo do chat
- **Prévia ao escrever**: ligada ou desligada, seu idioma de destino, e se clicar preenche a caixa de chat ou copia a tradução para a área de transferência
- **Filtros**: pular bots, bloquear usuários ou canais, restringir os idiomas de origem, ou permitir apenas certos canais
- **Glossário**: pares de localizar e substituir aplicados à tradução, para nomes e piadas internas que os motores destroem
- **Orçamento**: cota do DeepL e roteamento inteligente, limite de frequência por canal, tamanho e duração do cache, concorrência
- **Pausa automática**: abas em segundo plano param de traduzir (economiza sua cota do DeepL)
- **Idioma da interface** da própria extensão, em inglês, espanhol, francês, português, turco, russo, árabe, chinês, japonês ou coreano, além de botões para limpar o cache ou redefinir estatísticas e ajustes
- **Depuração**: as últimas decisões do tradutor e por que uma linha foi deixada de lado, mantidas apenas em memória

## Privacidade

Sem conta, sem analytics, sem nenhum servidor meu. As mensagens vão para o provedor de tradução que você
escolheu e para mais nenhum lugar; e no modo local, nem isso. [Detalhes](PRIVACY.md)

## FAQ

**P: A barra verde desapareceu / a tradução parou de funcionar.**
**R:** A 2.6.0 corrigiu a causa disso: a Kick deixa na página uma segunda cópia oculta do painel de chat, e a barra estava sendo montada nessa cópia, invisível desde o início. Atualize primeiro. Se ainda acontecer na 2.6.0 ou posterior, recarregue a página e abra uma issue, porque aí seria um problema novo.

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
