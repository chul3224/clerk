import asyncio
import os

from deepgram import DeepgramClient, PrerecordedOptions


def _transcribe_sync(file_path: str) -> list[dict]:
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPGRAM_API_KEY 환경변수가 설정되지 않았습니다")

    client = DeepgramClient(api_key)

    with open(file_path, "rb") as f:
        buffer_data = f.read()

    options = PrerecordedOptions(
        model="nova-2",
        language="ko",
        diarize=True,
        punctuate=True,
        utterances=True,
    )

    response = client.listen.rest.v("1").transcribe_file(
        {"buffer": buffer_data}, options
    )

    results = response.results
    if not results:
        raise RuntimeError("Deepgram 응답이 없습니다")

    segments = []

    if results.utterances:
        for utt in results.utterances:
            speaker_idx = int(utt.speaker) if utt.speaker is not None else 0
            segments.append({
                "start": float(utt.start),
                "end": float(utt.end),
                "speaker": f"SPEAKER_{chr(65 + speaker_idx)}",
                "text": utt.transcript.strip(),
            })
    else:
        words = results.channels[0].alternatives[0].words or []
        current = None
        for w in words:
            spk_idx = int(w.speaker) if w.speaker is not None else 0
            spk = f"SPEAKER_{chr(65 + spk_idx)}"
            if current and current["speaker"] == spk and float(w.start) - current["end"] < 1.5:
                current["end"] = float(w.end)
                current["words"].append(w.word)
            else:
                if current:
                    segments.append({
                        "start": current["start"],
                        "end": current["end"],
                        "speaker": current["speaker"],
                        "text": " ".join(current["words"]),
                    })
                current = {"start": float(w.start), "end": float(w.end), "speaker": spk, "words": [w.word]}
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
