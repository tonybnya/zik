"""Tests for the preferences routes (GET auto-create, PUT update)."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_get_preferences_works_in_stub_mode_without_headers(
    client: FlaskClient,
) -> None:
    """Stub mode auto-creates a dev user."""
    resp = client.get("/api/preferences")
    assert resp.status_code == 200
    assert resp.get_json()["preferred_genres"] == []


def test_get_creates_empty_preferences(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.get("/api/preferences", headers=stub_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["preferred_genres"] == []
    assert body["preferred_moods"] == []


def test_get_returns_existing_preferences(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": ["lofi"], "preferred_moods": ["focus"]},
    )
    body = client.get("/api/preferences", headers=stub_headers).get_json()
    assert body["preferred_genres"] == ["lofi"]
    assert body["preferred_moods"] == ["focus"]


def test_update_replaces_preferences(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": ["jazz", "ambient"], "preferred_moods": ["calm"]},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert set(body["preferred_genres"]) == {"jazz", "ambient"}
    assert body["preferred_moods"] == ["calm"]


def test_update_partial(client: FlaskClient, stub_headers: dict[str, str]) -> None:
    """Updating only one field leaves the other untouched."""
    client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": ["jazz"], "preferred_moods": ["calm"]},
    )
    client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": ["lofi"]},
    )
    body = client.get("/api/preferences", headers=stub_headers).get_json()
    assert body["preferred_genres"] == ["lofi"]
    assert body["preferred_moods"] == ["calm"]


def test_update_rejects_non_list_genres(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_genres": "lofi"},
    )
    assert resp.status_code == 400


def test_update_rejects_non_list_moods(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.put(
        "/api/preferences",
        headers=stub_headers,
        json={"preferred_moods": "calm"},
    )
    assert resp.status_code == 400


def test_preferences_isolated_per_user(client: FlaskClient) -> None:
    alice = {"X-Stub-User-Id": "alice", "X-Stub-User-Email": "alice@x.com"}
    bob = {"X-Stub-User-Id": "bob", "X-Stub-User-Email": "bob@x.com"}

    client.put(
        "/api/preferences",
        headers=alice,
        json={"preferred_genres": ["ambient"]},
    )
    bob_body = client.get("/api/preferences", headers=bob).get_json()
    assert bob_body["preferred_genres"] == []
