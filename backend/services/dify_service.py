"""
Dify Knowledge Base 자동 적재 서비스

회의 처리 완료 시 요약·결정사항·액션아이템을 Dify 지식베이스에 문서로 저장합니다.
DIFY_API_KEY / DIFY_DATASET_ID 환경변수가 없으면 조용히 스킵합니다.
"""

import json
import os
from datetime import datetime

import httpx

DIFY_BASE = "https://api.dify.ai/v1"


def _cfg() -> dict:
    return {
        "api_key": os.getenv("DIFY_API_KEY"),
        "dataset_id": os.getenv("DIFY_DATASET_ID"),
    }


def _build_document(
    summary: str,
    action_items: list,
    key_decisions: list,
    transcript: list,
    created_at: str,
) -> tuple[str, str]:
    """반환: (문서 제목, 문서 본문)"""
    date_str = created_at[:10] if created_at else datetime.now().strftime("%Y-%m-%d")
    title = f"회의록_{date_str}"

    lines = [
        f"# 회의록 — {date_str}",
        "",
        "## 요약",
        summary or "(요약 없음)",
        "",
    ]

    if key_decisions:
        lines += ["## 핵심 결정사항", *[f"- {d}" for d in key_decisions], ""]

    if action_items:
        lines += ["## 액션아이템", *[f"- {a}" for a in action_items], ""]

    if transcript:
        lines += ["## 전체 대화록", ""]
        for seg in transcript:
            speaker = seg.get("speaker", "?")
            text = seg.get("text", "")
            lines.append(f"**{speaker}**: {text}")

    return title, "\n".join(lines)


async def push_to_dify(
    summary: str,
    action_items: list,
    key_decisions: list,
    transcript: list,
    created_at: str | None = None,
) -> dict | None:
    """
    Dify 지식베이스에 문서 1건 생성.
    환경변수 미설정 시 None 반환 (오류 아님).
    """
    cfg = _cfg()
    if not cfg["api_key"] or not cfg["dataset_id"]:
        return None

    title, body = _build_document(
        summary, action_items, key_decisions, transcript,
        created_at or datetime.now().isoformat(),
    )

    payload = {
        "name": title,
        "text": body,
        "indexing_technique": "high_quality",
        "process_rule": {"mode": "automatic"},
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{DIFY_BASE}/datasets/{cfg['dataset_id']}/documents/create-by-text",
                headers={"Authorization": f"Bearer {cfg['api_key']}"},
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None  # Dify 실패가 메인 플로우에 영향 안 줌
