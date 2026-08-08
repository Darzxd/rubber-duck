import asyncio
import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.bus import subscribe, unsubscribe
from agents.graph import graph
from agents.state import TranscriptChunk

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


@app.post("/ingest")
async def ingest(req: IngestRequest) -> dict:
    chunk: TranscriptChunk = {"author": req.author, "text": req.text, "ts": req.ts}
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
