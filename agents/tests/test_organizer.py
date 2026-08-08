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


def digest_of(add, summary="algo", keep=None):
    """What the model answers: numbers for what stays, objects for what is new."""
    return json.dumps({"summary": summary, "keep": keep or [], "add": add})


_fresh: list = []


def heard(text="algo con sustancia", author="Ignacio"):
    """Puts one line into the session, the way the loop would."""
    store.add_chunk("s", {"author": author, "text": text, "ts": 0.0})
    _fresh[:] = store.take_pending("s")


async def pass_over_it():
    return await organizer.summarize("s", _fresh)


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
            '{"keep": "nope", "add": "nope"}',
            '{"add": [null, 7, "x"], "keep": [99, "x", null]}',
            '{"keep": {}, "add": {}}',
            '{"add": [{"author": "Ignacio"}]}',
            '{"summary": null, "keep": null, "add": null}',
            '{"unexpected": "shape"}',
        ],
    )
    async def test_survives_and_keeps_previous(self, llm, raw):
        llm.raw = raw
        heard()

        assert await pass_over_it() is None
        assert store.get("s").digest["revision"] == 0

    async def test_api_failure_keeps_previous_digest(self, llm):
        llm.raw = RuntimeError("openai down")
        heard()

        assert await pass_over_it() is None
        assert store.get("s").digest == {
            "summary": "",
            "points": [],
            "revision": 0,
        }


class TestPointCoercion:
    async def test_ids_derive_from_text(self, llm):
        llm.raw = digest_of([{"text": "Guardar todo en Supabase", "author": "N"}])
        heard()

        d = await pass_over_it()
        assert d["points"][0]["id"] == point_id("Guardar todo en Supabase")

    async def test_same_text_keeps_its_id_across_passes(self, llm):
        """This is what stops the canvas from rebuilding a node a human moved."""
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        first = await pass_over_it()

        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "y dagre", "author": "I"},
            ],
            "dos",
        )
        second = await pass_over_it()

        assert first["points"][0]["id"] == second["points"][0]["id"]

    @pytest.mark.parametrize(
        "kind, expected",
        [("pregunta", "pregunta"), ("PENDIENTE", "pendiente"), ("otra cosa", "idea")],
    )
    async def test_the_kind_decides_who_acts_on_it(self, llm, kind, expected):
        """An unreadable kind becomes an idea, so it still reaches the board."""
        llm.raw = digest_of([{"text": "algo", "author": "N", "kind": kind}])
        heard()

        assert (await pass_over_it())["points"][0]["kind"] == expected

    async def test_a_point_with_no_kind_is_an_idea(self, llm):
        llm.raw = digest_of([{"text": "algo", "author": "N"}])
        heard()

        assert (await pass_over_it())["points"][0]["kind"] == "idea"

    async def test_duplicate_points_collapse(self, llm):
        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "usar   portal", "author": "I"},
            ]
        )
        heard()

        assert len((await pass_over_it())["points"]) == 1

    async def test_caps_the_list(self, llm):
        llm.raw = digest_of(
            [{"text": f"idea numero {i}", "author": "N"} for i in range(40)]
        )
        heard()

        points = (await pass_over_it())["points"]
        assert len(points) == organizer.MAX_POINTS

    async def test_empty_points_is_a_valid_answer(self, llm):
        llm.raw = digest_of([], "todavia no dijeron nada")
        heard()

        d = await pass_over_it()
        assert d["points"] == []
        assert d["revision"] == 1


class TestKeepByNumber:
    """The model names what it already wrote by number instead of retyping it.
    Retyping ten points every couple of seconds is what blew the 3s budget."""

    async def test_kept_number_reuses_the_point(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        first = await pass_over_it()

        llm.raw = digest_of([{"text": "y dagre", "author": "I"}], "dos", keep=[1])
        second = await pass_over_it()

        assert second["points"][0] == first["points"][0]
        assert second["points"][1]["text"] == "y dagre"

    async def test_unnamed_points_fall_off_the_board(self, llm):
        heard()
        llm.raw = digest_of(
            [{"text": "Usar Portal", "author": "N"}, {"text": "y dagre", "author": "I"}],
            "uno",
        )
        await pass_over_it()

        llm.raw = digest_of([], "dos", keep=[2])
        assert [p["text"] for p in (await pass_over_it())["points"]] == ["y dagre"]

    async def test_a_number_that_does_not_exist_is_ignored(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        await pass_over_it()

        llm.raw = digest_of([], "dos", keep=[1, 9, 0, -3])
        assert len((await pass_over_it())["points"]) == 1


class TestChangeDetection:
    async def test_identical_answer_does_not_redraw(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "igual")
        assert await pass_over_it() is not None
        # Same summary, same points: nothing for the board to do.
        assert await pass_over_it() is None
        assert store.get("s").digest["revision"] == 1

    async def test_new_point_bumps_the_revision(self, llm):
        heard()
        llm.raw = digest_of([{"text": "Usar Portal", "author": "N"}], "uno")
        await pass_over_it()

        llm.raw = digest_of(
            [
                {"text": "Usar Portal", "author": "N"},
                {"text": "y dagre", "author": "I"},
            ],
            "uno",
        )
        assert (await pass_over_it())["revision"] == 2


class TestContext:
    """Only the new speech goes up each pass. Re-sending the whole conversation
    made every call slower than the last, which is how the 3s budget was lost."""

    async def test_old_talk_stays_out_of_the_new_pass(self, llm):
        heard(author="Nico", text="propongo Supabase")
        llm.raw = digest_of([{"text": "Supabase", "author": "Nico"}], "uno")
        await pass_over_it()

        heard(author="Ignacio", text="y el layout con dagre")
        await pass_over_it()

        sent = json.loads(llm.last["messages"][1]["content"])
        assert sent["nuevo"] == ["Ignacio: y el layout con dagre"]
        assert "Nico: propongo Supabase" in sent["dicho_antes"]
        # The summary is what carries the memory forward, not the transcript.
        assert sent["resumen_anterior"]["summary"] == "uno"

    async def test_run_up_is_capped(self, llm):
        for i in range(30):
            heard(text=f"linea numero {i}")
            await pass_over_it()

        sent = json.loads(llm.last["messages"][1]["content"])
        assert len(sent["dicho_antes"]) == organizer.TAIL_CHUNKS
