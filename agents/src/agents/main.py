from fastapi import FastAPI
from pydantic import BaseModel

from agents.graph import graph
from agents.state import TranscriptChunk

app = FastAPI(title="rubber-duck agents")


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
