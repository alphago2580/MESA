"""
리포트 생성 오케스트레이션 서비스
데이터 수집 → AI 분석 → DB 저장 → 푸시 알림 파이프라인을 관리합니다.
"""
import json
from datetime import date
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.user import User, ReportLevel, ReportFrequency
from ..models.report import Report
from .data_service import data_service
from . import ai_service
from .push_service import send_report_notification


# 기본 지표 설정 로드
_INDICATORS_CONFIG: list[dict] = []

def _load_indicators_config() -> list[dict]:
    global _INDICATORS_CONFIG
    if _INDICATORS_CONFIG:
        return _INDICATORS_CONFIG
    config_path = Path(__file__).parent.parent / "data" / "indicators_config.json"
    if config_path.exists():
        with open(config_path) as f:
            raw = json.load(f)
            if isinstance(raw, dict):
                _INDICATORS_CONFIG = raw.get("indicators", [])
            else:
                _INDICATORS_CONFIG = raw
    return _INDICATORS_CONFIG


DEFAULT_INDICATORS = [
    "fed_funds_rate", "us_10y_treasury", "us_cpi",
    "us_unemployment", "sp500", "vix", "usd_krw", "wti_crude",
]


async def generate_user_report(user: User, db: AsyncSession) -> Report:
    """
    사용자 설정에 맞는 리포트 생성 후 DB 저장 및 푸시 알림 전송
    """
    indicator_ids = user.selected_indicators or DEFAULT_INDICATORS
    level = user.report_level or ReportLevel.STANDARD
    configs = _load_indicators_config()

    # 1. 데이터 수집
    raw_data = await data_service.fetch_all_indicators(indicator_ids)

    # 2. AI 리포트 생성
    result = await ai_service.generate_report(raw_data, level, configs)

    # 3. DB 저장
    report = Report(
        user_id=user.id,
        title=result["title"],
        summary=result["summary"],
        html_content=result["html_content"],
        level=level,
        indicators_used=indicator_ids,
        raw_data=raw_data,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # 4. 푸시 알림
    await send_report_notification(user, report)

    return report


async def generate_reports_by_frequency(db: AsyncSession, frequency: ReportFrequency) -> int:
    """
    특정 frequency의 모든 활성 사용자 리포트 생성.
    성공적으로 생성된 리포트 수를 반환합니다.
    """
    result = await db.execute(
        select(User).where(User.is_active == True, User.report_frequency == frequency)
    )
    users = result.scalars().all()

    success_count = 0
    for user in users:
        try:
            await generate_user_report(user, db)
            success_count += 1
        except Exception as e:
            print(f"[REPORT] Error generating {frequency} report for user {user.id}: {e}")

    return success_count


async def generate_all_due_reports(db: AsyncSession):
    """
    스케줄러에서 호출: 오늘 리포트를 받아야 할 모든 사용자에게 생성.
    report_frequency 기준으로 일간/주간/월간 조건을 체크합니다.
    """
    today = date.today()
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()

    for user in users:
        should_generate = False
        if user.report_frequency == ReportFrequency.DAILY:
            should_generate = True
        elif user.report_frequency == ReportFrequency.WEEKLY:
            should_generate = (today.weekday() == 0)  # 월요일
        elif user.report_frequency == ReportFrequency.MONTHLY:
            should_generate = (today.day == 1)  # 매월 1일

        if should_generate:
            try:
                await generate_user_report(user, db)
            except Exception as e:
                print(f"[REPORT] Error generating report for user {user.id}: {e}")
