"""
Script Name : songs.py
Description : Public song routes — random pick, similar-by-mood/genre,
              and inline audio serving.
              Auth is optional: signed-in users get a personalized boost
              from their preferences; anonymous callers get the base
              ranking.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, send_file
from sqlalchemy import func, select

from app.auth.middleware import current_user
from app.config import Config
from app.errors import ApiError
from app.extensions import db
from app.models import Preference, Song
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
    given song. Excludes the input song itself. When the caller is signed in
    and has set preferences, candidates matching those preferences receive a
    ranking boost (Task 11.3).
    """
    target = db.session.get(Song, song_id)
    if target is None:
        raise ApiError(
            f"Song {song_id} not found", status_code=404, code="song_not_found"
        )

    if not target.moods and not target.genre:
        return jsonify({"songs": []})

    # Optional preference boost: signed-in callers only.
    preferred_genres: set[str] = set()
    preferred_moods: set[str] = set()
    try:
        user = current_user()
        pref = db.session.execute(
            select(Preference).where(Preference.user_id == user.id)
        ).scalar_one_or_none()
        if pref is not None:
            preferred_genres = set(pref.preferred_genres or [])
            preferred_moods = set(pref.preferred_moods or [])
    except Exception:
        # Auth not configured or no user — anonymous ranking only.
        pass

    # Build a query: same genre OR any overlapping mood. SQLite's JSON support
    # is limited; the most portable approach is to fetch the candidate pool
    # and filter in Python.
    candidates = (
        db.session.execute(select(Song).where(Song.id != target.id)).scalars().all()
    )

    def _score(candidate: Song) -> int:
        score = 0
        if candidate.genre == target.genre:
            score += 2
        overlap = set(candidate.moods or []) & set(target.moods or [])
        score += len(overlap)
        # Preference boost (Task 11.3): nudge candidates that match the
        # user's preferred genres/moods ahead of base-rank matches.
        if candidate.genre and candidate.genre in preferred_genres:
            score += 2
        pref_mood_overlap = set(candidate.moods or []) & preferred_moods
        score += len(pref_mood_overlap)
        return score

    ranked = [c for c in candidates if _score(c) > 0]
    ranked.sort(key=_score, reverse=True)

    return jsonify({"songs": [serialize_song(s) for s in ranked[:8]]})


@songs_bp.get("/<int:song_id>/audio")
def serve_song_audio(song_id: int):
    """Stream the MP3 file for a song. The audio_path is relative to
    Config.AUDIO_DIR. Returns 404 when the song has no audio file.
    """
    song = db.session.get(Song, song_id)
    if song is None:
        raise ApiError(
            f"Song {song_id} not found", status_code=404, code="song_not_found"
        )
    if not song.audio_path:
        raise ApiError(
            f"No audio file for song {song_id}",
            status_code=404,
            code="audio_not_found",
        )
    audio_file = Config.AUDIO_DIR / song.audio_path
    if not audio_file.is_file():
        raise ApiError(
            f"Audio file not found: {song.audio_path}",
            status_code=404,
            code="audio_file_missing",
        )
    return send_file(
        str(audio_file),
        mimetype="audio/mpeg",
        as_attachment=False,
    )
