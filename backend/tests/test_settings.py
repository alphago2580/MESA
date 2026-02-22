"""
FR-02: 리포트 설정 E2E 테스트
- 수신 주기, 관심 지표, 레벨 설정
"""
import pytest
from httpx import AsyncClient
from .conftest import create_and_login, auth_headers


@pytest.mark.asyncio
async def test_get_default_settings(client: AsyncClient):
    """신규 가입자 기본 설정 조회 (/auth/me 통해 확인)"""
    token = await create_and_login(client)
    resp = await client.get("/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["report_level"] == "standard"
    assert data["report_frequency"] == "weekly"


@pytest.mark.asyncio
async def test_update_report_level(client: AsyncClient):
    """리포트 레벨 변경 (주린이/일반/전문가)"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/settings/",
        headers=auth_headers(token),
        json={"report_level": "beginner"},
    )
    assert resp.status_code == 200
    assert resp.json()["settings"]["report_level"] == "beginner"


@pytest.mark.asyncio
async def test_update_frequency(client: AsyncClient):
    """수신 주기 변경"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/settings/",
        headers=auth_headers(token),
        json={"report_frequency": "daily"},
    )
    assert resp.status_code == 200
    assert resp.json()["settings"]["report_frequency"] == "daily"


@pytest.mark.asyncio
async def test_update_selected_indicators(client: AsyncClient):
    """관심 지표 선택"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/settings/",
        headers=auth_headers(token),
        json={"selected_indicators": ["sp500", "us_cpi", "us_unemployment"]},
    )
    assert resp.status_code == 200
    assert "sp500" in resp.json()["settings"]["selected_indicators"]


@pytest.mark.asyncio
async def test_settings_persist(client: AsyncClient):
    """설정 변경 후 /auth/me에 반영 확인"""
    token = await create_and_login(client)
    await client.patch(
        "/settings/",
        headers=auth_headers(token),
        json={"report_level": "expert", "report_frequency": "daily"},
    )
    me = await client.get("/auth/me", headers=auth_headers(token))
    assert me.json()["report_level"] == "expert"
    assert me.json()["report_frequency"] == "daily"


@pytest.mark.asyncio
async def test_invalid_report_level(client: AsyncClient):
    """유효하지 않은 레벨 설정 거부"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/settings/",
        headers=auth_headers(token),
        json={"report_level": "god_tier"},
    )
    assert resp.status_code in (400, 422)
