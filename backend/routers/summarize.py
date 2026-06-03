from fastapi import APIRouter
from pydantic import BaseModel

from services.groq_service import summarize_triple

router = APIRouter()


class SummarizeRequest(BaseModel):
    transcript: str


@router.post("/summarize")
async def summarize(body: SummarizeRequest):
    summaries = await summarize_triple(body.transcript)
    return {"summaries": summaries}
