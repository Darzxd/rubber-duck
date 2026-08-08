import asyncio
import json
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from agents.bus import emit, sessions, subscribe, unsubscribe
from agents.graph import graph
from agents.settings import get_settings
from agents.state import TranscriptChunk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agents.api")

app = FastAPI(title="rubber-duck agents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngestRequest(BaseModel):
    session_id: str
    author: str
    text: str
    ts: float


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.get("/working")
async def working() -> FileResponse:
    return FileResponse(Path(__file__).parent / "working.html")


@app.get("/sessions")
async def list_sessions() -> dict:
    return {"sessions": sessions()}


@app.post("/ingest")
async def ingest(req: IngestRequest) -> dict:
    chunk: TranscriptChunk = {"author": req.author, "text": req.text, "ts": req.ts}
    logger.info(
        "ingest session=%s author=%s text=%r", req.session_id, req.author, req.text
    )
    await emit(
        req.session_id,
        "ingest.received",
        {"author": req.author, "text": req.text},
    )
    await graph.ainvoke(
        {
            "session_id": req.session_id,
            "incoming": chunk,
            "buffer": [],
            "settled_thread": None,
            "dispatch": [],
        }
    )
    return {"accepted": True}


@app.post("/realtime-session")
async def realtime_session() -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(500, "OPENAI_API_KEY is not set")

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/realtime/client_secrets",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "session": {
                    "type": "transcription",
                    "audio": {
                        "input": {
                            "transcription": {
                                "model": settings.openai_realtime_model,
                                "language": settings.openai_realtime_language,
                                "prompt": settings.openai_realtime_prompt,
                            },
                            "turn_detection": {
                                "type": "server_vad",
                                "threshold": 0.6,
                                "prefix_padding_ms": 400,
                                "silence_duration_ms": (
                                    settings.openai_realtime_silence_ms
                                ),
                            },
                        }
                    },
                }
            },
        )

    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"openai realtime mint failed: {r.text}")
    return r.json()


@app.get("/events/{session_id}")
async def events(session_id: str, request: Request) -> StreamingResponse:
    q = subscribe(session_id)

    async def gen():
        try:
            yield ": connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            unsubscribe(session_id, q)

    return StreamingResponse(gen(), media_type="text/event-stream")
