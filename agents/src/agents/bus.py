import asyncio
from collections import defaultdict

# In-memory pub/sub keyed by session_id. Good enough for a single-process
# hackathon deploy. Swap for Portal (or Redis) when we outgrow one worker.
_subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)


def subscribe(session_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    _subscribers[session_id].append(q)
    return q


def unsubscribe(session_id: str, q: asyncio.Queue) -> None:
    subs = _subscribers.get(session_id)
    if subs and q in subs:
        subs.remove(q)


async def emit(session_id: str, event: str, content: dict) -> None:
    payload = {"event": event, "content": content}
    for q in list(_subscribers.get(session_id, [])):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass
