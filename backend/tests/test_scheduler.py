"""
APScheduler 자동 리포트 생성 테스트
- generate_reports_by_frequency: frequency별 사용자만 선별 처리
- generate_all_due_reports: 날짜 조건에 따른 frequency 필터링
"""
import pytest
from datetime import date
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, ReportFrequency, ReportLevel
from app.services.report_service import (
    generate_reports_by_frequency,
    generate_all_due_reports,
)


# ──────────────────────────────────────────────
# 헬퍼: 가짜 User 객체 생성
# ──────────────────────────────────────────────

def _make_user(user_id: int, frequency: ReportFrequency, is_active: bool = True) -> User:
    user = User()
    user.id = user_id
    user.email = f"user{user_id}@example.com"
    user.hashed_password = "hashed"
    user.is_active = is_active
    user.report_frequency = frequency
    user.report_level = ReportLevel.STANDARD
    user.selected_indicators = []
    return user


# ──────────────────────────────────────────────
# generate_reports_by_frequency 테스트
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_reports_by_frequency_daily_only():
    """DAILY frequency 사용자만 리포트 생성"""
    daily_user = _make_user(1, ReportFrequency.DAILY)
    weekly_user = _make_user(2, ReportFrequency.WEEKLY)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [daily_user]

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.report_service.generate_user_report", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = MagicMock()
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.DAILY)

    assert count == 1
    mock_gen.assert_called_once_with(daily_user, mock_db)


@pytest.mark.asyncio
async def test_generate_reports_by_frequency_weekly_only():
    """WEEKLY frequency 사용자만 리포트 생성"""
    weekly_user = _make_user(3, ReportFrequency.WEEKLY)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [weekly_user]

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.report_service.generate_user_report", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = MagicMock()
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.WEEKLY)

    assert count == 1
    mock_gen.assert_called_once_with(weekly_user, mock_db)


@pytest.mark.asyncio
async def test_generate_reports_by_frequency_monthly_only():
    """MONTHLY frequency 사용자만 리포트 생성"""
    monthly_user = _make_user(4, ReportFrequency.MONTHLY)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [monthly_user]

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.report_service.generate_user_report", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = MagicMock()
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.MONTHLY)

    assert count == 1
    mock_gen.assert_called_once_with(monthly_user, mock_db)


@pytest.mark.asyncio
async def test_generate_reports_by_frequency_no_users():
    """해당 frequency 사용자가 없으면 0 반환"""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.report_service.generate_user_report", new_callable=AsyncMock
    ) as mock_gen:
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.DAILY)

    assert count == 0
    mock_gen.assert_not_called()


@pytest.mark.asyncio
async def test_generate_reports_by_frequency_error_handling():
    """리포트 생성 실패 시 다음 사용자는 계속 처리"""
    user1 = _make_user(1, ReportFrequency.DAILY)
    user2 = _make_user(2, ReportFrequency.DAILY)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [user1, user2]

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    call_count = 0

    async def _side_effect(user, db):
        nonlocal call_count
        call_count += 1
        if user.id == 1:
            raise RuntimeError("AI 서비스 오류")
        return MagicMock()

    with patch(
        "app.services.report_service.generate_user_report",
        side_effect=_side_effect,
    ):
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.DAILY)

    # user1 실패, user2 성공 → 1개
    assert count == 1
    assert call_count == 2


@pytest.mark.asyncio
async def test_generate_reports_multiple_users():
    """여러 사용자 동시 처리"""
    users = [_make_user(i, ReportFrequency.DAILY) for i in range(1, 4)]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = users

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.report_service.generate_user_report", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = MagicMock()
        count = await generate_reports_by_frequency(mock_db, ReportFrequency.DAILY)

    assert count == 3
    assert mock_gen.call_count == 3


# ──────────────────────────────────────────────
# generate_all_due_reports 날짜 조건 테스트
# ──────────────────────────────────────────────

def _make_db_with_users(users: list[User]) -> AsyncMock:
    """사용자 목록을 반환하는 mock DB 세션 생성"""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = users

    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = AsyncMock(return_value=mock_result)
    return mock_db


@pytest.mark.asyncio
async def test_daily_user_always_gets_report():
    """DAILY 사용자는 요일/날짜 무관하게 항상 리포트 생성"""
    daily_user = _make_user(1, ReportFrequency.DAILY)
    # 수요일 (weekday=2)
    wednesday = date(2025, 1, 15)
    mock_db = _make_db_with_users([daily_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = wednesday
        mock_gen.return_value = MagicMock()
        await generate_all_due_reports(mock_db)

    mock_gen.assert_called_once_with(daily_user, mock_db)


@pytest.mark.asyncio
async def test_weekly_user_gets_report_on_monday():
    """WEEKLY 사용자는 월요일에만 리포트 생성"""
    weekly_user = _make_user(2, ReportFrequency.WEEKLY)
    monday = date(2025, 1, 13)  # weekday=0
    assert monday.weekday() == 0

    mock_db = _make_db_with_users([weekly_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = monday
        mock_gen.return_value = MagicMock()
        await generate_all_due_reports(mock_db)

    mock_gen.assert_called_once_with(weekly_user, mock_db)


@pytest.mark.asyncio
async def test_weekly_user_skipped_on_non_monday():
    """WEEKLY 사용자는 월요일이 아닌 날에 리포트 생성 안 함"""
    weekly_user = _make_user(2, ReportFrequency.WEEKLY)
    tuesday = date(2025, 1, 14)  # weekday=1
    assert tuesday.weekday() == 1

    mock_db = _make_db_with_users([weekly_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = tuesday
        await generate_all_due_reports(mock_db)

    mock_gen.assert_not_called()


@pytest.mark.asyncio
async def test_monthly_user_gets_report_on_first_day():
    """MONTHLY 사용자는 매월 1일에만 리포트 생성"""
    monthly_user = _make_user(3, ReportFrequency.MONTHLY)
    first_day = date(2025, 2, 1)  # day=1
    assert first_day.day == 1

    mock_db = _make_db_with_users([monthly_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = first_day
        mock_gen.return_value = MagicMock()
        await generate_all_due_reports(mock_db)

    mock_gen.assert_called_once_with(monthly_user, mock_db)


@pytest.mark.asyncio
async def test_monthly_user_skipped_on_other_days():
    """MONTHLY 사용자는 1일이 아닌 날에 리포트 생성 안 함"""
    monthly_user = _make_user(3, ReportFrequency.MONTHLY)
    second_day = date(2025, 2, 2)  # day=2
    assert second_day.day == 2

    mock_db = _make_db_with_users([monthly_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = second_day
        await generate_all_due_reports(mock_db)

    mock_gen.assert_not_called()


@pytest.mark.asyncio
async def test_mixed_frequencies_monday_first_day():
    """월요일이면서 1일인 경우 weekly/monthly/daily 모두 생성"""
    daily_user = _make_user(1, ReportFrequency.DAILY)
    weekly_user = _make_user(2, ReportFrequency.WEEKLY)
    monthly_user = _make_user(3, ReportFrequency.MONTHLY)

    # 2024-04-01 은 월요일이면서 1일
    monday_and_first = date(2024, 4, 1)
    assert monday_and_first.weekday() == 0
    assert monday_and_first.day == 1

    mock_db = _make_db_with_users([daily_user, weekly_user, monthly_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = monday_and_first
        mock_gen.return_value = MagicMock()
        await generate_all_due_reports(mock_db)

    assert mock_gen.call_count == 3


@pytest.mark.asyncio
async def test_inactive_users_excluded():
    """비활성 사용자(is_active=False)는 리포트 생성 대상에서 제외"""
    # generate_all_due_reports는 DB 쿼리에서 is_active=True 필터링
    # 여기서는 active_user만 DB mock에 포함 (inactive는 쿼리에서 걸러짐)
    active_user = _make_user(1, ReportFrequency.DAILY, is_active=True)
    mock_db = _make_db_with_users([active_user])

    with patch("app.services.report_service.date") as mock_date,  \
         patch("app.services.report_service.generate_user_report", new_callable=AsyncMock) as mock_gen:
        mock_date.today.return_value = date(2025, 1, 15)
        mock_gen.return_value = MagicMock()
        await generate_all_due_reports(mock_db)

    mock_gen.assert_called_once_with(active_user, mock_db)


# ──────────────────────────────────────────────
# 스케줄러 등록 테스트
# ──────────────────────────────────────────────

def test_scheduler_jobs_registered():
    """main.py _setup_scheduler가 3개의 job을 등록하는지 확인"""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from main import _setup_scheduler

    test_scheduler = AsyncIOScheduler()

    # 원본 scheduler를 임시로 교체
    import main as main_module
    original_scheduler = main_module.scheduler
    main_module.scheduler = test_scheduler

    try:
        _setup_scheduler()
        jobs = test_scheduler.get_jobs()
        job_ids = {job.id for job in jobs}

        assert "daily_reports" in job_ids, "daily_reports job 미등록"
        assert "weekly_reports" in job_ids, "weekly_reports job 미등록"
        assert "monthly_reports" in job_ids, "monthly_reports job 미등록"
        assert len(jobs) == 3
    finally:
        main_module.scheduler = original_scheduler
