from agents.state import GraphState


async def organizer(state: GraphState) -> dict:
    # TODO: group buffered chunks into topic threads, decide when a thread has
    # settled, filter out anything that does not deserve the canvas. Only this
    # node dispatches — controls the pace of the whole graph.
    chunk = state["incoming"]
    return {
        "buffer": [chunk],
        "settled_thread": None,
        "dispatch": [],
    }
