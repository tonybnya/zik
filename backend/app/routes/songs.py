"""
Script Name : songs.py
Description : Public song routes — random pick + similar-by-mood/genre.
              No auth required.
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify
from sqlalchemy import func, select

from app.errors import ApiError
from app.extensions import db
from app.models import Song
from app.serializers import serialize_song

songs_bp = Blueprint("songs", __name__, url_prefix="/api/songs")


@songs_bp.get("/random")
def random_song():
    """Return one random song. 404 if the library is empty."""
    count = db.session.scalar(select(func.count(Song.id))) or 0
    if count == 0:
        raise ApiError("No songs in library", status_code=404, code="library_empty")

    song = db.session.execute(
        select(Song).order_by(func.random()).limit(1)
    ).scalar_one()
    return jsonify(serialize_song(song))


@songs_bp.get("/<int:song_id>/similar")
def similar_songs(song_id: int):
    """Return up to 8 songs sharing any mood tag or the same genre as the
    given song. Excludes the input song itself.
    """
    target = db.session.get(Song, song_id)
    if target is None:
        raise ApiError(f"Song {song_id} not found", status_code=404, code="song_not_found")

    if not target.moods and not target.genre:
        return jsonify({"songs": []})

    # Build a query: same genre OR any overlapping mood. SQLite's JSON support
    # is limited; the most portable approach is to fetch the candidate pool
    # and filter in Python.
    candidates = db.session.execute(
        select(Song).where(Song.id != target.id)
    ).scalars().all()

    def _score(candidate: Song) -> int:
        score = 0
        if candidate.genre == target.genre:
            score += 2
        overlap = set(candidate.moods or []) & set(target.moods or [])
        score += len(overlap)
        return score

    ranked = [c for c in candidates if _score(c) > 0]
    ranked.sort(key=_score, reverse=True)

    return jsonify({"songs": [serialize_song(s) for s in ranked[:8]]})
