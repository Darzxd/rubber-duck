from agents.portal import publish
from agents.settings import get_settings
from agents.state import GraphState


async def architect(state: GraphState) -> dict:
    # TODO: turn the settled thread into canvas nodes and connections. Only
    # draw what was actually said in the thread.
    thread = state["settled_thread"]
    if not thread:
        return {}

    nodes: list[dict] = []
    edges: list[dict] = []

    await publish(
        get_settings().portal_channel_id,
        "architect.draw",
        {"threadId": thread["id"], "nodes": nodes, "edges": edges},
    )
    return {}
