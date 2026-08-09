from langgraph.graph import END, START, StateGraph

from agents.nodes.architect import architect
from agents.nodes.critic import critic
from agents.nodes.notetaker import notetaker
from agents.nodes.scribe import scribe
from agents.state import GraphState


async def _entry(state: GraphState) -> dict:
    return {}


def _route(state: GraphState) -> list[str]:
    """Which agents run straight from entry.

    The Critic annotates nodes the Architect has created. If both are dispatched
    it waits its turn instead of starting alongside — a `pegar_nota` on a node
    the Architect has not placed yet is silently dropped."""
    dispatch = list(state["dispatch"])
    if "architect" in dispatch and "critic" in dispatch:
        dispatch.remove("critic")
    return dispatch or [END]


def _after_architect(state: GraphState) -> str:
    """Runs the Critic once the Architect has laid the nodes it will annotate.

    Anything else the Critic wanted to check that has no node this pass is
    lost; it will catch it on the next revision if the point survives."""
    return "critic" if "critic" in state["dispatch"] else END


def build_graph():
    g = StateGraph(GraphState)
    # The Organizer is no longer a graph node: it runs as a background loop
    # per session and feeds settled threads in here.
    g.add_node("entry", _entry)
    g.add_node("architect", architect)
    g.add_node("critic", critic)
    g.add_node("scribe", scribe)
    g.add_node("notetaker", notetaker)

    g.add_edge(START, "entry")
    g.add_conditional_edges(
        "entry",
        _route,
        ["architect", "critic", "scribe", "notetaker", END],
    )
    g.add_conditional_edges("architect", _after_architect, ["critic", END])
    g.add_edge("critic", END)
    g.add_edge("scribe", END)
    g.add_edge("notetaker", END)

    return g.compile()


graph = build_graph()
