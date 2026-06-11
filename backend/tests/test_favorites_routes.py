"""Tests for the favorites routes (POST toggle, GET list)."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_list_favorites_works_in_stub_mode_without_headers(
    client: FlaskClient,
) -> None:
    """Stub mode auto-creates a dev user."""
    resp = client.get("/api/favorites")
    assert resp.status_code == 200


def test_list_favorites_empty_for_new_user(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.get("/api/favorites", headers=stub_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body == {"songs": [], "count": 0}


def test_toggle_adds_favorite(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    song_id = make_song(title="Loved", genre="lofi")

    resp = client.post(
        "/api/favorites",
        headers=stub_headers,
        json={"song_id": song_id},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["favorited"] is True
    assert body["song_id"] == song_id


def test_toggle_removes_existing_favorite(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    song_id = make_song(title="Loved", genre="lofi")

    client.post("/api/favorites", headers=stub_headers, json={"song_id": song_id})
    resp = client.post(
        "/api/favorites",
        headers=stub_headers,
        json={"song_id": song_id},
    )
    assert resp.get_json()["favorited"] is False


def test_list_returns_favorited_songs(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    a = make_song(title="A", genre="lofi")
    b = make_song(title="B", genre="ambient")
    client.post("/api/favorites", headers=stub_headers, json={"song_id": a})
    client.post("/api/favorites", headers=stub_headers, json={"song_id": b})

    resp = client.get("/api/favorites", headers=stub_headers)
    body = resp.get_json()
    titles = {s["title"] for s in body["songs"]}
    assert titles == {"A", "B"}
    assert body["count"] == 2


def test_toggle_requires_song_id(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.post("/api/favorites", headers=stub_headers, json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "bad_request"


def test_toggle_404_for_unknown_song(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.post("/api/favorites", headers=stub_headers, json={"song_id": 9999})
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "song_not_found"


def test_favorites_isolated_per_user(client: FlaskClient, make_song) -> None:
    song_id = make_song()
    alice = {"X-Stub-User-Id": "alice", "X-Stub-User-Email": "alice@x.com"}
    bob = {"X-Stub-User-Id": "bob", "X-Stub-User-Email": "bob@x.com"}

    client.post("/api/favorites", headers=alice, json={"song_id": song_id})

    alice_list = client.get("/api/favorites", headers=alice).get_json()
    bob_list = client.get("/api/favorites", headers=bob).get_json()

    assert alice_list["count"] == 1
    assert bob_list["count"] == 0
