from langgraph.graph import END, START, StateGraph

from agents.nodes.architect import architect
from agents.nodes.critic import critic
from agents.nodes.organizer import organizer
from agents.nodes.scribe import scribe
from agents.state import GraphState


def _route_from_organizer(state: GraphState) -> list[str]:
    if not state["dispatch"]:
        return [END]
    return list(state["dispatch"])


def build_graph():
    g = StateGraph(GraphState)
    g.add_node("organizer", organizer)
    g.add_node("architect", architect)
    g.add_node("critic", critic)
    g.add_node("scribe", scribe)

    g.add_edge(START, "organizer")
    g.add_conditional_edges(
        "organizer",
        _route_from_organizer,
        ["architect", "critic", "scribe", END],
    )
    g.add_edge("architect", END)
    g.add_edge("critic", END)
    g.add_edge("scribe", END)

    return g.compile()


graph = build_graph()
