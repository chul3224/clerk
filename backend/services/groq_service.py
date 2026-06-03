import asyncio
import json
import os
import time

import google.generativeai as genai
from groq import AsyncGroq

MODELS = [
    {
        "id": "llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B",
        "label": "Meta · Groq",
        "provider": "groq",
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "label": "Google",
        "provider": "gemini",
    },
    {
        "id": "gemini-3.1-flash-lite",
        "name": "Gemini 3.1 Flash-Lite",
        "label": "Google",
        "provider": "gemini",
    },
]

SUMMARY_PROMPT = """당신은 회의록 전문 분석 AI입니다. 다음 회의 대화록을 빠짐없이 분석하여 JSON으로 응답하세요.

회의 대화록:
{transcript}

분석 기준:
- key_decisions: 회의에서 확정·결정·합의된 모든 사항을 빠짐없이 추출 (사소한 것도 포함)
- action_items: 다음 지침을 반드시 따르세요
  * 하나의 목표나 프로세스에 속한 세부 단계들은 하나의 액션아이템으로 묶어서 작성
  * 총 3~5개를 넘지 않도록 핵심만 추출
  * 마감일·기간이 언급된 경우 task에 포함 (예: "강의 녹음 텍스트화 후 AI 트렌드 분석 — 10월까지")
  * 담당자가 명시된 경우 assignee에 포함, 없으면 null
- 대화에서 명시적으로 언급된 것만 작성하고 추측 금지

JSON 형식:
{{
    "summary": "회의 핵심 요약 (3-5문장, 주요 논의 흐름 포함)",
    "key_decisions": ["결정사항1", "결정사항2"],
    "action_items": [
        {{"task": "구체적인 작업 내용 (기간/조건 포함)", "assignee": "담당자 이름 또는 null"}}
    ]
}}

JSON만 응답하세요."""


async def _summarize_groq(transcript_text: str, model: dict) -> dict:
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    start = time.time()
    response = await client.chat.completions.create(
        model=model["id"],
        messages=[{"role": "user", "content": SUMMARY_PROMPT.format(transcript=transcript_text)}],
        temperature=0.3,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    elapsed_ms = int((time.time() - start) * 1000)
    try:
        data = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        data = {"summary": response.choices[0].message.content, "key_decisions": [], "action_items": []}
    return {
        "model": model["name"],
        "label": model["label"],
        "model_id": model["id"],
        "summary": data.get("summary", ""),
        "key_decisions": data.get("key_decisions", []),
        "action_items": data.get("action_items", []),
        "response_time_ms": elapsed_ms,
        "token_count": response.usage.total_tokens,
    }


async def _summarize_gemini(transcript_text: str, model: dict) -> dict:
    loop = asyncio.get_running_loop()

    def _run():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        m = genai.GenerativeModel(model["id"])
        start = time.time()
        response = m.generate_content(
            SUMMARY_PROMPT.format(transcript=transcript_text),
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=4096,
            ),
        )
        elapsed_ms = int((time.time() - start) * 1000)
        text = response.text.strip()
        # JSON 코드블록 제거
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            data = {"summary": text, "key_decisions": [], "action_items": []}
        return {
            "model": model["name"],
            "label": model["label"],
            "model_id": model["id"],
            "summary": data.get("summary", ""),
            "key_decisions": data.get("key_decisions", []),
            "action_items": data.get("action_items", []),
            "response_time_ms": elapsed_ms,
            "token_count": getattr(response.usage_metadata, "total_token_count", 0),
        }

    return await loop.run_in_executor(None, _run)


async def _summarize_one(transcript_text: str, model: dict) -> dict:
    if model["provider"] == "groq":
        return await _summarize_groq(transcript_text, model)
    return await _summarize_gemini(transcript_text, model)


def _trim_transcript(text: str, max_chars: int = 6000) -> str:
    """대화록이 너무 길면 앞/뒤 중요 부분만 유지"""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n...(중략)...\n" + text[-half:]


async def summarize_triple(transcript_text: str) -> list[dict]:
    trimmed = _trim_transcript(transcript_text)
    results = await asyncio.gather(
        *[_summarize_one(trimmed, m) for m in MODELS],
        return_exceptions=True,
    )
    summaries = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            summaries.append({
                "model": MODELS[i]["name"],
                "label": MODELS[i]["label"],
                "model_id": MODELS[i]["id"],
                "summary": f"오류: {str(r)}",
                "key_decisions": [],
                "action_items": [],
                "response_time_ms": 0,
                "token_count": 0,
            })
        else:
            summaries.append(r)
    return summaries


# 하위 호환 유지
async def summarize_dual(transcript_text: str) -> tuple[dict, dict]:
    summaries = await summarize_triple(transcript_text)
    return summaries[0], summaries[1]
