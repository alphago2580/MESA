"""
FR-03: 리포트 생성 및 조회 E2E 테스트
- 리포트 수동 생성, 목록 조회, 상세 조회, 권한 격리
"""
import pytest
from httpx import AsyncClient
from .conftest import create_and_login, auth_headers


@pytest.mark.asyncio
async def test_generate_report_manual(client: AsyncClient):
    """수동 리포트 생성 (AI mock 사용)"""
    token = await create_and_login(client)
    resp = await client.post("/reports/generate", headers=auth_headers(token))
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert "title" in data
    assert "level" in data


@pytest.mark.asyncio
async def test_list_reports(client: AsyncClient):
    """리포트 목록 조회"""
    token = await create_and_login(client)
    await client.post("/reports/generate", headers=auth_headers(token))
    await client.post("/reports/generate", headers=auth_headers(token))

    resp = await client.get("/reports/", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_report_detail(client: AsyncClient):
    """리포트 상세 조회"""
    token = await create_and_login(client)
    create_resp = await client.post("/reports/generate", headers=auth_headers(token))
    report_id = create_resp.json()["id"]

    resp = await client.get(f"/reports/{report_id}", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["id"] == report_id


@pytest.mark.asyncio
async def test_cannot_access_other_users_report(client: AsyncClient):
    """다른 사용자 리포트 접근 차단 (404 반환)"""
    token1 = await create_and_login(client, {"email": "user1@example.com", "password": "pass1234!"})
    token2 = await create_and_login(client, {"email": "user2@example.com", "password": "pass1234!"})

    create_resp = await client.post("/reports/generate", headers=auth_headers(token1))
    report_id = create_resp.json()["id"]

    # user2가 user1의 리포트 조회 시 404
    resp = await client.get(f"/reports/{report_id}", headers=auth_headers(token2))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_reports_isolated_by_user(client: AsyncClient):
    """사용자별 리포트 격리 확인"""
    token1 = await create_and_login(client, {"email": "userA@example.com", "password": "pass1234!"})
    token2 = await create_and_login(client, {"email": "userB@example.com", "password": "pass1234!"})

    await client.post("/reports/generate", headers=auth_headers(token1))
    await client.post("/reports/generate", headers=auth_headers(token1))

    # user2는 리포트 0개
    resp = await client.get("/reports/", headers=auth_headers(token2))
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_delete_report(client: AsyncClient):
    """리포트 삭제 성공 (204 반환)"""
    token = await create_and_login(client)
    create_resp = await client.post("/reports/generate", headers=auth_headers(token))
    report_id = create_resp.json()["id"]

    resp = await client.delete(f"/reports/{report_id}", headers=auth_headers(token))
    assert resp.status_code == 204

    # 삭제 후 조회 시 404
    get_resp = await client.get(f"/reports/{report_id}", headers=auth_headers(token))
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_report_not_found(client: AsyncClient):
    """존재하지 않는 리포트 삭제 시 404 반환"""
    token = await create_and_login(client)
    resp = await client.delete("/reports/99999", headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_other_users_report_forbidden(client: AsyncClient):
    """다른 사용자의 리포트 삭제 시 404 반환 (권한 격리)"""
    token1 = await create_and_login(client, {"email": "del1@example.com", "password": "pass1234!"})
    token2 = await create_and_login(client, {"email": "del2@example.com", "password": "pass1234!"})

    create_resp = await client.post("/reports/generate", headers=auth_headers(token1))
    report_id = create_resp.json()["id"]

    # user2가 user1의 리포트 삭제 시도 → 404
    resp = await client.delete(f"/reports/{report_id}", headers=auth_headers(token2))
    assert resp.status_code == 404

    # user1 리포트는 여전히 존재
    get_resp = await client.get(f"/reports/{report_id}", headers=auth_headers(token1))
    assert get_resp.status_code == 200
