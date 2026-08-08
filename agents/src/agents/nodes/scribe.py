from agents.portal import publish
from agents.settings import get_settings
from agents.state import GraphState


async def scribe(state: GraphState) -> dict:
    # TODO: maintain live lists of decisions, open items, and open questions
    # derived from the digest. Publish patches, not full snapshots.
    digest = state["digest"]
    if not digest["points"]:
        return {}

    patch = {"decisions": [], "openItems": [], "openQuestions": []}

    await publish(
        get_settings().portal_channel_id,
        "scribe.patch",
        {"revision": digest["revision"], "patch": patch},
    )
    return {}
