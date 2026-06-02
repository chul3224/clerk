import asyncio
import os
from pathlib import Path

import httpx

MIME_TYPES = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
}


def _transcribe_sync(file_path: str) -> list[dict]:
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPGRAM_API_KEY 환경변수가 설정되지 않았습니다")

    ext = Path(file_path).suffix.lower()
    content_type = MIME_TYPES.get(ext, "audio/mpeg")

    with open(file_path, "rb") as f:
        audio_data = f.read()

    response = httpx.post(
        "https://api.deepgram.com/v1/listen",
        headers={
            "Authorization": f"Token {api_key}",
            "Content-Type": content_type,
        },
        params={
            "model": "nova-2",
            "detect_language": "true",
            "diarize": "true",
            "punctuate": "true",
            "utterances": "true",
        },
        content=audio_data,
        timeout=300.0,
    )
    response.raise_for_status()
    data = response.json()

    utterances = data.get("results", {}).get("utterances", [])
    segments = []

    if utterances:
        for utt in utterances:
            speaker_idx = int(utt.get("speaker", 0))
            segments.append({
                "start": float(utt["start"]),
                "end": float(utt["end"]),
                "speaker": f"SPEAKER_{chr(65 + speaker_idx)}",
                "text": utt.get("transcript", "").strip(),
            })
    else:
        words = (
            data.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("words", [])
        )
        current = None
        for w in words:
            spk = f"SPEAKER_{chr(65 + int(w.get('speaker', 0)))}"
            if current and current["speaker"] == spk and float(w["start"]) - current["end"] < 1.5:
                current["end"] = float(w["end"])
                current["words"].append(w["word"])
            else:
                if current:
                    segments.append({
                        "start": current["start"],
                        "end": current["end"],
                        "speaker": current["speaker"],
                        "text": " ".join(current["words"]),
                    })
                current = {"start": float(w["start"]), "end": float(w["end"]), "speaker": spk, "words": [w["word"]]}
        if current:
            segments.append({
                "start": current["start"],
                "end": current["end"],
                "speaker": current["speaker"],
                "text": " ".join(current["words"]),
            })

    return segments or [{"start": 0.0, "end": 0.0, "speaker": "SPEAKER_A", "text": "인식된 텍스트가 없습니다."}]


async def transcribe_with_diarization(file_path: str) -> list[dict]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _transcribe_sync, file_path)
