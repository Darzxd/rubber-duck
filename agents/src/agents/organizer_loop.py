import asyncio
import logging
import time

from agents import organizer_store as store
from agents.bus import emit
from agents.nodes.organizer import is_noise, is_substantial, reconcile
from agents.state import Thread, TranscriptChunk

logger = logging.getLogger("agents.organizer.loop")

TICK_SEC = 2.0
# Speech keeps arriving in fragments, so reconciling on every one wastes a
# call. Wait for a short lull, or for enough material to be worth a pass.
QUIET_SEC = 2.5
MAX_PENDING = 6
# A thread nobody has touched in this long is over, whatever the model said.
STALE_SEC = 25.0

_tasks: dict[str, asyncio.Task] = {}


def ensure_running(session_id: str, dispatch) -> None:
    task = _tasks.get(session_id)
    if task and not task.done():
        return
    _tasks[session_id] = asyncio.create_task(_run(session_id, dispatch))


def submit(session_id: str, chunk: TranscriptChunk) -> bool:
    """Returns False if the chunk was obvious noise and never entered."""
    if is_noise(chunk):
        return False
    store.add_chunk(session_id, chunk)
    return True


def _should_reconcile(session_id: str) -> bool:
    s = store.get(session_id)
    if not s.pending:
        return False
    if len(s.pending) >= MAX_PENDING:
        return True
    return time.time() - s.last_chunk_at >= QUIET_SEC


def _stale_threads(session_id: str) -> list[Thread]:
    now = time.time()
    return [
        t
        for t in store.ongoing(session_id)
        if now - t["last_touched"] >= STALE_SEC and is_substantial(t)
    ]


async def _run(session_id: str, dispatch) -> None:
    logger.info("organizer loop started session=%s", session_id)
    try:
        while True:
            await asyncio.sleep(TICK_SEC)

            ready: list[Thread] = []
            if _should_reconcile(session_id):
                chunks = store.take_pending(session_id)
                ready = await reconcile(session_id, chunks)

            # The model often leaves a thread open forever because the topic
            # never formally closes. Silence closes it for us.
            for t in _stale_threads(session_id):
                t["status"] = "settled"
                store.upsert_thread(session_id, t)
                ready.append(t)
                logger.info(
                    "force settled session=%s thread=%s", session_id, t["id"]
                )

            for thread in ready:
                if thread["dispatched"]:
                    continue
                thread["dispatched"] = True
                store.upsert_thread(session_id, thread)
                await emit(
                    session_id,
                    "organizer.settled",
                    {
                        "threadId": thread["id"],
                        "topic": thread["topic"],
                        "summary": thread["summary"],
                        "intents": thread["intents"],
                        "participants": thread["participants"],
                    },
                )
                try:
                    await dispatch(session_id, thread)
                except asyncio.CancelledError:
                    raise
                except Exception:
                    # One bad drawing must not take the session's ears down
                    # with it. Keep listening.
                    logger.exception(
                        "dispatch failed session=%s thread=%s",
                        session_id,
                        thread["id"],
                    )
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("organizer loop crashed session=%s", session_id)
