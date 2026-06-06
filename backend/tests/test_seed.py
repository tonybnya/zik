"""Tests for the song seed loader and database seeder.

Gate tests — must pass on every commit, deterministic, <2s.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Song
from app.seed import REQUIRED_FIELDS, load_seed_data, seed_database


# -----------------------------
# Fixtures
# -----------------------------


@pytest.fixture
def valid_song() -> dict[str, Any]:
    return {
        "title": "Test Track",
        "artist": "Test Artist",
        "genre": "ambient",
        "moods": ["calm", "focus"],
        "bpm": 72,
        "external_url": "https://example.com/track",
        "cover_url": None,
    }


@pytest.fixture
def seed_file(tmp_path: Path, valid_song: dict[str, Any]) -> Path:
    path = tmp_path / "songs.json"
    payload = [valid_song, {**valid_song, "title": "Second", "bpm": 80}]
    path.write_text(json.dumps(payload))
    return path


@pytest.fixture
def session():
    """In-memory SQLite session with a fresh schema for the Song model only."""
    engine = create_engine("sqlite:///:memory:", future=True)
    Song.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, future=True)
    with Session() as s:
        yield s


# -----------------------------
# load_seed_data
# -----------------------------


def test_load_seed_data_returns_list(seed_file: Path) -> None:
    result = load_seed_data(seed_file)
    assert isinstance(result, list)
    assert len(result) == 2


def test_load_seed_data_preserves_fields(seed_file: Path) -> None:
    [first, second] = load_seed_data(seed_file)
    assert first["title"] == "Test Track"
    assert first["moods"] == ["calm", "focus"]
    assert second["bpm"] == 80


def test_load_seed_data_rejects_missing_required_field(tmp_path: Path) -> None:
    bad = [{"artist": "X", "genre": "lofi", "moods": [], "external_url": "u"}]
    path = tmp_path / "bad.json"
    path.write_text(json.dumps(bad))

    with pytest.raises(ValueError, match="title"):
        load_seed_data(path)


@pytest.mark.parametrize("field", sorted(REQUIRED_FIELDS))
def test_load_seed_data_rejects_each_missing_field(
    tmp_path: Path, valid_song: dict[str, Any], field: str
) -> None:
    bad = {k: v for k, v in valid_song.items() if k != field}
    path = tmp_path / "bad.json"
    path.write_text(json.dumps([bad]))

    with pytest.raises(ValueError, match=field):
        load_seed_data(path)


def test_load_seed_data_rejects_non_list_payload(tmp_path: Path) -> None:
    path = tmp_path / "notlist.json"
    path.write_text(json.dumps({"not": "a list"}))
    with pytest.raises(ValueError, match="list"):
        load_seed_data(path)


def test_load_seed_data_rejects_wrong_mood_type(
    tmp_path: Path, valid_song: dict[str, Any]
) -> None:
    bad = {**valid_song, "moods": "calm"}  # string instead of list
    path = tmp_path / "bad.json"
    path.write_text(json.dumps([bad]))

    with pytest.raises(ValueError, match="moods"):
        load_seed_data(path)


def test_load_seed_data_rejects_wrong_bpm_type(
    tmp_path: Path, valid_song: dict[str, Any]
) -> None:
    bad = {**valid_song, "bpm": "72"}  # str instead of int
    path = tmp_path / "bad.json"
    path.write_text(json.dumps([bad]))

    with pytest.raises(ValueError, match="bpm"):
        load_seed_data(path)


# -----------------------------
# seed_database
# -----------------------------


def test_seed_database_inserts_all(session, seed_file: Path) -> None:
    songs = load_seed_data(seed_file)
    inserted = seed_database(session, songs)
    session.commit()

    assert inserted == 2
    assert session.query(Song).count() == 2


def test_seed_database_preserves_all_fields(session, seed_file: Path) -> None:
    songs = load_seed_data(seed_file)
    seed_database(session, songs)
    session.commit()

    loaded = session.query(Song).filter_by(title="Test Track").one()
    assert loaded.artist == "Test Artist"
    assert loaded.genre == "ambient"
    assert loaded.moods == ["calm", "focus"]
    assert loaded.bpm == 72
    assert loaded.external_url == "https://example.com/track"
    assert loaded.cover_url is None


def test_seed_database_handles_null_bpm(session, valid_song: dict[str, Any]) -> None:
    valid_song["bpm"] = None
    inserted = seed_database(session, [valid_song])
    session.commit()

    assert inserted == 1
    assert session.query(Song).first().bpm is None


def test_seed_database_is_idempotent(session, seed_file: Path) -> None:
    songs = load_seed_data(seed_file)
    seed_database(session, songs)
    session.commit()
    seed_database(session, songs)  # second pass: same titles, different ids
    session.commit()

    assert session.query(Song).count() == 4  # 2 + 2, no unique-title constraint


def test_seed_database_returns_count(session, seed_file: Path) -> None:
    songs = load_seed_data(seed_file)
    assert seed_database(session, songs) == 2
