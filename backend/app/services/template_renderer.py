"""
Jinja2 기반 HTML 리포트 렌더러
레벨별 템플릿을 사용하여 리포트를 HTML로 변환합니다.
"""
from pathlib import Path
from datetime import date
from typing import Any

from jinja2 import Environment, FileSystemLoader

from ..models.user import ReportLevel

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=False,
)

LEVEL_CONFIG = {
    ReportLevel.BEGINNER: {
        "template": "report_beginner.html",
        "color": "#4CAF50",
        "label": "주린이",
    },
    ReportLevel.STANDARD: {
        "template": "report_standard.html",
        "color": "#2196F3",
        "label": "일반",
    },
    ReportLevel.EXPERT: {
        "template": "report_expert.html",
        "color": "#9C27B0",
        "label": "전문가",
    },
}

INDICATOR_EMOJIS = {
    "interest_rates": "🏦",
    "inflation": "📈",
    "employment": "👷",
    "growth": "🏭",
    "market_indices": "📊",
    "fx_commodities": "💱",
}


def _hex_to_rgb(hex_color: str) -> str:
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"{r},{g},{b}"


def _build_indicator_cards(
    indicator_data: dict[str, Any],
    configs: list[dict],
    level: ReportLevel,
) -> list[dict]:
    config_map = {c["id"]: c for c in configs}
    cards = []
    for ind_id, data in indicator_data.items():
        cfg = config_map.get(ind_id, {})
        name = cfg.get("name_ko", ind_id)
        value = data.get("value")
        change_pct = data.get("change_pct")
        if value is None:
            continue

        change_class = "flat"
        if change_pct is not None:
            change_class = "up" if change_pct > 0 else "down"
        change_str = f"{change_pct:+.2f}%" if change_pct is not None else ""

        card: dict[str, Any] = {
            "name": name,
            "value": value,
            "change_str": change_str,
            "change_class": change_class,
        }

        if level == ReportLevel.BEGINNER:
            category = cfg.get("category", "")
            card["emoji"] = INDICATOR_EMOJIS.get(category, "")
            if change_pct is not None:
                if change_pct > 0.5:
                    card["direction"] = "↗️"
                elif change_pct < -0.5:
                    card["direction"] = "↘️"
                else:
                    card["direction"] = "➡️"

        cards.append(card)
    return cards


def _build_raw_data_table(
    indicator_data: dict[str, Any],
    configs: list[dict],
) -> list[dict]:
    config_map = {c["id"]: c for c in configs}
    rows = []
    for ind_id, data in indicator_data.items():
        cfg = config_map.get(ind_id, {})
        rows.append({
            "name": cfg.get("name_ko", ind_id),
            "value": data.get("value", "-"),
            "change_pct": data.get("change_pct"),
            "date": data.get("date", "-"),
        })
    return rows


def render_report_html(
    parsed: dict,
    level: ReportLevel,
    indicator_data: dict[str, Any],
    indicator_configs: list[dict],
) -> str:
    """
    AI가 생성한 파싱된 리포트 데이터를 레벨별 Jinja2 템플릿으로 렌더링합니다.
    """
    cfg = LEVEL_CONFIG[level]
    template = _env.get_template(cfg["template"])

    summary_lines = [
        parsed.get("summary_line1", ""),
        parsed.get("summary_line2", ""),
        parsed.get("summary_line3", ""),
    ]

    context = {
        "title": parsed.get("title", f"{date.today().strftime('%Y년 %m월 %d일')} 경제 리포트"),
        "generated_date": date.today().strftime("%Y년 %m월 %d일"),
        "level_label": cfg["label"],
        "theme_color": cfg["color"],
        "theme_rgb": _hex_to_rgb(cfg["color"]),
        "summary_lines": summary_lines,
        "sections": parsed.get("sections", []),
        "indicator_cards": _build_indicator_cards(indicator_data, indicator_configs, level),
    }

    if level == ReportLevel.EXPERT:
        context["raw_data_table"] = _build_raw_data_table(indicator_data, indicator_configs)

    return template.render(**context)
