"""경제 지표 목록 및 실시간 데이터 API"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..services.data_service import data_service

router = APIRouter(prefix="/indicators", tags=["indicators"])

_CONFIG_PATH = Path(__file__).parent.parent / "data" / "indicators_config.json"


def _load_config() -> list[dict]:
    if _CONFIG_PATH.exists():
        raw = json.loads(_CONFIG_PATH.read_text())
        # indicators_config.json은 {"version": ..., "indicators": [...]} 형식
        if isinstance(raw, dict):
            return raw.get("indicators", [])
        return raw
    return []


@router.get("/")
async def list_indicators():
    """사용 가능한 모든 경제 지표 목록 반환"""
    return _load_config()


@router.get("/{indicator_id}/live")
async def get_live_data(indicator_id: str):
    """특정 지표의 실시간 데이터 조회"""
    configs = _load_config()
    valid_ids = [c["id"] for c in configs]
    if indicator_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"지표 '{indicator_id}'를 찾을 수 없습니다")
    data = await data_service.fetch_all_indicators([indicator_id])
    return data.get(indicator_id, {"error": "데이터를 가져올 수 없습니다"})


@router.post("/live")
async def get_multiple_live_data(indicator_ids: list[str]):
    """여러 지표의 실시간 데이터 일괄 조회"""
    if len(indicator_ids) > 20:
        raise HTTPException(status_code=400, detail="한 번에 최대 20개의 지표만 조회할 수 있습니다")
    return await data_service.fetch_all_indicators(indicator_ids)
