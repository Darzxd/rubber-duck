import time
from dataclasses import dataclass, field

from agents.state import Digest, Notepad, TranscriptChunk

# How much speech the Organizer gets to look at. Enough to keep the thread of
# the conversation, short enough that the call stays inside the 3s budget.
CONTEXT_CHUNKS = 40

# A brief steers a meeting, it is not a document. Past this it stops fitting in
# every prompt that has to carry it.
MAX_BRIEF = 600


def empty_digest() -> Digest:
    return {"summary": "", "points": [], "revision": 0}


def empty_notepad() -> Notepad:
    return {"notes": [], "revision": 0}


def empty_board() -> dict:
    return {"revision": 0, "elements": []}


@dataclass
class SessionState:
    """Live picture of one session: everything said, plus the running summary
    the Organizer keeps rewriting over it."""

    pending: list[TranscriptChunk] = field(default_factory=list)
    transcript: list[TranscriptChunk] = field(default_factory=list)
    digest: Digest = field(default_factory=empty_digest)
    # What the room said it was here to do, written before anybody spoke. Every
    # agent that has to decide what matters reads it; without it they can only
    # guess at the point of the meeting.
    brief: str = ""
    notepad: Notepad = field(default_factory=empty_notepad)
    # The last thing the Architect drew. Whoever opens the link after it was
    # drawn gets an empty canvas otherwise: the stream only carries what
    # happens from the moment somebody is listening.
    board: dict = field(default_factory=empty_board)
    # The team's repo, read once when somebody connects it. It is context for
    # understanding what is being said — never a source of what gets drawn.
    repo: dict | None = None
    # The Critic is handed each proposal once, so its notes accumulate here
    # rather than being rewritten — nothing would bring an old one back.
    critic_notes: list[dict] = field(default_factory=list)
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


def set_brief(session_id: str, brief: str) -> str:
    s = get(session_id)
    s.brief = " ".join(brief.split())[:MAX_BRIEF]
    return s.brief


def set_notepad(session_id: str, notepad: Notepad) -> None:
    get(session_id).notepad = notepad


def set_board(session_id: str, revision: int, elements: list[dict]) -> None:
    get(session_id).board = {"revision": revision, "elements": elements}


def set_repo(session_id: str, index: dict | None) -> None:
    get(session_id).repo = index


# Enough to fill the panel twice. Past that the oldest objection is about a
# proposal nobody is discussing any more.
MAX_CRITIC_NOTES = 12


def add_critic_notes(session_id: str, revision: int, notes: list[dict]) -> list[dict]:
    """Adds what the Critic just found, newest first, one note per proposal."""
    s = get(session_id)
    fresh = [dict(n, revision=revision) for n in notes]
    keep = {n["point"] for n in fresh}
    s.critic_notes = (fresh + [n for n in s.critic_notes if n["point"] not in keep])[
        :MAX_CRITIC_NOTES
    ]
    return s.critic_notes
