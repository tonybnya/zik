"""Tests for public song routes (no auth required)."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_random_returns_200(client: FlaskClient, make_song) -> None:
    make_song(title="Track A", genre="ambient", moods=["calm"])
    make_song(title="Track B", genre="lofi", moods=["focus"])

    resp = client.get("/api/songs/random")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["title"] in {"Track A", "Track B"}
    assert "id" in body
    assert "external_url" in body
    assert "moods" in body


def test_random_404_when_library_empty(client: FlaskClient) -> None:
    resp = client.get("/api/songs/random")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "library_empty"


def test_random_works_without_auth_headers(
    client: FlaskClient, make_song
) -> None:
    make_song()
    resp = client.get("/api/songs/random")
    assert resp.status_code == 200


def test_similar_returns_matches_by_genre(client: FlaskClient, make_song) -> None:
    target = make_song(title="Target", genre="ambient", moods=["calm"])
    make_song(title="Same Genre", genre="ambient", moods=["bright"])
    make_song(title="Diff Genre", genre="lofi", moods=["bright"])

    resp = client.get(f"/api/songs/{target}/similar")
    assert resp.status_code == 200
    body = resp.get_json()
    titles = [s["title"] for s in body["songs"]]
    assert "Same Genre" in titles
    assert "Target" not in titles  # excludes self
    assert "Diff Genre" not in titles  # no mood or genre overlap


def test_similar_returns_matches_by_mood(client: FlaskClient, make_song) -> None:
    target = make_song(title="Target", genre="ambient", moods=["focus", "calm"])
    make_song(title="Shared Mood", genre="lofi", moods=["focus"])
    make_song(title="Other Mood", genre="lofi", moods=["bright"])

    resp = client.get(f"/api/songs/{target}/similar")
    body = resp.get_json()
    titles = [s["title"] for s in body["songs"]]
    assert "Shared Mood" in titles
    assert "Other Mood" not in titles


def test_similar_limits_to_8(client: FlaskClient, make_song, app) -> None:
    target = make_song(title="Target", genre="ambient", moods=["calm"])
    for i in range(12):
        make_song(title=f"Match {i}", genre="ambient", moods=["calm"])

    resp = client.get(f"/api/songs/{target}/similar")
    body = resp.get_json()
    assert len(body["songs"]) == 8


def test_similar_ranks_genre_over_mood(client: FlaskClient, make_song) -> None:
    target = make_song(title="Target", genre="ambient", moods=["calm"])
    make_song(title="Genre Only", genre="ambient", moods=["bright"])
    make_song(title="Mood Only", genre="lofi", moods=["calm"])
    make_song(title="Both", genre="ambient", moods=["calm"])

    resp = client.get(f"/api/songs/{target}/similar")
    titles = [s["title"] for s in resp.get_json()["songs"]]
    # "Both" should rank highest (genre + mood), then "Genre Only", then "Mood Only"
    assert titles.index("Both") < titles.index("Genre Only")
    assert titles.index("Both") < titles.index("Mood Only")


def test_similar_404_for_unknown_song(client: FlaskClient) -> None:
    resp = client.get("/api/songs/9999/similar")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "song_not_found"


def test_similar_empty_when_target_has_no_genre_or_moods(
    client: FlaskClient, make_song
) -> None:
    target = make_song(title="Lonely", genre="ambient", moods=[])
    make_song(title="Other", genre="lofi", moods=["focus"])

    resp = client.get(f"/api/songs/{target}/similar")
    assert resp.get_json()["songs"] == []
