import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.assemblyai_service import transcribe_with_diarization
from services.groq_service import summarize_dual
from services.transcript_builder import format_transcript_text
from state import jobs

router = APIRouter()


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.get("/process/{file_id}")
async def process_audio(file_id: str):
    if file_id not in jobs:
        raise HTTPException(404, "파일을 찾을 수 없습니다")

    file_path = jobs[file_id]["file_path"]

    async def generate():
        try:
            # Step 1: STT + 화자 분리 (AssemblyAI)
            yield _sse({"step": "stt", "status": "processing", "message": "음성 분석 중 (STT + 화자 분리)..."})
            transcript = await transcribe_with_diarization(file_path)
            speakers = list({s["speaker"] for s in transcript})
            yield _sse({"step": "stt", "status": "done", "message": f"분석 완료 — {len(speakers)}명 감지, {len(transcript)}개 발화"})

            # Step 2: 화자 분리 완료 표시
            yield _sse({"step": "diarization", "status": "done", "message": "화자 분리 완료"})

            # Step 3: AI 요약 (두 모델 병렬)
            transcript_text = format_transcript_text(transcript)
            yield _sse({"step": "summarization", "status": "processing", "message": "AI 요약 생성 중 (두 모델 동시)..."})
            model_a, model_b = await summarize_dual(transcript_text)
            yield _sse({"step": "summarization", "status": "done", "message": "AI 요약 완료"})

            result = {
                "transcript": transcript,
                "summary_a": model_a,
                "summary_b": model_b,
            }
            jobs[file_id]["result"] = result
            jobs[file_id]["status"] = "done"

            yield _sse({"step": "complete", "data": result})

        except Exception as e:
            jobs[file_id]["status"] = "error"
            yield _sse({"step": "error", "message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
