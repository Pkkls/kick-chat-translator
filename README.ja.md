# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Pkkls/kick-chat-translator?style=flat&color=53fc18)](https://github.com/Pkkls/kick-chat-translator/stargazers)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome Users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

[English](README.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Kick.com のチャットをリアルタイムで翻訳するブラウザ拡張機能。
配信を開くと、外国語のメッセージの下に翻訳が出る。それだけ。

**Brave・Chrome・Edge・Firefox** で動く。7TV にも対応。

![日本語チャットの翻訳例](screenshots/japanese-chat.jpg)

翻訳先の言語は自由に選べる。日本語に設定すれば、
すべてのメッセージが日本語で読める。42言語対応。

---

## インストール

**[➥ Chrome / Brave / Edge — Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)** · **[➥ Firefox — Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)**

ワンクリックでインストール後、Kick の配信を開くだけ。チャット上部に緑のバーが出れば動作してる。

<details>
<summary>手動インストール（zip / 開発ビルド）</summary>

[Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest)
から対応する zip をダウンロードして展開。

**Chrome / Brave / Edge** — `…-chromium.zip`：

1. `brave://extensions`（または `chrome://extensions`、`edge://extensions`）を開く
2. **デベロッパーモード**をオン
3. **パッケージ化されていない拡張機能を読み込む** → 展開したフォルダを選択

**Firefox 121以上** — `…-firefox.zip`：

1. `about:debugging#/runtime/this-firefox` を開く
2. **「一時的なアドオンを読み込む」** → フォルダ内の `manifest.json` を選択
   *（一時的な読み込み。Firefox を再起動すると消える。AMO 公開までの暫定。）*

</details>

## 翻訳エンジン

4つのプロバイダーをチェーンで使う。1つが落ちたら次が引き継ぐ：

| プロバイダー | キー | 備考 |
|---|---|---|
| Google | 不要 | デフォルト、そのまま動く |
| DeepL | 必要（無料） | 品質最高。[無料キーを取得](https://www.deepl.com/pro-api)（月100万文字、0円） |
| MyMemory | 不要 | フォールバック |
| Lingva | 不要 | フォールバック |

Chrome/Edge では端末内翻訳も使える（通信なし・無制限）。
Brave・Firefox は未対応なので、自動的にクラウドを使う。

順番は設定で変更できる。

## 設定

チャットバーの歯車、または拡張機能アイコンを右クリック → オプション。

- **翻訳先の言語** — 42言語から選択
- **プロバイダー順** — ドラッグで並べ替え、DeepL キーを入力
- **フィルター** — ボットを除外、ユーザー/チャンネルのブロック、言語の制限
- **自動一時停止** — バックグラウンドのタブは翻訳しない（DeepL の枠を節約）

## プライバシー

アカウント不要、解析なし、サーバーなし。メッセージは選んだ翻訳エンジンにしか
送らない。端末内モードならそれすらしない。[詳細](PRIVACY.md)

---

## FAQ

**Q：緑のバーが消えた / 翻訳が止まった。**
**A：** ページを更新してください。Kickがインターフェースを更新することがあり、その際に拡張機能のチャットへの接続が切れることがあります。

**Q：メッセージが翻訳されない。**
**A：** 拡張機能の設定を開き、翻訳先の言語が翻訳元と異なることを確認してください。また、プロバイダーチェーンで少なくとも1つの翻訳プロバイダーが有効になっているかも確認してください。

**Q：VODの録画再生でも動作しますか？**
**A：** はい、ライブ配信とVOD再生の両方でチャットを翻訳できます。

**Q：対応ブラウザは？**
**A：** Chrome、Brave、Edge、Firefoxに対応しています。

**Q：データは安全ですか？**
**A：** この拡張機能にはアカウント機能がなく、分析データの収集も行いません。チャットメッセージは選択した翻訳プロバイダーにのみ送信され、それ以外には送られません。

**Q：翻訳の精度を上げるには？**
**A：** 拡張機能の設定で無料のDeepL APIキーを追加してください。DeepLの無料枠は月100万文字まで利用でき、デフォルトのプロバイダーより一貫して高品質な翻訳を提供します。

**Q：一部のメッセージに文字化けや未翻訳がある。**
**A：** 非常に短いメッセージやエモートのみのメッセージは意図的にスキップされます。翻訳可能なテキストが含まれることが少なく、APIの無駄遣いになるためです。

**Q：Kickのアップデート後に拡張機能が動かなくなった。**
**A：** Kickがチャットの構造を変更することがあり、メッセージの検出が壊れる場合があります。[GitHubにIssue](https://github.com/Pkkls/kick-chat-translator/issues)を立てていただければ、できる限り早くパッチを当てます。

## ソースからビルド

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

MIT ライセンス。Kick とは無関係。
