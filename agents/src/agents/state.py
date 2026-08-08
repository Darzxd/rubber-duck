from operator import add
from typing import Annotated, Literal, NotRequired, TypedDict


class TranscriptChunk(TypedDict):
    author: str
    text: str
    ts: float


class Thread(TypedDict):
    id: str
    chunks: list[TranscriptChunk]
    settled: bool
    topic: NotRequired[str]
    summary: NotRequired[str]


class GraphState(TypedDict):
    session_id: str
    incoming: TranscriptChunk
    buffer: Annotated[list[TranscriptChunk], add]
    settled_thread: Thread | None
    dispatch: list[Literal["architect", "critic", "scribe"]]
