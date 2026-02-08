<!-- Sync Impact Report
  Version: 0.0.0 → 1.0.0 (MAJOR - initial ratification)
  Added Principles:
    - I. 모듈 분리
    - II. 제로 시크릿
    - III. 테스트 권장
    - IV. PR 리뷰 필수
    - V. 한국어 우선
  Added Sections:
    - 레포지토리 구조
    - 협업 워크플로우
    - Governance
  Templates Updated:
    - .specify/templates/plan-template.md ✅ (Constitution Check 섹션 호환)
    - .specify/templates/spec-template.md ✅ (한국어 우선 원칙 호환)
    - .specify/templates/tasks-template.md ✅ (모듈 분리 원칙 호환)
  Follow-up TODOs: None
-->

# MESA Constitution

## Core Principles

### I. 모듈 분리

프로젝트는 세 개의 독립 영역으로 분리한다:
- **비즈니스 로직** (`src/`): 트레이딩 전략, 백테스팅 엔진, 거래소 연동 등 핵심 도메인 코드
- **협업 툴** (`discord-github-worker/` 등): 봇, 자동화, 인프라 코드
- **문서/명세** (`specs/`, `docs/`): 명세서, 설계 문서, 가이드

각 영역은 독립적으로 개발/배포/테스트할 수 있어야 한다. 한 영역의 변경이 다른 영역에 영향을 주면 안 된다.

### II. 제로 시크릿

API 키, 토큰, 비밀번호, 개인 자격증명은 **절대** 커밋하지 않는다:
- 모든 시크릿은 `.env` 파일 또는 플랫폼별 시크릿 관리 도구에 저장
- `.gitignore`에 `.env`, `config.json`, `*.pem` 등 시크릿 파일 MUST 포함
- PR 리뷰 시 시크릿 유출 여부를 반드시 확인
- 실수로 커밋된 시크릿은 즉시 교체(revoke)하고 히스토리에서 제거

### III. 테스트 권장

테스트 작성을 적극 권장하되 강제하지 않는다:
- 핵심 비즈니스 로직(전략 시그널, 주문 실행, 백테스팅 계산)은 테스트 작성을 강력히 권장
- 백테스팅 결과 검증은 전략 변경 시 MUST 수행
- 유틸리티, UI, 설정 코드는 테스트 선택사항
- 테스트 프레임워크: pytest 사용

### IV. PR 리뷰 필수

모든 Pull Request는 최소 1명의 리뷰어 승인 후 머지한다:
- `main` 브랜치 직접 push 금지
- 리뷰어는 코드 품질, 시크릿 유출, 원칙 준수 여부를 확인
- AI 코드 리뷰(Claude, Copilot)는 보조 수단이며 사람 리뷰를 대체하지 않음
- 긴급 수정(hotfix)도 사후 리뷰 MUST 진행

### V. 한국어 우선

문서, 주석, 커밋 메시지는 한국어를 기본으로 한다:
- 명세서(`specs/`), README, 가이드 문서는 한국어 작성
- 코드 주석은 한국어 권장 (영어도 허용)
- 커밋 메시지는 한국어 작성
- 변수명, 함수명 등 코드 식별자는 영어 사용
- 외부 공개용 문서는 영어 병행 가능

## 레포지토리 구조

```
MESA/
├── src/                          # 비즈니스 로직 (트레이딩 봇)
│   ├── strategies/               # 트레이딩 전략
│   ├── backtesting/              # 백테스팅 엔진
│   ├── bot.py                    # 메인 봇
│   └── exchange.py               # 거래소 연동
├── discord-github-worker/        # 협업 툴 (Discord-GitHub-Notion 동기화)
├── specs/                        # 명세서 (spec-kit)
├── docs/                         # 프로젝트 문서
├── tests/                        # 테스트
└── .specify/                     # spec-kit 설정
```

## 협업 워크플로우

1. **명세 작성**: 새 기능은 `specs/` 에 명세서를 먼저 작성
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명` 형식
3. **구현**: 명세 기반으로 개발
4. **PR 생성**: 변경 사항 설명 + 테스트 계획 포함
5. **리뷰 & 머지**: 최소 1명 승인 후 `main`에 머지

## Governance

- 이 Constitution은 모든 개발 활동에 우선한다
- 원칙 수정은 팀 논의 후 PR을 통해 진행하며, 변경 이력을 기록한다
- Constitution 위반 사항이 PR에서 발견되면 머지를 차단한다
- 원칙 간 충돌 시 보안(II) > 협업(IV) > 나머지 순으로 우선한다

**Version**: 1.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-08
