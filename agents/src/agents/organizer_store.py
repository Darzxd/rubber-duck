import time
import uuid
from dataclasses import dataclass, field

from agents.state import Thread, TranscriptChunk


@dataclass
class SessionState:
    """Live picture of one session. Threads persist across ticks so the
    Organizer can revise them as the conversation continues, instead of
    judging each fragment in isolation."""

    pending: list[TranscriptChunk] = field(default_factory=list)
    threads: dict[str, Thread] = field(default_factory=dict)
    last_reconciled: float = field(default_factory=time.time)
    last_chunk_at: float = 0.0


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
    return taken


def new_thread_id() -> str:
    return f"th_{uuid.uuid4().hex[:8]}"


def upsert_thread(session_id: str, thread: Thread) -> None:
    get(session_id).threads[thread["id"]] = thread


def ongoing(session_id: str) -> list[Thread]:
    return [
        t for t in get(session_id).threads.values() if t["status"] == "ongoing"
    ]


def undispatched_settled(session_id: str) -> list[Thread]:
    return [
        t
        for t in get(session_id).threads.values()
        if t["status"] == "settled" and not t["dispatched"]
    ]
