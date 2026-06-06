"""Test suite for SQLAlchemy models.

Gate tests — must pass on every commit, deterministic, <2s.
Uses in-memory SQLite so the suite is hermetic.
"""

from __future__ import annotations

from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.extensions import db
from app.models import Favorite, PlayHistory, Preference, Song, User


@pytest.fixture
def session():
    """Yield a fresh in-memory SQLite session, build all tables each test."""
    engine = create_engine("sqlite:///:memory:", future=True)
    db.Model.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, future=True)
    with Session() as s:
        yield s


def test_create_all_succeeds(session: sessionmaker) -> None:
    assert session is not None
    assert db.Model.metadata.tables.keys() >= {
        "songs",
        "users",
        "play_history",
        "favorites",
        "preferences",
    }


def test_user_unique_clerk_id(session) -> None:
    User(clerk_id="clerk_123", email="a@b.com").save(session)
    session.commit()

    duplicate = User(clerk_id="clerk_123", email="other@b.com")
    with pytest.raises(IntegrityError):
        duplicate.save(session)
        session.commit()


def test_user_unique_email(session) -> None:
    User(clerk_id="clerk_a", email="same@b.com").save(session)
    session.commit()

    with pytest.raises(IntegrityError):
        User(clerk_id="clerk_b", email="same@b.com").save(session)
        session.commit()


def test_song_moods_roundtrip(session) -> None:
    moods = ["focus", "calm", "ambient"]
    song = Song(
        title="Drift",
        artist="Anonymous",
        genre="ambient",
        moods=moods,
        bpm=72,
        external_url="https://example.com/drift",
    )
    song.save(session)
    session.commit()

    loaded = session.get(Song, song.id)
    assert loaded is not None
    assert loaded.moods == moods
    assert loaded.bpm == 72
    assert loaded.genre == "ambient"


def test_song_bpm_optional(session) -> None:
    song = Song(
        title="Untitled",
        artist="Unknown",
        genre="nature",
        moods=[],
        external_url="https://example.com/x",
    )
    song.save(session)
    session.commit()

    assert session.get(Song, song.id).bpm is None


def test_favorite_unique_pair(session) -> None:
    user = User(clerk_id="clerk_1", email="a@b.com")
    song = Song(
        title="A",
        artist="X",
        genre="lofi",
        moods=["focus"],
        external_url="https://x.com/a",
    )
    user.save(session)
    song.save(session)
    Favorite(user_id=user.id, song_id=song.id).save(session)
    session.commit()

    with pytest.raises(IntegrityError):
        Favorite(user_id=user.id, song_id=song.id).save(session)
        session.commit()


def test_play_history_cascade_delete(session) -> None:
    user = User(clerk_id="clerk_cd", email="cd@b.com")
    song = Song(
        title="B",
        artist="Y",
        genre="jazz",
        moods=["smooth"],
        external_url="https://x.com/b",
    )
    user.save(session)
    song.save(session)
    PlayHistory(user_id=user.id, song_id=song.id).save(session)
    session.commit()

    history_id = session.query(PlayHistory).first().id
    session.delete(user)
    session.commit()

    assert session.get(PlayHistory, history_id) is None


def test_preference_defaults(session) -> None:
    user = User(clerk_id="clerk_p", email="p@b.com")
    user.save(session)
    Preference(user_id=user.id).save(session)
    session.commit()

    pref = session.query(Preference).filter_by(user_id=user.id).one()
    assert pref.preferred_genres == []
    assert pref.preferred_moods == []


def test_preference_unique_per_user(session) -> None:
    user = User(clerk_id="clerk_uq", email="uq@b.com")
    user.save(session)
    Preference(user_id=user.id).save(session)
    session.commit()

    with pytest.raises(IntegrityError):
        Preference(user_id=user.id).save(session)
        session.commit()


def test_timestamp_mixin_sets_created_at(session) -> None:
    song = Song(
        title="TS",
        artist="Z",
        genre="classical",
        moods=[],
        external_url="https://x.com/ts",
    )
    song.save(session)
    session.commit()

    assert isinstance(session.get(Song, song.id).created_at, datetime)
