from agents.portal import publish
from agents.settings import get_settings
from agents.state import GraphState


async def critic(state: GraphState) -> dict:
    # TODO: check proposals in the settled thread against the team's GitHub
    # repo. Stick short notes with a file path. No evidence in the code, no
    # note.
    thread = state["settled_thread"]
    if not thread:
        return {}

    notes: list[dict] = []

    await publish(
        get_settings().portal_channel_id,
        "critic.notes",
        {"threadId": thread["id"], "notes": notes},
    )
    return {}
