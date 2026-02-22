"""
FR-01: 회원 관리 E2E 테스트
- 회원가입, 로그인, JWT 발급, 보호된 엔드포인트 접근
"""
import pytest
from httpx import AsyncClient
from .conftest import TEST_USER, create_and_login, auth_headers


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """정상 회원가입"""
    resp = await client.post("/auth/register", json=TEST_USER)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == TEST_USER["email"]
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """중복 이메일 가입 차단"""
    await client.post("/auth/register", json=TEST_USER)
    resp = await client.post("/auth/register", json=TEST_USER)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """로그인 후 JWT 발급"""
    await client.post("/auth/register", json=TEST_USER)
    resp = await client.post(
        "/auth/token",
        data={"username": TEST_USER["email"], "password": TEST_USER["password"]},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert resp.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """틀린 비밀번호로 로그인 실패"""
    await client.post("/auth/register", json=TEST_USER)
    resp = await client.post(
        "/auth/token",
        data={"username": TEST_USER["email"], "password": "wrongpass"},
    )
    assert resp.status_code in (400, 401)


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    """인증 후 /auth/me 조회"""
    token = await create_and_login(client)
    resp = await client.get("/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["email"] == TEST_USER["email"]


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """토큰 없이 /auth/me 접근 차단"""
    resp = await client.get("/auth/me")
    assert resp.status_code in (400, 401)
