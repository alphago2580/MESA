from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional

from ..core.database import get_db
from ..models.report import Report
from ..models.user import User
from ..services.report_service import generate_user_report
from .auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportResponse(BaseModel):
    id: int
    title: str
    summary: str
    level: str
    indicators_used: list
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ReportResponse])
async def list_reports(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """사용자의 리포트 목록 조회 (최신순)"""
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(desc(Report.created_at))
        .offset(skip)
        .limit(limit)
    )
    reports = result.scalars().all()
    return [
        ReportResponse(
            id=r.id,
            title=r.title,
            summary=r.summary,
            level=r.level.value,
            indicators_used=r.indicators_used or [],
            is_read=r.is_read,
            created_at=r.created_at.isoformat(),
        )
        for r in reports
    ]


@router.get("/{report_id}/html", response_class=None)
async def get_report_html(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """리포트 HTML 내용 반환"""
    from fastapi.responses import HTMLResponse
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다")

    # 읽음 처리
    if not report.is_read:
        report.is_read = True
        await db.commit()

    return HTMLResponse(content=report.html_content)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """리포트 메타데이터 조회"""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다")
    return ReportResponse(
        id=report.id,
        title=report.title,
        summary=report.summary,
        level=report.level.value,
        indicators_used=report.indicators_used or [],
        is_read=report.is_read,
        created_at=report.created_at.isoformat(),
    )


@router.post("/generate", status_code=status.HTTP_201_CREATED, response_model=ReportResponse)
async def generate_report_now(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """즉시 리포트 생성 (온디맨드)"""
    report = await generate_user_report(current_user, db)
    return ReportResponse(
        id=report.id,
        title=report.title,
        summary=report.summary,
        level=report.level.value,
        indicators_used=report.indicators_used or [],
        is_read=report.is_read,
        created_at=report.created_at.isoformat(),
    )
