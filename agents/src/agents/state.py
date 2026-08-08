from typing import Literal, NotRequired, TypedDict


class TranscriptChunk(TypedDict):
    author: str
    text: str
    ts: float


class Intent(TypedDict):
    """What one participant is after inside a thread."""

    author: str
    wants: str


class Thread(TypedDict):
    id: str
    topic: str
    summary: str
    chunks: list[TranscriptChunk]
    participants: list[str]
    intents: list[Intent]
    status: Literal["ongoing", "settled"]
    created_at: float
    last_touched: float
    dispatched: bool
    open_questions: NotRequired[list[str]]


class GraphState(TypedDict):
    session_id: str
    thread: Thread
    dispatch: list[Literal["architect", "critic", "scribe"]]
