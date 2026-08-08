import hashlib
from typing import Literal, TypedDict


class TranscriptChunk(TypedDict):
    author: str
    text: str
    ts: float


class Point(TypedDict):
    """One line of what matters, as the Organizer currently understands it.

    The id is derived from the text, so the same idea keeps the same id across
    passes. That is what lets the canvas redraw without destroying a node a
    human may have moved."""

    id: str
    text: str
    author: str


class Digest(TypedDict):
    """The running summary of a session. Rewritten whole on every pass — it is
    a document being edited, not a log being appended to."""

    summary: str
    points: list[Point]
    revision: int


def point_id(text: str) -> str:
    key = " ".join(text.lower().split())
    return "p_" + hashlib.sha1(key.encode()).hexdigest()[:10]


class GraphState(TypedDict):
    session_id: str
    digest: Digest
    dispatch: list[Literal["architect", "critic", "scribe"]]
