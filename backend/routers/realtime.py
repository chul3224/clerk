import asyncio
import json
import os

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

DEEPGRAM_WS_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?model=nova-2"
    "&detect_language=true"
    "&punctuate=true"
    "&interim_results=true"
    "&endpointing=500"
    "&encoding=linear16"
    "&sample_rate=16000"
    "&channels=1"
)


@router.websocket("/ws/transcribe")
async def ws_transcribe(websocket: WebSocket):
    await websocket.accept()

    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        await websocket.send_json({"error": "DEEPGRAM_API_KEY not set"})
        await websocket.close()
        return

    try:
        async with websockets.connect(
            DEEPGRAM_WS_URL,
            extra_headers={"Authorization": f"Token {api_key}"},
        ) as dg_ws:

            async def client_to_deepgram():
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        await dg_ws.send(data)
                except (WebSocketDisconnect, Exception):
                    try:
                        await dg_ws.send(json.dumps({"type": "CloseStream"}))
                    except Exception:
                        pass

            async def deepgram_to_client():
                try:
                    async for msg in dg_ws:
                        result = json.loads(msg)
                        if result.get("type") == "Results":
                            alt = result.get("channel", {}).get("alternatives", [{}])[0]
                            transcript = alt.get("transcript", "")
                            is_final = result.get("is_final", False)
                            if transcript:
                                await websocket.send_json({
                                    "transcript": transcript,
                                    "is_final": is_final,
                                })
                except Exception:
                    pass

            await asyncio.gather(
                client_to_deepgram(),
                deepgram_to_client(),
                return_exceptions=True,
            )

    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
