from agents.bus import emit
from agents.state import GraphState

_LISTS = {
    "decision": "decisions",
    "pendiente": "openItems",
    "pregunta": "openQuestions",
}


async def scribe(state: GraphState) -> dict:
    # The Orchestrator already separated what belongs on each list, so this is
    # a sort, not a judgement.
    patch: dict[str, list[str]] = {
        "decisions": [],
        "openItems": [],
        "openQuestions": [],
    }
    for point in state["routes"]["scribe"]:
        patch[_LISTS[point["kind"]]].append(point["text"])

    await emit(
        state["session_id"],
        "scribe.patch",
        {"revision": state["digest"]["revision"], "patch": patch},
    )
    return {}
