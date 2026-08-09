import asyncio
import json
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from agents import organizer_loop, organizer_store, repo
from agents.bus import emit, sessions, subscribe, unsubscribe
from agents.orchestrator import dispatch
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


class BriefRequest(BaseModel):
    session_id: str
    brief: str


class RepoRequest(BaseModel):
    session_id: str
    url: str
    # Only sent on the second try, after GitHub refused the repo to an
    # anonymous reader. It is used for this one call and never stored.
    token: str = ""


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
        {"author": req.author, "text": req.text, "ts": req.ts},
    )

    # Ingest only queues. The Organizer loop listens on its own clock, so a
    # slow model call never holds up the next thing somebody says.
    organizer_loop.ensure_running(req.session_id, dispatch)
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


@app.post("/brief")
async def brief(req: BriefRequest) -> dict:
    """What the room is here to do, set before anybody speaks.

    Idempotent on purpose: everyone who joins posts the brief they were shown,
    so a late arrival re-asserting it is harmless."""
    saved = organizer_store.set_brief(req.session_id, req.brief)
    await emit(req.session_id, "session.brief", {"brief": saved})
    return {"brief": saved}


@app.post("/repo")
async def connect_repo(req: RepoRequest) -> dict:
    """Reads the team's repo so the agents know what the product is made of.

    Answers with a reason rather than an error when it cannot get in, because
    the front acts on it: `needs_token` is what turns the card into its second
    step instead of showing a failure."""
    try:
        index = await repo.fetch(req.url, req.token)
    except repo.RepoError as e:
        # req.token is deliberately absent from this line and from every other
        # one in this file. It belongs to whoever pasted it.
        logger.info("repo %s refused session=%s: %s", req.url, req.session_id, e.reason)
        return {"ok": False, "reason": e.reason}

    organizer_store.set_repo(req.session_id, index)
    connected = {
        "url": index["url"],
        "owner": index["owner"],
        "name": index["name"],
        "description": index["description"],
        "language": index["language"],
        "files": index["total_files"],
        "private": index["private"],
    }
    await emit(req.session_id, "session.repo", connected)
    return {"ok": True, "repo": connected}


@app.get("/digest/{session_id}")
async def digest(session_id: str) -> dict:
    s = organizer_store.get(session_id)
    return {
        "pending": len(s.pending),
        "heard": len(s.transcript),
        "digest": s.digest,
        "brief": s.brief,
        "notepad": s.notepad,
        "board": s.board,
        # The index itself is large and is nobody's business on the front; what
        # it needs is whether a repo is connected and which one.
        "repo": {
            "url": s.repo["url"],
            "owner": s.repo["owner"],
            "name": s.repo["name"],
            "description": s.repo["description"],
            "language": s.repo["language"],
            "files": s.repo["total_files"],
            "private": s.repo["private"],
        }
        if s.repo
        else None,
    }


@app.post("/realtime-session")
async def realtime_session() -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(500, "OPENAI_API_KEY is not set")

    transcription: dict = {
        "model": settings.openai_realtime_model,
        "languages": list(settings.openai_realtime_languages),
        "delay": settings.openai_realtime_delay,
    }
    if settings.openai_realtime_keywords:
        transcription["keywords"] = list(settings.openai_realtime_keywords)
    if settings.openai_realtime_prompt:
        transcription["prompt"] = settings.openai_realtime_prompt
    logger.info("realtime session transcription=%s", transcription)

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
                            # This model rejects every turn_detection value.
                            "turn_detection": None,
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
