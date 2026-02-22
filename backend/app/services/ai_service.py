"""
AI 인사이트 생성 서비스
Claude API를 통해 경제 데이터를 분석하고 레벨별 인사이트를 생성합니다.
"""
from typing import Any
from anthropic import AsyncAnthropic
from ..core.config import settings
from ..models.user import ReportLevel

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

LEVEL_SYSTEM_PROMPTS = {
    ReportLevel.BEGINNER: """당신은 경제를 전혀 모르는 사람도 이해할 수 있게 설명하는 친절한 경제 선생님입니다.
- 전문 용어는 반드시 쉬운 말로 풀어서 설명하세요
- 일상적인 비유와 예시를 많이 사용하세요 (예: "금리가 오른다 = 대출이자가 올라간다")
- 숫자보다 방향과 의미를 강조하세요
- 이모지를 적절히 사용해 친근하게 작성하세요
- 전문 용어 사용 시 반드시 괄호로 설명 추가""",

    ReportLevel.STANDARD: """당신은 경제 전반을 다루는 전문 경제 애널리스트입니다.
- 핵심 지표 간의 상관관계와 맥락을 설명하세요
- 역사적 비교와 트렌드를 포함하세요
- 투자자와 일반 시민에게 실질적인 시사점을 제공하세요
- 균형 잡힌 시각으로 리스크와 기회를 모두 다루세요
- 적절한 전문 용어 사용 (너무 어렵지 않게)""",

    ReportLevel.EXPERT: """당신은 매크로 헤지펀드의 수석 이코노미스트입니다.
- 계량경제학적 분석과 통계적 유의성을 포함하세요
- 금융 모델(IS-LM, 필립스 곡선 등)을 활용한 분석을 제공하세요
- 글로벌 자본 흐름과 크로스에셋 상관관계를 심층 분석하세요
- 테일 리스크와 컨베이론 전략도 다루세요
- 블룸버그/IMF/BIS 수준의 전문적인 언어로 작성하세요""",
}

LEVEL_LABELS = {
    ReportLevel.BEGINNER: "주린이",
    ReportLevel.STANDARD: "일반",
    ReportLevel.EXPERT: "전문가",
}


async def generate_report(
    indicator_data: dict[str, Any],
    level: ReportLevel,
    indicator_configs: list[dict],
) -> dict[str, str]:
    """
    경제 데이터를 분석하여 HTML 리포트 생성
    Returns: {"title": ..., "summary": ..., "html_content": ...}
    """
    system_prompt = LEVEL_SYSTEM_PROMPTS[level]
    level_label = LEVEL_LABELS[level]

    # 데이터 포맷팅
    data_text = _format_data_for_prompt(indicator_data, indicator_configs)

    user_prompt = f"""다음은 오늘({_today()}) 수집된 경제 지표 데이터입니다.

{data_text}

위 데이터를 분석하여 [{level_label}] 수준의 경제 리포트를 작성하세요.

## 출력 형식 (JSON)
다음 형식으로 정확히 응답하세요:

{{
  "title": "리포트 제목 (날짜 포함, 예: 2026년 2월 경제 동향 분석)",
  "summary_line1": "첫 번째 요약 문장 (가장 중요한 메시지)",
  "summary_line2": "두 번째 요약 문장 (핵심 지표 상황)",
  "summary_line3": "세 번째 요약 문장 (투자/생활 시사점)",
  "sections": [
    {{
      "title": "섹션 제목",
      "content": "섹션 내용 (HTML 태그 사용 가능: <strong>, <em>, <ul>, <li>, <p>)"
    }}
  ]
}}

## 필수 섹션
1. 거시경제 현황 요약
2. 주요 지표 분석 (선택된 지표별)
3. 시장 영향 및 시사점
4. 주의사항 및 리스크

두괄식으로 summary를 가장 중요하게 작성하세요."""

    response = await client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    import json
    text = response.content[0].text
    # JSON 추출
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        parsed = json.loads(text[start:end])
    except Exception:
        parsed = {
            "title": f"{_today()} 경제 리포트",
            "summary_line1": "데이터 파싱 오류가 발생했습니다.",
            "summary_line2": "",
            "summary_line3": "",
            "sections": [{"title": "원문", "content": text}],
        }

    summary = "\n".join([
        parsed.get("summary_line1", ""),
        parsed.get("summary_line2", ""),
        parsed.get("summary_line3", ""),
    ])

    from .template_renderer import render_report_html
    html_content = render_report_html(parsed, level, indicator_data, indicator_configs)

    return {
        "title": parsed.get("title", f"{_today()} 경제 리포트"),
        "summary": summary,
        "html_content": html_content,
    }


def _today() -> str:
    from datetime import date
    return date.today().strftime("%Y년 %m월 %d일")


def _format_data_for_prompt(indicator_data: dict, configs: list[dict]) -> str:
    lines = []
    config_map = {c["id"]: c for c in configs}
    for ind_id, data in indicator_data.items():
        cfg = config_map.get(ind_id, {})
        name = cfg.get("name_ko", ind_id)
        value = data.get("value")
        change_pct = data.get("change_pct")
        date = data.get("date", "")
        if value is None:
            lines.append(f"- {name}: 데이터 없음")
            continue
        change_str = f"({change_pct:+.2f}%)" if change_pct is not None else ""
        lines.append(f"- {name}: {value} {change_str} [{date}]")
    return "\n".join(lines)


