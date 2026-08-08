import hashlib
from typing import Literal, TypedDict


class TranscriptChunk(TypedDict):
    author: str
    text: str
    ts: float


# What a line of the summary is, which is what decides who gets to act on it.
Kind = Literal["idea", "decision", "pregunta", "pendiente"]
KINDS: set[str] = {"idea", "decision", "pregunta", "pendiente"}


class Point(TypedDict):
    """One line of what matters, as the Organizer currently understands it.

    The id is derived from the text, so the same idea keeps the same id across
    passes. That is what lets the canvas redraw without destroying a node a
    human may have moved."""

    id: str
    text: str
    author: str
    kind: Kind


class Digest(TypedDict):
    """The running summary of a session. Rewritten whole on every pass — it is
    a document being edited, not a log being appended to."""

    summary: str
    points: list[Point]
    revision: int


def point_id(text: str) -> str:
    key = " ".join(text.lower().split())
    return "p_" + hashlib.sha1(key.encode()).hexdigest()[:10]


class Note(TypedDict):
    """One entry of the Notetaker's pad.

    A Point is a line of the running summary; a Note is written to survive the
    meeting and be read on its own afterwards, so it carries its own title."""

    id: str
    title: str
    body: str
    author: str
    kind: Kind
    # 1 to 5, relative to the rest of the pad. The pad is ordered by this, which
    # is the whole job: deciding what matters more, not collecting everything.
    weight: int


class Notepad(TypedDict):
    notes: list[Note]
    revision: int


def note_id(title: str) -> str:
    key = " ".join(title.lower().split())
    return "n_" + hashlib.sha1(key.encode()).hexdigest()[:10]


Agent = Literal["architect", "critic", "scribe", "notetaker"]


class GraphState(TypedDict):
    session_id: str
    digest: Digest
    dispatch: list[Agent]
    # What the Orchestrator decided each agent should work on. An agent reads
    # its own slice, never the whole summary.
    routes: dict[str, list[Point]]
