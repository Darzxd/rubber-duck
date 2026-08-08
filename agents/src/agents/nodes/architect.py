import uuid

from agents.bus import emit
from agents.state import GraphState


async def architect(state: GraphState) -> dict:
    # Still stub — for now we surface the Organizer's summary as the node
    # label instead of raw chunk text. Real LLM extraction of nodes + edges
    # from the thread is the next slice.
    thread = state["settled_thread"]
    if not thread:
        return {}

    summary = thread.get("summary") or " ".join(
        c["text"] for c in thread["chunks"]
    )
    topic = thread.get("topic") or ""
    author = thread["chunks"][0]["author"] if thread["chunks"] else ""

    node = {
        "id": uuid.uuid4().hex[:8],
        "label": summary,
        "topic": topic,
        "author": author,
    }

    await emit(
        state["session_id"],
        "architect.draw",
        {"threadId": thread["id"], "nodes": [node], "edges": []},
    )
    return {}
