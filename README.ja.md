# Kick Chat Translator

[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🌐 言語:** [English](README.md) · 日本語 · [Español](README.es.md) · [Português (BR)](README.pt-BR.md)

> Kick.com のチャットを、あなたの言語でリアルタイムに。無料・オープンソース・プライバシー重視。

**Brave・Chrome・Edge** で動くブラウザ拡張機能です。配信を開くだけで、外国語の
メッセージの下に翻訳が表示されます。翻訳先の言語は自由に選べます。

🎬 **概要（ビジュアル）:** [`presentation.html`](presentation.html)（英語／日本語）·
🆕 **使い方ガイド:** [TUTORIAL.md](TUTORIAL.md)

## 翻訳の例（→ 日本語）

| チャット | 翻訳 |
|---|---|
| 🇬🇧 where is he from? | 彼はどこ出身？ |
| 🇪🇸 ¿alguien sabe cuándo empieza? | 誰か開始時刻わかる？ |
| 🇧🇷 que jogada absurda mano | とんでもないプレイだな |
| 🇸🇦 كيف حالك؟ | 元気ですか？ |

原文はそのまま残り、その下に言語タグ付きで翻訳が表示されます。

## 特長

- ⚡ **リアルタイム** — 各メッセージの下に表示。
- 🌍 **どんな言語にも、どの方向にも** — 翻訳先を選べます（English・日本語・Español・Português…）。日本のユーザーはすべて日本語で読めます。
- 🔁 **複数エンジン＋自動切替** — DeepL・Google・MyMemory・Lingva。翻訳が止まりません。
- 🖥️ **Chrome／Edge では端末内翻訳** — 無料・無制限・オフライン（Brave では自動でクラウドに切替）。
- 🧩 **7TV 対応** — 7TV の有無にかかわらず正しく読み取ります。
- 🔒 **プライバシー重視** — アカウント不要・追跡なし・サーバーなし。

## 2分でインストール（ビルド不要・コマンド不要）

1. [Releases ページ][releases] から `kick-chat-translator-…-chromium.zip` を**ダウンロード**。
2. **展開**すると、`manifest.json` が入ったフォルダができます。
3. `brave://extensions`・`chrome://extensions`・`edge://extensions` を開く。
4. **デベロッパーモード**をオン（右上）。
5. **「パッケージ化されていない拡張機能を読み込む」**で、**展開したフォルダ**を選択。
6. Kick の配信を開くと、チャット上部に緑色のバーが表示されます。✅

## 言語の選び方

チャットバーの **⚙**（またはツールバーのアイコン → 設定）→ **表示 → 翻訳先の言語**。
日本語をはじめ30言語に対応。選んだ言語にすべて翻訳されます。

## さらに高品質に（任意）: 無料の DeepL キー

初期状態でも Google・MyMemory（キー不要）で動作します。より自然な翻訳には、**無料**の
DeepL キー（0円・月100万文字）を追加してください。

1. <https://www.deepl.com/pro-api> で **DeepL API Free** に登録。
2. キー（末尾が `:fx`）をコピー。
3. **設定 → プロバイダー**でキーを貼り付け、**プラン = Free** にして **DeepL** を一番上へ。

## プライバシー

アカウント・解析・独自サーバーは一切ありません。メッセージは選んだ翻訳エンジンにのみ、
翻訳のためだけに送信されます。端末内モードでは外部に一切送信しません。詳細は
[PRIVACY.md](PRIVACY.md) を参照してください。

## 開発者向け

ソースからのビルド方法やアーキテクチャは、英語版の [README.md](README.md) を参照して
ください。

```bash
npm ci && npm run build   # → dist/
```

## ライセンス

[MIT](LICENSE) · 本プロジェクトは Kick とは無関係です。「Kick」「7TV」は各権利者に帰属します。

[releases]: https://github.com/Pkkls/kick-chat-translator/releases/latest
