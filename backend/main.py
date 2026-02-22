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
    from app.services.report_service import generate_all_due_reports

    async def _run():
        async with AsyncSessionLocal() as db:
            await generate_all_due_reports(db)

    # 매일 오전 8시 KST = UTC 23:00
    scheduler.add_job(_run, CronTrigger(hour=23, minute=0, timezone="UTC"), id="daily_reports")


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
