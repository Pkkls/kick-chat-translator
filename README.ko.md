<div align="center">

<img src="public/icons/icon128.png" alt="" width="80" height="80">

# Kick Chat Translator

Kick용 실시간 채팅 번역기입니다. 어떤 방송의 채팅이든 자기 언어로 읽고, 채널의 언어로 답할 수 있습니다.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=Chrome%20Web%20Store&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Chrome users](https://img.shields.io/chrome-web-store/users/nkkjmbkmacbdkboijmnhjnblcaiclhni?label=users&color=53fc18)](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
[![Firefox Add-on](https://img.shields.io/amo/v/kick-chat-translator?label=Firefox%20Add-on&color=53fc18)](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)
[![CI](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/Pkkls/kick-chat-translator/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md) · [Čeština](README.cs.md)

<img src="screenshots/demo.gif" alt="스페인어 채팅 메시지가 하나씩 도착하고 각각 아래에 영어 번역이 붙습니다. 이어서 영어 답장을 입력하면 채팅창 위에 스페인어 미리보기가 나타나고 Tab으로 바꿔 넣습니다" width="360">

[실제 채팅에서 작동하는 모습 보기](https://www.youtube.com/watch?v=NoGJeUrwy9o)

</div>

## 무엇을 하나요

읽지 못하는 언어로 채팅이 오가는 Kick 방송을 열어 보세요. 메시지가 도착하는 대로 바로 아래에 번역이
붙습니다. 생방송에서도 다시보기에서도 마찬가지입니다. 답장을 입력하면 채팅창 위에 채널 언어로 된
미리보기가 나타납니다. Tab을 누르거나 클릭하면 입력한 내용이 그 버전으로 바뀝니다.

설정할 것은 없습니다. 들어오는 채팅은 브라우저 언어로 번역되고, 내가 쓴 글은 Kick에서 직접 읽어 온
채널의 방송 언어로 나갑니다. 둘 다 설정에서 바꿀 수 있습니다.

- 43개 언어. 오른쪽에서 왼쪽으로 쓰는 문자(아랍어, 히브리어, 페르시아어)와 지역 변형(브라질 포르투갈어,
  번체 중국어, 광둥어)도 포함합니다
- Google은 키도 계정도 없이 바로 동작합니다. 더 좋은 품질을 원하면 무료 DeepL 키를 직접 추가하고,
  MyMemory와 Lingva가 예비로 대기합니다
- 브라우저가 지원하는 Chrome과 Edge에서는 기기 내 번역: 1.6초 대신 22ms, 텍스트가 내 컴퓨터를 떠나지
  않습니다
- 7TV 이모트, 봇과 사용자 필터, 키워드 필터, 번역 엔진이 망가뜨리는 이름을 위한 용어집
- 채팅 바에서 한 채널만 일시 중지해도 다른 채널은 멈추지 않습니다. 채널을 바꾸거나 확장 프로그램을
  업데이트해도 열린 탭은 새로 고침 없이 계속 번역합니다
- Chrome, Brave, Edge, Firefox

| 스크롤되는 대로 번역되는 채팅 | 툴바 팝업 |
|---|---|
| <img src="screenshots/chat.png" alt="스페인어 메시지마다 아래에 영어 번역이 붙은 Kick 채팅과, 목록 위의 확장 프로그램 상태 바" width="360"> | <img src="screenshots/popup.png" alt="번역 대상 언어, 표시 방식, 번역 엔진 목록, 오늘의 요청 수가 보이는 확장 프로그램 팝업" width="360"> |

| 보내기 전에 입력한 내용 | 언어를 고르거나 맡기기 |
|---|---|
| <img src="screenshots/compose.png" alt="영어 메시지가 들어 있는 입력창과, 그 위에 보내질 스페인어 버전을 보여 주는 미리보기" width="360"> | <img src="screenshots/languages.png" alt="채널의 언어가 맨 앞에 오는, 검색 가능한 언어 국기와 이름 목록" width="360"> |

<sub>이 저장소가 직접 만드는 채팅방에서 배포 빌드로 찍었습니다. 사용자 이름과 메시지는 지어낸 것이고
번역은 로컬에서 응답하므로, 실제 사람의 닉네임은 이 페이지에 나오지 않습니다.</sub>

## 설치

[Chrome, Brave, Edge: Chrome Web Store](https://chromewebstore.google.com/detail/kick-chat-translator/nkkjmbkmacbdkboijmnhjnblcaiclhni)
&nbsp;·&nbsp;
[Firefox: Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/kick-chat-translator/)

아무 Kick 방송이나 열어 보세요. 채팅 위쪽의 초록색 바가 작동 중임을 알려 줍니다. 스토어에서 설치한
버전은 자동으로 업데이트됩니다.

<details>
<summary>릴리스 zip으로 직접 설치하기</summary>

[Releases](https://github.com/Pkkls/kick-chat-translator/releases/latest)에서 브라우저에 맞는 zip을 내려받아 압축을 풉니다.

- Chrome, Brave, Edge(`…-chromium.zip`): `chrome://extensions`를 열고 개발자 모드를 켠 뒤, 압축해제된 확장 프로그램 로드를 눌러 폴더를 고릅니다.
- Firefox 121+(`…-firefox.zip`): `about:debugging#/runtime/this-firefox`를 열고 임시 부가 기능 로드를 눌러 `manifest.json`을 고릅니다.

이렇게 설치한 버전은 자동으로 업데이트되지 않습니다. 새 버전이 나오면 아이콘에 배지가 붙고, 팝업에서
스토어로 연결됩니다.

</details>

## 번역 엔진

네 개의 제공자가 사슬처럼 이어집니다. 하나가 실패하면 다음이 넘겨받습니다. 순서는 직접 정합니다.

| 제공자 | 키 | 참고 |
|---|---|---|
| Google | 없음 | 기본값, 바로 동작 |
| DeepL | 무료 | 최고 품질, 월 100만 자 [무료 키](https://www.deepl.com/pro-api) |
| MyMemory | 없음 | 예비 |
| Lingva | 없음 | 예비, 자체 인스턴스를 지정하지 않으면 공개 인스턴스 사용 |

Chromium에 내장된 번역기는 이들 모두보다 빠릅니다. 실제 채널에서 측정한 결과, 메시지가 나타나서 번역이
화면에 뜨기까지 22ms였고 클라우드 사슬은 1618ms였습니다. 네트워크도 할당량도 필요 없습니다. Chrome과
Edge 138 이상에서 제공될 수 있지만 모든 설치본에서 되는 것은 아니며, 언어 쌍마다 바에서 한 번 클릭해
모델을 한 번 내려받아야 합니다. Firefox에는 없습니다. 없는 곳에서는 클라우드 사슬이 넘겨받으므로
아무것도 깨지지 않습니다.

## 설정

채팅 바의 톱니바퀴를 누르거나, 확장 프로그램 아이콘을 오른쪽 클릭해 옵션을 고르세요.

- 번역 대상 언어, 그리고 켜 두면 채널마다 기억되는 읽기 언어
- 제공자 순서, DeepL 키, 엔진 모드: 기기 내 우선, 클라우드 우선, 기기 내만
- 표시: 메시지 아래(권장), 같은 줄 뒤, 메시지 대신, 마우스를 올렸을 때. 원문과 원본 언어 배지는 선택
- 채팅 작업 바의 언어 버튼: 한 번 클릭하면 채널 언어와 마지막 선택 사이를 오가고, 길게 누르면 목록이
  열리며, 두 글자를 입력하면 걸러집니다
- 작성 미리보기: 켜기 또는 끄기, 대상 언어, 클릭했을 때 채팅창을 채울지 복사할지
- 필터: 봇 건너뛰기, 사용자, 채널, 키워드 차단, 원본 언어 제한
- 용어집: 번역에 적용되는 찾기와 바꾸기 쌍
- 예산: DeepL 할당량 비율, 채널별 속도 제한, 캐시 크기와 보존 기간
- 가독성과 모양: 글자 크기, 줄 간격, 글꼴, 강조 색, 채팅 테마
- 키보드: Alt+T로 채팅 번역을 켜고 끄며, Alt+W로 작성 미리보기를 켜고 끕니다
- 활동: 번역한 메시지, 캐시 적중, 채팅에서 본 모든 언어, 그리고 마지막 50줄 각각이 번역되었거나 그대로
  남은 이유
- 확장 프로그램 자체 화면 언어: 영어, 스페인어, 프랑스어, 포르투갈어, 튀르키예어, 러시아어, 아랍어,
  중국어, 일본어, 한국어

## 지원 언어

영어 · 프랑스어 · 스페인어 · 포르투갈어 · 포르투갈어(브라질) · 독일어 · 이탈리아어 · 네덜란드어 · 폴란드어 · 스웨덴어 · 체코어 · 슬로바키아어 · 루마니아어 · 러시아어 · 우크라이나어 · 튀르키예어 · 아랍어 · 히브리어 · 일본어 · 한국어 · 중국어(간체) · 중국어(번체) · 태국어 · 베트남어 · 인도네시아어 · 힌디어 · 핀란드어 · 노르웨이어 · 덴마크어 · 그리스어 · 헝가리어 · 불가리아어 · 카탈루냐어 · 슬로베니아어 · 에스토니아어 · 리투아니아어 · 라트비아어 · 페르시아어 · 벵골어 · 타밀어 · 말레이어 · 필리핀어 · 광둥어

## 개인정보

계정도, 분석 도구도, 제 서버도 없습니다. 채팅 메시지는 고른 번역 제공자에게만 가고, 기기 내 모드에서는
그곳에도 가지 않습니다. 스토어에서 설치한 버전은 그 밖의 요청을 하지 않습니다. 직접 설치한 버전은
업데이트 배지를 보여 줄지 알기 위해 최대 6시간에 한 번 GitHub에 최신 릴리스 태그를 묻습니다.
[자세히](PRIVACY.md)

## 자주 묻는 질문

**메시지가 번역되지 않아요.**
설정의 활동 탭을 열고 "Read decisions"를 누르세요. 마지막 50줄을 보여 주고, 각 줄이 번역되었거나 그대로
남은 이유를 알려 줍니다. 건너뛴 줄은 대부분 의도된 것입니다. 한 번의 생방송에서 234줄 중 213줄은 같은
사용자의 반복이었고, 9줄은 너무 짧았고, 7줄은 이모지나 웃음뿐이었으며, 1줄은 이미 읽기 언어였습니다.
탭에 아무것도 나오지 않으면 확장 프로그램이 채팅을 보지 못하는 것이니 이슈를 열어 주세요.

**초록색 바가 사라졌어요.**
페이지를 새로 고치세요. 다시 그러면 채널과 그 전에 한 일을 적어
[이슈](https://github.com/Pkkls/kick-chat-translator/issues)를 열어 주세요.

**번역 품질을 높이려면?**
설정에서 무료 DeepL 키를 추가하세요. 무료 요금제는 월 100만 자이며, DeepL은 무료 엔진보다 나은 언어
쌍에서만 사용됩니다.

**어떤 표시 방식을 써야 하나요?**
메시지 아래입니다. 나머지 세 가지도 동작하며 아직 다듬는 중입니다.

**다시보기에서도 되나요?**
네, 생방송과 똑같이 됩니다.

**Kick 업데이트 후 작동하지 않아요.**
Kick은 가끔 채팅 구조를 바꿉니다. [이슈](https://github.com/Pkkls/kick-chat-translator/issues)를 열어 주시면
수정됩니다.

**Kick이 만든 건가요?**
아니요. Kick과 관련 없는 독립 오픈소스 프로젝트입니다.

## 새 소식

### 3.0.2

채팅 바의 일시 중지 버튼이 이제 시청 중인 채널만 일시 중지합니다. 이전에는 팝업에서 다시 켤 때까지 모든 채널과 모든 탭에서 번역이 꺼졌습니다.

현재 탭의 채널이 일시 중지된 경우 팝업에 이를 표시하고 재개 버튼을 제공합니다.

확장 프로그램이 설치되거나 업데이트되는 동안 이미 열려 있던 Kick 탭도 계속 번역합니다. 이전에는 페이지를 새로 고칠 때까지 멈췄습니다.

페이지를 새로 고치지 않고 다른 채널로 이동하면 페이지를 새로 고칠 때까지 번역이 멈췄습니다. 이제 화면에 보이는 채팅을 따라갑니다.

첫 번역을 하기 전까지는 Kick 밖에서 연 팝업이 채널을 열도록 안내하고 이를 위한 버튼을 제공합니다.

각 릴리스에서 바뀐 점과 그 뒤의 측정 결과:
[Releases](https://github.com/Pkkls/kick-chat-translator/releases)와 [CHANGELOG.md](CHANGELOG.md).

## 개발

```bash
git clone https://github.com/Pkkls/kick-chat-translator.git
cd kick-chat-translator
npm ci
npm run release:check    # typecheck, lint, unit tests, build: the gate every package goes through
npm run build:firefox    # Firefox build, same dist/ folder
npm run package:all      # both zips, in release/
npm run dev              # HMR
```

빌드는 재현 가능합니다. 같은 커밋은 어떤 기계에서든 바이트 단위로 같은 zip을 만들며, 빈 폴더에서
태그의 `git archive`를 빌드해 해시를 비교하는 방식으로 확인합니다.

단위 테스트 외에도 41개의 오프라인 게이트가 빌드된 확장 프로그램을 실제 브라우저에 불러와 조작하고
동작을 검증합니다. 페이지도 번역 엔진도 로컬에서 응답합니다. 일부러 의존성에 넣지 않은 Playwright가
필요합니다. `node_modules`에 Playwright가 있는 폴더를 `UX_KIT`로 지정하거나, `npm i -D playwright`를
실행하세요.

```bash
node test/e2e/run-gates.mjs --headless                  # all 41, no window
node test/e2e/store-shots-fixture.mjs --lang=ja         # the store screenshots, in one listing language
node test/e2e/store-shots-fixture.mjs --gif             # English store screenshots, the README images and this GIF
```

스택: Manifest V3, Vite, TypeScript, Preact, Tailwind. 스토어 문구는 [store/](store/)에 있고, 릴리스는
버전 태그입니다. CI가 빌드하고 검사한 뒤 두 스토어에 게시합니다.

## 관련 프로젝트

- [kick-ad-blocker](https://github.com/Pkkls/kick-ad-blocker), Kick의 프리롤과 오버레이 광고를 차단
- [kick-core](https://github.com/Pkkls/kick-core), 이 확장 프로그램들이 함께 쓰는 실시간 게이트웨이 클라이언트
- [kickbus](https://github.com/Pkkls/kickbus), Kick 공식 웹훅을 SSE로 로컬 봇에 전달
- [kick-drops-miner](https://github.com/Pkkls/kick-drops-miner), Kick 드롭 시청 시간을 쌓아 주는 Windows 앱

## 라이선스

MIT. Kick과 관련이 없습니다.
