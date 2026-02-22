"""
경제 지표 데이터 수집 서비스
FRED API, yfinance, 공개 API를 통해 실시간 경제 데이터를 수집합니다.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Any
import httpx
import pandas as pd

try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False

try:
    from fredapi import Fred
    HAS_FRED = True
except ImportError:
    HAS_FRED = False

from ..core.config import settings


class DataService:

    def __init__(self):
        self.fred = Fred(api_key=settings.FRED_API_KEY) if HAS_FRED and settings.FRED_API_KEY else None

    async def fetch_all_indicators(self, indicator_ids: list[str]) -> dict[str, Any]:
        """선택된 지표들의 최신 데이터를 병렬로 수집"""
        tasks = [self._fetch_indicator(ind_id) for ind_id in indicator_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        data = {}
        for ind_id, result in zip(indicator_ids, results):
            if isinstance(result, Exception):
                data[ind_id] = {"error": str(result), "value": None}
            else:
                data[ind_id] = result
        return data

    async def _fetch_indicator(self, indicator_id: str) -> dict[str, Any]:
        """지표별 데이터 수집 디스패처"""
        FRED_SERIES = {
            # 금리/통화정책
            "fed_funds_rate": "DFF",
            "us_10y_treasury": "DGS10",
            "us_2y_treasury": "DGS2",
            "us_yield_spread_10y2y": "T10Y2Y",
            # 물가
            "us_cpi": "CPIAUCSL",
            "us_pce": "PCEPI",
            "us_ppi": "PPIFES",
            # 고용
            "us_unemployment": "UNRATE",
            "us_nfp": "PAYEMS",
            # 성장
            "us_gdp": "GDPC1",
            # 시장
            "sp500": "SP500",
            "nasdaq": "NASDAQCOM",
            "vix": "VIXCLS",
            # 환율/원자재
            "usd_krw": "DEXKOUS",
            "dxy": "DTWEXBGS",
            "wti_crude": "DCOILWTICO",
            "gold": "GOLDAMGBD228NLBM",
        }
        YFINANCE_TICKERS = {
            "sp500": "^GSPC",
            "nasdaq": "^IXIC",
            "vix": "^VIX",
            "dxy": "DX-Y.NYB",
            "usd_krw": "KRW=X",
            "wti_crude": "CL=F",
            "gold": "GC=F",
            "kospi": "^KS11",
            "kosdaq": "^KQ11",
        }

        if indicator_id in FRED_SERIES and self.fred:
            return await asyncio.to_thread(self._fetch_fred, FRED_SERIES[indicator_id], indicator_id)
        elif indicator_id in YFINANCE_TICKERS and HAS_YFINANCE:
            return await asyncio.to_thread(self._fetch_yfinance, YFINANCE_TICKERS[indicator_id], indicator_id)
        else:
            return await self._fetch_public_api(indicator_id)

    def _fetch_fred(self, series_id: str, indicator_id: str) -> dict[str, Any]:
        """FRED API에서 시계열 데이터 수집"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        series = self.fred.get_series(series_id, start_date, end_date)
        latest = series.dropna().iloc[-1]
        prev = series.dropna().iloc[-2] if len(series.dropna()) > 1 else None
        return {
            "indicator_id": indicator_id,
            "value": float(latest),
            "prev_value": float(prev) if prev is not None else None,
            "change": float(latest - prev) if prev is not None else None,
            "change_pct": float((latest - prev) / prev * 100) if prev is not None else None,
            "date": series.dropna().index[-1].strftime("%Y-%m-%d"),
            "history": [
                {"date": d.strftime("%Y-%m-%d"), "value": float(v)}
                for d, v in series.dropna().tail(12).items()
            ],
            "source": "FRED",
        }

    def _fetch_yfinance(self, ticker: str, indicator_id: str) -> dict[str, Any]:
        """Yahoo Finance에서 시세 데이터 수집"""
        t = yf.Ticker(ticker)
        hist = t.history(period="1y")
        if hist.empty:
            raise ValueError(f"No data for {ticker}")
        latest = hist["Close"].iloc[-1]
        prev = hist["Close"].iloc[-2] if len(hist) > 1 else None
        return {
            "indicator_id": indicator_id,
            "value": round(float(latest), 2),
            "prev_value": round(float(prev), 2) if prev is not None else None,
            "change": round(float(latest - prev), 2) if prev is not None else None,
            "change_pct": round(float((latest - prev) / prev * 100), 2) if prev is not None else None,
            "date": hist.index[-1].strftime("%Y-%m-%d"),
            "history": [
                {"date": d.strftime("%Y-%m-%d"), "value": round(float(v), 2)}
                for d, v in hist["Close"].tail(60).items()
            ],
            "source": "Yahoo Finance",
        }

    async def _fetch_public_api(self, indicator_id: str) -> dict[str, Any]:
        """공개 API (World Bank 등) 에서 데이터 수집"""
        WB_INDICATORS = {
            "kr_gdp": ("KOR", "NY.GDP.MKTP.CD"),
            "kr_cpi": ("KOR", "FP.CPI.TOTL.ZG"),
            "kr_unemployment": ("KOR", "SL.UEM.TOTL.ZS"),
        }
        if indicator_id in WB_INDICATORS:
            country, wb_id = WB_INDICATORS[indicator_id]
            url = f"https://api.worldbank.org/v2/country/{country}/indicator/{wb_id}?format=json&mrv=5"
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                entries = [e for e in data[1] if e["value"] is not None]
                if not entries:
                    raise ValueError(f"No World Bank data for {indicator_id}")
                latest = entries[0]
                return {
                    "indicator_id": indicator_id,
                    "value": float(latest["value"]),
                    "date": latest["date"],
                    "source": "World Bank",
                    "history": [
                        {"date": e["date"], "value": float(e["value"])}
                        for e in entries[:5]
                    ],
                }
        return {"indicator_id": indicator_id, "value": None, "error": "unsupported indicator", "source": "unknown"}


data_service = DataService()
