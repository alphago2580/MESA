실행하는 법 : 
1. 터미널 창에 먼저 입력(실행하기 위한 토대 마련, 설치)
   `npm install`
2. 그 다음 입력(실행 명령문)
   `npm run dev`

## 🤝 Team Workflow & Rules

이 프로젝트는 4개의 핵심 파트(Data, Persona, Debate, Marketing/Analysis)로 나뉘어 진행됩니다.
각 팀원은 **자신의 역할에 맞는 폴더**에서만 작업해야 하며, **지정된 AI 가이드**를 준수해야 합니다.

### 📂 Folder Structure by Role

| Role | Folder Path | Guide File | Description |
|------|------------|------------|-------------|
| **Role 1: Data** | `src/features/data` | `docs/team_AI_guide/ROLE_1_DATA.md` | 데이터 처리(API연결부터 유저프롬프트까지) 담당 |
| **Role 2: Persona** | `src/features/personas` | `docs/team_AI_guide/ROLE_2_PERSONA.md` | 9인의 AI 페르소나 설계 및 프롬프트 관리 |
| **Role 3: Debate** | `src/features/debate` | `docs/team_AI_guide/ROLE_3_DEBATE.md` | 토론 인터랙티브 구현 |
| **Role 4: Director** (Frontend) | `src/App.tsx`, `src/features/analysis` | `docs/team_AI_guide/ROLE_4_FRONTEND.md` | 앱 통합, 시나리오 연출 및 최종 리포트 |

### 🤖 AI Agent Guidelines

모든 팀원은 작업을 시작하기 전, 자신의 역할에 맞는 **AI System Prompt**를 AI 코딩 툴(Antigravity, Cursor 등)에 최우선 지침으로 주입할 방법을 찾아서 적용해야 합니다.

1.  **작업 시작 전**: `docs/team_AI_guide/` 폴더에서 자신의 역할 파일(`ROLE_X_....md`)을 엽니다.
2.  **프롬프트 주입**: 파일 내용을 AI가 최우선 지침으로 인식할 방법을 찾아서 적용합니다. 만약 채팅창에 파일첨부나 텍스트 복붙으로 방법을 적용하신다면 채팅창은 그 채팅안에서의 맥락만 기억한다는 것을 유의하셔야 합니다. 만약 채팅이 초기화되거나 새로 열렸다면 파일첨부 또는 텍스트 복붙을 다시 해주셔야 합니다. 이 기회에 한번의 행동으로 계속 유지시킬 수 있는 방법을 찾아보는 것도 좋은 경험이 될 거라 생각합니다.
3. 작업은 자신의 폴더에서만 작업합니다. 역할별 폴더는 features라는 폴더안에 위치해 있습니다.

