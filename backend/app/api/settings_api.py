"""사용자 설정 API (리포트 주기, 지표 선택, 깊이 레벨, 푸시 구독)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, Any

from ..core.database import get_db
from ..models.user import User, ReportLevel, ReportFrequency
from .auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    report_level: Optional[str] = None      # "beginner" | "standard" | "expert"
    report_frequency: Optional[str] = None  # "daily" | "weekly" | "monthly"
    selected_indicators: Optional[list[str]] = None


class PushSubscriptionUpdate(BaseModel):
    subscription: Optional[dict[str, Any]] = None  # None = 구독 해제
    enabled: bool = True


class VapidKeyResponse(BaseModel):
    public_key: str


@router.patch("/")
async def update_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """리포트 수신 설정 업데이트"""
    if data.report_level is not None:
        try:
            current_user.report_level = ReportLevel(data.report_level)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"올바르지 않은 레벨: {data.report_level}")

    if data.report_frequency is not None:
        try:
            current_user.report_frequency = ReportFrequency(data.report_frequency)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"올바르지 않은 주기: {data.report_frequency}")

    if data.selected_indicators is not None:
        current_user.selected_indicators = data.selected_indicators

    await db.commit()
    return {"message": "설정이 저장되었습니다", "settings": {
        "report_level": current_user.report_level.value,
        "report_frequency": current_user.report_frequency.value,
        "selected_indicators": current_user.selected_indicators,
    }}


@router.post("/push-subscription")
async def update_push_subscription(
    data: PushSubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Web Push 구독 정보 저장/해제"""
    if data.subscription is None:
        current_user.push_subscription = None
        current_user.push_enabled = False
    else:
        current_user.push_subscription = data.subscription
        current_user.push_enabled = data.enabled
    await db.commit()
    return {"message": "푸시 설정이 업데이트되었습니다", "push_enabled": current_user.push_enabled}


@router.get("/vapid-public-key", response_model=VapidKeyResponse)
async def get_vapid_public_key():
    """클라이언트용 VAPID 공개키 반환"""
    from ..core.config import settings
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push 알림이 설정되지 않았습니다")
    return {"public_key": settings.VAPID_PUBLIC_KEY}
