# MESA v2 - AI 경제 리포트 서비스

AI가 분석한 거시경제 인사이트를 개인화된 HTML 리포트로 받아보는 서비스입니다.

## 핵심 기능

- **AI 인사이트**: Claude API 기반 심층 경제 분석
- **레벨별 리포트**: 주린이 / 일반 / 전문가 3단계 깊이 조절
- **두괄식 구성**: 모든 리포트 맨 앞에 3줄 Executive Summary
- **구독 설정**: 일간 / 주간 / 월간 수신 주기 선택
- **지표 선택**: 금리, 물가, 고용, GDP, 주가지수, 환율, 원자재 등 24개 지표
- **앱 알림**: Web Push (PWA) 기반 브라우저 알림
- **HTML 리포트**: 반응형, 다크모드 지원, 인쇄 가능

## 프로젝트 구조

```
MESA/
├── backend/               # FastAPI 백엔드
│   ├── app/
│   │   ├── api/           # API 라우터 (auth, reports, settings, indicators)
│   │   ├── core/          # 설정, DB 연결
│   │   ├── models/        # SQLAlchemy 모델 (User, Report)
│   │   ├── services/      # 비즈니스 로직
│   │   │   ├── data_service.py      # FRED/Yahoo Finance 데이터 수집
│   │   │   ├── ai_service.py        # Claude API 인사이트 생성
│   │   │   ├── template_renderer.py # HTML 리포트 렌더링
│   │   │   ├── report_service.py    # 리포트 생성 오케스트레이션
│   │   │   └── push_service.py      # Web Push 알림
│   │   ├── templates/     # Jinja2 HTML 리포트 템플릿
│   │   └── data/          # 경제 지표 메타데이터 (JSON)
│   └── main.py            # 앱 엔트리포인트 + 스케줄러
├── frontend/              # Next.js 14 프론트엔드
│   ├── src/app/           # App Router 페이지
│   │   ├── page.tsx       # 대시보드
│   │   ├── login/         # 로그인/회원가입
│   │   ├── reports/[id]/  # 리포트 뷰어
│   │   └── settings/      # 리포트 설정
│   ├── src/lib/           # API 클라이언트, 타입
│   └── public/sw.js       # Service Worker (Push 알림)
├── docs/                  # 설계 문서
│   ├── architecture.md    # 시스템 아키텍처
│   ├── spec.md            # 기능 스펙
│   └── indicators.md      # 경제 지표 목록
└── legacy/                # MESA v1 (crypto trading bot) 아카이브
```

## 빠른 시작

### 1. 백엔드 실행

```bash
cd backend
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 등 설정

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## 환경 변수

`backend/.env` 파일:

| 변수 | 필수 | 설명 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 |
| `FRED_API_KEY` | 권장 | FRED 경제 데이터 API 키 (무료) |
| `SECRET_KEY` | ✅ | JWT 서명 키 |
| `VAPID_PRIVATE_KEY` | 선택 | Web Push 알림용 |
| `VAPID_PUBLIC_KEY` | 선택 | Web Push 알림용 |

## API 문서

백엔드 실행 후: http://localhost:8000/docs

## 경제 지표 (24개)

| 카테고리 | 지표 예시 |
|----------|-----------|
| 금리/통화정책 | 미국 기준금리, 장단기 스프레드, 10년물 국채 |
| 물가/인플레이션 | CPI, PCE, PPI |
| 고용 | 실업률, NFP |
| 경제성장 | GDP, ISM PMI |
| 시장지수 | S&P 500, KOSPI, VIX |
| 환율/원자재 | USD/KRW, DXY, WTI, 금 |

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, PWA
- **Backend**: FastAPI, SQLAlchemy, APScheduler
- **AI**: Claude API (claude-sonnet-4-6)
- **데이터**: FRED API, Yahoo Finance, World Bank
- **알림**: Web Push (pywebpush)
- **DB**: SQLite (개발) / PostgreSQL (프로덕션)

## 라이선스

MIT
