import asyncio
from collections import defaultdict

# In-memory pub/sub keyed by session_id. Good enough for a single-process
# hackathon deploy. Swap for Portal (or Redis) when we outgrow one worker.
_subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

# Subscribers to every session at once, used by the /working dashboard so
# you never have to guess a session id to see the pipeline move.
FIREHOSE = "*"

# Sessions seen since boot, most recent last.
_seen: list[str] = []


def sessions() -> list[str]:
    return list(_seen)


def subscribe(session_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    _subscribers[session_id].append(q)
    return q


def unsubscribe(session_id: str, q: asyncio.Queue) -> None:
    subs = _subscribers.get(session_id)
    if subs and q in subs:
        subs.remove(q)


async def emit(session_id: str, event: str, content: dict) -> None:
    if session_id not in _seen:
        _seen.append(session_id)
        del _seen[:-50]

    payload = {"event": event, "content": content}
    for q in list(_subscribers.get(session_id, [])):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass

    tagged = {**payload, "sessionId": session_id}
    for q in list(_subscribers.get(FIREHOSE, [])):
        try:
            q.put_nowait(tagged)
        except asyncio.QueueFull:
            pass
