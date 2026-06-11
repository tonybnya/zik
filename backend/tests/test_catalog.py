"""Tests for the curated song catalog builder.

Verifies the data shape produced by build_catalog.py stays in sync with the
target distribution (50 lo-fi, 40 cinematic, etc.) and that every entry is
valid against the seed loader.
"""

from __future__ import annotations

import pytest

from app.seeds.build_catalog import (
    ALL_SONGS,
    AMBIENT,
    CINEMATIC,
    CLASSICAL,
    JAZZ,
    LOFI,
    NATURE,
    SYNTHWAVE,
)
from app.seed import load_seed_data

EXPECTED_COUNTS: dict[str, int] = {
    "lofi": 50,
    "cinematic": 40,
    "ambient": 30,
    "nature": 20,
    "jazz": 30,
    "classical": 30,
    "synthwave": 30,
}


def test_total_song_count() -> None:
    assert len(ALL_SONGS) == sum(EXPECTED_COUNTS.values()) == 230


@pytest.mark.parametrize(
    "genre,expected,actual_list",
    [
        ("lofi", 50, LOFI),
        ("cinematic", 40, CINEMATIC),
        ("ambient", 30, AMBIENT),
        ("nature", 20, NATURE),
        ("jazz", 30, JAZZ),
        ("classical", 30, CLASSICAL),
        ("synthwave", 30, SYNTHWAVE),
    ],
)
def test_genre_count_matches_target(
    genre: str, expected: int, actual_list: list
) -> None:
    assert len(actual_list) == expected
    assert all(s["genre"] == genre for s in actual_list)


def test_every_entry_has_required_fields() -> None:
    for song in ALL_SONGS:
        for field in ("title", "artist", "genre", "moods", "external_url"):
            assert field in song, f"{song.get('title')!r} missing {field}"
        assert isinstance(song["moods"], list)
        assert all(isinstance(m, str) for m in song["moods"])
        assert song["moods"], f"{song['title']!r} has empty moods"


def test_every_title_is_unique() -> None:
    titles = [s["title"] for s in ALL_SONGS]
    duplicates = {t for t in titles if titles.count(t) > 1}
    assert not duplicates, f"Duplicate titles: {duplicates}"


def test_bpm_is_int_or_none() -> None:
    for song in ALL_SONGS:
        bpm = song.get("bpm")
        if bpm is not None:
            assert isinstance(bpm, int)
            assert 0 < bpm < 300, f"{song['title']!r} has implausible bpm {bpm}"


def test_external_url_is_http() -> None:
    for song in ALL_SONGS:
        url = song["external_url"]
        assert url.startswith(("http://", "https://")), f"{song['title']!r} has bad URL"


def test_catalog_validates_against_loader() -> None:
    """Round-trip the catalog through the loader to catch any drift."""
    from app.config import Config

    seed_path = Config.SEEDS_DIR / "songs.json"
    if not seed_path.exists():
        pytest.skip("songs.json not yet built (run build_catalog)")

    from app.seeds.build_catalog import get_audio_files

    loaded = load_seed_data(seed_path)
    expected = sum(1 for s in ALL_SONGS if get_audio_files(s["genre"]))
    assert len(loaded) == expected, f"{len(loaded)} != {expected}"
