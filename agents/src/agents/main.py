import asyncio
import json
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from agents import organizer_loop, organizer_store
from agents.bus import emit, sessions, subscribe, unsubscribe
from agents.graph import graph
from agents.settings import get_settings
from agents.state import Thread, TranscriptChunk

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


class UnsureRequest(BaseModel):
    session_id: str
    author: str
    text: str
    confidence: float


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.get("/working")
async def working() -> FileResponse:
    return FileResponse(Path(__file__).parent / "working.html")


@app.get("/sessions")
async def list_sessions() -> dict:
    return {"sessions": sessions()}


async def _dispatch(session_id: str, thread: Thread) -> None:
    await graph.ainvoke(
        {
            "session_id": session_id,
            "thread": thread,
            "dispatch": ["architect"],
        }
    )


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

    # Ingest only queues. The Organizer loop listens on its own clock, so a
    # slow model call never holds up the next thing somebody says.
    organizer_loop.ensure_running(req.session_id, _dispatch)
    kept = organizer_loop.submit(req.session_id, chunk)
    if not kept:
        await emit(
            req.session_id,
            "organizer.status",
            {"stage": "noise_dropped", "text": req.text},
        )
    else:
        await emit(
            req.session_id,
            "organizer.status",
            {
                "stage": "queued",
                "pending": len(organizer_store.get(req.session_id).pending),
            },
        )
    return {"accepted": True, "queued": kept}


@app.get("/threads/{session_id}")
async def threads(session_id: str) -> dict:
    s = organizer_store.get(session_id)
    return {
        "pending": len(s.pending),
        "threads": [
            {
                "id": t["id"],
                "topic": t["topic"],
                "summary": t["summary"],
                "status": t["status"],
                "dispatched": t["dispatched"],
                "participants": t["participants"],
                "intents": t["intents"],
                "open_questions": t.get("open_questions") or [],
                "chunks": len(t["chunks"]),
            }
            for t in s.threads.values()
        ],
    }


@app.post("/unsure")
async def unsure(req: UnsureRequest) -> dict:
    """The browser heard something it does not trust. It stops there — this
    only makes the discard visible on the internals page."""
    logger.info(
        "unsure session=%s author=%s conf=%.2f text=%r",
        req.session_id,
        req.author,
        req.confidence,
        req.text,
    )
    await emit(
        req.session_id,
        "transcript.unsure",
        {
            "author": req.author,
            "text": req.text,
            "confidence": round(req.confidence, 2),
        },
    )
    return {"ok": True}


@app.post("/realtime-session")
async def realtime_session() -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(500, "OPENAI_API_KEY is not set")

    transcription: dict = {
        "model": settings.openai_realtime_model,
        "language": settings.openai_realtime_language,
    }
    if settings.openai_realtime_prompt:
        transcription["prompt"] = settings.openai_realtime_prompt

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
                            "transcription": transcription,
                            # Room noise opens segments that hold no speech,
                            # and the model fills them with invented text.
                            "noise_reduction": {"type": "near_field"},
                            "turn_detection": {
                                "type": "server_vad",
                                "threshold": 0.55,
                                "prefix_padding_ms": 400,
                                "silence_duration_ms": (
                                    settings.openai_realtime_silence_ms
                                ),
                            },
                        }
                    },
                    # Invented text comes back with low token probability.
                    # Without this the browser has no way to tell it apart
                    # from something actually said.
                    "include": ["item.input_audio_transcription.logprobs"],
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
