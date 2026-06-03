# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Português](README.pt-BR.md)

Kick.com のチャットをリアルタイムで翻訳するブラウザ拡張機能。
配信を開くと、外国語のメッセージの下に翻訳が出る。それだけ。

**Brave・Chrome・Edge・Firefox** で動く。7TV にも対応。

![日本語チャットの翻訳例](screenshots/japanese-chat.jpg)

翻訳先の言語は自由に選べる。日本語に設定すれば、
すべてのメッセージが日本語で読める。30言語対応。

---

## インストール

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

Kick の配信を開いて、チャット上部に緑のバーが出れば動作してる。

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

- **翻訳先の言語** — 30言語から選択
- **プロバイダー順** — ドラッグで並べ替え、DeepL キーを入力
- **フィルター** — ボットを除外、ユーザー/チャンネルのブロック、言語の制限
- **自動一時停止** — バックグラウンドのタブは翻訳しない（DeepL の枠を節約）

## プライバシー

アカウント不要、解析なし、サーバーなし。メッセージは選んだ翻訳エンジンにしか
送らない。端末内モードならそれすらしない。[詳細](PRIVACY.md)

---

## ソースからビルド

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run build
```

MIT ライセンス。Kick とは無関係。
