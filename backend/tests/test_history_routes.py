"""Tests for the play-history routes (POST log, GET list)."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_log_play_requires_auth(client: FlaskClient, make_song) -> None:
    song_id = make_song()
    resp = client.post("/api/history", json={"song_id": song_id})
    assert resp.status_code == 401


def test_log_play_returns_201(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    song_id = make_song(title="Played Once", genre="jazz")
    resp = client.post(
        "/api/history", headers=stub_headers, json={"song_id": song_id}
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["song_id"] == song_id
    assert body["song_title"] == "Played Once"
    assert "played_at" in body


def test_log_play_allows_duplicate_entries(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    """Each play is a separate event — same song twice is allowed."""
    song_id = make_song()
    client.post("/api/history", headers=stub_headers, json={"song_id": song_id})
    client.post("/api/history", headers=stub_headers, json={"song_id": song_id})

    resp = client.get("/api/history", headers=stub_headers)
    assert resp.get_json()["count"] == 2


def test_log_play_requires_song_id(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.post("/api/history", headers=stub_headers, json={})
    assert resp.status_code == 400


def test_log_play_404_for_unknown_song(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.post(
        "/api/history", headers=stub_headers, json={"song_id": 9999}
    )
    assert resp.status_code == 404


def test_list_history_requires_auth(client: FlaskClient) -> None:
    resp = client.get("/api/history")
    assert resp.status_code == 401


def test_list_history_empty_for_new_user(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.get("/api/history", headers=stub_headers)
    assert resp.get_json() == {"entries": [], "count": 0}


def test_list_history_newest_first(
    client: FlaskClient, stub_headers: dict[str, str], make_song
) -> None:
    a = make_song(title="A", genre="lofi")
    b = make_song(title="B", genre="jazz")
    client.post("/api/history", headers=stub_headers, json={"song_id": a})
    client.post("/api/history", headers=stub_headers, json={"song_id": b})

    entries = client.get("/api/history", headers=stub_headers).get_json()["entries"]
    # Most recent insert should appear first
    assert entries[0]["song_title"] == "B"
    assert entries[1]["song_title"] == "A"


def test_history_isolated_per_user(client: FlaskClient, make_song) -> None:
    song_id = make_song()
    alice = {"X-Stub-User-Id": "alice", "X-Stub-User-Email": "alice@x.com"}
    bob = {"X-Stub-User-Id": "bob", "X-Stub-User-Email": "bob@x.com"}

    client.post("/api/history", headers=alice, json={"song_id": song_id})

    assert client.get("/api/history", headers=alice).get_json()["count"] == 1
    assert client.get("/api/history", headers=bob).get_json()["count"] == 0
