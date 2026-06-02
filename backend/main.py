import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, process

app = FastAPI(title="Clerkai API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(process.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/debug-env")
def debug_env():
    import os
    return {
        "GROQ_API_KEY": "set" if os.getenv("GROQ_API_KEY") else "NOT SET",
        "GROQ_KEY_PREFIX": os.getenv("GROQ_API_KEY", "")[:8] if os.getenv("GROQ_API_KEY") else "EMPTY",
        "HF_TOKEN": "set" if os.getenv("HF_TOKEN") else "NOT SET",
    }
