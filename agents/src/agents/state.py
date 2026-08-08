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


Agent = Literal["architect", "critic", "scribe"]


class GraphState(TypedDict):
    session_id: str
    digest: Digest
    dispatch: list[Agent]
    # What the Orchestrator decided each agent should work on. An agent reads
    # its own slice, never the whole summary.
    routes: dict[str, list[Point]]
