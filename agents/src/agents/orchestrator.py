import logging
import time

from agents.bus import emit
from agents.graph import graph
from agents.state import Digest

logger = logging.getLogger("agents.orchestrator")

# The Architect redraws on every revision — that is the whole point of the
# live board. The other two are expensive and nobody is watching them tick,
# so they run on a slower clock.
SLOW_AGENTS_EVERY_SEC = 20.0

_last_slow: dict[str, float] = {}


def _agents_for(session_id: str, digest: Digest) -> list[str]:
    if not digest["points"]:
        return []

    agents = ["architect"]

    now = time.time()
    if now - _last_slow.get(session_id, 0.0) >= SLOW_AGENTS_EVERY_SEC:
        _last_slow[session_id] = now
        agents += ["critic", "scribe"]
    return agents


async def dispatch(session_id: str, digest: Digest) -> None:
    """Hands the running summary to whichever agents should act on it."""
    agents = _agents_for(session_id, digest)
    if not agents:
        return

    await emit(
        session_id,
        "orchestrator.dispatch",
        {"revision": digest["revision"], "agents": agents},
    )
    await graph.ainvoke(
        {"session_id": session_id, "digest": digest, "dispatch": agents}
    )
