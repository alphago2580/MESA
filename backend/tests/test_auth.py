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


# ──────────────────────────────────────────────
# PATCH /auth/me — 프로필 수정
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_me_change_email(client: AsyncClient):
    """이메일 정상 변경"""
    token = await create_and_login(client)
    new_email = "changed@example.com"
    resp = await client.patch(
        "/auth/me",
        json={"email": new_email},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == new_email


@pytest.mark.asyncio
async def test_patch_me_change_password(client: AsyncClient):
    """비밀번호 정상 변경 후 새 비밀번호로 로그인 가능"""
    token = await create_and_login(client)
    new_password = "newPass5678!"
    resp = await client.patch(
        "/auth/me",
        json={"current_password": TEST_USER["password"], "new_password": new_password},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200

    # 새 비밀번호로 로그인 성공 확인
    login_resp = await client.post(
        "/auth/token",
        data={"username": TEST_USER["email"], "password": new_password},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


@pytest.mark.asyncio
async def test_patch_me_wrong_current_password(client: AsyncClient):
    """현재 비밀번호 틀린 경우 400 반환"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/auth/me",
        json={"current_password": "wrongpass", "new_password": "newPass5678!"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_patch_me_new_password_without_current(client: AsyncClient):
    """current_password 없이 new_password만 전달 시 400 반환"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/auth/me",
        json={"new_password": "newPass5678!"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_patch_me_duplicate_email(client: AsyncClient):
    """이미 사용 중인 이메일로 변경 시 400 반환"""
    other_user = {"email": "other@example.com", "password": "other1234!"}
    await client.post("/auth/register", json=other_user)

    token = await create_and_login(client)
    resp = await client.patch(
        "/auth/me",
        json={"email": other_user["email"]},
        headers=auth_headers(token),
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_patch_me_unauthorized(client: AsyncClient):
    """토큰 없이 PATCH /auth/me 접근 차단"""
    resp = await client.patch("/auth/me", json={"email": "hacker@example.com"})
    assert resp.status_code in (400, 401)


@pytest.mark.asyncio
async def test_patch_me_no_changes(client: AsyncClient):
    """변경 사항 없는 빈 요청도 200 반환 (이메일 유지)"""
    token = await create_and_login(client)
    resp = await client.patch(
        "/auth/me",
        json={},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == TEST_USER["email"]
