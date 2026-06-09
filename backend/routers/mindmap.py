import json
import os
import re

from fastapi import APIRouter, Depends, HTTPException
from groq import AsyncGroq
from pydantic import BaseModel

from auth_utils import get_current_user
from models import User

router = APIRouter()

MINDMAP_PROMPT = """회의 요약을 마인드맵 JSON으로 변환하세요.

형식: {"keyword": "주제", "children": [{"keyword": "하위주제", "children": [...]}]}

규칙:
- 루트: 회의 핵심 주제 (10자 이내)
- 1단계 자식: 주요 안건 3~5개
- 2단계 자식: 각 안건의 핵심 포인트 2~3개
- keyword는 간결하게 (15자 이내)
- 반드시 유효한 JSON만 반환"""


class MindmapRequest(BaseModel):
    summary: str
    key_decisions: list[str] = []
    action_items: list[dict] = []


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text)


@router.post("/mindmap")
async def generate_mindmap(
    body: MindmapRequest,
    current_user: User = Depends(get_current_user),
):
    combined = f"요약: {body.summary}"
    if body.key_decisions:
        combined += "\n\n결정사항:\n" + "\n".join(f"- {d}" for d in body.key_decisions)
    if body.action_items:
        tasks = "\n".join(f"- {a.get('task','')}" for a in body.action_items)
        combined += f"\n\n액션아이템:\n{tasks}"

    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": MINDMAP_PROMPT},
            {"role": "user", "content": combined},
        ],
        temperature=0.2,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )

    try:
        tree = _extract_json(response.choices[0].message.content)
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(500, "마인드맵 생성에 실패했습니다")

    return tree
