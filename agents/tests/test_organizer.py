"""The Organizer keeps a running summary. What matters is that a bad model
response never takes the session down, and that a summary which did not change
never reaches the board — an identical redraw makes the canvas flicker for
nothing."""

import json
from types import SimpleNamespace

import pytest

from agents import organizer_store as store
from agents.nodes import organizer
from agents.state import point_id


@pytest.fixture
def llm(monkeypatch):
    """Pins what the model answers, so each test states one behaviour."""
    box = SimpleNamespace(raw="{}", calls=0, last=None)

    class FakeCompletions:
        async def create(self, **kwargs):
            box.calls += 1
            box.last = kwargs
            if isinstance(box.raw, Exception):
                raise box.raw
            msg = SimpleNamespace(content=box.raw)
            return SimpleNamespace(choices=[SimpleNamespace(message=msg)])

    class FakeClient:
        def __init__(self, **kwargs):
            self.chat = SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setattr(organizer, "AsyncOpenAI", FakeClient)
    monkeypatch.setattr(
        organizer,
        "get_settings",
        lambda: SimpleNamespace(
            openai_api_key="test-key", openai_organizer_model="test-model"
        ),
    )
    return box


def digest_of(points, summary="algo"):
    return json.dumps({"summary": summary, "points": points})


def heard(text="algo con sustancia", author="Ignacio"):
    store.add_chunk("s", {"author": author, "text": text, "ts": 0.0})
    store.take_pending("s")


class TestIsNoise:
    @pytest.mark.parametrize("text", ["jajaja", "JAJAJAJA", "jeje", "xd", ""])
    def test_laughter_and_empty(self, chunk, text):
        assert organizer.is_noise(chunk(text=text)) is True

    @pytest.mark.parametrize("text", ["dale", "ok", "claro", "exacto", "ajá"])
    def test_lone_filler(self, chunk, text):
        assert organizer.is_noise(chunk(text=text)) is True

    @pytest.mark.parametrize(
        "text",
        [
            "dale, lo guardamos en Supabase",
            "no me convence el polling",
            "claro que sí, pero el costo sube",
        ],
    )
    def test_filler_inside_a_real_sentence_survives(self, chunk, text):
        assert organizer.is_noise(chunk(text=text)) is False


class TestMalformedModelOutput:
    """CLAUDE.md: bad agent output must be ignored, never crash the canvas."""

    @pytest.mark.parametrize(
        "raw",
        [
            "not json at all",
            "",
            "null",
            "[1, 2, 3]",
            '"just a string"',
            '{"points": "nope"}',
            '{"points": [null, 7, "x"]}',
            '{"points": {}}',
            '{"points": [{"author": "Ignacio"}]}',
            '{"summary": null, "points": null}',
            '{"unexpected": "shape"}',
        ],
    )
    async def test_survives_and_keeps_previous(self, llm, raw):
        llm.raw = raw
        heard()

        assert await organizer.summarize("s") is None
        assert store.get("s").digest["revision"] == 0

    async def test_api_failure_keeps_previous_digest(self, llm):
        llm.raw = RuntimeError("openai down")
        heard()

        assert await organizer.summarize("s") is None
        assert store.get("s").digest == {
            "summary": "",
            "points": [],
            "revision": 0,
        }


class TestPointCoercion:
    async def test_ids_derive_from_text(self, llm):
        llm.raw = digest_of([{"text": "Guardar todo en Supabase", "author": "N"}])
        heard()

        d = await organizer.summarize("s")
        assert d["points"][0]["id"] == point_id("Guardar todo en Supabase")

    async def test_same_text_keeps_its_id_across_passes(self, llm):
        """This is what stops the canvas from rebuilding a node a human moved."""
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        first = await organizer.summarize("s")

        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "y dagre", "author": "I"},
            ],
            "dos",
        )
        second = await organizer.summarize("s")

        assert first["points"][0]["id"] == second["points"][0]["id"]

    async def test_duplicate_points_collapse(self, llm):
        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "usar   portal", "author": "I"},
            ]
        )
        heard()

        assert len((await organizer.summarize("s"))["points"]) == 1

    async def test_caps_the_list(self, llm):
        llm.raw = digest_of(
            [{"text": f"idea numero {i}", "author": "N"} for i in range(40)]
        )
        heard()

        points = (await organizer.summarize("s"))["points"]
        assert len(points) == organizer.MAX_POINTS

    async def test_empty_points_is_a_valid_answer(self, llm):
        llm.raw = digest_of([], "todavia no dijeron nada")
        heard()

        d = await organizer.summarize("s")
        assert d["points"] == []
        assert d["revision"] == 1


class TestChangeDetection:
    async def test_identical_answer_does_not_redraw(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "igual")
        assert await organizer.summarize("s") is not None
        # Same summary, same points: nothing for the board to do.
        assert await organizer.summarize("s") is None
        assert store.get("s").digest["revision"] == 1

    async def test_new_point_bumps_the_revision(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        await organizer.summarize("s")

        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "y dagre", "author": "I"},
            ],
            "uno",
        )
        assert (await organizer.summarize("s"))["revision"] == 2


class TestContext:
    async def test_model_sees_the_talk_and_its_own_last_summary(self, llm):
        heard(author="Nico", text="propongo Supabase")
        llm.raw = digest_of([{"text": "Supabase", "author": "Nico"}], "uno")
        await organizer.summarize("s")

        heard(author="Ignacio", text="y el layout con dagre")
        await organizer.summarize("s")

        sent = json.loads(llm.last["messages"][1]["content"])
        assert "Nico: propongo Supabase" in sent["conversacion"]
        assert "Ignacio: y el layout con dagre" in sent["conversacion"]
        assert sent["resumen_anterior"]["summary"] == "uno"
