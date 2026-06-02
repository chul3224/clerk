import asyncio
import os

from deepgram import DeepgramClient, PrerecordedOptions


def _transcribe_sync(file_path: str) -> list[dict]:
    client = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

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

    segments = []

    if response.results.utterances:
        for utt in response.results.utterances:
            segments.append({
                "start": utt.start,
                "end": utt.end,
                "speaker": f"SPEAKER_{chr(65 + int(utt.speaker))}",
                "text": utt.transcript.strip(),
            })
    else:
        words = response.results.channels[0].alternatives[0].words or []
        current = None
        for w in words:
            spk = f"SPEAKER_{chr(65 + int(w.speaker))}"
            if current and current["speaker"] == spk and w.start - current["end"] < 1.5:
                current["end"] = w.end
                current["words"].append(w.word)
            else:
                if current:
                    segments.append({
                        "start": current["start"],
                        "end": current["end"],
                        "speaker": current["speaker"],
                        "text": " ".join(current["words"]),
                    })
                current = {"start": w.start, "end": w.end, "speaker": spk, "words": [w.word]}
        if current:
            segments.append({
                "start": current["start"],
                "end": current["end"],
                "speaker": current["speaker"],
                "text": " ".join(current["words"]),
            })

    return segments or [{"start": 0.0, "end": 0.0, "speaker": "SPEAKER_A", "text": "인식된 텍스트가 없습니다."}]


async def transcribe_with_diarization(file_path: str) -> list[dict]:
    return await asyncio.get_event_loop().run_in_executor(
        None, _transcribe_sync, file_path
    )
