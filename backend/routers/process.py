import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.diarization_service import diarize_audio
from services.groq_service import summarize_dual
from services.transcript_builder import build_transcript, format_transcript_text
from services.whisper_service import transcribe_audio
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
            # Step 1: STT
            yield _sse({"step": "stt", "status": "processing", "message": "음성을 텍스트로 변환 중..."})
            whisper_result = await transcribe_audio(file_path)
            yield _sse({"step": "stt", "status": "done", "message": f"STT 완료 — {len(whisper_result['segments'])}개 세그먼트"})

            # Step 2: 화자 분리
            yield _sse({"step": "diarization", "status": "processing", "message": "화자를 분리 중..."})
            diarization_result = await diarize_audio(file_path)
            speakers = list({s["speaker"] for s in diarization_result})
            yield _sse({"step": "diarization", "status": "done", "message": f"화자 분리 완료 — {len(speakers)}명 감지"})

            # Step 3: 대화록 생성
            transcript = build_transcript(whisper_result["segments"], diarization_result)
            transcript_text = format_transcript_text(transcript)

            # Step 4: AI 요약 (두 모델 병렬)
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
