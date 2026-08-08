import uuid

from agents.bus import emit
from agents.state import GraphState


async def architect(state: GraphState) -> dict:
    # Slice 1: echo each settled chunk as a single node so we can verify the
    # end-to-end plumbing (organizer → architect → bus → SSE → canvas).
    # Real LLM extraction of nodes + edges from the thread comes next.
    thread = state["settled_thread"]
    if not thread:
        return {}

    text = " ".join(c["text"] for c in thread["chunks"])
    node = {
        "id": uuid.uuid4().hex[:8],
        "label": text,
        "author": thread["chunks"][0]["author"],
    }

    await emit(
        state["session_id"],
        "architect.draw",
        {"threadId": thread["id"], "nodes": [node], "edges": []},
    )
    return {}
