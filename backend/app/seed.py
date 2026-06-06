"""
Script Name : seed.py
Description : Song seed loader and database seeder. Validates the
              songs.json shape, then bulk-inserts rows into the Song table.

              Run with:
                  uv run python -m app.seed              # insert, skip existing titles
                  uv run python -m app.seed --reset      # wipe songs first, then insert
                  uv run python -m app.seed --count      # print current count, no insert

Author      : @tonybnya
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, TypedDict, cast

from sqlalchemy.orm import Session

from app.config import Config
from app.extensions import db
from app.models import Song


class SongEntry(TypedDict, total=False):
    """Shape of a single song record in songs.json.

    Required: title, artist, genre, moods, external_url.
    Optional: bpm, cover_url.
    """

    title: str
    artist: str
    genre: str
    moods: list[str]
    bpm: int | None
    external_url: str
    cover_url: str | None


REQUIRED_FIELDS: frozenset[str] = frozenset(
    {"title", "artist", "genre", "moods", "external_url"}
)
OPTIONAL_FIELDS: frozenset[str] = frozenset({"bpm", "cover_url"})


class SeedValidationError(ValueError):
    """Raised when the seed JSON fails shape or type validation."""


def load_seed_data(path: Path) -> list[SongEntry]:
    """Load and validate songs.json. Returns a list of typed song dicts.

    Raises SeedValidationError on:
      - non-list payload
      - missing required field
      - wrong type for `moods` (must be list) or `bpm` (must be int or null)
    """
    try:
        payload: list[Any] = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        raise SeedValidationError(f"Invalid JSON in {path}: {exc}") from exc

    if not isinstance(payload, list):
        raise SeedValidationError(
            f"Seed file must be a list, got {type(payload).__name__}"
        )

    validated: list[SongEntry] = []
    for index, raw_entry in enumerate(payload):
        if not isinstance(raw_entry, dict):
            raise SeedValidationError(
                f"Entry #{index} is not an object: {raw_entry!r}"
            )
        entry: dict[str, Any] = raw_entry
        missing = REQUIRED_FIELDS - entry.keys()
        if missing:
            raise SeedValidationError(
                f"Entry #{index} ({entry.get('title', '?')}) missing: "
                f"{', '.join(sorted(missing))}"
            )

        moods = entry["moods"]
        if not isinstance(moods, list):
            raise SeedValidationError(
                f"Entry #{index} ({entry['title']}) 'moods' must be a list, "
                f"got {type(moods).__name__}"
            )
        for mood in moods:
            if not isinstance(mood, str):
                raise SeedValidationError(
                    f"Entry #{index} ({entry['title']}) mood values must be "
                    f"strings, got {type(mood).__name__}: {mood!r}"
                )

        bpm = entry.get("bpm")
        if bpm is not None and not isinstance(bpm, int):
            raise SeedValidationError(
                f"Entry #{index} ({entry['title']}) 'bpm' must be int or null, "
                f"got {type(bpm).__name__}"
            )

        cover_url = entry.get("cover_url")
        if cover_url is not None and not isinstance(cover_url, str):
            raise SeedValidationError(
                f"Entry #{index} ({entry['title']}) 'cover_url' must be string "
                f"or null, got {type(cover_url).__name__}"
            )

        validated.append(cast(SongEntry, entry))

    return validated


def seed_database(session: Session, songs: list[SongEntry]) -> int:
    """Insert all songs into the database. Returns count inserted.

    Caller commits. Existing rows are NOT touched — re-running is a no-op for
    duplicates, but adds new rows for any titles that don't exist yet.
    """
    rows = [
        Song(
            title=s["title"],
            artist=s["artist"],
            genre=s["genre"],
            moods=s["moods"],
            bpm=s.get("bpm"),
            external_url=s["external_url"],
            cover_url=s.get("cover_url"),
        )
        for s in songs
    ]
    session.add_all(rows)
    session.flush()
    return len(rows)


def reset_songs(session: Session) -> int:
    """Delete every row in the songs table. Returns the count deleted."""
    deleted = session.query(Song).delete()
    session.flush()
    return deleted


def _build_app():
    from flask import Flask

    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed the songs table.")
    parser.add_argument(
        "--seed-file",
        type=Path,
        default=Config.SEEDS_DIR / "songs.json",
        help="Path to songs.json (default: app/seeds/songs.json)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete every row in the songs table before inserting",
    )
    parser.add_argument(
        "--count",
        action="store_true",
        help="Print the current row count and exit",
    )
    args = parser.parse_args(argv)

    if not args.seed_file.exists():
        print(f"Seed file not found: {args.seed_file}", file=sys.stderr)
        return 1

    songs = load_seed_data(args.seed_file)
    print(f"Loaded {len(songs)} songs from {args.seed_file}")

    app = _build_app()
    with app.app_context():
        with db.session() as s:
            if args.count:
                count = s.query(Song).count()
                print(f"Songs in DB: {count}")
                return 0

            if args.reset:
                deleted = reset_songs(s)
                print(f"Deleted {deleted} existing song(s)")
                s.commit()

            inserted = seed_database(s, songs)
            s.commit()
            total = s.query(Song).count()
            print(f"Inserted {inserted} song(s). Total in DB: {total}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
