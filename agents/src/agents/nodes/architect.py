import uuid

from agents.bus import emit
from agents.state import GraphState


async def architect(state: GraphState) -> dict:
    # Still a stub: one node per settled thread. Real extraction of concepts
    # and edges from the thread is the next slice.
    thread = state["thread"]

    node = {
        "id": uuid.uuid4().hex[:8],
        "label": thread["summary"] or thread["topic"],
        "topic": thread["topic"],
        "author": thread["participants"][0] if thread["participants"] else "",
    }

    await emit(
        state["session_id"],
        "architect.draw",
        {"threadId": thread["id"], "nodes": [node], "edges": []},
    )
    return {}
