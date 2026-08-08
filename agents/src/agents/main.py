from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
