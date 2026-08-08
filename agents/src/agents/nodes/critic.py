from agents.bus import emit
from agents.state import GraphState


async def critic(state: GraphState) -> dict:
    # TODO: check state["routes"]["critic"] — the proposals the Orchestrator
    # sent here — against the team's GitHub repo. Stick short notes with a file
    # path. No evidence in the code, no note.
    notes: list[dict] = []

    await emit(
        state["session_id"],
        "critic.notes",
        {"revision": state["digest"]["revision"], "notes": notes},
    )
    return {}
