<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Um tradutor de chat em tempo real para a Kick. Leia o chat de qualquer live no seu idioma e responda na língua do canal.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Usuários do Chrome](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=usu%C3%A1rios&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [中文](README.zh-CN.md) · [Čeština](README.cs.md)

<img src="screenshots/demo.gif" alt="Mensagens de chat em espanhol chegam uma a uma, cada uma com a tradução em inglês logo abaixo; depois uma resposta em inglês é digitada, uma prévia em espanhol aparece acima da caixa de chat e o Tab a coloca no lugar" width="360">

[Veja funcionando em um chat de verdade](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## O que faz

Abra uma live da Kick em que o chat está num idioma que você não lê. Cada mensagem ganha a tradução logo
abaixo, à medida que chega, em lives e em replays de VOD. Digite uma resposta e uma prévia a mostra no idioma
do canal acima da caixa de chat: aperte Tab ou clique nela, e essa versão substitui o que você digitou.

Não há nada para configurar. O chat que chega vai para o idioma do seu navegador, e o que você escreve sai no
idioma em que o canal transmite, lido da própria Kick. Os dois podem ser trocados nas configurações.

- 43 idiomas, incluindo os escritos da direita para a esquerda (árabe, hebraico, persa) e variantes regionais
  (português do Brasil, chinês tradicional, cantonês)
- Google de fábrica, sem chave e sem conta. Sua própria chave gratuita do DeepL para mais qualidade,
  MyMemory e Lingva como reserva
- Tradução no próprio dispositivo no Chrome e no Edge quando o navegador oferece: 22 ms em vez de 1,6 s, e o
  texto nunca sai da sua máquina
- Emotes do 7TV, filtros de bots e de usuários, filtro de palavras-chave, um glossário para os nomes que os
  motores estragam
- Pause um canal pela barra do chat sem parar os outros. Ao trocar de canal ou atualizar a extensão,
  as abas abertas continuam traduzindo, sem recarregar
- Chrome, Brave, Edge e Firefox

| O chat, traduzido enquanto rola | A janela da barra de ferramentas |
|---|---|
| <img src="screenshots/chat.png" alt="Chat da Kick em que cada mensagem em espanhol traz a tradução em inglês logo abaixo, com a barra de status da extensão acima da lista" width="360"> | <img src="screenshots/popup.png" alt="A janela da extensão com o idioma de destino, o modo de exibição, a lista de provedores e as requisições do dia" width="360"> |

| O que você digita, antes de enviar | Escolha um idioma, ou deixe que ela escolha |
|---|---|
| <img src="screenshots/compose.png" alt="A caixa de chat com uma mensagem em inglês e, acima, uma prévia com a versão em espanhol que será enviada" width="360"> | <img src="screenshots/languages.png" alt="Uma grade pesquisável de bandeiras e nomes de idiomas, com o idioma do canal primeiro" width="360"> |

<sub>Capturas da versão publicada numa sala de chat que este repositório inventa: os nomes e as mensagens são
fictícios e as traduções são respondidas localmente, então nenhum usuário real aparece aqui.</sub>

## Instalação

[Chrome, Brave, Edge: Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox: Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

Abra qualquer live da Kick: a barra verde no topo do chat indica que está funcionando. As cópias das lojas se
atualizam sozinhas.

<details>
<summary>Instalação manual, a partir de um zip de release</summary>

Baixe o zip do seu navegador em [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) e descompacte.

- Chrome, Brave, Edge (`…-chromium.zip`): abra `chrome://extensions`, ative o Modo do desenvolvedor, clique em Carregar sem compactação e escolha a pasta.
- Firefox 121+ (`…-firefox.zip`): abra `about:debugging#/runtime/this-firefox`, clique em Carregar extensão temporária e escolha `manifest.json`.

Uma cópia instalada assim não se atualiza sozinha. O ícone dela mostra um selo quando existe uma versão nova,
e a janela leva à loja.

</details>

## Motores de tradução

Quatro provedores encadeados: quando um falha, o próximo assume. A ordem é você quem define.

| Provedor | Chave | Observação |
|---|---|---|
| Google | nenhuma | o padrão, funciona de fábrica |
| DeepL | gratuita | a melhor qualidade, [chave gratuita](https://www.deepl.com/pro-api) para 1 milhão de caracteres por mês |
| MyMemory | nenhuma | reserva |
| Lingva | nenhuma | reserva, numa instância pública a menos que você aponte para a sua |

O tradutor embutido do Chromium é mais rápido que todos eles. Medido num canal ao vivo: 22 ms entre uma
mensagem aparecer e a tradução estar na tela, contra 1618 ms pela cadeia na nuvem, sem rede e sem cota. O
Chrome e o Edge 138 ou mais recentes podem oferecê-lo, embora nem toda cópia ofereça, e cada par de idiomas
precisa baixar o modelo uma vez, com um clique na barra. O Firefox não tem. Onde ele falta, a cadeia na nuvem
assume e nada quebra.

## Configurações

Clique na engrenagem da barra do chat, ou clique com o botão direito no ícone da extensão e escolha Opções.

- Idioma de destino, e um idioma de leitura lembrado por canal se você ativar
- Ordem dos provedores, sua chave do DeepL e o modo do motor: dispositivo primeiro, nuvem primeiro, ou só
  dispositivo
- Exibição: abaixo da mensagem (recomendada), na mesma linha depois dela, no lugar dela ou ao passar o mouse,
  com o texto original e o selo do idioma de origem opcionais
- O botão de idioma na barra de ações do chat: um clique alterna entre o idioma do canal e a sua última
  escolha, segurar abre a lista, digitar duas letras filtra
- Prévia de escrita: ligada ou não, o idioma de destino dela, e se o clique preenche a caixa de chat ou copia
- Filtros: pular bots, bloquear usuários, canais ou palavras-chave, restringir os idiomas de origem
- Glossário: pares de localizar e substituir aplicados às traduções
- Orçamento: parte da cota do DeepL, limite por canal, tamanho e duração do cache
- Legibilidade e aparência: tamanho do texto, espaçamento entre linhas, fonte, cor de destaque, tema do chat
- Teclado: Alt+T liga ou desliga a tradução do chat, Alt+W a prévia de escrita
- Atividade: mensagens traduzidas, acertos do cache, cada idioma visto no chat, e por que cada uma das últimas
  50 linhas foi traduzida ou não
- A interface da própria extensão em inglês, espanhol, francês, português, turco, russo, árabe, chinês,
  japonês ou coreano

## Idiomas

Inglês · Francês · Espanhol · Português · Português (Brasil) · Alemão · Italiano · Holandês · Polonês · Sueco · Tcheco · Eslovaco · Romeno · Russo · Ucraniano · Turco · Árabe · Hebraico · Japonês · Coreano · Chinês (simplificado) · Chinês (tradicional) · Tailandês · Vietnamita · Indonésio · Hindi · Finlandês · Norueguês · Dinamarquês · Grego · Húngaro · Búlgaro · Catalão · Esloveno · Estoniano · Lituano · Letão · Persa · Bengali · Tâmil · Malaio · Filipino · Cantonês

## Privacidade

Sem conta, sem analytics, sem servidor próprio. As mensagens do chat vão para o provedor de tradução que você
escolheu e para nenhum outro lugar, e no modo dispositivo nem para ele. Uma cópia instalada de uma loja não faz
nenhuma outra requisição. Uma cópia instalada à mão pergunta ao GitHub a última tag de release, no máximo a
cada seis horas, para saber se mostra o selo de atualização. [Detalhes](PRIVACY.md)

## Perguntas frequentes

**As mensagens não são traduzidas.**
Abra a aba Atividade nas configurações e aperte "Ler decisões": ela lista as últimas 50 linhas e diz por que
cada uma foi traduzida ou não. A maioria das linhas puladas é pulada de propósito. Numa sessão ao vivo, 213
de 234 eram o mesmo usuário se repetindo, 9 eram curtas demais, 7 eram só emoji ou risada, e 1 já estava no
idioma de leitura. Se a aba não mostra nada, a extensão não está vendo o chat: abra uma issue.

**A barra verde sumiu.**
Recarregue a página. Se acontecer de novo, abra uma [issue](https://github.com/Pkkls/kick-chat-translator/issues)
com o canal e o que você fez antes.

**Como consigo traduções melhores?**
Adicione uma chave gratuita do DeepL nas configurações. O plano gratuito cobre um milhão de caracteres por mês,
e o DeepL só é gasto nos pares de idiomas em que supera os motores gratuitos.

**Qual estilo de exibição devo usar?**
Abaixo da mensagem. Os outros três funcionam e ainda estão sendo ajustados.

**Funciona em replays de VOD?**
Sim, do mesmo jeito que ao vivo.

**Parou de funcionar depois de uma atualização da Kick.**
A Kick às vezes muda a estrutura do chat. Abra uma [issue](https://github.com/Pkkls/kick-chat-translator/issues)
e ela é corrigida.

**É feita pela Kick?**
Não. É um projeto independente de código aberto, sem vínculo com a Kick.

## Novidades

Cada versão, com o que mudou e a medição por trás:
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) e [CHANGELOG.md](CHANGELOG.md).

## Desenvolvimento

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, testes unitários, build: o controle por onde passa cada pacote
npm run build:firefox    # build do Firefox, na mesma pasta dist/
npm run package:all      # os dois zips, em release/
npm run dev              # HMR
```

Os builds são reproduzíveis: o mesmo commit gera zips idênticos byte a byte em qualquer máquina, verificado
construindo um `git archive` da tag numa pasta vazia e comparando os hashes.

Além dos testes unitários, 41 testes sem rede carregam a extensão construída num navegador real, operam a
extensão e verificam o que ela faz, com a página e o motor de tradução servidos localmente. Eles precisam do
Playwright, que de propósito não é uma dependência: aponte `UX_KIT` para uma pasta cujo `node_modules` o
contenha, ou rode `npm i -D playwright`.

```bash
node test/e2e/run-gates.mjs --headless                  # os 41, sem janela
node test/e2e/store-shots-fixture.mjs --lang=pt-BR      # as capturas da loja, num idioma da página
node test/e2e/store-shots-fixture.mjs --gif             # capturas em inglês, as imagens do README e este GIF
```

Stack: Manifest V3, Vite, TypeScript, Preact, Tailwind. Os textos das lojas ficam em [store/](store/), e uma
release é uma tag de versão: a CI a constrói, verifica e publica nas duas lojas.

## Projetos relacionados

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), bloqueia os anúncios pre-roll e sobrepostos da Kick
- [kick-core](https://github.com/Pkkls/kick-core), o cliente do gateway em tempo real compartilhado por estas extensões
- [kickbus](https://github.com/Pkkls/kickbus), webhooks oficiais da Kick repassados a bots locais por SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), app de Windows que avança o tempo assistido dos drops da Kick

## Licença

MIT. Sem vínculo com a Kick.
