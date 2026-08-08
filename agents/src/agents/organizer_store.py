import time
from dataclasses import dataclass, field

from agents.state import Digest, TranscriptChunk

# How much speech the Organizer gets to look at. Enough to keep the thread of
# the conversation, short enough that the call stays inside the 3s budget.
CONTEXT_CHUNKS = 40


def empty_digest() -> Digest:
    return {"summary": "", "points": [], "revision": 0}


@dataclass
class SessionState:
    """Live picture of one session: everything said, plus the running summary
    the Organizer keeps rewriting over it."""

    pending: list[TranscriptChunk] = field(default_factory=list)
    transcript: list[TranscriptChunk] = field(default_factory=list)
    digest: Digest = field(default_factory=empty_digest)
    last_chunk_at: float = 0.0
    last_summarized: float = 0.0


_sessions: dict[str, SessionState] = {}


def get(session_id: str) -> SessionState:
    if session_id not in _sessions:
        _sessions[session_id] = SessionState()
    return _sessions[session_id]


def session_ids() -> list[str]:
    return list(_sessions)


def add_chunk(session_id: str, chunk: TranscriptChunk) -> None:
    s = get(session_id)
    s.pending.append(chunk)
    s.last_chunk_at = time.time()


def take_pending(session_id: str) -> list[TranscriptChunk]:
    s = get(session_id)
    taken, s.pending = s.pending, []
    s.transcript.extend(taken)
    del s.transcript[:-CONTEXT_CHUNKS]
    return taken


def context(session_id: str) -> list[TranscriptChunk]:
    return get(session_id).transcript


def set_digest(session_id: str, digest: Digest) -> None:
    s = get(session_id)
    s.digest = digest
    s.last_summarized = time.time()
