import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 — ensures tables are registered before create_all
from routers import upload, process, realtime, summarize, auth, mindmap, history, share

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clerkai API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/health")
def health():
    return {"status": "ok"}


