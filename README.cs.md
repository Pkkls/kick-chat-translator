<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Živý překladač chatu pro Kick. Čtěte chat kteréhokoli streamu ve svém jazyce a odpovídejte v jazyce kanálu.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [中文](README.zh-CN.md)

<img src="screenshots/demo.gif" alt="Španělské zprávy v chatu přicházejí jedna po druhé, každá s anglickým překladem pod sebou; pak se píše anglická odpověď, nad polem chatu se objeví španělský náhled a Tab ho vloží" width="360">

[Podívejte se, jak běží ve skutečném chatu](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## Co dělá

Otevřete stream na Kicku, jehož chat je v jazyce, kterému nerozumíte. Každá zpráva dostane překlad hned pod
sebou, jakmile dorazí, u živých streamů i u záznamů. Napište odpověď a nad polem chatu se objeví náhled
v jazyce kanálu: stiskněte Tab nebo na něj klikněte a tato verze nahradí to, co jste napsali.

Není co nastavovat. Příchozí chat se překládá do jazyka vašeho prohlížeče a to, co napíšete, odchází v jazyce,
ve kterém kanál vysílá, zjištěném přímo z Kicku. Obojí lze změnit v nastavení.

- 43 jazyků, včetně písem psaných zprava doleva (arabština, hebrejština, perština) a regionálních variant
  (brazilská portugalština, tradiční čínština, kantonština)
- Google funguje rovnou, bez klíče a bez účtu. Vlastní bezplatný klíč DeepL pro lepší kvalitu, MyMemory
  a Lingva jako záloha
- Překlad přímo v zařízení v Chromu a Edge, pokud ho prohlížeč nabízí: 22 ms místo 1,6 s a text nikdy
  neopustí váš počítač
- Emoty 7TV, filtry botů a uživatelů, filtr klíčových slov, glosář pro jména, která překladače komolí
- Pozastavte jeden kanál z lišty chatu, aniž byste zastavili ostatní. Při přepnutí kanálu nebo aktualizaci
  rozšíření otevřené karty dál překládají, bez obnovení stránky
- Chrome, Brave, Edge a Firefox

| Chat přeložený za běhu | Vyskakovací okno v liště |
|---|---|
| <img src="screenshots/chat.png" alt="Chat na Kicku, kde každá španělská zpráva má pod sebou anglický překlad, se stavovou lištou rozšíření nad seznamem" width="360"> | <img src="screenshots/popup.png" alt="Vyskakovací okno rozšíření s cílovým jazykem, způsobem zobrazení, seznamem překladačů a počtem dnešních požadavků" width="360"> |

| Co napíšete, ještě než to odešlete | Vyberte jazyk, nebo ho nechte vybrat |
|---|---|
| <img src="screenshots/compose.png" alt="Pole pro psaní s anglickou zprávou a nad ním náhled španělské verze, která se odešle" width="360"> | <img src="screenshots/languages.png" alt="Vyhledávací mřížka vlajek a názvů jazyků, s jazykem kanálu na prvním místě" width="360"> |

<sub>Pořízeno z vydaného buildu v chatovací místnosti, kterou si tento repozitář vytváří: uživatelská jména
a zprávy jsou vymyšlené a překlady se odpovídají lokálně, takže se na tuto stránku nedostane přezdívka žádného
skutečného člověka.</sub>

## Instalace

[Chrome, Brave, Edge: Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox: Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

Otevřete jakýkoli stream na Kicku: zelená lišta nahoře v chatu ukazuje, že rozšíření běží. Kopie z obchodů
se aktualizují samy.

<details>
<summary>Ruční instalace ze zipu vydání</summary>

Stáhněte zip pro svůj prohlížeč z [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) a rozbalte ho.

- Chrome, Brave, Edge (`…-chromium.zip`): otevřete `chrome://extensions`, zapněte Režim pro vývojáře, klikněte na Načíst rozbalené a vyberte složku.
- Firefox 121+ (`…-firefox.zip`): otevřete `about:debugging#/runtime/this-firefox`, klikněte na Načíst dočasný doplněk a vyberte `manifest.json`.

Takto nainstalovaná kopie se sama neaktualizuje. Když existuje novější verze, ukáže její ikona odznak
a vyskakovací okno odkazuje do obchodu.

</details>

## Překladače

Čtyři poskytovatelé v řetězci: když jeden selže, převezme to další. Pořadí určujete vy.

| Poskytovatel | Klíč | Poznámka |
|---|---|---|
| Google | žádný | výchozí, funguje rovnou |
| DeepL | zdarma | nejlepší kvalita, [bezplatný klíč](https://www.deepl.com/pro-api) na 1 milion znaků měsíčně |
| MyMemory | žádný | záloha |
| Lingva | žádný | záloha, na veřejné instanci, pokud ji nenasměrujete na vlastní |

Vestavěný překladač Chromia je rychlejší než všechny. Změřeno na živém kanálu: 22 ms od objevení zprávy
po zobrazení jejího překladu, proti 1618 ms přes cloudový řetězec, bez sítě a bez kvóty. Chrome a Edge
138 a novější ho mohou nabízet, i když ne každá kopie, a každá jazyková dvojice potřebuje jednou stáhnout
model, jedním kliknutím z lišty. Firefox ho nemá. Tam, kde chybí, převezme práci cloudový řetězec a nic se
nerozbije.

## Nastavení

Klikněte na ozubené kolo v liště chatu, nebo klikněte pravým tlačítkem na ikonu rozšíření a zvolte Možnosti.

- Cílový jazyk, a pokud ho zapnete, jazyk čtení zapamatovaný pro každý kanál
- Pořadí poskytovatelů, váš klíč DeepL a režim překladu: nejdřív v zařízení, nejdřív cloud, nebo jen v zařízení
- Zobrazení: pod zprávou (doporučeno), za ní na stejném řádku, místo ní nebo při najetí myší, s volitelným
  původním textem a odznakem zdrojového jazyka
- Tlačítko jazyka v liště akcí chatu: jedno kliknutí přepíná mezi jazykem kanálu a vaší poslední volbou,
  podržení otevře seznam, napsání dvou písmen ho filtruje
- Náhled při psaní: zapnutý nebo vypnutý, jeho cílový jazyk a zda kliknutí vyplní pole chatu, nebo zkopíruje
- Filtry: přeskakovat boty, blokovat uživatele, kanály nebo klíčová slova, omezit zdrojové jazyky
- Glosář: dvojice najít a nahradit, použité na překlady
- Rozpočet: podíl kvóty DeepL, limit rychlosti na kanál, velikost a životnost mezipaměti
- Čitelnost a vzhled: velikost textu, řádkování, písmo, barva zvýraznění, motiv chatu
- Klávesnice: Alt+T zapíná a vypíná překlad chatu, Alt+W náhled při psaní
- Aktivita: přeložené zprávy, zásahy mezipaměti, každý jazyk, který se v chatu objevil, a proč byl každý
  z posledních 50 řádků přeložen nebo ponechán
- Vlastní rozhraní rozšíření v angličtině, španělštině, francouzštině, portugalštině, turečtině, ruštině,
  arabštině, čínštině, japonštině nebo korejštině

## Podporované jazyky

angličtina · francouzština · španělština · portugalština · portugalština (Brazílie) · němčina · italština · nizozemština · polština · švédština · čeština · slovenština · rumunština · ruština · ukrajinština · turečtina · arabština · hebrejština · japonština · korejština · čínština (zjednodušená) · čínština (tradiční) · thajština · vietnamština · indonéština · hindština · finština · norština · dánština · řečtina · maďarština · bulharština · katalánština · slovinština · estonština · litevština · lotyština · perština · bengálština · tamilština · malajština · filipínština · kantonština

## Soukromí

Žádný účet, žádná analytika, žádný můj server. Zprávy z chatu jdou k poskytovateli překladu, kterého jste
zvolili, a nikam jinam, a v režimu v zařízení ani tam. Kopie nainstalovaná z obchodu nedělá žádný další
požadavek. Kopie nainstalovaná ručně se nejvýš jednou za šest hodin zeptá GitHubu na značku posledního
vydání, aby věděla, zda ukázat odznak aktualizace. [Podrobnosti](PRIVACY.md)

## Časté otázky

**Zprávy se nepřekládají.**
Otevřete v nastavení kartu Aktivita a stiskněte „Read decisions“: vypíše posledních 50 řádků a u každého
řekne, proč byl přeložen nebo ponechán. Většina přeskočených řádků je přeskočena záměrně. Během jednoho
živého vysílání bylo 213 z 234 tentýž uživatel, který se opakoval, 9 bylo příliš krátkých, 7 obsahovalo jen
emoji nebo smích a 1 už byl v jazyce čtení. Pokud karta neukazuje vůbec nic, rozšíření chat nevidí:
otevřete prosím issue.

**Zelená lišta zmizela.**
Obnovte stránku. Pokud se to stane znovu, otevřete [issue](https://github.com/Pkkls/kick-chat-translator/issues)
s kanálem a tím, co jste předtím dělali.

**Jak získat lepší překlady?**
Přidejte v nastavení bezplatný klíč DeepL. Bezplatný tarif pokrývá milion znaků měsíčně a DeepL se
používá jen u jazykových dvojic, kde překoná bezplatné překladače.

**Jaký styl zobrazení zvolit?**
Pod zprávou. Ostatní tři fungují a ještě se dolaďují.

**Funguje to i u záznamů?**
Ano, stejně jako u živých streamů.

**Po aktualizaci Kicku to přestalo fungovat.**
Kick občas mění, jak je jeho chat postavený. Otevřete [issue](https://github.com/Pkkls/kick-chat-translator/issues)
a bude to opraveno.

**Vytváří to Kick?**
Ne. Je to nezávislý open source projekt, bez vazby na Kick.

## Novinky

### 3.0.2

Tlačítko pauzy na liště chatu nyní pozastaví jen kanál, který právě sledujete. Dříve vypnulo překlad na všech kanálech a ve všech kartách, dokud jste ho znovu nezapnuli ve vyskakovacím okně.

Když je kanál v aktuální kartě pozastavený, vyskakovací okno to oznámí a nabídne tlačítko Pokračovat.

Karta Kick, která byla otevřená během instalace nebo aktualizace rozšíření, dál překládá. Dříve se zastavila, dokud jste stránku znovu nenačetli.

Po přepnutí na jiný kanál bez opětovného načtení se překlad zastavil, dokud jste stránku neobnovili. Nyní sleduje chat, který máte před sebou.

Dokud nic nepřeložíte, vyskakovací okno otevřené mimo Kick vás vyzve k otevření kanálu a nabídne tlačítko, které to udělá.

Texty v chatu, na liště, ve vyskakovacím okně a v nastavení mají znovu diakritiku ve francouzštině, španělštině, portugalštině a turečtině.

Každé vydání, s tím, co se změnilo, a s měřením za tím:
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) a [CHANGELOG.md](CHANGELOG.md).

## Vývoj

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, unit tests, build: the gate every package goes through
npm run build:firefox    # Firefox build, same dist/ folder
npm run package:all      # both zips, in release/
npm run dev              # HMR
```

Buildy jsou reprodukovatelné: stejný commit dá na jakémkoli stroji bajtově shodné zipy, což se ověřuje
sestavením `git archive` značky v prázdné složce a porovnáním hashů.

Kromě jednotkových testů načítá 41 offline bran sestavené rozšíření do skutečného prohlížeče, ovládá ho
a ověřuje, co dělá, se stránkou servírovanou lokálně a překladačem odpovídajícím lokálně. Potřebují
Playwright, který záměrně není závislostí: nastavte `UX_KIT` na složku, jejíž `node_modules` ho obsahuje,
nebo spusťte `npm i -D playwright`.

```bash
node test/e2e/run-gates.mjs --headless                  # all 41, no window
node test/e2e/store-shots-fixture.mjs --lang=ja         # the store screenshots, in one listing language
node test/e2e/store-shots-fixture.mjs --gif             # English store screenshots, the README images and this GIF
```

Technologie: Manifest V3, Vite, TypeScript, Preact, Tailwind. Texty pro obchody jsou v [store/](store/)
a vydání je značka verze: CI ho sestaví, zkontroluje a zveřejní v obou obchodech.

## Související projekty

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), blokuje reklamy Kicku před videem i přes něj
- [kick-core](https://github.com/Pkkls/kick-core), klient realtime brány sdílený těmito rozšířeními
- [kickbus](https://github.com/Pkkls/kickbus), oficiální webhooky Kicku předávané lokálním botům přes SSE
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), aplikace pro Windows, která sbírá čas sledování pro dropy na Kicku

## Licence

MIT. Bez vazby na Kick.
