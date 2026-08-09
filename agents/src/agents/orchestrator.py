import logging

from agents.bus import emit
from agents.graph import graph
from agents.state import Agent, Digest, Point

logger = logging.getLogger("agents.orchestrator")

# What each agent is for. The Organizer already said what every line is while
# it was writing the summary, so deciding this costs nothing and stays out of
# the 3s budget — there is no second model call before the board moves.
#
# The board is the structure of what is being built, so a question does not
# belong on it; that is a list the Scribe keeps. A pending item does: what
# blocks a thing is part of how the thing is built.
WANTS: dict[str, set[str]] = {
    "architect": {"idea", "decision", "pendiente"},
    "scribe": {"decision", "pregunta", "pendiente"},
    # The Critic checks proposals against the repo. A question has nothing to
    # check yet, and a decision is already made.
    "critic": {"idea"},
}

# The board and the lists are pictures of a whole state, so they are handed the
# whole slice — and only when that slice actually moved. The Critic goes and
# reads a repo, so it only ever gets what it has not looked at yet.
INCREMENTAL = {"critic"}

# Per session, the last thing each agent was handed.
_seen: dict[str, dict[str, list[str]]] = {}


def route(session_id: str, digest: Digest) -> dict[str, list[Point]]:
    """Decides who has something to do with this revision, and what.

    Most revisions do not concern everybody. Somebody asking a question moves
    the Scribe's list and leaves the board exactly as it was, and redrawing it
    anyway is work nobody asked for and a canvas that flickers."""
    seen = _seen.setdefault(session_id, {})
    routes: dict[str, list[Point]] = {}

    for agent, kinds in WANTS.items():
        mine = [p for p in digest["points"] if p["kind"] in kinds]
        before = seen.get(agent, [])

        if agent in INCREMENTAL:
            known = set(before)
            mine = [p for p in mine if p["id"] not in known]
            if not mine:
                continue
            seen[agent] = before + [p["id"] for p in mine]
        else:
            ids = [p["id"] for p in mine]
            if ids == before:
                continue
            seen[agent] = ids

        routes[agent] = mine

    return routes


def forget(session_id: str) -> None:
    _seen.pop(session_id, None)


async def dispatch(session_id: str, digest: Digest) -> None:
    """Hands each agent the part of the summary that is its business."""
    routes = route(session_id, digest)
    if not routes:
        logger.info(
            "rev=%s changed nothing anybody owns session=%s",
            digest["revision"],
            session_id,
        )
        return

    agents: list[Agent] = list(routes)  # type: ignore[arg-type]
    await emit(
        session_id,
        "orchestrator.dispatch",
        {
            "revision": digest["revision"],
            "agents": agents,
            # Who was left out, so the pipeline can be watched deciding rather
            # than just firing.
            "idle": [a for a in WANTS if a not in routes],
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
