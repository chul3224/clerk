import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from state import jobs

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"지원하지 않는 형식입니다: {ext}")

    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}{ext}"

    size = 0
    with open(file_path, "wb") as f:
        while chunk := file.file.read(1024 * 64):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                file_path.unlink(missing_ok=True)
                raise HTTPException(400, "파일 크기가 25MB를 초과합니다")
            f.write(chunk)

    jobs[file_id] = {
        "file_path": str(file_path),
        "status": "uploaded",
        "result": None,
    }

    return {"file_id": file_id}
