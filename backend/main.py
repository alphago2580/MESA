"""
MESA v2 - Economic Report Service
FastAPI 애플리케이션 메인 엔트리포인트
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import init_db, AsyncSessionLocal
from app.api import auth_router, reports_router, settings_router, indicators_router

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    _setup_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()


def _setup_scheduler():
    """
    유저별 report_frequency 기준 일간/주간/월간 스케줄 등록.
    - 일간(DAILY):   매일 오전 8시 KST (UTC 23:00)
    - 주간(WEEKLY):  매주 월요일 오전 8시 KST (UTC 23:00)
    - 월간(MONTHLY): 매월 1일 오전 8시 KST (UTC 23:00)
    """
    from app.services.report_service import generate_reports_by_frequency
    from app.models.user import ReportFrequency

    async def _run_daily():
        async with AsyncSessionLocal() as db:
            count = await generate_reports_by_frequency(db, ReportFrequency.DAILY)
            print(f"[SCHEDULER] daily: {count}개 리포트 생성 완료")

    async def _run_weekly():
        async with AsyncSessionLocal() as db:
            count = await generate_reports_by_frequency(db, ReportFrequency.WEEKLY)
            print(f"[SCHEDULER] weekly: {count}개 리포트 생성 완료")

    async def _run_monthly():
        async with AsyncSessionLocal() as db:
            count = await generate_reports_by_frequency(db, ReportFrequency.MONTHLY)
            print(f"[SCHEDULER] monthly: {count}개 리포트 생성 완료")

    # 일간: 매일 오전 8시 KST = UTC 23:00
    scheduler.add_job(
        _run_daily,
        CronTrigger(hour=23, minute=0, timezone="UTC"),
        id="daily_reports",
        replace_existing=True,
    )

    # 주간: 매주 월요일 오전 8시 KST = UTC 23:00
    scheduler.add_job(
        _run_weekly,
        CronTrigger(day_of_week="mon", hour=23, minute=0, timezone="UTC"),
        id="weekly_reports",
        replace_existing=True,
    )

    # 월간: 매월 1일 오전 8시 KST = UTC 23:00
    scheduler.add_job(
        _run_monthly,
        CronTrigger(day=1, hour=23, minute=0, timezone="UTC"),
        id="monthly_reports",
        replace_existing=True,
    )


app = FastAPI(
    title="MESA v2 - Economic Report Service",
    description="AI 기반 경제 리포트 서비스",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mesa.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(indicators_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "mesa-v2"}
