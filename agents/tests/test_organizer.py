"""The Organizer is the only agent that decides what reaches the board, so a
bad model response has to end in a no-op, never in a crash."""

import json
from types import SimpleNamespace

import pytest

from agents import organizer_store as store
from agents.nodes import organizer
from agents.nodes.organizer import is_noise, is_substantial, reconcile
from agents.state import Thread


@pytest.fixture
def llm(monkeypatch):
    """Pins whatever raw string the model is pretending to return."""

    box = SimpleNamespace(raw="{}")

    class FakeClient:
        def __init__(self, **_):
            self.chat = SimpleNamespace(completions=self)

        async def create(self, **_):
            message = SimpleNamespace(content=box.raw)
            return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    monkeypatch.setattr(organizer, "AsyncOpenAI", FakeClient)
    monkeypatch.setattr(
        organizer,
        "get_settings",
        lambda: SimpleNamespace(
            openai_api_key="test", openai_organizer_model="test-model"
        ),
    )
    return box


def thread(**over) -> Thread:
    base: Thread = {
        "id": "th_1",
        "topic": "un tema",
        "summary": "",
        "chunks": [
            {"author": "Ignacio", "text": "x" * 60, "ts": 0.0},
            {"author": "Nico", "text": "y" * 60, "ts": 1.0},
        ],
        "participants": ["Ignacio", "Nico"],
        "intents": [],
        "status": "ongoing",
        "created_at": 0.0,
        "last_touched": 0.0,
        "dispatched": False,
    }
    return {**base, **over}


class TestIsNoise:
    @pytest.mark.parametrize(
        "text",
        ["jajaja", "JAJA", "jeje", "xd", "ja ja".replace(" ", ""), "hahaha"],
    )
    def test_laughter(self, chunk, text):
        assert is_noise(chunk(text=text))

    @pytest.mark.parametrize("text", ["si", "Sí", "ok", "dale?", "eh", "  "])
    def test_single_word_filler(self, chunk, text):
        assert is_noise(chunk(text=text))

    @pytest.mark.parametrize(
        "text",
        [
            "no guardemos la transcripcion completa",
            "si, con el snapshot alcanza",
            "dale, me cierra lo de Supabase",
        ],
    )
    def test_keeps_filler_words_inside_a_real_sentence(self, chunk, text):
        assert not is_noise(chunk(text=text))


class TestIsSubstantial:
    def test_needs_a_topic(self):
        assert not is_substantial(thread(topic=""))

    def test_needs_more_than_one_chunk(self):
        assert not is_substantial(
            thread(chunks=[{"author": "N", "text": "z" * 200, "ts": 0.0}])
        )

    def test_needs_enough_spoken_text(self):
        short = [
            {"author": "Ignacio", "text": "bueno", "ts": 0.0},
            {"author": "Nico", "text": "dale", "ts": 1.0},
        ]
        assert not is_substantial(thread(chunks=short))

    def test_accepts_a_developed_thread(self):
        assert is_substantial(thread())


class TestMalformedModelOutput:
    """Every one of these must leave the session untouched and return no work
    for the Architect, rather than raising."""

    @pytest.mark.parametrize(
        "raw",
        [
            "not json at all",
            "",
            "null",
            "[1, 2, 3]",
            '"just a string"',
            '{"threads": "nope"}',
            '{"threads": [null, 7, "x"]}',
            '{"threads": {}}',
            '{"drop": "everything"}',
            '{"drop": ["a", null, 99]}',
        ],
    )
    @pytest.mark.asyncio
    async def test_survives(self, llm, chunk, raw):
        llm.raw = raw
        ready = await reconcile("s1", [chunk(text="hola que tal")])
        assert ready == []
        assert store.get("s1").threads == {}

    @pytest.mark.asyncio
    async def test_api_failure_requeues_the_speech(self, monkeypatch, chunk):
        monkeypatch.setattr(
            organizer,
            "get_settings",
            lambda: SimpleNamespace(
                openai_api_key="test", openai_organizer_model="m"
            ),
        )

        class Boom:
            def __init__(self, **_):
                self.chat = SimpleNamespace(completions=self)

            async def create(self, **_):
                raise RuntimeError("openai is down")

        monkeypatch.setattr(organizer, "AsyncOpenAI", Boom)

        spoken = [chunk(text="algo importante"), chunk(text="y algo mas")]
        ready = await reconcile("s1", spoken)

        assert ready == []
        assert store.get("s1").pending == spoken


class TestFieldCoercion:
    @pytest.mark.asyncio
    async def test_drops_intents_it_cannot_read(self, llm, chunk):
        llm.raw = json.dumps(
            {
                "threads": [
                    {
                        "id": None,
                        "topic": "persistencia",
                        "summary": "donde guardamos",
                        "intents": [
                            {"author": "Nico", "wants": "no guardar todo"},
                            {"author": "", "wants": "algo"},
                            {"wants": "sin autor"},
                            "Ignacio quiere Supabase",
                            None,
                        ],
                        "chunk_ids": [0],
                    }
                ]
            }
        )
        await reconcile("s1", [chunk(text="donde guardamos la transcripcion")])

        (t,) = store.get("s1").threads.values()
        assert t["intents"] == [{"author": "Nico", "wants": "no guardar todo"}]

    @pytest.mark.asyncio
    async def test_ignores_chunk_ids_out_of_range(self, llm, chunk):
        llm.raw = json.dumps(
            {
                "threads": [
                    {
                        "id": None,
                        "topic": "t",
                        "summary": "s",
                        "chunk_ids": [0, 5, -1, "2", True, 1, 1],
                    }
                ]
            }
        )
        await reconcile("s1", [chunk(text="uno"), chunk(text="dos")])

        (t,) = store.get("s1").threads.values()
        assert [c["text"] for c in t["chunks"]] == ["uno", "dos"]

    @pytest.mark.asyncio
    async def test_a_thread_with_no_chunks_is_not_created(self, llm, chunk):
        llm.raw = json.dumps(
            {"threads": [{"id": None, "topic": "t", "chunk_ids": []}]}
        )
        await reconcile("s1", [chunk(text="algo")])
        assert store.get("s1").threads == {}

    @pytest.mark.asyncio
    async def test_blank_topic_does_not_erase_what_we_knew(self, llm, chunk):
        store.upsert_thread("s1", thread(topic="persistencia", summary="ya se"))
        llm.raw = json.dumps(
            {
                "threads": [
                    {"id": "th_1", "topic": "", "summary": None, "chunk_ids": [0]}
                ]
            }
        )
        await reconcile("s1", [chunk(text="mas sobre lo mismo")])

        t = store.get("s1").threads["th_1"]
        assert t["topic"] == "persistencia"
        assert t["summary"] == "ya se"


class TestSettling:
    @pytest.mark.asyncio
    async def test_does_not_settle_a_single_stray_sentence(self, llm, chunk):
        llm.raw = json.dumps(
            {
                "threads": [
                    {
                        "id": None,
                        "topic": "algo",
                        "summary": "s",
                        "settled": True,
                        "chunk_ids": [0],
                    }
                ]
            }
        )
        ready = await reconcile("s1", [chunk(text="che una cosa")])
        assert ready == []

    @pytest.mark.asyncio
    async def test_settles_a_developed_thread(self, llm, chunk):
        store.upsert_thread("s1", thread())
        llm.raw = json.dumps(
            {
                "threads": [
                    {
                        "id": "th_1",
                        "topic": "persistencia",
                        "summary": "guardamos el snapshot",
                        "settled": True,
                        "chunk_ids": [0],
                    }
                ]
            }
        )
        ready = await reconcile("s1", [chunk(text="dale, cerramos con eso")])

        assert [t["id"] for t in ready] == ["th_1"]
        assert store.get("s1").threads["th_1"]["status"] == "settled"

    @pytest.mark.asyncio
    async def test_never_settles_twice(self, llm, chunk):
        store.upsert_thread("s1", thread(dispatched=True))
        llm.raw = json.dumps(
            {
                "threads": [
                    {"id": "th_1", "settled": True, "chunk_ids": [0]}
                ]
            }
        )
        ready = await reconcile("s1", [chunk(text="algo mas")])
        assert ready == []


class TestThreadContinuity:
    @pytest.mark.asyncio
    async def test_revising_a_thread_keeps_its_history(self, llm, chunk):
        store.upsert_thread("s1", thread(topic="viejo"))
        llm.raw = json.dumps(
            {
                "threads": [
                    {
                        "id": "th_1",
                        "topic": "persistencia de la transcripcion",
                        "summary": "ahora se entiende mejor",
                        "chunk_ids": [0],
                    }
                ]
            }
        )
        await reconcile("s1", [chunk(author="Ana", text="sumo esto")])

        t = store.get("s1").threads["th_1"]
        assert t["topic"] == "persistencia de la transcripcion"
        assert len(t["chunks"]) == 3
        assert t["participants"] == ["Ana", "Ignacio", "Nico"]

    @pytest.mark.asyncio
    async def test_unknown_thread_id_starts_a_new_thread(self, llm, chunk):
        llm.raw = json.dumps(
            {
                "threads": [
                    {"id": "th_ghost", "topic": "t", "chunk_ids": [0]}
                ]
            }
        )
        await reconcile("s1", [chunk(text="algo")])

        (tid,) = store.get("s1").threads
        assert tid != "th_ghost"
