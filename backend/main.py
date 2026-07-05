import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine, Base
import models  # noqa: F401 — ensures tables are registered before create_all
from routers import upload, process, realtime, summarize, auth, mindmap, history, share, dify

Base.metadata.create_all(bind=engine)


def _migrate():
    """기존 DB에 새 컬럼이 없으면 추가한다 (간단 마이그레이션).
    create_all은 이미 존재하는 테이블은 건드리지 않기 때문에 필요."""
    insp = inspect(engine)
    cols = {c["name"] for c in insp.get_columns("meeting_records")}
    additions = {
        "title": "VARCHAR",
        "transcript": "TEXT",
        "summaries": "TEXT",
    }
    with engine.begin() as conn:
        for name, coltype in additions.items():
            if name not in cols:
                conn.execute(text(f"ALTER TABLE meeting_records ADD COLUMN {name} {coltype}"))


_migrate()

app = FastAPI(title="Clerkai API", version="1.1.0")

# 배포 시 ALLOWED_ORIGINS 환경변수에 프론트 주소를 콤마로 나열하세요.
# 예: ALLOWED_ORIGINS=https://clerk-nine-mu.vercel.app,http://localhost:5173
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(process.router, prefix="/api")
app.include_router(realtime.router, prefix="/api")
app.include_router(summarize.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(mindmap.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(share.router, prefix="/api")
app.include_router(dify.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
