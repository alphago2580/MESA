"""
MESA v2 테스트 공용 픽스처

- in-memory SQLite DB (테스트마다 격리)
- AI 서비스 mock (Anthropic API 호출 차단)
- 데이터 서비스 mock (FRED/yfinance 외부 호출 차단)
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from unittest.mock import AsyncMock, patch

from app.core.database import get_db
from app.models.base import Base


# ──────────────────────────────────────────────
# DB 픽스처 (in-memory SQLite, 테스트마다 격리)
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def db_session():
    """테스트용 인메모리 SQLite 세션"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


# ──────────────────────────────────────────────
# FastAPI TestClient
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """FastAPI ASGI 테스트 클라이언트 (실제 DB 격리 버전)"""
    from main import app  # noqa: 지연 임포트 (backend/ 디렉토리 기준)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ──────────────────────────────────────────────
# AI 서비스 mock
# ──────────────────────────────────────────────

MOCK_AI_REPORT = "<h2>테스트 리포트</h2><p>AI 분석 결과입니다.</p>"

@pytest.fixture(autouse=True)
def mock_ai_service():
    """Anthropic API 호출을 mock으로 대체 (모든 테스트에 자동 적용)"""
    with patch("app.services.ai_service.generate_report") as mock_gen:
        mock_gen.return_value = {
            "title": "테스트 리포트 (2024-10)",
            "summary": "AI 분석 요약 텍스트입니다.",
            "html_content": MOCK_AI_REPORT,
        }
        yield mock_gen


# ──────────────────────────────────────────────
# 데이터 서비스 mock (FRED / yfinance)
# ──────────────────────────────────────────────

MOCK_INDICATOR_DATA = {
    "sp500": {"value": 5800.0, "change": 0.5, "unit": "포인트", "period": "2024-10"},
    "us_cpi": {"value": 315.6, "change": 2.6, "unit": "지수", "period": "2024-10"},
    "us_unemployment": {"value": 4.1, "change": -0.1, "unit": "%", "period": "2024-10"},
}

@pytest.fixture(autouse=True)
def mock_data_service():
    """FRED/yfinance 외부 API 호출을 mock으로 대체 (모든 테스트에 자동 적용)"""
    with patch("app.services.data_service.data_service.fetch_all_indicators",
               new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = MOCK_INDICATOR_DATA
        yield mock_fetch


# ──────────────────────────────────────────────
# 공통 헬퍼
# ──────────────────────────────────────────────

TEST_USER = {"email": "testuser@example.com", "password": "test1234!"}


async def create_and_login(client: AsyncClient, user: dict = TEST_USER) -> str:
    """회원가입 + 로그인 후 access_token 반환"""
    await client.post("/auth/register", json=user)
    resp = await client.post(
        "/auth/token",
        data={"username": user["email"], "password": user["password"]},
    )
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    """Authorization 헤더 딕셔너리 반환"""
    return {"Authorization": f"Bearer {token}"}
