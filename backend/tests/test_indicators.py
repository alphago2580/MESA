"""
FR-04: 경제 지표 API E2E 테스트
- GET /indicators/  : 지표 목록 조회
- GET /indicators/{id}/live : 특정 지표 실시간 데이터 조회
- POST /indicators/live : 여러 지표 일괄 실시간 데이터 조회
"""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock

from .conftest import MOCK_INDICATOR_DATA


# ──────────────────────────────────────────────
# GET /indicators/  — 지표 목록
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_indicators_returns_200(client: AsyncClient):
    """지표 목록 조회 — 200 응답"""
    resp = await client.get("/indicators/")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_indicators_returns_list(client: AsyncClient):
    """지표 목록 조회 — 리스트 반환"""
    resp = await client.get("/indicators/")
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_indicators_not_empty(client: AsyncClient):
    """지표 목록 조회 — 1개 이상의 지표 포함"""
    resp = await client.get("/indicators/")
    data = resp.json()
    assert len(data) > 0


@pytest.mark.asyncio
async def test_list_indicators_item_has_required_fields(client: AsyncClient):
    """지표 목록 — 각 항목에 id, name_ko, name_en 필드 존재"""
    resp = await client.get("/indicators/")
    for item in resp.json():
        assert "id" in item
        assert "name_ko" in item
        assert "name_en" in item


@pytest.mark.asyncio
async def test_list_indicators_contains_known_ids(client: AsyncClient):
    """지표 목록 — 주요 지표 ID 포함 여부 확인"""
    resp = await client.get("/indicators/")
    ids = [item["id"] for item in resp.json()]
    for expected_id in ("sp500", "us_cpi", "us_unemployment", "fed_funds_rate"):
        assert expected_id in ids, f"지표 '{expected_id}'가 목록에 없습니다"


@pytest.mark.asyncio
async def test_list_indicators_no_auth_required(client: AsyncClient):
    """지표 목록 조회 — 인증 없이도 접근 가능"""
    # 헤더 없이 호출
    resp = await client.get("/indicators/")
    assert resp.status_code == 200


# ──────────────────────────────────────────────
# GET /indicators/{id}/live — 특정 지표 실시간 조회
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_live_indicator_valid_id_returns_200(client: AsyncClient):
    """유효한 지표 ID로 실시간 데이터 조회 — 200 응답"""
    resp = await client.get("/indicators/sp500/live")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_live_indicator_response_matches_mock(client: AsyncClient):
    """실시간 데이터 — mock 데이터와 일치하는 값 반환"""
    resp = await client.get("/indicators/sp500/live")
    assert resp.status_code == 200
    data = resp.json()
    expected = MOCK_INDICATOR_DATA["sp500"]
    assert data["value"] == expected["value"]
    assert data["change"] == expected["change"]


@pytest.mark.asyncio
async def test_get_live_indicator_us_cpi(client: AsyncClient):
    """us_cpi 지표 실시간 조회 — 정상 응답"""
    resp = await client.get("/indicators/us_cpi/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["value"] == MOCK_INDICATOR_DATA["us_cpi"]["value"]


@pytest.mark.asyncio
async def test_get_live_indicator_invalid_id_returns_404(client: AsyncClient):
    """존재하지 않는 지표 ID — 404 반환"""
    resp = await client.get("/indicators/nonexistent_indicator_xyz/live")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_live_indicator_404_detail_message(client: AsyncClient):
    """존재하지 않는 지표 ID — 에러 메시지에 지표 ID 포함"""
    resp = await client.get("/indicators/unknown_id_abc/live")
    assert resp.status_code == 404
    assert "unknown_id_abc" in resp.json().get("detail", "")


@pytest.mark.asyncio
async def test_get_live_indicator_calls_data_service(client: AsyncClient, mock_data_service: AsyncMock):
    """실시간 지표 조회 시 data_service.fetch_all_indicators 호출 확인"""
    resp = await client.get("/indicators/sp500/live")
    assert resp.status_code == 200
    mock_data_service.assert_called_once_with(["sp500"])


@pytest.mark.asyncio
async def test_get_live_indicator_no_auth_required(client: AsyncClient):
    """실시간 지표 조회 — 인증 없이 접근 가능"""
    resp = await client.get("/indicators/us_unemployment/live")
    assert resp.status_code == 200


# ──────────────────────────────────────────────
# POST /indicators/live — 여러 지표 일괄 조회
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_post_live_indicators_success(client: AsyncClient):
    """유효한 지표 ID 목록으로 일괄 조회 — 200 응답"""
    resp = await client.post("/indicators/live", json=["sp500", "us_cpi"])
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_post_live_indicators_response_is_dict(client: AsyncClient):
    """일괄 조회 응답 — dict 형태 반환"""
    resp = await client.post("/indicators/live", json=["sp500", "us_cpi"])
    data = resp.json()
    assert isinstance(data, dict)


@pytest.mark.asyncio
async def test_post_live_indicators_response_matches_mock(client: AsyncClient):
    """일괄 조회 — mock 데이터와 일치"""
    resp = await client.post("/indicators/live", json=["sp500", "us_cpi", "us_unemployment"])
    assert resp.status_code == 200
    data = resp.json()
    assert "sp500" in data
    assert data["sp500"]["value"] == MOCK_INDICATOR_DATA["sp500"]["value"]


@pytest.mark.asyncio
async def test_post_live_indicators_empty_list(client: AsyncClient):
    """빈 목록 전송 — 200 응답 및 dict 형태 반환"""
    resp = await client.post("/indicators/live", json=[])
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_post_live_indicators_over_limit_returns_400(client: AsyncClient):
    """21개 이상의 지표 요청 — 400 에러 반환"""
    too_many = [f"indicator_{i}" for i in range(21)]
    resp = await client.post("/indicators/live", json=too_many)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_post_live_indicators_exactly_20_allowed(client: AsyncClient):
    """정확히 20개 지표 요청 — 허용 (400 아님)"""
    exactly_20 = [f"indicator_{i}" for i in range(20)]
    resp = await client.post("/indicators/live", json=exactly_20)
    assert resp.status_code != 400


@pytest.mark.asyncio
async def test_post_live_indicators_calls_data_service(client: AsyncClient, mock_data_service: AsyncMock):
    """일괄 조회 시 data_service.fetch_all_indicators 호출 확인"""
    ids = ["sp500", "us_cpi"]
    resp = await client.post("/indicators/live", json=ids)
    assert resp.status_code == 200
    mock_data_service.assert_called_once_with(ids)


@pytest.mark.asyncio
async def test_post_live_indicators_no_auth_required(client: AsyncClient):
    """일괄 지표 조회 — 인증 없이 접근 가능"""
    resp = await client.post("/indicators/live", json=["sp500"])
    assert resp.status_code == 200
