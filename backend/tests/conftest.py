"""Shared pytest fixtures for route and middleware tests.

Spins up a Flask app against an isolated in-memory SQLite DB, with all
tables built. The same db instance is reused for the test session so the
client sees consistent state.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from flask import Flask
from flask.testing import FlaskClient

from app.app_factory import create_app
from app.config import Config as DefaultConfig
from app.extensions import db as _db
from app.models import Favorite, PlayHistory, Preference, Song, User  # noqa: F401


class TestConfig(DefaultConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    AUTH_MODE = "stub"
    TESTING = True


@pytest.fixture
def app() -> Iterator[Flask]:
    application = create_app(TestConfig)
    with application.app_context():
        _db.create_all()
    yield application
    with application.app_context():
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    return app.test_client()


@pytest.fixture
def stub_headers() -> dict[str, str]:
    return {
        "X-Stub-User-Id": "clerk_test_123",
        "X-Stub-User-Email": "tester@zik.app",
    }


@pytest.fixture
def make_song(app: Flask):
    """Factory: insert a song and return it."""
    from app.models import Song as SongModel

    def _factory(**kwargs):
        defaults = {
            "title": "Test Track",
            "artist": "Test Artist",
            "genre": "ambient",
            "moods": ["calm"],
            "external_url": "https://example.com/track",
        }
        defaults.update(kwargs)
        with app.app_context():
            song = SongModel(**defaults)
            _db.session.add(song)
            _db.session.commit()
            return song.id

    return _factory
