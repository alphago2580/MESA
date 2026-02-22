"""
Web Push 알림 서비스
사용자에게 새 리포트 생성 시 브라우저 푸시 알림을 전송합니다.
"""
import json
from typing import Any

try:
    from pywebpush import webpush, WebPushException
    HAS_WEBPUSH = True
except ImportError:
    HAS_WEBPUSH = False

from ..core.config import settings


async def send_push_notification(
    subscription: dict[str, Any],
    title: str,
    body: str,
    url: str = "/",
) -> bool:
    """
    단일 사용자에게 Web Push 알림 전송
    subscription: PushSubscription JSON (endpoint, keys)
    """
    if not HAS_WEBPUSH:
        print("[PUSH] pywebpush not installed, skipping push notification")
        return False
    if not settings.VAPID_PRIVATE_KEY:
        print("[PUSH] VAPID key not configured, skipping push notification")
        return False

    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/icons/icon-192x192.png",
    })

    try:
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"},
        )
        return True
    except WebPushException as e:
        print(f"[PUSH] WebPush error: {e}")
        return False
    except Exception as e:
        print(f"[PUSH] Unexpected error: {e}")
        return False


async def send_report_notification(user, report) -> bool:
    """리포트 생성 완료 후 해당 사용자에게 알림 전송"""
    if not user.push_enabled or not user.push_subscription:
        return False
    return await send_push_notification(
        subscription=user.push_subscription,
        title=f"📊 새 경제 리포트 도착",
        body=report.summary.split("\n")[0] if report.summary else "새 리포트를 확인하세요",
        url=f"/reports/{report.id}",
    )
