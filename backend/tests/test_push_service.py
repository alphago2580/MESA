"""
push_service.py 단위 테스트

- send_push_notification: VAPID 키 없음, pywebpush 없음, 성공/실패/예외 케이스
- send_report_notification: push_enabled True/False, subscription 유무, 알림 내용 검증
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


# ──────────────────────────────────────────────
# 테스트용 목업 클래스
# ──────────────────────────────────────────────

class MockUser:
    """User 모델 목업"""
    def __init__(self, push_enabled: bool = False, push_subscription=None):
        self.id = 1
        self.push_enabled = push_enabled
        self.push_subscription = push_subscription


class MockReport:
    """Report 모델 목업"""
    def __init__(self, id: int = 1, summary: str = "요약 첫 번째 줄\n두 번째 줄"):
        self.id = id
        self.summary = summary


# ──────────────────────────────────────────────
# send_push_notification 테스트
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_push_returns_false_when_no_vapid_key():
    """VAPID 키가 설정되지 않으면 False를 반환한다"""
    from app.services.push_service import send_push_notification

    with patch("app.services.push_service.settings") as mock_settings:
        mock_settings.VAPID_PRIVATE_KEY = ""
        mock_settings.VAPID_CLAIMS_EMAIL = "admin@mesa.local"

        result = await send_push_notification(
            subscription={"endpoint": "https://example.com/push/sub1"},
            title="테스트 알림",
            body="내용",
        )

    assert result is False


@pytest.mark.asyncio
async def test_send_push_returns_false_when_pywebpush_not_installed():
    """pywebpush 라이브러리가 없으면 False를 반환한다"""
    from app.services import push_service

    original = push_service.HAS_WEBPUSH
    try:
        push_service.HAS_WEBPUSH = False
        result = await push_service.send_push_notification(
            subscription={"endpoint": "https://example.com/push/sub1"},
            title="테스트 알림",
            body="내용",
        )
        assert result is False
    finally:
        push_service.HAS_WEBPUSH = original


@pytest.mark.asyncio
async def test_send_push_returns_true_on_success():
    """VAPID 키가 있고 webpush 호출이 성공하면 True를 반환한다"""
    from app.services import push_service

    subscription = {
        "endpoint": "https://fcm.googleapis.com/push/sub123",
        "keys": {"p256dh": "abc", "auth": "xyz"},
    }

    with patch("app.services.push_service.HAS_WEBPUSH", True), \
         patch("app.services.push_service.settings") as mock_settings, \
         patch("app.services.push_service.webpush") as mock_webpush:

        mock_settings.VAPID_PRIVATE_KEY = "fake-private-key"
        mock_settings.VAPID_CLAIMS_EMAIL = "admin@mesa.local"
        mock_webpush.return_value = None

        result = await push_service.send_push_notification(
            subscription=subscription,
            title="새 리포트",
            body="리포트가 생성되었습니다",
            url="/reports/1",
        )

    assert result is True
    mock_webpush.assert_called_once()


@pytest.mark.asyncio
async def test_send_push_passes_correct_vapid_claims():
    """webpush 호출 시 VAPID private key와 claims를 올바르게 전달한다"""
    from app.services import push_service

    subscription = {"endpoint": "https://example.com/push/sub1"}

    with patch("app.services.push_service.HAS_WEBPUSH", True), \
         patch("app.services.push_service.settings") as mock_settings, \
         patch("app.services.push_service.webpush") as mock_webpush:

        mock_settings.VAPID_PRIVATE_KEY = "test-private-key"
        mock_settings.VAPID_CLAIMS_EMAIL = "test@mesa.local"
        mock_webpush.return_value = None

        await push_service.send_push_notification(
            subscription=subscription,
            title="알림",
            body="내용",
        )

        call_kwargs = mock_webpush.call_args[1]
        assert call_kwargs["vapid_private_key"] == "test-private-key"
        assert call_kwargs["vapid_claims"]["sub"] == "mailto:test@mesa.local"


@pytest.mark.asyncio
async def test_send_push_returns_false_on_webpush_exception():
    """WebPushException 발생 시 False를 반환한다"""
    from app.services import push_service

    with patch("app.services.push_service.HAS_WEBPUSH", True), \
         patch("app.services.push_service.settings") as mock_settings, \
         patch("app.services.push_service.webpush") as mock_webpush, \
         patch("app.services.push_service.WebPushException", Exception):

        mock_settings.VAPID_PRIVATE_KEY = "fake-private-key"
        mock_settings.VAPID_CLAIMS_EMAIL = "admin@mesa.local"
        mock_webpush.side_effect = Exception("push 전송 실패")

        result = await push_service.send_push_notification(
            subscription={"endpoint": "https://example.com/push/sub1"},
            title="테스트",
            body="내용",
        )

    assert result is False


@pytest.mark.asyncio
async def test_send_push_returns_false_on_unexpected_exception():
    """예상치 못한 일반 예외 발생 시 False를 반환한다"""
    from app.services import push_service

    with patch("app.services.push_service.HAS_WEBPUSH", True), \
         patch("app.services.push_service.settings") as mock_settings, \
         patch("app.services.push_service.webpush") as mock_webpush:

        mock_settings.VAPID_PRIVATE_KEY = "fake-private-key"
        mock_settings.VAPID_CLAIMS_EMAIL = "admin@mesa.local"
        mock_webpush.side_effect = RuntimeError("네트워크 오류")

        result = await push_service.send_push_notification(
            subscription={"endpoint": "https://example.com/push/sub1"},
            title="테스트",
            body="내용",
        )

    assert result is False


# ──────────────────────────────────────────────
# send_report_notification 테스트
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_report_notification_skipped_when_push_disabled():
    """push_enabled=False이면 알림을 전송하지 않고 False를 반환한다"""
    from app.services.push_service import send_report_notification

    user = MockUser(push_enabled=False, push_subscription={"endpoint": "https://example.com/push/sub1"})
    report = MockReport()

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        result = await send_report_notification(user, report)

    assert result is False
    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_report_notification_skipped_when_no_subscription():
    """push_subscription이 None이면 알림을 전송하지 않고 False를 반환한다"""
    from app.services.push_service import send_report_notification

    user = MockUser(push_enabled=True, push_subscription=None)
    report = MockReport()

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        result = await send_report_notification(user, report)

    assert result is False
    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_report_notification_sends_when_subscribed():
    """push_enabled=True이고 subscription이 있으면 알림을 전송한다"""
    from app.services.push_service import send_report_notification

    sub = {"endpoint": "https://fcm.googleapis.com/push/sub1", "keys": {"p256dh": "abc", "auth": "xyz"}}
    user = MockUser(push_enabled=True, push_subscription=sub)
    report = MockReport(id=42, summary="요약 첫 줄\n두 번째 줄")

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        result = await send_report_notification(user, report)

    assert result is True
    mock_send.assert_called_once_with(
        subscription=sub,
        title="📊 새 경제 리포트 도착",
        body="요약 첫 줄",
        url="/reports/42",
    )


@pytest.mark.asyncio
async def test_report_notification_uses_first_line_of_summary():
    """summary가 여러 줄일 때 첫 번째 줄만 body로 사용한다"""
    from app.services.push_service import send_report_notification

    sub = {"endpoint": "https://example.com/push/sub1"}
    user = MockUser(push_enabled=True, push_subscription=sub)
    report = MockReport(id=1, summary="첫째 줄\n둘째 줄\n셋째 줄")

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        await send_report_notification(user, report)

    _, call_kwargs = mock_send.call_args
    assert call_kwargs["body"] == "첫째 줄"


@pytest.mark.asyncio
async def test_report_notification_fallback_when_summary_empty():
    """summary가 빈 문자열이면 fallback 메시지를 body로 사용한다"""
    from app.services.push_service import send_report_notification

    sub = {"endpoint": "https://example.com/push/sub1"}
    user = MockUser(push_enabled=True, push_subscription=sub)
    report = MockReport(id=1, summary="")

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        await send_report_notification(user, report)

    _, call_kwargs = mock_send.call_args
    assert call_kwargs["body"] == "새 리포트를 확인하세요"


@pytest.mark.asyncio
async def test_report_notification_includes_report_url():
    """알림의 url이 /reports/{report.id} 형식으로 설정된다"""
    from app.services.push_service import send_report_notification

    sub = {"endpoint": "https://example.com/push/sub1"}
    user = MockUser(push_enabled=True, push_subscription=sub)
    report = MockReport(id=99, summary="요약 내용")

    with patch("app.services.push_service.send_push_notification", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        await send_report_notification(user, report)

    _, call_kwargs = mock_send.call_args
    assert call_kwargs["url"] == "/reports/99"
