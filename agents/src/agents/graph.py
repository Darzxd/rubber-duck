from langgraph.graph import END, START, StateGraph

from agents.nodes.architect import architect
from agents.nodes.critic import critic
from agents.nodes.scribe import scribe
from agents.state import GraphState


async def _entry(state: GraphState) -> dict:
    return {}


def _route(state: GraphState) -> list[str]:
    return list(state["dispatch"]) or [END]


def build_graph():
    g = StateGraph(GraphState)
    # The Organizer is no longer a graph node: it runs as a background loop
    # per session and feeds settled threads in here.
    g.add_node("entry", _entry)
    g.add_node("architect", architect)
    g.add_node("critic", critic)
    g.add_node("scribe", scribe)

    g.add_edge(START, "entry")
    g.add_conditional_edges(
        "entry",
        _route,
        ["architect", "critic", "scribe", END],
    )
    g.add_edge("architect", END)
    g.add_edge("critic", END)
    g.add_edge("scribe", END)

    return g.compile()


graph = build_graph()
