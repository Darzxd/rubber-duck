import time
from collections import defaultdict

from agents.state import TranscriptChunk

# Per-session rolling buffer of transcript chunks that survived the cheap
# noise filter but have not yet been organized into a settled thread. In a
# multi-worker deploy this needs to move to Redis or the bus — one process
# is enough for the hackathon.
_buffers: dict[str, dict] = defaultdict(
    lambda: {"chunks": [], "last_organized": 0.0},
)


def append(session_id: str, chunk: TranscriptChunk) -> None:
    _buffers[session_id]["chunks"].append(chunk)


def snapshot(session_id: str) -> list[TranscriptChunk]:
    return list(_buffers[session_id]["chunks"])


def replace(session_id: str, chunks: list[TranscriptChunk]) -> None:
    _buffers[session_id]["chunks"] = chunks
    _buffers[session_id]["last_organized"] = time.time()


def should_organize(
    session_id: str,
    min_chunks: int = 2,
    timeout_sec: float = 4.0,
) -> bool:
    b = _buffers[session_id]
    if not b["chunks"]:
        return False
    if len(b["chunks"]) >= min_chunks:
        return True
    return time.time() - b["last_organized"] >= timeout_sec
