import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user
from models import User

router = APIRouter()

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")


class ShareRequest(BaseModel):
    summary: str
    key_decisions: list[str] = []
    action_items: list[dict] = []
    transcript_count: int = 0


@router.post("/share/slack")
async def share_to_slack(
    body: ShareRequest,
    current_user: User = Depends(get_current_user),
):
    if not N8N_WEBHOOK_URL:
        raise HTTPException(status_code=503, detail="Slack 연동이 설정되지 않았습니다")

    payload = {
        "event": "meeting_processed",
        "user_id": current_user.id,
        "transcript_count": body.transcript_count,
        "summary": body.summary,
        "key_decisions": body.key_decisions,
        "action_items": body.action_items,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(N8N_WEBHOOK_URL, json=payload)
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="Slack 전송에 실패했습니다")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Slack 전송 시간이 초과됐습니다")

    return {"message": "Slack으로 공유되었습니다"}
