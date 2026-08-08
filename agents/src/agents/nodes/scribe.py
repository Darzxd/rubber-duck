from agents.portal import publish
from agents.settings import get_settings
from agents.state import GraphState


async def scribe(state: GraphState) -> dict:
    # TODO: maintain live lists of decisions, open items, and open questions
    # derived from the settled thread. Publish patches, not full snapshots.
    thread = state["settled_thread"]
    if not thread:
        return {}

    patch = {"decisions": [], "openItems": [], "openQuestions": []}

    await publish(
        get_settings().portal_channel_id,
        "scribe.patch",
        {"threadId": thread["id"], "patch": patch},
    )
    return {}
