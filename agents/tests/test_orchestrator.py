"""The Orchestrator decides who acts on what. It runs between the Organizer and
the three agents, and it must decide without a model call — a second call there
would eat the 3s budget before anything reaches the board."""

import pytest

from agents import orchestrator
from agents.nodes import scribe as scribe_node
from agents.state import Digest, Point, point_id


def point(text: str, kind: str = "idea", author: str = "Ignacio") -> Point:
    return {"id": point_id(text), "text": text, "author": author, "kind": kind}


def digest_of(*points: Point) -> Digest:
    return {"summary": "algo", "points": list(points), "revision": 1}


@pytest.fixture(autouse=True)
def fresh_session():
    """Every test starts with nobody having seen anything."""
    orchestrator._seen.clear()
    yield
    orchestrator._seen.clear()


class TestRouting:
    def test_the_board_only_gets_what_is_structure(self):
        routes = orchestrator.route(
            "s",
            digest_of(
                point("guardamos todo en Supabase"),
                point("dónde guardamos la transcripción", "pregunta"),
                point("falta registrar el dominio", "pendiente"),
            ),
        )
        assert [p["text"] for p in routes["architect"]] == [
            "guardamos todo en Supabase"
        ]

    def test_a_decision_is_both_a_node_and_a_record(self):
        routes = orchestrator.route("s", digest_of(point("vamos con web", "decision")))
        assert [p["text"] for p in routes["architect"]] == ["vamos con web"]
        assert [p["text"] for p in routes["scribe"]] == ["vamos con web"]

    def test_the_critic_gets_proposals_not_questions(self):
        routes = orchestrator.route(
            "s",
            digest_of(
                point("usar React Flow"),
                point("cuánto cuesta Portal", "pregunta"),
            ),
        )
        assert [p["text"] for p in routes["critic"]] == ["usar React Flow"]

    def test_an_agent_with_nothing_to_do_is_not_called(self):
        routes = orchestrator.route("s", digest_of(point("usar dagre")))
        assert "scribe" not in routes

    def test_an_empty_summary_wakes_nobody(self):
        assert orchestrator.route("s", digest_of()) == {}


class TestNobodyWorksForNothing:
    """Most revisions do not concern everybody. An agent whose part of the
    summary did not move is not called at all — that is the whole job."""

    def test_a_question_does_not_touch_the_board(self):
        board = digest_of(point("usar dagre"))
        orchestrator.route("s", board)

        after = orchestrator.route(
            "s", digest_of(point("usar dagre"), point("y el layout", "pregunta"))
        )
        assert "architect" not in after
        assert [p["text"] for p in after["scribe"]] == ["y el layout"]

    def test_the_same_summary_twice_wakes_nobody(self):
        d = digest_of(point("usar dagre"), point("vamos con web", "decision"))
        assert orchestrator.route("s", d)
        assert orchestrator.route("s", d) == {}

    def test_reordering_the_board_is_a_redraw(self):
        a, b = point("usar dagre"), point("vamos con web", "decision")
        orchestrator.route("s", digest_of(a, b))
        assert "architect" in orchestrator.route("s", digest_of(b, a))

    def test_the_critic_only_sees_a_proposal_once(self):
        orchestrator.route("s", digest_of(point("usar dagre")))

        after = orchestrator.route(
            "s", digest_of(point("usar dagre"), point("y React Flow"))
        )
        assert [p["text"] for p in after["critic"]] == ["y React Flow"]

    def test_a_point_that_falls_off_the_board_empties_it(self):
        orchestrator.route("s", digest_of(point("usar dagre")))
        assert orchestrator.route("s", digest_of())["architect"] == []

    def test_a_session_does_not_hold_back_another(self):
        d = digest_of(point("usar dagre"))
        orchestrator.route("s", d)
        assert "architect" in orchestrator.route("otra", d)


class TestScribe:
    async def test_each_kind_lands_on_its_own_list(self, monkeypatch):
        sent = {}

        async def fake_emit(session_id, event, content):
            sent.update(content)

        monkeypatch.setattr(scribe_node, "emit", fake_emit)
        await scribe_node.scribe(
            {
                "session_id": "s",
                "digest": digest_of(),
                "dispatch": ["scribe"],
                "routes": {
                    "scribe": [
                        point("vamos con web", "decision"),
                        point("falta el dominio", "pendiente"),
                        point("dónde guardamos", "pregunta"),
                    ]
                },
            }
        )
        assert sent["patch"] == {
            "decisions": ["vamos con web"],
            "openItems": ["falta el dominio"],
            "openQuestions": ["dónde guardamos"],
        }
