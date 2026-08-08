"""The loop decides when the Organizer thinks and when a thread leaves for the
Architect. Getting this wrong either burns calls or drops what people said."""

import time

import pytest

from agents import organizer_loop as loop
from agents import organizer_store as store
from agents.state import Thread


def thread(**over) -> Thread:
    base: Thread = {
        "id": "th_1",
        "topic": "persistencia",
        "summary": "donde guardamos la transcripcion",
        "chunks": [
            {"author": "Ignacio", "text": "a" * 60, "ts": 0.0},
            {"author": "Nico", "text": "b" * 60, "ts": 1.0},
        ],
        "participants": ["Ignacio", "Nico"],
        "intents": [],
        "status": "ongoing",
        "created_at": 0.0,
        "last_touched": time.time(),
        "dispatched": False,
    }
    return {**base, **over}


class TestSubmit:
    def test_noise_never_enters_the_buffer(self, chunk):
        assert loop.submit("s1", chunk(text="jajaja")) is False
        assert store.get("s1").pending == []

    def test_speech_enters_and_stamps_the_clock(self, chunk):
        before = time.time()
        assert loop.submit("s1", chunk(text="guardemos solo el snapshot"))
        assert len(store.get("s1").pending) == 1
        assert store.get("s1").last_chunk_at >= before


class TestShouldReconcile:
    def test_idle_session_does_not_spend_a_call(self):
        assert not loop._should_reconcile("s1")

    def test_waits_while_someone_is_still_talking(self, chunk):
        loop.submit("s1", chunk(text="estoy diciendo algo largo"))
        assert not loop._should_reconcile("s1")

    def test_runs_after_a_lull(self, chunk):
        loop.submit("s1", chunk(text="estoy diciendo algo largo"))
        store.get("s1").last_chunk_at = time.time() - loop.QUIET_SEC - 0.1
        assert loop._should_reconcile("s1")

    def test_runs_early_when_enough_piled_up(self, chunk):
        for i in range(loop.MAX_PENDING):
            loop.submit("s1", chunk(text=f"frase numero {i}"))
        assert loop._should_reconcile("s1")


class TestStaleThreads:
    def test_a_fresh_thread_stays_open(self):
        store.upsert_thread("s1", thread())
        assert loop._stale_threads("s1") == []

    def test_silence_closes_a_developed_thread(self):
        store.upsert_thread(
            "s1", thread(last_touched=time.time() - loop.STALE_SEC - 1)
        )
        assert [t["id"] for t in loop._stale_threads("s1")] == ["th_1"]

    def test_silence_does_not_close_a_thin_thread(self):
        thin = thread(
            last_touched=time.time() - loop.STALE_SEC - 1,
            chunks=[{"author": "Ignacio", "text": "che", "ts": 0.0}],
        )
        store.upsert_thread("s1", thin)
        assert loop._stale_threads("s1") == []

    def test_a_settled_thread_is_not_reconsidered(self):
        done = thread(
            status="settled", last_touched=time.time() - loop.STALE_SEC - 1
        )
        store.upsert_thread("s1", done)
        assert loop._stale_threads("s1") == []


class TestDispatch:
    @pytest.mark.asyncio
    async def test_a_thread_reaches_the_architect_once(self, monkeypatch):
        store.upsert_thread(
            "s1", thread(last_touched=time.time() - loop.STALE_SEC - 1)
        )
        monkeypatch.setattr(loop, "TICK_SEC", 0.01)
        monkeypatch.setattr(loop, "emit", _noop)

        seen: list[str] = []

        async def dispatch(session_id, thread):
            seen.append(thread["id"])

        loop.ensure_running("s1", dispatch)
        await _settle()

        assert seen == ["th_1"]
        assert store.get("s1").threads["th_1"]["dispatched"] is True

    @pytest.mark.asyncio
    async def test_a_failing_architect_does_not_kill_the_session(
        self, monkeypatch
    ):
        store.upsert_thread(
            "s1", thread(last_touched=time.time() - loop.STALE_SEC - 1)
        )
        monkeypatch.setattr(loop, "TICK_SEC", 0.01)
        monkeypatch.setattr(loop, "emit", _noop)

        async def dispatch(session_id, thread):
            raise RuntimeError("architect exploded")

        loop.ensure_running("s1", dispatch)
        task = loop._tasks["s1"]
        await _settle()

        assert task.cancelled()
        assert store.get("s1").threads["th_1"]["dispatched"] is True


async def _noop(*_, **__):
    return None


async def _settle() -> None:
    import asyncio

    await asyncio.sleep(0.08)
    task = loop._tasks.pop("s1", None)
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
