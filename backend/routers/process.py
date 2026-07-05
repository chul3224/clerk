import json
import os
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from auth_utils import verify_token
from database import SessionLocal
from models import MeetingRecord
from services.deepgram_service import transcribe_with_diarization
from services.dify_service import push_to_dify
from services.groq_service import summarize_triple
from services.transcript_builder import format_transcript_text
from state import jobs

router = APIRouter()

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _best_summary(summaries: list) -> dict | None:
    return next(
        (s for s in summaries if s.get("summary") and not s["summary"].startswith("오류")),
        None,
    )


def _save_to_db(file_id: str, user_id: int, transcript: list, summaries: list):
    best = _best_summary(summaries)
    if not best:
        return
    db = SessionLocal()
    try:
        record = MeetingRecord(
            user_id=user_id,
            file_id=file_id,
            title=best.get("title", ""),
            summary=best.get("summary", ""),
            action_items=json.dumps(best.get("action_items", []), ensure_ascii=False),
            key_decisions=json.dumps(best.get("key_decisions", []), ensure_ascii=False),
            # 대화록과 3개 모델 요약 전체를 저장해서
            # 히스토리에서도 결과 화면을 그대로 복원할 수 있게 한다
            transcript=json.dumps(transcript, ensure_ascii=False),
            summaries=json.dumps(summaries, ensure_ascii=False),
            transcript_count=len(transcript),
        )
        db.add(record)
        db.commit()
    finally:
        db.close()


async def _fire_n8n_webhook(file_id: str, user_id: int, transcript: list, summaries: list):
    if not N8N_WEBHOOK_URL:
        return
    best = _best_summary(summaries) or summaries[0]
    payload = {
        "event": "meeting_processed",
        "file_id": file_id,
        "user_id": user_id,
        "transcript_count": len(transcript),
        "summary": best.get("summary", ""),
        "action_items": best.get("action_items", []),
        "key_decisions": best.get("key_decisions", []),
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(N8N_WEBHOOK_URL, json=payload)
    except Exception:
        pass  # webhook 실패해도 사용자 응답에는 영향 없음


@router.get("/process/{file_id}")
async def process_audio(file_id: str, token: str = None):
    if file_id not in jobs:
        raise HTTPException(404, "파일을 찾을 수 없습니다")

    file_path = jobs[file_id]["file_path"]
    user_id = jobs[file_id].get("user_id")

    # EventSource는 Authorization 헤더를 못 붙이므로 쿼리스트링 토큰으로 인증한다.
    # 업로드한 본인만 처리 결과를 볼 수 있다.
    token_user = verify_token(token) if token else None
    if user_id and token_user != user_id:
        raise HTTPException(403, "본인이 업로드한 파일만 처리할 수 있습니다")

    async def generate():
        try:
            yield _sse({"step": "stt", "status": "processing", "message": "음성 분석 중 (STT + 화자 분리)..."})
            transcript = await transcribe_with_diarization(file_path)
            speakers = list({s["speaker"] for s in transcript})
            yield _sse({"step": "stt", "status": "done", "message": f"분석 완료 — {len(speakers)}명 감지, {len(transcript)}개 발화"})

            yield _sse({"step": "diarization", "status": "done", "message": "화자 분리 완료"})

            transcript_text = format_transcript_text(transcript)
            yield _sse({"step": "summarization", "status": "processing", "message": "AI 요약 생성 중 (3개 모델 동시)..."})
            summaries = await summarize_triple(transcript_text)
            yield _sse({"step": "summarization", "status": "done", "message": "AI 요약 완료"})

            result = {"transcript": transcript, "summaries": summaries}
            jobs[file_id]["result"] = result
            jobs[file_id]["status"] = "done"

            yield _sse({"step": "complete", "data": result})

            # 처리 완료 후 DB 저장 + Dify 자동 적재
            if user_id:
                _save_to_db(file_id, user_id, transcript, summaries)
                best = _best_summary(summaries) or (summaries[0] if summaries else {})
                await push_to_dify(
                    summary=best.get("summary", ""),
                    action_items=best.get("action_items", []),
                    key_decisions=best.get("key_decisions", []),
                    transcript=transcript,
                )

        except Exception as e:
            jobs[file_id]["status"] = "error"
            yield _sse({"step": "error", "message": str(e)})
        finally:
            # 처리가 끝난 오디오 파일은 삭제해서 디스크가 쌓이지 않게 한다
            Path(file_path).unlink(missing_ok=True)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
