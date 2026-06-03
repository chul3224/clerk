from fastapi import APIRouter
from pydantic import BaseModel

from services.groq_service import summarize_dual

router = APIRouter()


class SummarizeRequest(BaseModel):
    transcript: str


@router.post("/summarize")
async def summarize(body: SummarizeRequest):
    model_a, model_b = await summarize_dual(body.transcript)
    return {"summary_a": model_a, "summary_b": model_b}
