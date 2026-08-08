import asyncio
import logging

from agents import organizer_store as store
from agents.nodes.organizer import is_noise, summarize
from agents.state import TranscriptChunk

logger = logging.getLogger("agents.organizer.loop")

# The budget is 3s from speech to a drawing, and two model calls eat most of
# it. So the loop does not sit on a clock waiting for its turn: new speech
# wakes it immediately, and it only pauses long enough for a burst of
# fragments to land together instead of paying for one call each.
DEBOUNCE_SEC = 0.35
# Ceiling on idle waiting, so a session with nothing new still breathes.
IDLE_SEC = 5.0

_tasks: dict[str, asyncio.Task] = {}
_wakeups: dict[str, asyncio.Event] = {}


def ensure_running(session_id: str, dispatch) -> None:
    task = _tasks.get(session_id)
    if task and not task.done():
        return
    _wakeups[session_id] = asyncio.Event()
    _tasks[session_id] = asyncio.create_task(_run(session_id, dispatch))


def submit(session_id: str, chunk: TranscriptChunk) -> bool:
    """Returns False if the chunk was obvious noise and never entered."""
    if is_noise(chunk):
        return False
    store.add_chunk(session_id, chunk)
    ev = _wakeups.get(session_id)
    if ev is not None:
        ev.set()
    return True


async def _run(session_id: str, dispatch) -> None:
    logger.info("organizer loop started session=%s", session_id)
    ev = _wakeups[session_id]
    try:
        while True:
            try:
                await asyncio.wait_for(ev.wait(), timeout=IDLE_SEC)
            except asyncio.TimeoutError:
                pass
            ev.clear()

            if not store.get(session_id).pending:
                continue

            await asyncio.sleep(DEBOUNCE_SEC)
            if not store.take_pending(session_id):
                continue

            digest = await summarize(session_id)
            if digest is None:
                continue

            try:
                await dispatch(session_id, digest)
            except asyncio.CancelledError:
                raise
            except Exception:
                # One bad drawing must not take the session's ears down with
                # it. Keep listening.
                logger.exception("dispatch failed session=%s", session_id)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("organizer loop crashed session=%s", session_id)
