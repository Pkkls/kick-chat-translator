# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Kick.com のチャットをリアルタイムで翻訳します。ライブ配信でも VOD のアーカイブでも同じように動作します。
配信を開くと、外国語のメッセージの下に翻訳が表示されます。設定は不要です。

<img width="354" height="593" alt="image" src="https://github.com/user-attachments/assets/4f7ae414-6c2a-4ee5-b191-6af9e29d46ec" />


**Brave・Chrome・Edge・Firefox** で動作し、7TV のエモートにも対応しています。

![日本語チャットの翻訳例](screenshots/japanese-chat.jpg)

**設定ゼロ。** 受信したチャットは*あなたのブラウザの*言語に翻訳されます。入力すると、あなたのメッセージを
*配信チャンネルの*言語（Kick から自動判定）に直したプレビューがチャット欄の上に表示されます。それをクリック
するか **Ctrl/Cmd+Enter** を押すと、その訳文を送信できます。どちらの方向も自動なので、言語を選ぶ必要は
ありません。（もちろん設定で選ぶこともできます。）

**42言語**に対応。右から左に書く言語（アラビア語・ヘブライ語・ペルシア語）や、地域変種
（ブラジルポルトガル語・繁体字中国語）も含みます。

---

## インストール

**[➥ Chrome / Brave / Edge · Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)**
&nbsp;·&nbsp;
**[➥ Firefox · Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

ワンクリックでインストール。Kick の配信を開いて、チャット上部に緑のバーが出れば動作中です。
<img width="347" height="193" alt="image" src="https://github.com/user-attachments/assets/3973b7a0-4767-42a2-974c-7f94b2534595" />

<details>
<summary>手動でインストールする（展開済み / 開発ビルド）</summary>

[Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) から対応する zip をダウンロードして展開します。

- **Chrome / Brave / Edge**（`…-chromium.zip`）：`chrome://extensions` を開き、**デベロッパーモード**をオンにして、**パッケージ化されていない拡張機能を読み込む** からフォルダを選択します。
- **Firefox 121以上**（`…-firefox.zip`）：`about:debugging#/runtime/this-firefox` を開き、**一時的なアドオンを読み込む…** から `manifest.json` を選択します。

</details>

## 翻訳エンジン

4つのプロバイダーをチェーンで使います。1つが落ちたら次が引き継ぎます。

| プロバイダー | キー | 備考 |
|---|---|---|
| Google | 不要 | デフォルト、そのまま動く |
| DeepL | 必要（無料） | 品質最高。[無料キーを取得](https://www.deepl.com/pro-api)（月100万文字、0円） |
| MyMemory | 不要 | フォールバック |
| Lingva | 不要 | フォールバック（自己ホストのみ。約2GBのRAMが必要で、自前のインスタンスを運用する場合以外は非推奨） |

Chrome/Edge では端末内翻訳も使えます（通信なし・上限なし）。Brave と Firefox はまだ未対応なので、
クラウドのチェーンにフォールバックします。

順番は設定で自由に変更できます。

## 設定

チャットバーの歯車、または拡張機能アイコンを右クリック → オプション。

- **翻訳先の言語**：すべてを何語に翻訳するか（42言語から選択）
- **プロバイダー順**：ドラッグで並べ替え、DeepL キーを貼り付け
- **フィルター**：ボットを除外、ユーザー/チャンネルのブロック、翻訳元の言語を制限
- **自動一時停止**：バックグラウンドのタブは翻訳しない（DeepL の枠を節約）

## プライバシー

アカウント不要、解析なし、こちらのサーバーもなし。メッセージは選んだ翻訳プロバイダーにしか送られず、
それ以外には一切送りません。端末内モードならそれすらしません。[詳細](PRIVACY.md)

## FAQ

**Q：緑のバーが消えた / 翻訳が止まった。**
**A：** ページを更新してください。Kick がインターフェースを更新することがあり、その際に拡張機能とチャットの接続が切れる場合があります。

**Q：メッセージが翻訳されない。**
**A：** 設定を開き、翻訳先の言語が翻訳元と異なることを確認してください。また、チェーン内で少なくとも1つのプロバイダーが有効になっているかも確認してください。

**Q：VOD の録画再生でも動作しますか？**
**A：** はい、ライブ配信と VOD 再生の両方でチャットを翻訳します。

**Q：対応ブラウザは？**
**A：** Chrome、Brave、Edge、Firefox に対応しています。

**Q：データは安全ですか？**
**A：** アカウント機能はなく、分析データの収集もありません。チャットメッセージは選択した翻訳プロバイダーにのみ送信され、それ以外には送られません。

**Q：翻訳の精度を上げるには？**
**A：** 設定で無料の DeepL API キーを追加してください。DeepL の無料枠は月100万文字まで使え、デフォルトのプロバイダーより一貫して高品質です。

**Q：一部のメッセージに文字化けや未翻訳がある。**
**A：** 非常に短いメッセージやエモートだけのメッセージは意図的にスキップしています。翻訳できるテキストを含むことが少なく、API の無駄遣いになるためです。

**Q：Kick のアップデート後に拡張機能が動かなくなった。**
**A：** Kick がチャットの構造を変更することがあり、メッセージの検出が壊れる場合があります。[GitHub に Issue](https://github.com/Pkkls/kick-chat-translator/issues) を立てていただければ、できる限り早く修正します。

## 対応言語

英語 · フランス語 · スペイン語 · ポルトガル語 · ポルトガル語（ブラジル） · ドイツ語 · イタリア語 · オランダ語 · ポーランド語 · スウェーデン語 · チェコ語 · スロバキア語 · ルーマニア語 · ロシア語 · ウクライナ語 · トルコ語 · アラビア語 · ヘブライ語 · 日本語 · 韓国語 · 中国語（簡体字） · 中国語（繁体字） · タイ語 · ベトナム語 · インドネシア語 · ヒンディー語 · フィンランド語 · ノルウェー語 · デンマーク語 · ギリシャ語 · ハンガリー語 · ブルガリア語 · カタルーニャ語 · スロベニア語 · エストニア語 · リトアニア語 · ラトビア語 · ペルシア語 · ベンガル語 · タミル語 · マレー語 · フィリピン語

## 仕組み

1. content script が Kick のチャット DOM を監視し、新しいメッセージを捕捉します。
2. メッセージはバックグラウンドの service worker に渡され、いずれかが成功するまでプロバイダーを順番に試します。
3. 翻訳結果が元のメッセージの下に DOM へ挿入されます。
4. 送信メッセージについては、Kick の API を通じてチャンネルの言語を自動判定し、チャット入力欄の上にプレビューを表示します。

拡張機能は Kick 自身のネットワークリクエストには一切手を加えません。必要なのは kick.com に対する `storage` と `host` 権限だけです。

---

## ソースからビルド

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build     # 出力は dist/
```

その他のコマンド：`npm run dev`（HMR）、`npm run test`、`npm run lint`、
`npm run pack`（配布用 zip）。

スタック：MV3、Vite、TypeScript、Preact、Tailwind。content script は
Brave で確実に注入できるよう、クラシックな IIFE として配布されます。

## ライセンス

MIT。Kick とは無関係です。
