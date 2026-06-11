"""Tests for the Flask app factory and global error handlers."""

from __future__ import annotations

from flask import Flask
from flask.testing import FlaskClient


def test_create_app_returns_flask_instance() -> None:
    from app.app_factory import create_app

    from app.config import Config

    class C(Config):
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    app = create_app(C)
    assert isinstance(app, Flask)


def test_create_app_registers_cors() -> None:
    from app.app_factory import create_app
    from app.config import Config
    from app.extensions import db

    class C(Config):
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    app = create_app(C)
    with app.app_context():
        db.create_all()
    with app.test_client() as c:
        resp = c.options(
            "/api/songs/random",
            headers={"Origin": "http://localhost:5173"},
        )
    assert resp.status_code in (200, 204)


def test_health_endpoint_returns_ok(client: FlaskClient) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_404_returns_json_error(client: FlaskClient) -> None:
    resp = client.get("/this-route-does-not-exist")
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["error"] == "not_found"
    assert "message" in body


def test_405_returns_json_error(client: FlaskClient) -> None:
    resp = client.patch("/api/health")
    assert resp.status_code == 405
    body = resp.get_json()
    assert body["error"] == "method_not_allowed"


def test_500_returns_json_error(client: FlaskClient) -> None:

    from app.app_factory import create_app
    from app.config import Config

    class C(Config):
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    app = create_app(C)

    @app.route("/api/boom")
    def boom() -> str:
        raise RuntimeError("kaboom")
        return ""  # unreachable; satisfies type checker

    with app.test_client() as c:
        resp = c.get("/api/boom")
    assert resp.status_code == 500
    body = resp.get_json()
    assert body["error"] == "internal_server_error"
    assert "message" in body
