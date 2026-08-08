from agents.portal import publish
from agents.settings import get_settings
from agents.state import GraphState


async def critic(state: GraphState) -> dict:
    # TODO: check the digest's points against the team's GitHub repo. Stick
    # short notes with a file path. No evidence in the code, no note.
    digest = state["digest"]
    if not digest["points"]:
        return {}

    notes: list[dict] = []

    await publish(
        get_settings().portal_channel_id,
        "critic.notes",
        {"revision": digest["revision"], "notes": notes},
    )
    return {}
