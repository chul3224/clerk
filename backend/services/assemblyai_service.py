import asyncio
import os
import assemblyai as aai


def _transcribe_sync(file_path: str) -> list[dict]:
    aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

    config = aai.TranscriptionConfig(
        speaker_labels=True,
        language_code="ko",
    )

    transcriber = aai.Transcriber(config=config)
    transcript = transcriber.transcribe(file_path)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI 오류: {transcript.error}")

    segments = []

    if transcript.utterances:
        for utt in transcript.utterances:
            segments.append({
                "start": utt.start / 1000,
                "end": utt.end / 1000,
                "speaker": f"SPEAKER_{utt.speaker}",
                "text": utt.text.strip(),
            })
    else:
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "speaker": "SPEAKER_A",
            "text": transcript.text or "",
        })

    return segments


async def transcribe_with_diarization(file_path: str) -> list[dict]:
    return await asyncio.get_event_loop().run_in_executor(
        None, _transcribe_sync, file_path
    )
