<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Kick 的实时聊天翻译器。用你自己的语言阅读任何直播的聊天，并用频道的语言回复。

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Čeština](README.cs.md)

<img src="screenshots/demo.gif" alt="西班牙语聊天消息逐条到达，每条下方都有英文译文；随后输入一条英文回复，聊天框上方出现西班牙语预览，按 Tab 即替换进去" width="360">

[观看它在真实聊天中运行](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## 它能做什么

打开一个聊天语言你看不懂的 Kick 直播。每条消息一到达，译文就显示在它的正下方，直播和回放都一样。
输入回复时，聊天框上方会出现频道语言的预览：按 Tab 或点击它，输入的内容就会被这个版本替换。

无需任何设置。收到的聊天会翻译成你浏览器的语言，你写的内容会以频道的直播语言发出，这个语言直接从 Kick
读取。两者都可以在设置中更改。

- 43 种语言，包括从右到左书写的文字（阿拉伯语、希伯来语、波斯语）和地区变体（巴西葡萄牙语、繁体中文、
  粤语）
- Google 开箱即用，无需密钥和账号。添加你自己的免费 DeepL 密钥可获得更好的质量，MyMemory 和 Lingva
  作为备用
- 在浏览器提供时，Chrome 和 Edge 中可进行设备端翻译：22 毫秒而不是 1.6 秒，文本也不会离开你的电脑
- 7TV 表情、机器人和用户过滤、关键词过滤，以及一份用于翻译引擎会弄错的名字的术语表
- 在聊天栏中暂停某个频道，不会影响其他频道。切换频道或更新扩展后，已打开的标签页无需刷新即可继续翻译
- Chrome、Brave、Edge 和 Firefox

| 聊天滚动时即时翻译 | 工具栏弹出窗口 |
|---|---|
| <img src="screenshots/chat.png" alt="Kick 聊天中每条西班牙语消息下方都有英文译文，列表上方是扩展的状态栏" width="360"> | <img src="screenshots/popup.png" alt="扩展弹出窗口，显示目标语言、显示方式、翻译服务列表和当天的请求数" width="360"> |

| 发送前你输入的内容 | 选择语言，或让它来选 |
|---|---|
| <img src="screenshots/compose.png" alt="输入框中是一条英文消息，上方的预览显示将要发送的西班牙语版本" width="360"> | <img src="screenshots/languages.png" alt="可搜索的语言旗帜和名称网格，频道自己的语言排在最前" width="360"> |

<sub>截图取自正式发布的版本，在本仓库自建的聊天室中拍摄：用户名和消息都是虚构的，翻译在本地应答，
因此这个页面上不会出现任何真实用户的昵称。</sub>

## 安装

[Chrome、Brave、Edge：Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox：Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

打开任意 Kick 直播：聊天顶部的绿色栏表示它正在运行。从商店安装的版本会自动更新。

<details>
<summary>从发布的 zip 手动安装</summary>

从 [Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest) 下载适合你浏览器的 zip 并解压。

- Chrome、Brave、Edge（`…-chromium.zip`）：打开 `chrome://extensions`，开启开发者模式，点击“加载已解压的扩展程序”，选择该文件夹。
- Firefox 121+（`…-firefox.zip`）：打开 `about:debugging#/runtime/this-firefox`，点击“临时载入附加组件”，选择 `manifest.json`。

这样安装的版本不会自动更新。有新版本时，图标会显示徽章，弹出窗口会链接到商店。

</details>

## 翻译引擎

四个服务提供方串联在一起：一个失败时，下一个接手。顺序由你决定。

| 服务 | 密钥 | 说明 |
|---|---|---|
| Google | 无 | 默认，开箱即用 |
| DeepL | 免费 | 质量最好，[免费密钥](https://www.deepl.com/pro-api)每月 100 万字符 |
| MyMemory | 无 | 备用 |
| Lingva | 无 | 备用，默认使用公共实例，也可以指向你自己的 |

Chromium 内置的翻译器比它们都快。在真实频道上测得：从消息出现到译文显示只需 22 毫秒，而云端链需要
1618 毫秒，且不需要网络和配额。Chrome 和 Edge 138 及以上版本可能提供它，但并非每个安装都有，而且每个
语言对都需要在栏上点击一次，下载一次模型。Firefox 没有这个功能。凡是缺少它的地方，都由云端链接手，
不会出任何问题。

## 设置

点击聊天栏上的齿轮，或右键点击扩展图标并选择“选项”。

- 目标语言，以及开启后按频道记住的阅读语言
- 服务顺序、你的 DeepL 密钥和引擎模式：设备端优先、云端优先或仅设备端
- 显示方式：消息下方（推荐）、同一行之后、替换原消息或鼠标悬停时，原文和来源语言徽章可选
- 聊天操作栏中的语言按钮：单击在频道语言和你上次的选择之间切换，长按打开列表，输入两个字母即可筛选
- 输入预览：开或关、目标语言，以及点击后是填入聊天框还是复制
- 过滤：跳过机器人，屏蔽用户、频道或关键词，限制来源语言
- 术语表：应用于译文的查找与替换对
- 预算：DeepL 配额占比、每个频道的速率限制、缓存大小和有效期
- 可读性和外观：文字大小、行距、字体、强调色、聊天主题
- 键盘：Alt+T 开关聊天翻译，Alt+W 开关输入预览
- 活动：已翻译的消息、缓存命中、聊天中出现过的每种语言，以及最近 50 行各自被翻译或保留的原因
- 扩展自身的界面语言：英语、西班牙语、法语、葡萄牙语、土耳其语、俄语、阿拉伯语、中文、日语或韩语

## 支持的语言

英语 · 法语 · 西班牙语 · 葡萄牙语 · 葡萄牙语（巴西） · 德语 · 意大利语 · 荷兰语 · 波兰语 · 瑞典语 · 捷克语 · 斯洛伐克语 · 罗马尼亚语 · 俄语 · 乌克兰语 · 土耳其语 · 阿拉伯语 · 希伯来语 · 日语 · 韩语 · 中文（简体） · 中文（繁体） · 泰语 · 越南语 · 印度尼西亚语 · 印地语 · 芬兰语 · 挪威语 · 丹麦语 · 希腊语 · 匈牙利语 · 保加利亚语 · 加泰罗尼亚语 · 斯洛文尼亚语 · 爱沙尼亚语 · 立陶宛语 · 拉脱维亚语 · 波斯语 · 孟加拉语 · 泰米尔语 · 马来语 · 菲律宾语 · 粤语

## 隐私

没有账号，没有分析统计，也没有我的服务器。聊天消息只发送给你选择的翻译服务，在设备端模式下连那里都
不发送。从商店安装的版本不会发出任何其他请求。手动安装的版本最多每六小时向 GitHub 查询一次最新发布
标签，以决定是否显示更新徽章。[详情](PRIVACY.md)

## 常见问题

**消息没有被翻译。**
打开设置中的“活动”标签页并点击“Read decisions”：它会列出最近 50 行，并说明每一行被翻译或保留的原因。
大多数被跳过的行是有意跳过的。在一次直播中，234 行里有 213 行是同一用户重复发言，9 行太短，7 行只有
表情或笑声，1 行已经是阅读语言。如果这个标签页什么都没有显示，说明扩展没有看到聊天：请提交 issue。

**绿色栏消失了。**
刷新页面。如果再次发生，请提交 [issue](https://github.com/Pkkls/kick-chat-translator/issues)，
写明频道和你之前的操作。

**怎样获得更好的翻译？**
在设置中添加免费的 DeepL 密钥。免费额度每月 100 万字符，DeepL 只会用在它比免费引擎更好的语言对上。

**应该用哪种显示方式？**
消息下方。其他三种也能用，仍在调整中。

**回放中能用吗？**
能，和直播中完全一样。

**Kick 更新后它坏了。**
Kick 有时会改变聊天的构造方式。提交 [issue](https://github.com/Pkkls/kick-chat-translator/issues)，
就会得到修复。

**这是 Kick 官方做的吗？**
不是。这是一个独立的开源项目，与 Kick 无关。

## 更新内容

### 3.1.0

ngl、idc、lmk、wyd、goat 等聊天缩写会在翻译前展开成完整说法，其他语言的读者得到的是它们的意思，而不是原样的字母或错误的猜测。

翻译引擎常常理解错的聊天用语，现在由扩展自带的词表翻译，覆盖的语言也更多：valeu 不再被译成"花费了"，yatta 不再被译成"在游艇上"，merci、gracias、konnichiwa 等问候语会被译成希伯来语、波斯语、希腊语、乌克兰语、保加利亚语、孟加拉语、泰米尔语、繁体中文和粤语。

在刷屏很快的聊天里，与同批其他行语言不同的行会原样返回，从不显示。现在每一行都单独检测语言并翻译。

丢失或误读的行更少了：意大利语或其他语言的短句不再被当成英语而隐藏，结尾像表情名的普通单词（罗马尼亚语 felul、土耳其语 erkek）不再在翻译前被删掉，阿拉伯语问候被识别为阿拉伯语而非波斯语，回复在粤语中也会保留 @提及和链接。

在你的设备上翻译的繁体中文，现在会以繁体字返回。

对浏览器更轻：没有打开 Kick 标签页时扩展不再被唤醒，在热闹的聊天里每条消息的开销也更小。

Firefox：更新后，一个标签页可能同时运行两份扩展，把每条消息翻译两次。现在只运行一份。

每个版本的变化及其背后的测量：
[Releases](https://github.com/Pkkls/kick-chat-translator/releases) 和 [CHANGELOG.md](CHANGELOG.md)。

## 开发

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, unit tests, build: the gate every package goes through
npm run build:firefox    # Firefox build, same dist/ folder
npm run package:all      # both zips, in release/
npm run dev              # HMR
```

构建是可复现的：同一个提交在任何机器上都会产出字节完全相同的 zip，验证方法是在空文件夹中构建该标签的
`git archive` 并比较哈希值。

除单元测试外，41 个离线检查会把构建好的扩展加载进真实浏览器，操作它并断言它的行为，页面和翻译引擎都在
本地应答。它们需要 Playwright，而 Playwright 刻意没有作为依赖：将 `UX_KIT` 指向一个其 `node_modules`
中包含它的文件夹，或运行 `npm i -D playwright`。

```bash
node test/e2e/run-gates.mjs --headless                  # all 41, no window
node test/e2e/store-shots-fixture.mjs --lang=ja         # the store screenshots, in one listing language
node test/e2e/store-shots-fixture.mjs --gif             # English store screenshots, the README images and this GIF
```

技术栈：Manifest V3、Vite、TypeScript、Preact、Tailwind。商店文案位于 [store/](store/)，发布就是一个版本
标签：CI 会构建、检查并发布到两个商店。

## 相关项目

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker)，屏蔽 Kick 的片头广告和覆盖广告
- [kick-core](https://github.com/Pkkls/kick-core)，这些扩展共用的实时网关客户端
- [kickbus](https://github.com/Pkkls/kickbus)，通过 SSE 将 Kick 官方 webhook 转发给本地机器人
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner)，为 Kick 掉落累计观看时长的 Windows 应用

## 许可证

MIT。与 Kick 无关。
