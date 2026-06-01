import asyncio
import json
import os
import time

from groq import AsyncGroq

MODELS = {
    "model_a": {
        "id": "llama-3.1-8b-instant",
        "name": "Llama 3.1 8B (초고속 경량)",
    },
    "model_b": {
        "id": "llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B (고성능)",
    },
}

SUMMARY_PROMPT = """당신은 회의록 전문 분석 AI입니다. 다음 회의 대화록을 빠짐없이 분석하여 JSON으로 응답하세요.

회의 대화록:
{transcript}

분석 기준:
- key_decisions: 회의에서 확정·결정·합의된 모든 사항 (작은 것도 포함)
- action_items: 누군가 해야 할 일, 다음에 진행할 일, 검토할 사항 모두 포함. 담당자가 언급되지 않았으면 null
- 대화에서 명시적으로 언급된 것만 작성하고 추측하지 마세요

JSON 형식:
{{
    "summary": "회의 핵심 요약 (3-5문장, 주요 논의 흐름 포함)",
    "key_decisions": ["결정사항1", "결정사항2"],
    "action_items": [
        {{"task": "작업 내용", "assignee": "담당자 이름 또는 null"}}
    ]
}}

JSON만 응답하세요."""


async def _summarize_single(transcript_text: str, model_key: str) -> dict:
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    model_info = MODELS[model_key]

    start = time.time()
    response = await client.chat.completions.create(
        model=model_info["id"],
        messages=[
            {
                "role": "user",
                "content": SUMMARY_PROMPT.format(transcript=transcript_text),
            }
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    elapsed_ms = int((time.time() - start) * 1000)

    try:
        data = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        data = {
            "summary": response.choices[0].message.content,
            "key_decisions": [],
            "action_items": [],
        }

    return {
        "model": model_info["name"],
        "model_id": model_info["id"],
        "summary": data.get("summary", ""),
        "key_decisions": data.get("key_decisions", []),
        "action_items": data.get("action_items", []),
        "response_time_ms": elapsed_ms,
        "token_count": response.usage.total_tokens,
    }


async def summarize_dual(transcript_text: str) -> tuple[dict, dict]:
    model_a, model_b = await asyncio.gather(
        _summarize_single(transcript_text, "model_a"),
        _summarize_single(transcript_text, "model_b"),
    )
    return model_a, model_b
