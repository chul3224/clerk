"""
Dify 연동 라우터

GET  /api/dify/status        — 환경변수 설정 여부 확인
POST /api/dify/push/{id}     — 특정 회의록을 수동으로 Dify에 전송
POST /api/dify/push-all      — 전체 히스토리를 Dify에 일괄 전송
"""

import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import MeetingRecord, User
from services.dify_service import push_to_dify

router = APIRouter()


@router.get("/dify/status")
def dify_status():
    configured = bool(os.getenv("DIFY_API_KEY") and os.getenv("DIFY_DATASET_ID"))
    return {
        "configured": configured,
        "dataset_id": os.getenv("DIFY_DATASET_ID", ""),
    }


@router.post("/dify/push/{record_id}")
async def push_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(MeetingRecord)
        .filter(MeetingRecord.id == record_id, MeetingRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(404, "기록을 찾을 수 없습니다")

    result = await push_to_dify(
        summary=record.summary or "",
        action_items=json.loads(record.action_items or "[]"),
        key_decisions=json.loads(record.key_decisions or "[]"),
        transcript=[],
        created_at=record.created_at.isoformat() if record.created_at else None,
    )

    if result is None:
        raise HTTPException(503, "DIFY_API_KEY 또는 DIFY_DATASET_ID 환경변수를 확인하세요")

    return {"ok": True, "dify_document_id": result.get("id"), "name": result.get("name")}


@router.post("/dify/push-all")
async def push_all_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(MeetingRecord)
        .filter(MeetingRecord.user_id == current_user.id)
        .order_by(MeetingRecord.created_at.asc())
        .all()
    )
    if not records:
        return {"pushed": 0, "failed": 0}

    pushed, failed = 0, 0
    for r in records:
        result = await push_to_dify(
            summary=r.summary or "",
            action_items=json.loads(r.action_items or "[]"),
            key_decisions=json.loads(r.key_decisions or "[]"),
            transcript=[],
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        if result:
            pushed += 1
        else:
            failed += 1

    return {"pushed": pushed, "failed": failed, "total": len(records)}
