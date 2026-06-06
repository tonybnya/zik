"""Tests for the stub auth middleware."""

from __future__ import annotations

from flask.testing import FlaskClient


def test_health_works_without_auth_headers(client: FlaskClient) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200


def test_stub_headers_create_user(client: FlaskClient, app) -> None:
    from app.models import User

    resp = client.get(
        "/api/health",
        headers={
            "X-Stub-User-Id": "clerk_abc",
            "X-Stub-User-Email": "abc@x.com",
        },
    )
    assert resp.status_code == 200

    with app.app_context():
        from app.extensions import db

        u = db.session.query(User).filter_by(clerk_id="clerk_abc").one()
        assert u.email == "abc@x.com"


def test_stub_headers_reuse_existing_user(client: FlaskClient, app) -> None:
    from app.extensions import db
    from app.models import User

    with app.app_context():
        db.session.add(
            User(clerk_id="clerk_existing", email="existing@x.com")
        )
        db.session.commit()

    for _ in range(2):
        client.get(
            "/api/health",
            headers={
                "X-Stub-User-Id": "clerk_existing",
                "X-Stub-User-Email": "existing@x.com",
            },
        )

    with app.app_context():
        assert (
            db.session.query(User).filter_by(clerk_id="clerk_existing").count()
            == 1
        )


def test_partial_stub_headers_are_ignored(client: FlaskClient, app) -> None:
    """Only one header is present; the request stays anonymous and no user is created."""
    from app.extensions import db
    from app.models import User

    resp = client.get(
        "/api/health",
        headers={"X-Stub-User-Id": "only_id"},
    )
    assert resp.status_code == 200

    with app.app_context():
        assert db.session.query(User).count() == 0


def test_authenticated_route_requires_stub_headers(client: FlaskClient) -> None:
    resp = client.get("/api/favorites")
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "unauthorized"


def test_authenticated_route_works_with_stub_headers(
    client: FlaskClient, stub_headers: dict[str, str]
) -> None:
    resp = client.get("/api/favorites", headers=stub_headers)
    assert resp.status_code == 200
    assert resp.get_json() == {"songs": [], "count": 0}


def test_unknown_auth_mode_returns_500(app, client: FlaskClient) -> None:
    """Mutating AUTH_MODE to an unknown value must surface a 500 ApiError."""
    app.config["AUTH_MODE"] = "garbage"
    resp = client.get(
        "/api/health",
        headers={"X-Stub-User-Id": "x", "X-Stub-User-Email": "y@z.com"},
    )
    assert resp.status_code == 500
    assert resp.get_json()["error"] == "misconfigured"
