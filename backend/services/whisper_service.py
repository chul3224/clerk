import os

from groq import AsyncGroq


async def transcribe_audio(file_path: str) -> dict:
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

    with open(file_path, "rb") as audio_file:
        response = await client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
            response_format="verbose_json",
            language="ko",
            prompt="Clerkai, Groq, Whisper, STT, 화자 분리, 화자분리, 프론트엔드, 백엔드, API, MVP, 레일웨이, 클라우드플레어, 액션아이템, 신우철",
        )

    segments = []
    if hasattr(response, "segments") and response.segments:
        for i, seg in enumerate(response.segments):
            if isinstance(seg, dict):
                segments.append(
                    {
                        "id": i,
                        "start": seg.get("start", 0.0),
                        "end": seg.get("end", 0.0),
                        "text": seg.get("text", "").strip(),
                    }
                )
            else:
                segments.append(
                    {
                        "id": i,
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text.strip(),
                    }
                )
    else:
        segments = [{"id": 0, "start": 0.0, "end": 0.0, "text": response.text}]

    return {"text": response.text, "segments": segments}
