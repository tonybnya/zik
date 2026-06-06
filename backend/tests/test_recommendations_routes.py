"""Tests for the recommendations route. Phase 4 stub — Phase 10 swaps in Gemini."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_recommendations_requires_auth(client: FlaskClient) -> None:
    resp = client.get("/api/recommendations")
    assert resp.status_code == 401


def test_recommendations_empty_for_new_user(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.get("/api/recommendations", headers=stub_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["songs"] == []
    assert body["ai_powered"] is False
    assert body["source"] == "favorites_fallback"


def test_recommendations_returns_favorites_fallback(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    a = make_song(title="A", genre="lofi")
    b = make_song(title="B", genre="jazz")
    client.post("/api/favorites", headers=stub_headers, json={"song_id": a})
    client.post("/api/favorites", headers=stub_headers, json={"song_id": b})

    body = client.get("/api/recommendations", headers=stub_headers).get_json()
    titles = {s["title"] for s in body["songs"]}
    assert titles == {"A", "B"}
    assert body["ai_powered"] is False


def test_recommendations_caps_at_5(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    for i in range(8):
        song_id = make_song(title=f"T{i}", genre="lofi")
        client.post(
            "/api/favorites", headers=stub_headers, json={"song_id": song_id}
        )

    body = client.get("/api/recommendations", headers=stub_headers).get_json()
    assert len(body["songs"]) == 5
