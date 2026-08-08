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
def fresh_clock():
    """Every test starts with the Critic due, and leaves nothing behind."""
    orchestrator._last_critic.clear()
    yield
    orchestrator._last_critic.clear()


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


class TestSlowClock:
    """The board and the lists keep up with the room. Only the Critic, which
    goes and reads a repo, runs on a slower clock."""

    def test_the_critic_sits_out_the_next_revision(self):
        d = digest_of(point("usar dagre"), point("vamos con web", "decision"))
        assert set(orchestrator.route("s", d)) == {"architect", "critic", "scribe"}
        assert set(orchestrator.route("s", d)) == {"architect", "scribe"}

    def test_a_session_does_not_hold_back_another(self):
        d = digest_of(point("usar dagre"))
        orchestrator.route("s", d)
        assert "critic" in orchestrator.route("otra", d)

    def test_a_revision_with_nothing_to_check_does_not_spend_the_turn(self):
        orchestrator.route("s", digest_of(point("vamos con web", "decision")))
        assert "critic" in orchestrator.route("s", digest_of(point("usar dagre")))


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
