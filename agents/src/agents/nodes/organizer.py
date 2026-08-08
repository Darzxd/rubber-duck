import uuid

from agents.state import GraphState


async def organizer(state: GraphState) -> dict:
    # Slice 1: dispatch every incoming chunk to the architect. Real batching
    # into topic threads (with filtering and settling) comes later.
    chunk = state["incoming"]
    thread = {
        "id": uuid.uuid4().hex[:8],
        "chunks": [chunk],
        "settled": True,
    }
    return {
        "buffer": [chunk],
        "settled_thread": thread,
        "dispatch": ["architect"],
    }
