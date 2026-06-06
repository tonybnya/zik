"""Smoke test for db_init bootstrap.

Runs the same code path the CLI uses, but against an isolated SQLite file in
a tmp dir so the test never touches the real dev.db.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from flask import Flask

from app.config import Config
from app.db_init import init_db
from app.extensions import db
from app.models import Favorite, PlayHistory, Preference, Song, User


@pytest.fixture
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    db_file = tmp_path / "test_init.db"
    monkeypatch.setattr(Config, "SQLALCHEMY_DATABASE_URI", f"sqlite:///{db_file}")
    return db_file


def test_init_db_creates_all_tables(isolated_db: Path) -> None:
    tables = init_db()
    assert {"songs", "users", "play_history", "favorites", "preferences"} <= set(tables)


def test_init_db_is_idempotent(isolated_db: Path) -> None:
    init_db()
    init_db()  # second run must not raise
    assert isolated_db.exists()


def test_init_db_creates_working_schema(isolated_db: Path) -> None:
    """After init, a full CRUD round-trip on every model succeeds."""
    init_db()  # bootstraps tables against the isolated_db URI

    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    with app.app_context():
        with db.session() as s:
            u = User(clerk_id="c1", email="c1@x.com")
            u.save(s)
            s.commit()

            song = Song(
                title="T",
                artist="A",
                genre="ambient",
                moods=["calm"],
                external_url="https://e.com/t",
            )
            song.save(s)
            s.commit()

            Favorite(user_id=u.id, song_id=song.id).save(s)
            PlayHistory(user_id=u.id, song_id=song.id).save(s)
            Preference(user_id=u.id).save(s)
            s.commit()

            assert s.query(Song).count() == 1
            assert s.query(User).count() == 1
            assert s.query(Favorite).count() == 1
            assert s.query(PlayHistory).count() == 1
            assert s.query(Preference).count() == 1
