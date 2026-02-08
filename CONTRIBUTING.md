# MESA 기여 가이드

코딩 경험이 전혀 없어도 괜찮습니다!
이 프로젝트는 **AI 도구가 코드를 대신 작성**해주고, 여러분은 **"뭘 만들지"를 설명하는 명세서(spec)**만 작성하면 됩니다.

---

## 목차

1. [필수 프로그램 설치](#1-필수-프로그램-설치)
2. [GitHub 기본 개념](#2-github-기본-개념)
3. [프로젝트 가져오기 (Clone)](#3-프로젝트-가져오기-clone)
4. [AI 코딩 도구 설치](#4-ai-코딩-도구-설치)
5. [spec-kit: 명세 작성으로 기여하기](#5-spec-kit-명세-작성으로-기여하기)
6. [변경사항 올리기 (커밋 & PR)](#6-변경사항-올리기-커밋--pr)
7. [팀 역할 & 폴더 구조](#7-팀-역할--폴더-구조)
8. [프로젝트 규칙 (Constitution)](#8-프로젝트-규칙-constitution)
9. [자주 묻는 질문](#9-자주-묻는-질문)

---

## 1. 필수 프로그램 설치

아래 프로그램들을 순서대로 설치하세요. (Windows 기준)

### 1-1. Git 설치

Git은 코드의 변경 이력을 관리하는 도구입니다. 여러 사람이 하나의 프로젝트를 동시에 작업할 수 있게 해줍니다.

1. https://git-scm.com/download/win 에서 다운로드
2. 설치 파일 실행 → **모든 옵션 기본값(Next)으로 진행**
3. 설치 완료 후 확인:
   - 바탕화면에서 마우스 오른쪽 클릭 → **"Open Git Bash"** 가 보이면 성공

### 1-2. Node.js 설치

프로젝트 실행에 필요한 런타임입니다.

1. https://nodejs.org 에서 **LTS (권장 버전)** 다운로드
2. 설치 파일 실행 → **모든 옵션 기본값(Next)으로 진행**
3. 설치 완료 후 확인:
   - Git Bash 열고 아래 명령어 입력:
   ```bash
   node --version
   npm --version
   ```
   - 버전 번호가 나오면 성공 (예: `v22.x.x`, `10.x.x`)

### 1-3. AI 코드 편집기 설치

아래 중 하나를 설치하세요:

| 도구 | 다운로드 | 설명 |
|------|----------|------|
| **Cursor** | https://cursor.com | AI가 코드를 대신 써주는 편집기 |
| **Antigravity** | https://idx.google.com/antigravity | Google의 AI 편집기 (무료) |

> 둘 다 Visual Studio Code와 비슷하게 생겼습니다.
> 팀에서 쓰는 도구가 있다면 같은 걸 쓰는 게 편합니다.

---

## 2. GitHub 기본 개념

처음이라면 이것만 알면 됩니다:

| 용어 | 쉬운 설명 |
|------|-----------|
| **Repository (레포)** | 프로젝트 폴더. MESA 레포 = MESA 프로젝트 전체 |
| **Clone (클론)** | 레포를 내 컴퓨터로 복사하는 것 |
| **Branch (브랜치)** | 원본을 건드리지 않고 내 작업 공간을 만드는 것 |
| **Commit (커밋)** | "저장"과 비슷. 변경사항을 기록하는 것 |
| **Push (푸시)** | 내 컴퓨터의 커밋을 GitHub에 올리는 것 |
| **Pull Request (PR)** | "이거 반영해주세요" 요청. 다른 사람이 검토 후 반영 |
| **Merge (머지)** | PR이 승인되어 원본에 합쳐지는 것 |

### 전체 흐름 (그림으로 보기)

```
내 컴퓨터                              GitHub
─────────                              ──────
1. Clone (복사)            ←────────   MESA 레포
2. Branch (내 작업공간)
3. 파일 수정
4. Commit (저장)
5. Push (올리기)           ────────→   내 브랜치
                                       6. Pull Request (검토 요청)
                                       7. 리뷰 & 승인
                                       8. Merge (반영!)
```

---

## 3. 프로젝트 가져오기 (Clone)

### 3-1. Git Bash 열기

바탕화면이나 원하는 폴더에서 마우스 오른쪽 클릭 → **"Open Git Bash"**

### 3-2. GitHub 계정 설정

**처음 한 번만** 하면 됩니다. 따옴표 안에 본인 정보를 입력하세요:

```bash
git config --global user.name "홍길동"
git config --global user.email "내깃허브이메일@example.com"
```

### 3-3. 프로젝트 복사

```bash
git clone https://github.com/alphago2580/MESA.git
```

성공하면 `MESA` 폴더가 생깁니다.

### 3-4. 프로젝트 폴더로 이동 & 패키지 설치

```bash
cd MESA
npm install
```

> `npm install`은 프로젝트에 필요한 패키지(부품)들을 자동으로 설치하는 명령어입니다.
> 처음 한 번만 실행하면 됩니다.

### 3-5. 실행해보기 (선택)

```bash
npm run dev
```

브라우저에서 프로젝트가 실행됩니다. `Ctrl+C`로 종료할 수 있습니다.

---

## 4. AI 코딩 도구 설치

코딩을 몰라도 AI가 다 해줍니다. 아래 중 편한 도구를 하나 골라 사용하세요.

### 방법 A: Cursor

1. Cursor 실행
2. **File → Open Folder** → `MESA` 폴더 선택
3. 오른쪽 채팅창(Chat)에서 AI에게 한국어로 질문하면 됩니다
4. spec-kit 명령어: 채팅창에 `/speckit.specify` 입력

### 방법 B: Antigravity

1. Antigravity 실행
2. **File → Open Folder** → `MESA` 폴더 선택
3. 채팅창에서 AI에게 한국어로 질문
4. spec-kit 명령어: 채팅창에 `/speckit.specify` 입력

### 방법 C: Claude Code (터미널)

1. https://docs.anthropic.com/en/docs/claude-code/setup 에서 설치
2. Git Bash에서:
   ```bash
   cd MESA
   claude
   ```
3. 대화형으로 AI에게 한국어로 지시

### 방법 D: Gemini CLI (터미널)

1. https://github.com/google-gemini/gemini-cli 에서 설치
2. Git Bash에서:
   ```bash
   cd MESA
   gemini
   ```

---

## 5. spec-kit: 명세 작성으로 기여하기

### spec-kit이 뭔가요?

코드를 직접 작성하는 대신, **"뭘 만들고 싶은지"를 글로 쓰면 AI가 코드를 만들어주는 방식**입니다.

여러분이 할 일은 **명세서(spec) 작성**입니다. 코딩 지식이 필요 없습니다!

### 명세 작성 5단계

| 단계 | 명령어 | 뭘 하는 건지 | 코딩 필요? |
|------|--------|-------------|-----------|
| 1 | `/speckit.specify` | "뭘 만들지" 정리 | 아니요 |
| 2 | `/speckit.plan` | "어떻게 만들지" 기술 계획 | 아니요 |
| 3 | `/speckit.tasks` | 할 일 목록으로 쪼개기 | 아니요 |
| 4 | `/speckit.implement` | AI가 실제 코드 작성 | AI가 해줌 |
| 5 | (선택) `/speckit.checklist` | 빠진 것 없는지 체크 | 아니요 |

### 실제 예시: 처음부터 끝까지

#### Step 1. AI 도구 열기

Cursor, Antigravity, Claude Code, Gemini CLI 중 하나를 열고 MESA 프로젝트를 엽니다.

#### Step 2. 명세 작성 시작

채팅창에 이렇게 입력합니다:

```
/speckit.specify

금리 변동이 주식시장에 미치는 영향을 시뮬레이션하는 기능을 추가하고 싶어.
유저가 금리를 올리거나 내리면 각 AI 페르소나가 자기 관점에서 토론하는 기능이야.
```

AI가 `specs/001-interest-rate-debate/spec.md` 파일을 만들어줍니다.

#### Step 3. 명세 검토

AI가 만든 명세서를 읽어보고, 부족한 부분이 있으면 수정하세요.
명세서는 마크다운(.md) 파일이라 그냥 텍스트를 편집하면 됩니다.

#### Step 4. 계획 수립

```
/speckit.plan
```

AI가 기술적인 구현 계획을 작성합니다.

#### Step 5. 태스크 생성

```
/speckit.tasks
```

AI가 할 일 목록을 만듭니다.

#### Step 6. 구현 (AI가 코드 작성)

```
/speckit.implement
```

AI가 태스크 목록에 따라 실제 코드를 작성합니다.

### 명세서만 작성해도 충분합니다!

코드 구현(`/speckit.implement`)은 나중에 해도 됩니다.
**명세서(`/speckit.specify`)만 작성하고 PR을 올려도 훌륭한 기여**입니다.
"이런 기능이 필요하다"는 아이디어 자체가 가치 있습니다.

### 생성되는 파일 구조

```
specs/
└── 001-interest-rate-debate/    ← 기능 이름
    ├── spec.md                  ← 뭘 만들지 (명세서)
    ├── plan.md                  ← 어떻게 만들지 (기술 계획)
    ├── tasks.md                 ← 할 일 목록
    └── contracts/               ← API 설계 (필요한 경우)
```

---

## 6. 변경사항 올리기 (커밋 & PR)

### 6-1. 새 브랜치 만들기

**main 브랜치에서 직접 작업하면 안 됩니다.** 항상 새 브랜치를 만드세요.

```bash
git checkout -b feature/내작업이름
```

예시:
```bash
git checkout -b feature/interest-rate-spec
```

### 6-2. 변경사항 확인

```bash
git status
```

수정/추가된 파일이 빨간색으로 표시됩니다.

### 6-3. 커밋하기

```bash
git add specs/
git commit -m "docs: 금리 변동 토론 기능 명세 작성"
```

커밋 메시지 태그:

| 태그 | 용도 | 예시 |
|------|------|------|
| `docs:` | 명세/문서 작성 | `docs: 금리 시뮬레이션 명세 추가` |
| `feat:` | 새 기능 구현 | `feat: RSI 전략 구현` |
| `fix:` | 버그 수정 | `fix: 토론 순서 오류 수정` |

### 6-4. GitHub에 올리기

```bash
git push origin feature/내작업이름
```

> 처음 푸시하면 브라우저에서 GitHub 로그인 창이 뜰 수 있습니다. 로그인하면 됩니다.

### 6-5. Pull Request 만들기

1. https://github.com/alphago2580/MESA 에 접속
2. 상단에 노란색 배너 **"Compare & pull request"** 클릭
3. 제목과 설명 작성 후 **"Create pull request"** 클릭
4. 팀원 최소 1명이 리뷰하고 승인하면 머지됩니다

---

## 7. 팀 역할 & 폴더 구조

프로젝트는 역할별로 폴더가 나뉘어 있습니다. **자기 역할 폴더에서만 작업**하세요.

| 역할 | 폴더 경로 | 가이드 | 담당 |
|------|----------|--------|------|
| Role 1: Data | `src/features/data` | `docs/team_AI_guide/ROLE_1_DATA.md` | 데이터 처리, API 연결 |
| Role 2: Persona | `src/features/personas` | `docs/team_AI_guide/ROLE_2_PERSONA.md` | AI 페르소나 설계 |
| Role 3: Debate | `src/features/debate` | `docs/team_AI_guide/ROLE_3_DEBATE.md` | 토론 로직 구현 |
| Role 4: Director | `src/App.tsx`, `src/features/analysis` | `docs/team_AI_guide/ROLE_4_FRONTEND.md` | 앱 통합, 리포트 |

### AI 가이드 사용법

작업 시작 전에 자기 역할의 가이드 파일을 AI에게 알려주세요:

**Cursor / Antigravity에서:**
1. `docs/team_AI_guide/` 폴더에서 본인 역할 파일을 엽니다 (예: `ROLE_1_DATA.md`)
2. 채팅창에 파일을 첨부하거나, 내용을 복사해서 붙여넣기 합니다
3. "이 가이드를 따라서 작업해줘"라고 말합니다

> 채팅이 초기화되면 가이드를 다시 첨부해야 합니다.

---

## 8. 프로젝트 규칙 (Constitution)

MESA에는 모든 팀원이 지켜야 할 5가지 규칙이 있습니다.
(`.specify/memory/constitution.md`에서 전체 내용 확인 가능)

| 규칙 | 핵심 내용 |
|------|-----------|
| **I. 모듈 분리** | `src/`(코드), `discord-github-worker/`(봇), `specs/`(명세)는 각각 독립 |
| **II. 제로 시크릿** | API 키, 비밀번호는 **절대** 커밋 금지. `.env` 파일에만 저장 |
| **III. 테스트 권장** | 핵심 로직은 테스트 작성 권장 (강제는 아님) |
| **IV. PR 리뷰 필수** | 모든 PR은 최소 1명이 검토한 후 머지 |
| **V. 한국어 우선** | 문서, 커밋 메시지는 한국어로 작성 |

### 특히 주의: 시크릿(비밀정보) 관리

아래 파일들은 **절대** 커밋하면 안 됩니다:
- `.env` (API 키가 들어있음)
- `config.json` (개인 설정)
- `*.pem` (인증서 파일)

만약 실수로 커밋했다면 **즉시 관리자(@alphago2580)에게 알려주세요.**

---

## 9. 자주 묻는 질문

### Q: `git push`가 안 돼요

GitHub 로그인이 필요합니다. 푸시하면 브라우저 로그인 창이 뜹니다.

### Q: `npm install`에서 오류가 나요

Node.js가 제대로 설치되었는지 확인하세요:
```bash
node --version
```
버전이 안 나오면 Node.js를 다시 설치하세요.

### Q: `main` 브랜치에서 작업해버렸어요

아직 커밋 안 했다면:
```bash
git checkout -b feature/내작업이름
```
수정사항이 자동으로 새 브랜치로 옮겨집니다.

### Q: 다른 사람의 최신 코드를 가져오고 싶어요

```bash
git checkout main
git pull origin main
```

### Q: 충돌(conflict)이 났어요

당황하지 마세요! **관리자(@alphago2580)에게 도움을 요청**하세요.

### Q: spec-kit 명령어가 안 돼요

MESA 폴더를 열지 않았을 수 있습니다:
- Cursor/Antigravity: **File → Open Folder** → MESA 폴더 선택
- CLI: `cd MESA` 로 폴더 이동 후 실행

### Q: 코딩을 전혀 모르는데 기여할 수 있나요?

**네!** spec-kit 명세서 작성은 코딩 지식이 필요 없습니다.
"이런 기능이 있으면 좋겠다"는 아이디어를 글로 정리하는 것만으로도 큰 기여입니다.
`/speckit.specify`에 한국어로 원하는 기능을 설명하면 됩니다.

### Q: 뭘 해야 할지 모르겠어요

1. GitHub Issues 탭에서 할 일 확인
2. AI 채팅에서 `/speckit.specify`로 새 기능 명세 작성
3. Discord에서 팀원들과 논의

---

## 도움이 필요하면

- **Discord**: 팀 채널에서 질문
- **GitHub Issues**: 버그 신고나 기능 제안
- **관리자**: @alphago2580
