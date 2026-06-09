import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import MeetingRecord, User

router = APIRouter()


def _serialize(r: MeetingRecord) -> dict:
    return {
        "id": r.id,
        "file_id": r.file_id,
        "summary": r.summary,
        "action_items": json.loads(r.action_items or "[]"),
        "key_decisions": json.loads(r.key_decisions or "[]"),
        "transcript_count": r.transcript_count,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/history")
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(MeetingRecord)
        .filter(MeetingRecord.user_id == current_user.id)
        .order_by(MeetingRecord.created_at.desc())
        .all()
    )
    return [_serialize(r) for r in records]


@router.get("/history/{record_id}")
def get_history(
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
    return _serialize(record)


@router.delete("/history/{record_id}")
def delete_history(
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
    db.delete(record)
    db.commit()
    return {"message": "삭제되었습니다"}
