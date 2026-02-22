# MESA v2 - System Architecture

> MESA Economic Report Service: AI 기반 거시경제 인사이트 리포트 서비스

## 1. 시스템 개요

MESA v2는 사용자가 설정한 주기와 관심 지표에 따라 AI가 거시경제 데이터를 분석하고,
수준별(주린이/일반/전문가) 맞춤 리포트를 생성하여 Web Push 알림으로 전달하는 서비스이다.

### 핵심 원칙
- **두괄식 리포트**: 모든 리포트는 3줄 Executive Summary로 시작
- **레벨별 맞춤**: 사용자 수준에 맞는 언어와 깊이
- **자동화된 전달**: 스케줄러 기반 리포트 생성 및 Push 알림

## 2. 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | PWA 지원 |
| Backend | FastAPI (Python 3.11+) | 비동기 처리 |
| AI Engine | Claude API (claude-sonnet-4-6) | Anthropic SDK |
| 경제 데이터 | FRED API, Yahoo Finance, World Bank API | fredapi, yfinance |
| 알림 | Web Push (pywebpush) + Service Worker | VAPID 키 기반 |
| DB | SQLite (개발) / PostgreSQL (프로덕션) | SQLAlchemy ORM |
| 스케줄러 | APScheduler | 크론 기반 작업 예약 |
| 배포 | Vercel (Frontend) + Railway/Render (Backend) | 분리 배포 |

## 3. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js 14 (PWA + Service Worker)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐  │  │
│  │  │ Dashboard │  │ Settings │  │ Report Viewer (HTML)   │  │  │
│  │  └──────────┘  └──────────┘  └────────────────────────┘  │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │ REST API                          │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌──────────┐  ┌────────────┴──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │     API Router        │  │   APScheduler    │  │
│  │  Module  │  │  /reports /settings   │  │  (Cron Jobs)     │  │
│  └──────────┘  └───────────────────────┘  └────────┬─────────┘  │
│                                                     │            │
│  ┌──────────────────────────────────────────────────┼─────────┐  │
│  │                  Service Layer                   │         │  │
│  │  ┌──────────────┐ ┌─────────────┐ ┌─────────────┴──────┐  │  │
│  │  │ Data Collect  │ │  AI Report  │ │   Push Notifier    │  │  │
│  │  │   Service     │ │  Generator  │ │     Service        │  │  │
│  │  └──────┬───────┘ └──────┬──────┘ └────────────────────┘  │  │
│  │         │                │                                 │  │
│  └─────────┼────────────────┼─────────────────────────────────┘  │
│            │                │                                    │
│  ┌─────────┴────┐  ┌───────┴────────┐  ┌──────────────────┐    │
│  │ External APIs │  │  Claude API    │  │    Database       │    │
│  │ FRED/YF/WB   │  │ (Anthropic)    │  │  SQLite/PgSQL    │    │
│  └──────────────┘  └────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 4. 디렉토리 구조

```
MESA/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py
│   │   ├── core/               # 핵심 설정
│   │   │   ├── __init__.py
│   │   │   ├── config.py       # Pydantic Settings 환경 설정
│   │   │   └── database.py     # DB 연결 및 세션 관리
│   │   ├── data/               # 정적 데이터 설정
│   │   │   └── indicators_config.json  # 경제 지표 메타데이터
│   │   ├── api/                # API 엔드포인트
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # 메인 라우터
│   │   │   ├── reports.py      # 리포트 CRUD API
│   │   │   ├── settings.py     # 사용자 설정 API
│   │   │   ├── auth.py         # 인증 API
│   │   │   └── push.py         # Push 구독 관리 API
│   │   ├── services/           # 비즈니스 로직
│   │   │   ├── __init__.py
│   │   │   ├── data_service.py      # 경제 데이터 수집 (FRED/Yahoo/WB)
│   │   │   ├── ai_service.py        # Claude API 연동 (리포트 생성)
│   │   │   ├── report_service.py    # 리포트 오케스트레이션
│   │   │   ├── push_service.py      # Web Push 알림 전송
│   │   │   └── scheduler_service.py # APScheduler 관리
│   │   ├── models/             # SQLAlchemy 모델
│   │   │   ├── __init__.py
│   │   │   ├── base.py         # Base 모델 (공통 필드)
│   │   │   ├── user.py         # 사용자 + 설정 모델
│   │   │   └── report.py       # 리포트 모델
│   │   ├── schemas/            # Pydantic 스키마 (요청/응답)
│   │   │   ├── __init__.py
│   │   │   ├── report.py
│   │   │   ├── settings.py
│   │   │   └── user.py
│   │   └── templates/          # HTML 리포트 Jinja2 템플릿
│   │       ├── base.html
│   │       ├── report_beginner.html
│   │       ├── report_standard.html
│   │       └── report_expert.html
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── requirements.txt        # Python 의존성
│   └── .env.example            # 환경변수 예시
├── frontend/                   # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                # App Router 페이지
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # 대시보드 (메인)
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx    # 리포트 목록
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 리포트 상세 뷰어
│   │   │   └── settings/
│   │   │       └── page.tsx    # 사용자 설정
│   │   ├── components/         # 재사용 UI 컴포넌트
│   │   ├── lib/                # 유틸리티 및 API 클라이언트
│   │   └── types/              # TypeScript 타입 정의
│   ├── public/
│   │   ├── manifest.json       # PWA 매니페스트
│   │   └── sw.js               # Service Worker
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/                       # 프로젝트 문서
│   ├── architecture.md         # 아키텍처 문서 (이 파일)
│   └── spec.md                 # 기능 스펙 문서
├── legacy/                     # v1 아카이브 (트레이딩 봇)
├── discord-github-worker/      # Discord-GitHub 연동 워커
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## 5. 핵심 플로우

### 5.1 리포트 생성 파이프라인

```
APScheduler (Cron Trigger)
    │
    ▼
[1] 대상 사용자 조회
    │  - 현재 시간에 리포트 수신 예정인 사용자 필터링
    │  - 사용자별 구독 설정 (주기, 지표, 레벨) 로드
    │
    ▼
[2] 경제 데이터 수집 (DataCollectorService)
    │  - FRED API: 금리, GDP, CPI, 실업률 등 거시지표
    │  - Yahoo Finance: 주요 지수, 환율, 원자재
    │  - World Bank API: 국가별 경제 데이터
    │  - 수집된 데이터를 구조화된 JSON으로 정규화
    │
    ▼
[3] AI 리포트 생성 (ReportGeneratorService)
    │  - 사용자 레벨에 맞는 시스템 프롬프트 선택
    │  - 수집된 데이터 + 프롬프트 → Claude API 호출
    │  - 응답을 파싱하여 구조화된 리포트 객체 생성
    │  - 3줄 Executive Summary 추출/검증
    │
    ▼
[4] HTML 렌더링
    │  - Jinja2 템플릿 엔진으로 HTML 리포트 생성
    │  - 레벨별 다른 템플릿 적용
    │  - 차트/시각화 데이터 포함
    │
    ▼
[5] 저장 및 알림
    │  - DB에 리포트 저장
    │  - Web Push로 사용자에게 알림 전송
    │
    ▼
[완료] 사용자가 알림 클릭 → 프론트엔드에서 리포트 열람
```

### 5.2 사용자 설정 플로우

```
사용자 (Frontend)
    │
    ├─ 리포트 주기 설정: 일간 / 주간 / 월간
    ├─ 관심 지표 선택: GDP, CPI, 금리, 실업률, 환율 등 (다중 선택)
    ├─ 리포트 레벨: 주린이 / 일반 / 전문가
    └─ Push 알림 구독 동의
    │
    ▼
API: PUT /api/settings
    │
    ▼
DB 저장 → 스케줄러에 작업 등록/업데이트
```

### 5.3 Push 알림 플로우

```
[Service Worker 등록]
Frontend → 브라우저 Push 권한 요청 → 구독 객체 생성
    │
    ▼
API: POST /api/push/subscribe
    │  - endpoint, keys(p256dh, auth) 저장
    │
    ▼
[알림 전송 시]
Backend → pywebpush → Push Service → 브라우저 → Service Worker
    │
    ▼
Service Worker: 알림 표시 → 클릭 시 리포트 페이지로 이동
```

## 6. 데이터 모델

### 6.1 User

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| email | String | 사용자 이메일 |
| created_at | DateTime | 생성일 |

### 6.2 UserSettings

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| frequency | Enum | DAILY / WEEKLY / MONTHLY |
| indicators | JSON | 선택한 경제 지표 목록 |
| level | Enum | BEGINNER / STANDARD / EXPERT |
| preferred_time | Time | 리포트 수신 희망 시간 |

### 6.3 Report

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| title | String | 리포트 제목 |
| executive_summary | Text | 3줄 요약 |
| content_html | Text | HTML 본문 |
| level | Enum | 생성 시 사용된 레벨 |
| indicators_used | JSON | 분석에 사용된 지표 |
| created_at | DateTime | 생성일 |

### 6.4 PushSubscription

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| endpoint | String | Push 서비스 엔드포인트 |
| p256dh_key | String | 암호화 키 |
| auth_key | String | 인증 키 |
| created_at | DateTime | 생성일 |

## 7. API 설계

### 7.1 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 (JWT 발급) |

### 7.2 리포트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/reports | 리포트 목록 조회 (페이지네이션) |
| GET | /api/reports/{id} | 리포트 상세 조회 |
| POST | /api/reports/generate | 즉시 리포트 생성 (수동) |
| DELETE | /api/reports/{id} | 리포트 삭제 |

### 7.3 설정

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/settings | 현재 설정 조회 |
| PUT | /api/settings | 설정 업데이트 |
| GET | /api/settings/indicators | 선택 가능한 지표 목록 |

### 7.4 Push 알림

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/push/subscribe | Push 구독 등록 |
| DELETE | /api/push/subscribe | Push 구독 해제 |
| POST | /api/push/test | 테스트 알림 전송 |

## 8. AI 프롬프트 전략

### 8.1 레벨별 시스템 프롬프트

**주린이 (Beginner)**
- 쉬운 말과 일상적인 비유를 사용
- 경제 용어마다 괄호 안에 쉬운 설명 추가
- 실생활 영향 중심으로 설명
- 예시: "금리가 올랐어요 (은행에 돈을 맡기면 이자를 더 받고, 대출 이자도 올라가요)"

**일반 (Standard)**
- 표준적인 경제 분석 톤
- 주요 용어는 설명 없이 사용 가능
- 데이터 기반 분석 + 시장 전망

**전문가 (Expert)**
- 기술적 분석 용어 적극 활용
- 통계 수치와 계량 데이터 중심
- 상관관계, 선행지표 분석 포함
- 투자 시사점 및 리스크 팩터 분석

### 8.2 리포트 구조 (공통)

```
[Executive Summary]  ← 반드시 3줄, 두괄식
- 핵심 요약 1
- 핵심 요약 2
- 핵심 요약 3

[주요 경제 지표 분석]
- 선택된 지표별 현황 및 변동

[시장 동향]
- 종합적인 시장 흐름 분석

[전망 및 시사점]
- 향후 전망
- 주의할 점
```

## 9. 스케줄러 설계

APScheduler를 사용하여 리포트 생성 작업을 관리한다.

```python
# 스케줄 유형
DAILY   → 매일 사용자 지정 시간
WEEKLY  → 매주 월요일 사용자 지정 시간
MONTHLY → 매월 1일 사용자 지정 시간
```

### 처리 방식
1. 서버 시작 시 모든 활성 사용자의 스케줄을 APScheduler에 등록
2. 사용자 설정 변경 시 해당 작업 재등록
3. 각 작업은 독립적으로 실행 (사용자 A의 실패가 사용자 B에 영향 없음)
4. 실패 시 최대 3회 재시도 후 에러 로깅

## 10. 보안 고려사항

- **API 키 관리**: 모든 외부 API 키는 환경변수로 관리 (.env)
- **인증**: JWT 기반 인증, 토큰 만료 시간 설정
- **CORS**: 프론트엔드 도메인만 허용
- **Rate Limiting**: API 엔드포인트별 요청 제한
- **VAPID 키**: Push 알림용 키 쌍 안전하게 관리

## 11. 개발 환경 설정

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # 환경변수 설정
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 12. 향후 확장 계획

- 멀티 에이전트 토론 시스템 (v1 컨셉에서 발전)
- 이메일 리포트 전달 옵션
- 리포트 공유 기능
- 사용자 맞춤 포트폴리오 분석
- 시계열 데이터 시각화 (차트 내장)
