import logging
import time

from agents.bus import emit
from agents.graph import graph
from agents.state import Agent, Digest, Point

logger = logging.getLogger("agents.orchestrator")

# The Critic is the only one that costs anything to run: it goes and reads the
# team's repo. Nobody is watching its notes tick, so it runs on a slower clock
# while the board and the lists keep up with the room.
CRITIC_EVERY_SEC = 20.0

# Who gets what. The Organizer already said what each line is while it was
# writing the summary, so deciding this costs nothing and stays out of the
# 3s budget — no second model call before the board moves.
#
# The board is the structure of what is being built, so questions and pending
# items do not belong on it; they are lists the Scribe keeps. A decision is
# both: it is a node and it is on the record.
WANTS: dict[str, set[str]] = {
    "architect": {"idea", "decision"},
    "scribe": {"decision", "pregunta", "pendiente"},
    # The Critic checks proposals against the repo. A question has nothing to
    # check yet, and a decision is already made.
    "critic": {"idea"},
}

_last_critic: dict[str, float] = {}


def route(session_id: str, digest: Digest) -> dict[str, list[Point]]:
    """Splits the running summary into what each agent should act on. An agent
    with nothing to act on is not called at all."""
    critic_due = time.time() - _last_critic.get(session_id, 0.0) >= CRITIC_EVERY_SEC

    routes: dict[str, list[Point]] = {}
    for agent, kinds in WANTS.items():
        if agent == "critic" and not critic_due:
            continue
        mine = [p for p in digest["points"] if p["kind"] in kinds]
        if mine:
            routes[agent] = mine

    if "critic" in routes:
        _last_critic[session_id] = time.time()
    return routes


async def dispatch(session_id: str, digest: Digest) -> None:
    """Hands each agent the part of the summary that is its business."""
    routes = route(session_id, digest)
    if not routes:
        return

    agents: list[Agent] = list(routes)  # type: ignore[arg-type]
    await emit(
        session_id,
        "orchestrator.dispatch",
        {
            "revision": digest["revision"],
            "agents": agents,
            # What went where, so the pipeline can be watched deciding rather
            # than just firing.
            "routes": {
                agent: [{"text": p["text"], "kind": p["kind"]} for p in points]
                for agent, points in routes.items()
            },
        },
    )
    await graph.ainvoke(
        {
            "session_id": session_id,
            "digest": digest,
            "dispatch": agents,
            "routes": routes,
        }
    )
