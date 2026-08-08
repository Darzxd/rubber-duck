import pytest

from agents import organizer_store as store


@pytest.fixture(autouse=True)
def clean_store():
    store._sessions.clear()
    yield
    store._sessions.clear()


@pytest.fixture
def chunk():
    def make(author: str = "Ignacio", text: str = "algo", ts: float = 0.0):
        return {"author": author, "text": text, "ts": ts}

    return make
