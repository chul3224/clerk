import asyncio
import os
import logging

logger = logging.getLogger(__name__)

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from pyannote.audio import Pipeline
        import torch

        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            raise RuntimeError("HF_TOKEN 환경변수가 설정되지 않았습니다")

        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.0",
            use_auth_token=hf_token,
        )
        if torch.cuda.is_available():
            import torch
            _pipeline = _pipeline.to(torch.device("cuda"))
    return _pipeline


def _run_diarization(file_path: str) -> list[dict]:
    pipeline = _get_pipeline()
    diarization = pipeline(file_path)
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append(
            {"start": turn.start, "end": turn.end, "speaker": speaker}
        )
    return segments


def _convert_to_wav(file_path: str) -> str:
    import os
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".wav":
        return file_path
    wav_path = file_path.rsplit(".", 1)[0] + ".wav"
    from pydub import AudioSegment
    audio = AudioSegment.from_file(file_path)
    audio.export(wav_path, format="wav")
    return wav_path


async def diarize_audio(file_path: str) -> list[dict]:
    try:
        wav_path = await asyncio.get_event_loop().run_in_executor(
            None, _convert_to_wav, file_path
        )
        segments = await asyncio.get_event_loop().run_in_executor(
            None, _run_diarization, wav_path
        )
        return segments
    except Exception as e:
        logger.warning(f"화자 분리 실패, 단일 화자로 처리합니다: {e}")
        return [{"start": 0.0, "end": 99999.0, "speaker": "SPEAKER_00"}]
