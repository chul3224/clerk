def build_transcript(
    whisper_segments: list[dict], diarization_segments: list[dict]
) -> list[dict]:
    transcript = []

    for ws in whisper_segments:
        ws_start = ws["start"]
        ws_end = ws["end"]
        best_speaker = "SPEAKER_00"
        best_overlap = -1

        for ds in diarization_segments:
            overlap = max(0, min(ws_end, ds["end"]) - max(ws_start, ds["start"]))
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = ds["speaker"]

        transcript.append(
            {
                "start": ws_start,
                "end": ws_end,
                "speaker": best_speaker,
                "text": ws["text"],
            }
        )

    # 같은 화자의 연속 세그먼트 병합 (간격 1초 이하)
    merged: list[dict] = []
    for seg in transcript:
        if (
            merged
            and merged[-1]["speaker"] == seg["speaker"]
            and seg["start"] - merged[-1]["end"] <= 1.0
        ):
            merged[-1]["end"] = seg["end"]
            merged[-1]["text"] += " " + seg["text"]
        else:
            merged.append(dict(seg))

    return merged


def format_transcript_text(segments: list[dict]) -> str:
    lines = []
    for seg in segments:
        secs = int(seg["start"])
        lines.append(f"[{secs // 60:02d}:{secs % 60:02d}] {seg['speaker']}: {seg['text']}")
    return "\n".join(lines)
