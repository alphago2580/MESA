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

### III. 테스트 필수 (Core Logic)
돈을 다루는 핵심 로직은 반드시 검증되어야 한다:
- **Core Logic:** 트레이딩 전략, 주문 실행, 백테스팅 계산 로직은 **단위 테스트(Unit Test) 작성이 필수(MUST)**이다.
- **Verification:** 백테스팅 결과 검증은 전략 변경 시 반드시 수행한다.
- **Optional:** 단순 유틸리티, UI, 일회성 스크립트는 테스트 권장 사항(SHOULD)이다.
- 프레임워크: `pytest` 사용

### IV. PR 리뷰 필수
모든 Pull Request는 최소 1명의 리뷰어 승인 후 머지한다:
- `main` 브랜치 직접 push 금지
- 리뷰어는 코드 품질, 시크릿 유출, 원칙 준수 여부를 확인
- AI 코드 리뷰(Claude, Copilot)는 보조 수단이며 사람 리뷰를 대체하지 않음

### V. 한국어 우선
문서, 주석, 커밋 메시지는 한국어를 기본으로 한다:
- 명세서(`specs/`), README, 가이드 문서는 한국어 작성
- **Docstring:** Google Style(`Args`, `Returns`) 포맷을 따르되 설명은 한국어로 작성
- 커밋 메시지는 한국어 작성 (Conventional Commits 준수)
- 식별자(변수/함수명)는 영어 사용

### VI. 명시적 타입과 스타일 (Google Standard)
코드는 기계가 아닌 사람을 위해 작성한다. 가독성과 안정성을 최우선으로 한다:
- **Python (`src/`):** 모든 함수 인자와 반환값에 **Type Hint**를 반드시 명시한다. (`Any` 사용 지양)
- **TypeScript (`worker/`):** `interface` 정의를 강제하며, `any` 타입을 절대 사용하지 않는다.
- **Linter:** `ruff` 또는 `mypy` 검사를 통과하지 못한 코드는 커밋할 수 없다.

### VII. 방어적 프로그래밍 (Stability)
시스템은 언제든 실패할 수 있다는 가정하에 설계한다:
- **No Silent Failures:** 외부 API(CCXT, Discord) 호출은 반드시 `try-except`로 예외를 처리한다.
- **Structured Logging:** `print()` 사용을 금지한다. `logger`를 사용하여 구조화된 로그(시간, 레벨, 메시지)를 남긴다.
- **Config Validation:** 환경변수나 설정 파일 로드 시, 필요한 값이 없으면 시스템 시작을 차단한다.

## 레포지토리 구조
(기존 내용 유지)

## 협업 워크플로우
(기존 내용 유지)

## Governance
- 이 Constitution은 모든 개발 활동에 우선한다
- 원칙 간 충돌 시 **보안(II) > 안정성(VII) > 나머지** 순으로 우선한다

**Version**: 1.1.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09
