"""Tests for the recommendations route. Phase 10: Gemini-powered with a
deterministic favorites fallback. The Gemini client is mocked via a service
injector so no real network call happens.
"""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any

import pytest
from flask import Flask
from flask.testing import FlaskClient

from app.services.gemini import GeminiService


class FakeModels:
    def __init__(self) -> None:
        self.next_response: Any = None
        self.next_error: BaseException | None = None
        self.last_call: dict[str, Any] | None = None

    async def generate_content(self, *, model: str, contents: str) -> Any:
        self.last_call = {"model": model, "contents": contents}
        if self.next_error is not None:
            raise self.next_error
        return self.next_response


class FakeAio:
    def __init__(self) -> None:
        self.models = FakeModels()


class FakeClient:
    def __init__(self) -> None:
        self.aio = FakeAio()


def _install_service(app: Flask, *, service: GeminiService) -> None:
    """Stash the service on the app so the route can read it without going
    through the real env-driven client constructor.
    """
    app.extensions["gemini_service"] = service  # type: ignore[index]


@pytest.fixture
def app_with_service(app: Flask):
    fake = FakeClient()
    service = GeminiService(client=fake)  # ty:ignore[invalid-argument-type]
    _install_service(app, service=service)
    app.config["FAKE_MODELS"] = fake.aio.models
    return app


@pytest.fixture
def client_with_service(app_with_service: Flask) -> FlaskClient:
    return app_with_service.test_client()


@pytest.fixture
def gemini_mocks(app_with_service: Flask):
    """Returns a handle to the mock models. Configure `next_response` or
    `next_error` before each request, then read `last_call` after.
    """
    return app_with_service.config["FAKE_MODELS"]


def _set_response(mocks, suggestions: list[dict[str, Any]]) -> None:
    mocks.next_response = SimpleNamespace(text=json.dumps(suggestions))


def _set_error(mocks, message: str = "network down") -> None:
    mocks.next_error = RuntimeError(message)


# --- Auth + empty cases (kept from Phase 4) --------------------------------


def test_recommendations_requires_auth(client: FlaskClient) -> None:
    resp = client.get("/api/recommendations")
    assert resp.status_code == 401


def test_recommendations_falls_back_when_no_history(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    """A brand-new user has no plays — Gemini would have no signal — so the
    route short-circuits to the favorites fallback."""
    make_song(title="Loved", genre="lofi")
    # No /api/history calls.

    body = client_with_service.get(
        "/api/recommendations", headers=stub_headers
    ).get_json()
    assert body["songs"] == []
    assert body["ai_powered"] is False
    assert body["source"] == "favorites_fallback"
    assert gemini_mocks.last_call is None  # never called Gemini


# --- Gemini path ------------------------------------------------------------


def test_recommendations_returns_gemini_suggestions_that_match_db(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    target = make_song(title="Rainy Window", artist="Tape Deck", genre="lofi",
                        moods=["calm", "focus"])
    make_song(title="Other", artist="X", genre="jazz", moods=["calm"])
    # Seed one play so the route will call Gemini.
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": target}
    )

    _set_response(gemini_mocks, [
        {"title": "Rainy Window", "artist": "Tape Deck",
         "genre": "lofi", "moods": ["calm"]},
        {"title": "Not In Library", "artist": "Ghost",
         "genre": "ambient", "moods": ["focus"]},
    ])

    body = client_with_service.get(
        "/api/recommendations", headers=stub_headers
    ).get_json()
    titles = [s["title"] for s in body["songs"]]
    assert titles == ["Rainy Window"]  # "Not In Library" filtered out
    assert body["ai_powered"] is True
    assert body["source"] == "gemini"
    assert body["songs"][0]["id"] == target


def test_recommendations_falls_back_on_gemini_error(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    make_song(title="Played", genre="lofi")
    # 1 history entry
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": 1}
    )
    make_song(title="Fav", genre="lofi")
    client_with_service.post(
        "/api/favorites", headers=stub_headers, json={"song_id": 2}
    )

    _set_error(gemini_mocks)

    body = client_with_service.get(
        "/api/recommendations", headers=stub_headers
    ).get_json()
    titles = [s["title"] for s in body["songs"]]
    assert "Fav" in titles
    assert body["ai_powered"] is False
    assert body["source"] == "favorites_fallback"


def test_recommendations_falls_back_when_no_gemini_matches(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    played = make_song(title="Played", genre="lofi")
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": played}
    )
    make_song(title="Fav", genre="lofi")
    client_with_service.post(
        "/api/favorites", headers=stub_headers, json={"song_id": 2}
    )

    # All suggestions point to songs we don't have → route falls back to favorites.
    _set_response(gemini_mocks, [
        {"title": "Ghost 1", "artist": "X", "genre": "lofi", "moods": ["calm"]},
        {"title": "Ghost 2", "artist": "Y", "genre": "lofi", "moods": ["focus"]},
    ])

    body = client_with_service.get(
        "/api/recommendations", headers=stub_headers
    ).get_json()
    titles = [s["title"] for s in body["songs"]]
    assert "Fav" in titles
    assert body["ai_powered"] is False
    assert body["source"] == "favorites_fallback"


def test_recommendations_passes_history_to_prompt(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    """The route should send at least the most recent play to Gemini."""
    a = make_song(title="First", genre="lofi", moods=["calm"])
    b = make_song(title="Second", genre="jazz", moods=["focus"])
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": a}
    )
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": b}
    )

    _set_response(gemini_mocks, [
        {"title": "First", "artist": "X", "genre": "lofi", "moods": ["calm"]},
    ])

    client_with_service.get("/api/recommendations", headers=stub_headers)

    assert gemini_mocks.last_call is not None
    assert "First" in gemini_mocks.last_call["contents"]
    assert "Second" in gemini_mocks.last_call["contents"]


def test_recommendations_sends_preferences_to_prompt(
    client_with_service: FlaskClient,
    stub_headers: dict[str, str],
    make_song,
    gemini_mocks,
) -> None:
    played = make_song(title="Played", genre="lofi")
    client_with_service.post(
        "/api/history", headers=stub_headers, json={"song_id": played}
    )
    client_with_service.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": ["ambient"], "preferred_moods": ["focus"]},
    )

    _set_response(gemini_mocks, [
        {"title": "Picked", "artist": "X", "genre": "lofi", "moods": ["calm"]},
    ])

    client_with_service.get("/api/recommendations", headers=stub_headers)

    contents = gemini_mocks.last_call["contents"]
    assert "ambient" in contents
    assert "focus" in contents

